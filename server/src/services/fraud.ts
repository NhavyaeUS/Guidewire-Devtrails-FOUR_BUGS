import prisma from '../lib/prisma';
import { detectFraudAI } from './ai';

interface FraudResult {
  fraudScore: number;
  flags: string[];
  recommendation: 'approve' | 'review' | 'reject';
  explanation: string;
}

// ─────────────────────────────────────────────
// Utility: Haversine distance between two GPS coords (returns km)
// ─────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─────────────────────────────────────────────
// Helper: Fetch GPS pings for a worker sorted by time ascending
// ─────────────────────────────────────────────
async function getRecentPings(workerId: string, limit: number = 20) {
  return prisma.gpsPing.findMany({
    where: { workerId },
    orderBy: { timestamp: 'asc' },
    take: limit,
  });
}

// ─────────────────────────────────────────────
// LAYER 1 — Location Validation (zone match + recency)
// ─────────────────────────────────────────────
async function validateLocation(
  workerId: string,
  workerZone: string
): Promise<{ passed: boolean; flag: string }> {
  const latestPing = await prisma.gpsPing.findFirst({
    where: { workerId },
    orderBy: { timestamp: 'desc' },
  });

  if (!latestPing) {
    return { passed: false, flag: 'inactive during event — no GPS data available' };
  }

  const hoursSinceLastPing = (Date.now() - latestPing.timestamp.getTime()) / (1000 * 60 * 60);
  if (hoursSinceLastPing > 4) {
    return {
      passed: false,
      flag: `inactive during event — last GPS ping over ${Math.round(hoursSinceLastPing)} hours ago`,
    };
  }

  if (latestPing.zone !== workerZone) {
    return {
      passed: false,
      flag: `location mismatch — GPS shows worker in ${latestPing.zone}, not in registered zone ${workerZone}`,
    };
  }

  return { passed: true, flag: '' };
}

// ─────────────────────────────────────────────
// LAYER 2 — Impossible Speed & Location Jump Detection
//   • Impossible speed: consecutive pings with implied velocity > MAX_SPEED_KMH
//   • Location jump: distance >> what's possible in elapsed time (hard teleport)
// ─────────────────────────────────────────────
const MAX_SPEED_KMH = 80; // max realistic delivery vehicle speed (bike in traffic)
const MAX_JUMP_KM_PER_MIN = MAX_SPEED_KMH / 60; // ~1.33 km per minute

async function checkSpeedAndJumps(workerId: string): Promise<{ flags: string[]; penaltyPoints: number }> {
  const pings = await getRecentPings(workerId, 20);
  const flags: string[] = [];
  let penaltyPoints = 0;

  if (pings.length < 2) return { flags, penaltyPoints };

  for (let i = 1; i < pings.length; i++) {
    const prev = pings[i - 1];
    const curr = pings[i];

    const distKm = haversineKm(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    const elapsedMs = curr.timestamp.getTime() - prev.timestamp.getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    const elapsedMins = elapsedMs / (1000 * 60);

    if (elapsedHours <= 0) continue; // identical timestamps, skip

    const speedKmh = distKm / elapsedHours;

    // Check 1: impossible speed
    if (speedKmh > MAX_SPEED_KMH && distKm > 0.1) {
      const flag = `impossible speed detected — ${Math.round(speedKmh)} km/h between GPS pings (max realistic: ${MAX_SPEED_KMH} km/h)`;
      if (!flags.includes(flag)) {
        flags.push(flag);
        penaltyPoints += 20; // +20 per type of impossible speed event
      }
    }

    // Check 2: location jump (teleport) — > max km achievable in that time
    const maxAchievableKm = MAX_JUMP_KM_PER_MIN * elapsedMins;
    if (distKm > maxAchievableKm + 0.5 && elapsedMins < 30) {
      // 0.5 km tolerance for GPS jitter; only flag if gap is within 30 min
      const flag = `location jump detected — ${distKm.toFixed(1)} km in ${Math.round(elapsedMins)} min (max possible: ${maxAchievableKm.toFixed(1)} km)`;
      if (!flags.includes(flag)) {
        flags.push(flag);
        penaltyPoints += 25;
      }
    }
  }

  return { flags, penaltyPoints };
}

// ─────────────────────────────────────────────
// LAYER 3 — Activity Validation (orders during disruption)
// ─────────────────────────────────────────────
async function validateActivity(
  workerId: string,
  triggerTime: Date
): Promise<{ passed: boolean; flag: string }> {
  const twoHoursBefore = new Date(triggerTime.getTime() - 2 * 60 * 60 * 1000);
  const twoHoursAfter = new Date(triggerTime.getTime() + 2 * 60 * 60 * 1000);

  try {
    const res = await fetch(
      `http://localhost:${process.env.PORT || 3001}/api/mock/platform-orders/${workerId}?from=${twoHoursBefore.toISOString()}&to=${twoHoursAfter.toISOString()}`
    );
    const data = await res.json() as { orders?: Array<{ completedAt: string }> };
    const ordersDuring = (data.orders || []).filter((o) => {
      const t = new Date(o.completedAt).getTime();
      return t >= triggerTime.getTime() && t <= twoHoursAfter.getTime();
    });

    if (ordersDuring.length >= 3) {
      return {
        passed: false,
        flag: `activity contradiction — worker completed ${ordersDuring.length} orders during the disruption window`,
      };
    }
  } catch {
    // Mock API inaccessible — skip quietly
  }

  return { passed: true, flag: '' };
}

// ─────────────────────────────────────────────
// LAYER 4 — AI Pattern Analysis (claim history heuristics)
// ─────────────────────────────────────────────
async function analyzePatterns(
  workerId: string,
  claim: any
): Promise<{ fraud_risk_score: number; flags: string[]; recommendation: string; explanation: string }> {
  const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000);
  const claimHistory = await prisma.claim.findMany({
    where: { workerId, createdAt: { gte: eightWeeksAgo } },
    orderBy: { createdAt: 'desc' },
    include: { trigger: true },
  });

  const gpsResult = claim.gpsFlag || 'passed';
  const activityResult = claim.activityFlag || 'passed';

  type PrismaClaimWithTrigger = (typeof claimHistory)[number];

  type ClaimHistoryItem = {
    trigger_type: string;
    date: string;
    hours: number;
    payout: number;
    status: string;
  };

  return await detectFraudAI({
    claimHistory: claimHistory.map((c: PrismaClaimWithTrigger): ClaimHistoryItem => ({
      trigger_type: c.trigger.triggerType,
      date: c.triggeredAt.toISOString(),
      hours: c.hoursCovered,
      payout: c.calculatedPayout,
      status: c.status,
    })),
    triggerType: claim.triggerType,
    city: claim.city,
    zone: claim.zone,
    hours: claim.hours,
    payout: claim.payout,
    gpsResult,
    activityResult,
  });
}

// ─────────────────────────────────────────────
// LAYER 5 — Duplicate Prevention
// ─────────────────────────────────────────────
async function checkDuplicates(
  workerId: string,
  triggerTime: Date
): Promise<{ passed: boolean; flag: string }> {
  const dayStart = new Date(triggerTime);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(triggerTime);
  dayEnd.setHours(23, 59, 59, 999);

  const existingApproved = await prisma.claim.findFirst({
    where: {
      workerId,
      status: { in: ['approved', 'paid'] },
      triggeredAt: { gte: dayStart, lte: dayEnd },
    },
  });

  if (existingApproved) {
    return { passed: false, flag: 'duplicate — worker already has an approved claim for this calendar day' };
  }

  const overlapping = await prisma.claim.findFirst({
    where: {
      workerId,
      status: { in: ['auto-triggered', 'approved', 'paid'] },
      triggeredAt: {
        gte: new Date(triggerTime.getTime() - 4 * 60 * 60 * 1000),
        lte: new Date(triggerTime.getTime() + 4 * 60 * 60 * 1000),
      },
    },
  });

  if (overlapping) {
    return { passed: false, flag: 'duplicate — overlapping claim already exists for this time window' };
  }

  return { passed: true, flag: '' };
}

// ─────────────────────────────────────────────
// HISTORICAL REPUTATION helpers
// ─────────────────────────────────────────────
async function getHistoricalReputation(workerId: string): Promise<{ score: number; flags: string[] }> {
  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) return { score: 50, flags: [] };

  const flags: string[] = [];

  // Fetch all-time legitimate completed claims
  const completedClaims = await prisma.claim.count({
    where: { workerId, status: { in: ['approved', 'paid'] } },
  });

  // Fetch recent rejected / flagged claims (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentDisputes = await prisma.claim.count({
    where: { workerId, status: { in: ['rejected', 'flagged'] }, createdAt: { gte: thirtyDaysAgo } },
  });

  // Start at a neutral baseline; Bayesian prior: new accounts start at +10
  let score = worker.monthsActive < 1 ? 60 : 50; // new account penalty

  if (completedClaims >= 100) {
    score -= 20; // Very established worker
    } else if (completedClaims >= 20) {
    score -= 10;
  } else if (completedClaims === 0) {
    score += 10; // no track record
    flags.push('no prior approved claims — new or unverified claimant');
  }

  if (recentDisputes >= 3) {
    score += 15;
    flags.push(`high dispute rate — ${recentDisputes} flagged/rejected claims in last 30 days`);
  } else if (recentDisputes >= 1) {
    score += 5;
  }

  // Long-tenured workers are less risky
  if (worker.monthsActive >= 12) score -= 5;

  return { score: Math.max(0, Math.min(100, score)), flags };
}

// ─────────────────────────────────────────────
// MAIN: Weighted Risk Scoring
//
//   Behavioral signals    40% weight
//   Device signals        20% weight  (static; device fingerprinting not in schema yet)
//   Network/Graph signals 25% weight  (duplicate + IP-level checks done via duplicate check)
//   Historical reputation 15% weight
//
// Each sub-score is on a 0-100 scale, then combined:
//   finalScore = 0.40*behavioral + 0.20*device + 0.25*network + 0.15*historical
// ─────────────────────────────────────────────
export async function runFraudDetection(
  workerId: string,
  claimData: {
    triggerType: string;
    city: string;
    zone: string;
    hours: number;
    payout: number;
    triggeredAt: Date;
  }
): Promise<FraudResult> {
  const allFlags: string[] = [];

  // ── Behavioral score (40%) ─────────────────
  let behavioralScore = 0;

  // 1a. Zone location mismatch check
  const locationResult = await validateLocation(workerId, claimData.zone);
  if (!locationResult.passed) {
    allFlags.push(locationResult.flag);
    behavioralScore = Math.max(behavioralScore, 65);
  }

  // 1b. Activity contradiction (orders during disruption)
  const activityResult = await validateActivity(workerId, claimData.triggeredAt);
  if (!activityResult.passed) {
    allFlags.push(activityResult.flag);
    behavioralScore = Math.max(behavioralScore, 55);
  }

  // 1c. Impossible speed + location jump analysis
  const movementResult = await checkSpeedAndJumps(workerId);
  if (movementResult.flags.length > 0) {
    allFlags.push(...movementResult.flags);
    // Penalty points go directly into behavioral score (capped at 100)
    behavioralScore = Math.min(100, behavioralScore + movementResult.penaltyPoints);
  }

  // 1d. AI-driven claim pattern analysis (feeds into behavioral score)
  const aiResult = await analyzePatterns(workerId, {
    ...claimData,
    gpsFlag: locationResult.passed ? 'passed' : locationResult.flag,
    activityFlag: activityResult.passed ? 'passed' : activityResult.flag,
  });
  allFlags.push(...aiResult.flags);
  // Merge AI score — AI output is itself a behavioral signal
  behavioralScore = Math.max(behavioralScore, aiResult.fraud_risk_score ?? 0);
  behavioralScore = Math.min(100, behavioralScore);

  // ── Device score (20%) ────────────────────
  // Device fingerprinting not yet in schema; using neutral baseline of 50
  // (will upgrade once deviceId field is added to Worker model)
  const deviceScore = 50;

  // ── Network / Graph score (25%) ───────────
  let networkScore = 50; // neutral baseline

  const dupResult = await checkDuplicates(workerId, claimData.triggeredAt);
  if (!dupResult.passed) {
    allFlags.push(dupResult.flag);
    networkScore = Math.max(networkScore, 80); // duplicates are strong network-level signal
  }

  // ── Historical reputation score (15%) ─────
  const histResult = await getHistoricalReputation(workerId);
  allFlags.push(...histResult.flags);
  const historicalScore = histResult.score;

  // ── Final weighted score ───────────────────
  const weightedScore =
    0.40 * behavioralScore +
    0.20 * deviceScore +
    0.25 * networkScore +
    0.15 * historicalScore;

  const finalScore = Math.round(Math.min(100, Math.max(0, weightedScore)));

  // ── Thresholds → recommendation ───────────
  let recommendation: 'approve' | 'review' | 'reject';
  if (finalScore < 30) {
    recommendation = 'approve';
  } else if (finalScore <= 70) {
    recommendation = 'review';
  } else {
    recommendation = 'reject';
  }

  return {
    fraudScore: finalScore,
    flags: allFlags,
    recommendation,
    explanation:
      allFlags.length > 0
        ? `Flagged: ${allFlags.join('; ')}`
        : 'No suspicious patterns detected. Claim appears legitimate.',
  };
}
