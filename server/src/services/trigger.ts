import prisma from '../lib/prisma';
import { getWeather, getScenarioWeather } from './weather';
import { runFraudDetection } from './fraud';

const TIER_CONFIG: Record<string, { maxHoursPerDay: number; maxWeeklyPayout: number }> = {
  basic: { maxHoursPerDay: 4, maxWeeklyPayout: 500 },
  standard: { maxHoursPerDay: 7, maxWeeklyPayout: 1200 },
  pro: { maxHoursPerDay: 10, maxWeeklyPayout: 2500 },
};

const HEAVY_RAIN_CODES = [502, 503, 504, 511, 522];

function calculatePayout(
  worker: { avgDailyEarnings: number; avgDailyHours: number },
  hoursCovered: number,
  multiplier: number = 1
): number {
  const hourlyRate = worker.avgDailyEarnings / worker.avgDailyHours;
  return Math.round(hourlyRate * hoursCovered * multiplier);
}

async function getRemainingPayout(workerId: string, policyId: string, maxWeeklyPayout: number): Promise<number> {
  const policy = await prisma.policy.findUnique({ where: { id: policyId } });
  if (!policy) return 0;

  const paidThisWeek = await prisma.payout.aggregate({
    where: {
      workerId,
      status: 'completed',
      initiatedAt: { gte: policy.coverageStart, lte: policy.coverageEnd }
    },
    _sum: { amount: true }
  });

  return maxWeeklyPayout - (paidThisWeek._sum.amount || 0);
}

async function createAutoClaimAndProcess(
  worker: any,
  policy: any,
  trigger: any,
  hoursCovered: number,
  payoutMultiplier: number = 1
) {
  const tierConfig = TIER_CONFIG[policy.tier];
  const cappedHours = Math.min(hoursCovered, tierConfig.maxHoursPerDay);
  let calculatedPayout = calculatePayout(worker, cappedHours, payoutMultiplier);

  // Cap by remaining weekly payout
  const remaining = await getRemainingPayout(worker.id, policy.id, tierConfig.maxWeeklyPayout);
  if (remaining <= 0) return null;
  calculatedPayout = Math.min(calculatedPayout, remaining);

  // Run fraud detection
  const fraudResult = await runFraudDetection(worker.id, {
    triggerType: trigger.triggerType,
    city: trigger.city,
    zone: trigger.zone,
    hours: cappedHours,
    payout: calculatedPayout,
    triggeredAt: trigger.startedAt
  });

  const status = fraudResult.recommendation === 'approve' ? 'approved'
    : fraudResult.recommendation === 'review' ? 'flagged'
    : 'rejected';

  const claim = await prisma.claim.create({
    data: {
      workerId: worker.id,
      policyId: policy.id,
      triggerId: trigger.id,
      triggeredAt: trigger.startedAt,
      hoursCovered: cappedHours,
      calculatedPayout,
      fraudScore: fraudResult.fraudScore,
      fraudFlags: JSON.stringify(fraudResult.flags),
      status,
    }
  });

  // If approved, create payout
  if (status === 'approved') {
    await createPayout(claim.id, worker.id, calculatedPayout);
  }

  return { claim, fraudResult };
}

async function createPayout(claimId: string, workerId: string, amount: number) {
  const payout = await prisma.payout.create({
    data: {
      claimId,
      workerId,
      amount,
      status: 'queued',
      upiRef: `UPI${new Date().getFullYear()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    }
  });

  // Simulate payout processing (queued -> processing -> completed)
  setTimeout(async () => {
    try {
      await prisma.payout.update({
        where: { id: payout.id },
        data: { status: 'processing' }
      });
    } catch {}
  }, 15000);

  setTimeout(async () => {
    try {
      await prisma.payout.update({
        where: { id: payout.id },
        data: { status: 'completed', completedAt: new Date() }
      });
      await prisma.claim.update({
        where: { id: claimId },
        data: { status: 'paid' }
      });
    } catch {}
  }, 30000);

  return payout;
}

export async function simulateDisruption(
  workerId: string,
  triggerType: string,
  forceGpsMismatch: boolean = false
): Promise<any> {
  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) throw new Error('Worker not found');

  const activePolicy = await prisma.policy.findFirst({
    where: { workerId, status: 'active' }
  });
  if (!activePolicy) throw new Error('No active policy');

  // If forceGpsMismatch, update GPS to a different city
  if (forceGpsMismatch) {
    await prisma.gpsPing.create({
      data: {
        workerId,
        latitude: 28.7041, // Delhi coords (different city)
        longitude: 77.1025,
        zone: 'Connaught Place',
        isActive: true,
      }
    });
  } else {
    // Create a valid GPS ping in the worker's zone
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      'Chennai': { lat: 13.0827, lng: 80.2707 },
      'Mumbai': { lat: 19.0760, lng: 72.8777 },
      'Bengaluru': { lat: 12.9716, lng: 77.5946 },
    };
    const coords = cityCoords[worker.city] || { lat: 13.0827, lng: 80.2707 };
    await prisma.gpsPing.create({
      data: {
        workerId,
        latitude: coords.lat,
        longitude: coords.lng,
        zone: worker.zone,
        isActive: true,
      }
    });
  }

  // Get appropriate weather for the scenario
  let scenarioMap: Record<string, string> = {
    'heavy_rain': 'heavy_rain',
    'extreme_heat': 'extreme_heat',
    'aqi': 'high_aqi',
  };

  // Determine hours covered based on trigger type
  let hoursCovered = 3;
  let payoutMultiplier = 1;
  let severityLevel = 'severe';
  let dataSource = 'mock_simulation';

  switch (triggerType) {
    case 'heavy_rain':
      hoursCovered = 3;
      dataSource = 'OpenWeatherMap (simulated)';
      break;
    case 'extreme_heat':
      hoursCovered = 4;
      payoutMultiplier = 0.5; // partial coverage for heat
      dataSource = 'OpenWeatherMap (simulated)';
      break;
    case 'aqi':
      hoursCovered = 5;
      dataSource = 'Air Pollution API (simulated)';
      break;
    case 'flood':
      hoursCovered = worker.avgDailyHours;
      dataSource = 'Flood Alert API (mock)';
      break;
    case 'curfew':
      hoursCovered = worker.avgDailyHours;
      dataSource = 'Civil Disruption API (mock)';
      break;
  }

  // Create trigger record
  const trigger = await prisma.disruptionTrigger.create({
    data: {
      triggerType,
      city: worker.city,
      zone: worker.zone,
      startedAt: new Date(),
      severityLevel,
      dataSource,
      rawData: JSON.stringify({
        simulated: true,
        scenario: triggerType,
        forceGpsMismatch
      })
    }
  });

  // Create claim and process
  const result = await createAutoClaimAndProcess(
    worker, activePolicy, trigger, hoursCovered, payoutMultiplier
  );

  if (!result) {
    return {
      trigger,
      message: 'Weekly payout limit already reached. No additional claim can be processed.',
      claim: null,
      payout: null
    };
  }

  // Get payout if claim was approved
  let payout = null;
  if (result.claim.status === 'approved') {
    payout = await prisma.payout.findFirst({ where: { claimId: result.claim.id } });
  }

  return {
    trigger,
    claim: result.claim,
    fraudResult: result.fraudResult,
    payout,
    message: result.claim.status === 'approved'
      ? `${triggerType.replace('_', ' ')} detected in your zone. A claim of ₹${result.claim.calculatedPayout} has been automatically processed for ${result.claim.hoursCovered} hours of disruption.`
      : result.claim.status === 'flagged'
        ? `Claim has been flagged for review: ${result.fraudResult.explanation}`
        : `Claim was rejected: ${result.fraudResult.explanation}`
  };
}

export async function checkWeatherTriggers(city: string, zone: string) {
  const weather = await getWeather(city);
  const triggers: string[] = [];

  // Trigger 1: Heavy Rain
  if (weather.rainfall_mm_per_hour >= 15 || HEAVY_RAIN_CODES.includes(weather.weather_code)) {
    triggers.push('heavy_rain');
  }

  // Trigger 2: Extreme Heat
  if (weather.feels_like >= 42) {
    triggers.push('extreme_heat');
  }

  // Trigger 3: AQI
  if (weather.aqi_index >= 4) {
    triggers.push('aqi');
  }

  return { weather, triggers };
}

export { createPayout };
