import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Get worker's payouts
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const payouts = await prisma.payout.findMany({
      where: { workerId: req.workerId! },
      include: { claim: { include: { trigger: true } } },
      orderBy: { initiatedAt: 'desc' }
    });
    res.json({ payouts });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

// Get payout status (for polling)
router.get('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const payout = await prisma.payout.findUnique({ where: { id: req.params.id as string } });
    if (!payout) return res.status(404).json({ error: 'Payout not found' });
    res.json({ status: payout.status, upiRef: payout.upiRef, completedAt: payout.completedAt });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch payout status' });
  }
});

export default router;
