import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { profileRisk } from '../services/ai';

const router = Router();

// Onboard worker (update risk profile)
router.post('/onboard', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.workerId!;
    const worker = await prisma.worker.findUnique({ where: { id: workerId } });
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const riskProfile = await profileRisk({
      city: worker.city,
      zone: worker.zone,
      earnings: worker.avgDailyEarnings,
      hours: worker.avgDailyHours,
      platform: worker.platform,
      months: worker.monthsActive,
    });

    const updated = await prisma.worker.update({
      where: { id: workerId },
      data: {
        riskScore: riskProfile.risk_score,
        riskTier: riskProfile.risk_tier,
      }
    });

    res.json({
      worker: { ...updated, password: undefined },
      riskProfile
    });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Onboarding failed' });
  }
});

// Get profile
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: req.workerId! },
      include: {
        policies: { where: { status: 'active' }, take: 1 },
        _count: { select: { claims: true, payouts: true } }
      }
    });
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    // Total earnings protected
    const totalPaid = await prisma.payout.aggregate({
      where: { workerId: worker.id, status: 'completed' },
      _sum: { amount: true }
    });

    res.json({
      worker: { ...worker, password: undefined },
      totalEarningsProtected: totalPaid._sum.amount || 0
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Risk profiling standalone
router.post('/risk-profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { city, zone, earnings, hours, platform, months } = req.body;
    const riskProfile = await profileRisk({ city, zone, earnings, hours, platform, months });
    res.json(riskProfile);
  } catch (error: any) {
    res.status(500).json({ error: 'Risk profiling failed' });
  }
});

export default router;
