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

// Clear simulation (reset all claims for demo purposes)
router.post('/clear-simulation', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.workerId!;
    
    // Find all claims for this worker to delete their triggers and payouts
    const claims = await prisma.claim.findMany({ where: { workerId } });
    
    // Delete payouts
    await prisma.payout.deleteMany({ where: { workerId } });
    // Delete claims
    await prisma.claim.deleteMany({ where: { workerId } });
    // Delete triggers linked to these claims
    const triggerIds = claims.map(c => c.triggerId);
    if (triggerIds.length > 0) {
      await prisma.disruptionTrigger.deleteMany({ where: { id: { in: triggerIds } } });
    }
    // Delete simulator GPS pings
    await prisma.gpsPing.deleteMany({ where: { workerId } });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Clear simulation error:', error);
    res.status(500).json({ error: 'Failed to clear simulation' });
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
