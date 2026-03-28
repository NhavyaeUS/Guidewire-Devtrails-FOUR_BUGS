import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { calculatePremium } from '../services/ai';

const router = Router();

const BASE_PREMIUMS: Record<string, { premium: number; maxPayout: number }> = {
  basic: { premium: 29, maxPayout: 500 },
  standard: { premium: 59, maxPayout: 1200 },
  pro: { premium: 99, maxPayout: 2500 },
};

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

// Create policy
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.workerId!;
    const { tier } = req.body;

    if (!BASE_PREMIUMS[tier]) {
      return res.status(400).json({ error: 'Invalid tier. Choose basic, standard, or pro.' });
    }

    const worker = await prisma.worker.findUnique({ where: { id: workerId } });
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    // Cancel any existing active policy
    await prisma.policy.updateMany({
      where: { workerId, status: 'active' },
      data: { status: 'cancelled' }
    });

    // Calculate dynamic premium
    const base = BASE_PREMIUMS[tier];
    const premiumResult = await calculatePremium({
      tier,
      basePremium: base.premium,
      city: worker.city,
      zone: worker.zone,
      riskScore: worker.riskScore,
      riskTier: worker.riskTier,
      earnings: worker.avgDailyEarnings,
    });

    const { monday, sunday } = getWeekBounds();

    const policy = await prisma.policy.create({
      data: {
        workerId,
        tier,
        weeklyPremium: premiumResult.adjusted_premium,
        maxWeeklyPayout: base.maxPayout,
        coverageStart: monday,
        coverageEnd: sunday,
        status: 'active',
      }
    });

    res.json({ policy, premiumAdjustment: premiumResult });
  } catch (error: any) {
    console.error('Policy creation error:', error);
    res.status(500).json({ error: 'Failed to create policy' });
  }
});

// Get active policy
router.get('/active', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const policy = await prisma.policy.findFirst({
      where: { workerId: req.workerId!, status: 'active' },
      orderBy: { createdAt: 'desc' }
    });

    if (!policy) return res.json({ policy: null });

    // Calculate remaining payout
    const paidThisWeek = await prisma.payout.aggregate({
      where: {
        workerId: req.workerId!,
        status: 'completed',
        initiatedAt: { gte: policy.coverageStart, lte: policy.coverageEnd }
      },
      _sum: { amount: true }
    });

    const remainingPayout = policy.maxWeeklyPayout - (paidThisWeek._sum.amount || 0);

    res.json({ policy, remainingPayout, paidThisWeek: paidThisWeek._sum.amount || 0 });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch policy' });
  }
});

// Get premium preview (for plan selection)
router.post('/preview-premium', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.workerId!;
    const { tier } = req.body;
    const base = BASE_PREMIUMS[tier];
    if (!base) return res.status(400).json({ error: 'Invalid tier' });

    const worker = await prisma.worker.findUnique({ where: { id: workerId } });
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const result = await calculatePremium({
      tier,
      basePremium: base.premium,
      city: worker.city,
      zone: worker.zone,
      riskScore: worker.riskScore,
      riskTier: worker.riskTier,
      earnings: worker.avgDailyEarnings,
    });

    res.json({
      tier,
      basePremium: base.premium,
      ...result,
      maxWeeklyPayout: base.maxPayout
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Premium preview failed' });
  }
});

// Renew policy
router.post('/renew', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.workerId!;
    const currentPolicy = await prisma.policy.findFirst({
      where: { workerId, status: 'active' },
      orderBy: { createdAt: 'desc' }
    });

    if (!currentPolicy) return res.status(404).json({ error: 'No active policy to renew' });

    const worker = await prisma.worker.findUnique({ where: { id: workerId } });
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    // Expire current policy
    await prisma.policy.update({
      where: { id: currentPolicy.id },
      data: { status: 'expired' }
    });

    // Recalculate premium
    const base = BASE_PREMIUMS[currentPolicy.tier];
    const premiumResult = await calculatePremium({
      tier: currentPolicy.tier,
      basePremium: base.premium,
      city: worker.city,
      zone: worker.zone,
      riskScore: worker.riskScore,
      riskTier: worker.riskTier,
      earnings: worker.avgDailyEarnings,
    });

    const { monday, sunday } = getWeekBounds();

    const newPolicy = await prisma.policy.create({
      data: {
        workerId,
        tier: currentPolicy.tier,
        weeklyPremium: premiumResult.adjusted_premium,
        maxWeeklyPayout: base.maxPayout,
        coverageStart: monday,
        coverageEnd: sunday,
        status: 'active',
      }
    });

    res.json({ policy: newPolicy, premiumAdjustment: premiumResult });
  } catch (error: any) {
    res.status(500).json({ error: 'Policy renewal failed' });
  }
});

// Get all tiers info
router.get('/tiers', (_req, res: Response) => {
  res.json({
    tiers: [
      { id: 'basic', name: 'Basic Shield', basePremium: 29, maxWeeklyPayout: 500, coverageHoursPerDay: 4, description: 'Covers severe disruptions only' },
      { id: 'standard', name: 'Standard Shield', basePremium: 59, maxWeeklyPayout: 1200, coverageHoursPerDay: 7, description: 'Covers moderate + severe disruptions' },
      { id: 'pro', name: 'Pro Shield', basePremium: 99, maxWeeklyPayout: 2500, coverageHoursPerDay: 10, description: 'Full coverage, all disruption types' },
    ]
  });
});

export default router;
