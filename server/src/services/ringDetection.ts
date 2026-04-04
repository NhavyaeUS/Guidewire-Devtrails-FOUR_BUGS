import prisma from '../lib/prisma';

export async function detectRings() {
  const rings = [];

  // 1. Detect device sharing (same deviceId across multiple workers)
  const deviceGroups = await prisma.worker.groupBy({
    by: ['deviceId'],
    having: {
      deviceId: { _count: { gt: 1 } },
    },
    where: {
      deviceId: { not: null }
    }
  });

  for (const group of deviceGroups) {
    if (!group.deviceId) continue;

    const workers = await prisma.worker.findMany({
      where: { deviceId: group.deviceId },
      select: { id: true, name: true, phone: true, riskScore: true }
    });

    const averageScore = workers.reduce((sum, w) => sum + w.riskScore, 0) / workers.length;

    rings.push({
      type: 'shared_device',
      signal: group.deviceId,
      memberCount: workers.length,
      averageFraudScore: Math.round(averageScore),
      members: workers
    });
  }

  // 2. Detect IP sharing (same sharedIp across multiple workers)
  const ipGroups = await prisma.worker.groupBy({
    by: ['sharedIp'],
    having: {
      sharedIp: { _count: { gt: 1 } },
    },
    where: {
      sharedIp: { not: null }
    }
  });

  for (const group of ipGroups) {
    if (!group.sharedIp) continue;

    const workers = await prisma.worker.findMany({
      where: { sharedIp: group.sharedIp },
      select: { id: true, name: true, phone: true, riskScore: true }
    });

    const averageScore = workers.reduce((sum, w) => sum + w.riskScore, 0) / workers.length;

    rings.push({
      type: 'shared_ip',
      signal: group.sharedIp,
      memberCount: workers.length,
      averageFraudScore: Math.round(averageScore),
      members: workers
    });
  }

  return rings;
}
