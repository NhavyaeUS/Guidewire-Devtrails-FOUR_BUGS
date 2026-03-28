import prisma from '../lib/prisma';
import { detectFraudAI } from './ai';

interface FraudResult {
  fraudScore: number;
  flags: string[];
  recommendation: 'approve' | 'review' | 'reject';
  explanation: string;
}

// Layer 1: Location Validation
async function validateLocation(workerId: string, workerZone: string, triggerCity: string): Promise<{ passed: boolean; flag: string }> {
  const latestPing = await prisma.gpsPing.findFirst({
    where: { workerId },
    orderBy: { timestamp: 'desc' }
  });

  if (!latestPing) {
    return { passed: false, flag: 'inactive during event — no GPS data available' };
  }

  const hoursSinceLastPing = (Date.now() - latestPing.timestamp.getTime()) / (1000 * 60 * 60);
  if (hoursSinceLastPing > 4) {
    return { passed: false, flag: 'inactive during event — last GPS ping over 4 hours ago' };
  }

  if (latestPing.zone !== workerZone) {
    return { passed: false, flag: `location mismatch — GPS shows worker in ${latestPing.zone}, not in registered zone ${workerZone}` };
  }

  return { passed: true, flag: '' };
}

// Layer 2: Activity Validation
async function validateActivity(workerId: string, triggerTime: Date): Promise<{ passed: boolean; flag: string }> {
  const twoHoursBefore = new Date(triggerTime.getTime() - 2 * 60 * 60 * 1000);
  const twoHoursAfter = new Date(triggerTime.getTime() + 2 * 60 * 60 * 1000);

  // Check mock platform orders
  try {
    const res = await fetch(`http://localhost:${process.env.PORT || 3001}/api/mock/platform-orders/${workerId}?from=${twoHoursBefore.toISOString()}&to=${twoHoursAfter.toISOString()}`);
    const data = await res.json();
    const ordersDuring = (data.orders || []).filter((o: any) => {
      const t = new Date(o.completedAt).getTime();
      return t >= triggerTime.getTime() && t <= twoHoursAfter.getTime();
    });

    if (ordersDuring.length >= 3) {
      return { passed: false, flag: `activity contradiction — worker completed ${ordersDuring.length} orders during the disruption window` };
    }
  } catch {}

  return { passed: true, flag: '' };
}

// Layer 3: Claim Pattern Anomaly (AI-powered)
async function analyzePatterns(workerId: string, claim: any): Promise<{ score: number; flags: string[]; recommendation: string; explanation: string }> {
  const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000);
  const claimHistory = await prisma.claim.findMany({
    where: { workerId, createdAt: { gte: eightWeeksAgo } },
    orderBy: { createdAt: 'desc' },
    include: { trigger: true }
  });

  const gpsResult = claim.gpsFlag || 'passed';
  const activityResult = claim.activityFlag || 'passed';

  return await detectFraudAI({
    claimHistory: claimHistory.map(c => ({
      trigger_type: c.trigger.triggerType,
      date: c.triggeredAt.toISOString(),
      hours: c.hoursCovered,
      payout: c.calculatedPayout,
      status: c.status
    })),
    triggerType: claim.triggerType,
    city: claim.city,
    zone: claim.zone,
    hours: claim.hours,
    payout: claim.payout,
    gpsResult,
    activityResult
  });
}

// Layer 4: Duplicate Prevention
async function checkDuplicates(workerId: string, triggerTime: Date): Promise<{ passed: boolean; flag: string }> {
  const dayStart = new Date(triggerTime);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(triggerTime);
  dayEnd.setHours(23, 59, 59, 999);

  // Check for approved claims on the same day
  const existingApproved = await prisma.claim.findFirst({
    where: {
      workerId,
      status: { in: ['approved', 'paid'] },
      triggeredAt: { gte: dayStart, lte: dayEnd }
    }
  });

  if (existingApproved) {
    return { passed: false, flag: 'duplicate — worker already has an approved claim for this calendar day' };
  }

  // Check for overlapping time windows
  const overlapping = await prisma.claim.findFirst({
    where: {
      workerId,
      status: { in: ['auto-triggered', 'approved', 'paid'] },
      triggeredAt: {
        gte: new Date(triggerTime.getTime() - 4 * 60 * 60 * 1000),
        lte: new Date(triggerTime.getTime() + 4 * 60 * 60 * 1000)
      }
    }
  });

  if (overlapping) {
    return { passed: false, flag: 'duplicate — overlapping claim already exists for this time window' };
  }

  return { passed: true, flag: '' };
}

export async function runFraudDetection(
  workerId: string,
  claimData: {
    triggerType: string; city: string; zone: string;
    hours: number; payout: number; triggeredAt: Date;
  }
): Promise<FraudResult> {
  const allFlags: string[] = [];
  let maxScore = 0;

  // Layer 1: Location
  const locationResult = await validateLocation(workerId, claimData.zone, claimData.city);
  if (!locationResult.passed) {
    allFlags.push(locationResult.flag);
    maxScore = Math.max(maxScore, 65);
  }

  // Layer 2: Activity
  const activityResult = await validateActivity(workerId, claimData.triggeredAt);
  if (!activityResult.passed) {
    allFlags.push(activityResult.flag);
    maxScore = Math.max(maxScore, 55);
  }

  // Layer 3: AI Pattern Analysis
  const aiResult = await analyzePatterns(workerId, {
    ...claimData,
    gpsFlag: locationResult.passed ? 'passed' : locationResult.flag,
    activityFlag: activityResult.passed ? 'passed' : activityResult.flag
  });
  allFlags.push(...aiResult.flags);
  maxScore = Math.max(maxScore, aiResult.score);

  // Layer 4: Duplicates
  const dupResult = await checkDuplicates(workerId, claimData.triggeredAt);
  if (!dupResult.passed) {
    allFlags.push(dupResult.flag);
    maxScore = Math.max(maxScore, 80);
  }

  // Final determination
  let recommendation: 'approve' | 'review' | 'reject';
  if (maxScore <= 40) {
    recommendation = 'approve';
  } else if (maxScore <= 70) {
    recommendation = 'review';
  } else {
    recommendation = 'reject';
  }

  return {
    fraudScore: maxScore,
    flags: allFlags,
    recommendation,
    explanation: allFlags.length > 0
      ? `Flagged: ${allFlags.join('; ')}`
      : 'No suspicious patterns detected. Claim appears legitimate.'
  };
}
