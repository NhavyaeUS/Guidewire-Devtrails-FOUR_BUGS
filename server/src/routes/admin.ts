import { Router, Response, Request } from 'express';
import prisma from '../lib/prisma';
import { adminMiddleware, AuthRequest } from '../middleware/auth';
import { predictAnalytics } from '../services/ai';
import { getScenarioWeather } from '../services/weather';

const router = Router();

// KPI Cards Data
router.get('/kpis', adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const activePoliciesCount = await prisma.policy.count({
      where: {
        status: 'active',
        coverageEnd: { gte: now },
        coverageStart: { lte: now }
      }
    });

    const activePolicies = await prisma.policy.findMany({
      where: {
        status: 'active',
        coverageEnd: { gte: now },
        coverageStart: { lte: now }
      },
      select: { weeklyPremium: true }
    });
    const totalPremiums = activePolicies.reduce((acc, p) => acc + p.weeklyPremium, 0);

    const payoutsThisWeek = await prisma.payout.aggregate({
      where: {
        status: 'completed',
        completedAt: { gte: startOfWeek }
      },
      _sum: { amount: true }
    });
    const totalPayouts = payoutsThisWeek._sum.amount || 0;

    const lossRatio = totalPremiums > 0 ? (totalPayouts / totalPremiums) * 100 : 0;

    res.json({
      activePolicies: activePoliciesCount,
      totalPremiums,
      totalPayouts,
      lossRatio: Math.round(lossRatio * 10) / 10
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

// All Claims Table Data
router.get('/claims', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string;
    const where = status ? { status } : {};
    
    const claims = await prisma.claim.findMany({
      where,
      include: {
        worker: { select: { id: true, name: true, city: true, riskTier: true } },
        trigger: { select: { triggerType: true, city: true, zone: true, startedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ claims });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

// Fraud Queue Data
router.get('/fraud-queue', adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const claims = await prisma.claim.findMany({
      where: { status: 'flagged' },
      include: {
        worker: { select: { id: true, name: true, city: true, riskScore: true, riskTier: true } },
        trigger: { select: { triggerType: true, startedAt: true } },
      },
      orderBy: { fraudScore: 'desc' }
    });
    res.json({ claims });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch fraud queue' });
  }
});

// Update Claim Status (Approve/Reject)
router.patch('/claims/:id', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, note } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const claim = await prisma.claim.findUnique({ where: { id: req.params.id } });
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.status !== 'flagged' && claim.status !== 'auto-triggered') {
      return res.status(400).json({ error: 'Claim has already been processed' });
    }

    const updated = await prisma.claim.update({
      where: { id: req.params.id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: 'admin',
        // Optional note field could be added to schema, appending to flags for now
        fraudFlags: note ? JSON.stringify([...JSON.parse(claim.fraudFlags || '[]'), `Admin Note: ${note}`]) : claim.fraudFlags
      }
    });

    // If approved, trigger payout
    if (status === 'approved') {
      const { createPayout } = require('../services/trigger');
      await createPayout(claim.id, claim.workerId, claim.calculatedPayout);
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update claim' });
  }
});

// Predictive Analytics (AI-powered forecast)
router.get('/predictions', adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    // Gather last 4 weeks claims data
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const recentClaims = await prisma.claim.findMany({
      where: { createdAt: { gte: fourWeeksAgo } },
      include: { worker: { select: { city: true } } }
    });

    const historicalData = recentClaims.reduce((acc: any, claim: any) => {
      const city = claim.worker.city;
      if (!acc[city]) acc[city] = { count: 0, payouts: 0 };
      acc[city].count++;
      acc[city].payouts += claim.calculatedPayout;
      return acc;
    }, {});

    // Mock next week's forecast
    const forecast = {
      'Chennai': getScenarioWeather('Chennai', 'heavy_rain'),
      'Mumbai': getScenarioWeather('Mumbai', 'heavy_rain'),
      'Bengaluru': getScenarioWeather('Bengaluru', 'normal'),
      'Delhi': getScenarioWeather('Delhi', 'high_aqi')
    };

    const prediction = await predictAnalytics({ historicalData, forecast });
    res.json(prediction);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

// Worker Analytics Charts Data
router.get('/analytics', adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    // Registrations by week
    const weeksList = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      weeksList.push(`Week ${Math.ceil(d.getDate()/7)} ${d.toLocaleString('default', { month: 'short' })}`);
    }

    // Mock charts data for demo purposes since we won't have 8 weeks of historical data
    const resData = {
      registrationsByWeek: weeksList.map(week => ({
        week,
        users: Math.floor(Math.random() * 50) + 10
      })),
      claimsVsPremiums: weeksList.map(week => ({
        week,
        premiums: Math.floor(Math.random() * 50000) + 20000,
        claims: Math.floor(Math.random() * 40000) + 10000
      }))
    };

    res.json(resData);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
