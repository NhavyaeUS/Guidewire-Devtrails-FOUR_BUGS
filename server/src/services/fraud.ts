import prisma from '../lib/prisma';

// Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Device fingerprint score (0–100)
async function computeDeviceScore(workerId: string): Promise<number> {
  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) return 50;

  let score = 0;
  if (worker.isRooted) score += 40;
  if (worker.isEmulator) score += 40;

  // Check if deviceId is shared across multiple workers
  if (worker.deviceId) {
    const sharedCount = await prisma.worker.count({ where: { deviceId: worker.deviceId } });
    if (sharedCount > 1) score += 30;
  }

  // Clean device bonus
  if (!worker.isRooted && !worker.isEmulator && !worker.deviceId) score -= 10;

  return Math.max(0, Math.min(100, score));
}

// IMU mismatch: GPS movement but flat accelerometer
async function checkImuMismatch(workerId: string): Promise<boolean> {
  const pings = await prisma.gpsPing.findMany({
    where: { workerId },
    orderBy: { timestamp: 'desc' },
    take: 5,
  });

  if (pings.length < 2) return false;

  const IMU_FLAT_THRESHOLD = 0.05;
  for (let i = 0; i < pings.length - 1; i++) {
    const dist = haversineKm(pings[i].latitude, pings[i].longitude, pings[i + 1].latitude, pings[i + 1].longitude);
    const variance = pings[i].accelerometerVariance;
    if (dist > 0.1 && variance !== null && variance < IMU_FLAT_THRESHOLD) {
      return true;
    }
  }
  return false;
}

// Historical reputation score
async function getHistoricalReputation(workerId: string): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalClaims, rejectedClaims] = await Promise.all([
    prisma.claim.count({ where: { workerId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.claim.count({ where: { workerId, status: { in: ['rejected', 'flagged'] }, createdAt: { gte: thirtyDaysAgo } } }),
  ]);

  if (totalClaims === 0) return 50;

  const fraudRate = rejectedClaims / totalClaims;
  let score = Math.round(fraudRate * 100);

  // Reputation decay bonus for clean workers with substantial history
  const paidClaims = await prisma.claim.count({ where: { workerId, status: 'paid' } });
  if (rejectedClaims === 0 && paidClaims >= 10) score -= 5;

  return Math.max(0, Math.min(100, score));
}

export interface FraudResult {
  fraudScore: number;
  flags: string[];
  recommendation: 'approve' | 'review' | 'reject';
  explanation: string;
  confidenceMargin: number;
}

export async function runFraudDetection(
  workerId: string,
  claimData: { triggerType: string; city: string; zone: string; hours: number; payout: number; triggeredAt: Date }
): Promise<FraudResult> {
  const flags: string[] = [];

  // 1. GPS zone mismatch check
  const recentPing = await prisma.gpsPing.findFirst({
    where: { workerId, isActive: true },
    orderBy: { timestamp: 'desc' },
  });

  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) throw new Error('Worker not found');

  if (recentPing) {
    // Check zone mismatch
    if (recentPing.zone !== worker.zone && recentPing.zone !== claimData.zone) {
      flags.push(`location mismatch — GPS shows worker in ${recentPing.zone}, not in registered zone ${worker.zone}`);
    }

    // Impossible speed check against previous ping
    const prevPing = await prisma.gpsPing.findFirst({
      where: { workerId, timestamp: { lt: recentPing.timestamp } },
      orderBy: { timestamp: 'desc' },
    });

    if (prevPing) {
      const distKm = haversineKm(prevPing.latitude, prevPing.longitude, recentPing.latitude, recentPing.longitude);
      const timeDiffHours = (recentPing.timestamp.getTime() - prevPing.timestamp.getTime()) / (1000 * 60 * 60);
      if (timeDiffHours > 0) {
        const speedKmh = distKm / timeDiffHours;
        if (speedKmh > 150) {
          flags.push(`impossible travel speed: ${Math.round(speedKmh)} km/h detected between GPS pings`);
        }
      }
    }
  }

  // 2. IMU mismatch check
  const imuMismatch = await checkImuMismatch(workerId);
  if (imuMismatch) {
    flags.push('IMU mismatch — flat accelerometer signal detected during GPS movement (spoofing suspected)');
  }

  // 3. Duplicate claim check
  const recentDuplicate = await prisma.claim.findFirst({
    where: {
      workerId,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // last 1 hour
      status: { not: 'rejected' },
    },
  });
  if (recentDuplicate) {
    flags.push('duplicate claim detected — another claim was filed within the past hour');
  }

  // 4. Compute weighted score
  const [deviceScore, reputationScore] = await Promise.all([
    computeDeviceScore(workerId),
    getHistoricalReputation(workerId),
  ]);

  const gpsScore = flags.filter(f => f.includes('location') || f.includes('speed') || f.includes('IMU')).length * 30;
  const duplicateScore = flags.some(f => f.includes('duplicate')) ? 40 : 0;

  // Weights: GPS/IMU 40%, device 25%, reputation 20%, duplicate 15%
  const rawScore = (gpsScore * 0.4) + (deviceScore * 0.25) + (reputationScore * 0.2) + (duplicateScore * 0.15);

  // Confidence margin — sparse ping data = ±10 pts
  const pingCount = await prisma.gpsPing.count({ where: { workerId } });
  const confidenceMargin = pingCount < 3 ? 10 : 0;

  const fraudScore = Math.round(Math.max(0, Math.min(100, rawScore)));

  let recommendation: 'approve' | 'review' | 'reject';
  if (fraudScore > 75) {
    recommendation = 'reject';
  } else if (fraudScore > 45 || (confidenceMargin > 0 && fraudScore > 35)) {
    recommendation = 'review';
  } else {
    recommendation = 'approve';
  }

  const explanation = flags.length > 0
    ? `${flags.length} fraud signal(s) detected. Score: ${fraudScore}/100.`
    : `No suspicious patterns detected. Score: ${fraudScore}/100.`;

  return { fraudScore, flags, recommendation, explanation, confidenceMargin };
}
