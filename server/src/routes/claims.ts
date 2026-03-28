import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { simulateDisruption, checkWeatherTriggers } from '../services/trigger';

const router = Router();

// Simulate disruption (demo button)
router.post('/simulate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.workerId!;
    const { triggerType, forceGpsMismatch } = req.body;

    const validTypes = ['heavy_rain', 'extreme_heat', 'aqi', 'flood', 'curfew'];
    if (!validTypes.includes(triggerType)) {
      return res.status(400).json({ error: 'Invalid trigger type' });
    }

    const result = await simulateDisruption(workerId, triggerType, forceGpsMismatch || false);
    res.json(result);
  } catch (error: any) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: error.message || 'Simulation failed' });
  }
});

// Get worker's claims
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const claims = await prisma.claim.findMany({
      where: { workerId: req.workerId! },
      include: {
        trigger: true,
        payout: true,
        policy: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ claims });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

// Get weather status for dashboard
router.get('/weather-status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const worker = await prisma.worker.findUnique({ where: { id: req.workerId! } });
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const result = await checkWeatherTriggers(worker.city, worker.zone);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to check weather' });
  }
});

export default router;
