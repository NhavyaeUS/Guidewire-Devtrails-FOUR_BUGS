import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET all appeals (admin only)
router.get('/', adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const appeals = await prisma.appeal.findMany({
      where: { status: 'pending' },
      include: {
        worker: { select: { name: true, city: true } },
        claim: { select: { calculatedPayout: true, fraudScore: true, fraudFlags: true } }
      },
      orderBy: { submittedAt: 'asc' }
    });
    res.json({ appeals });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch appeals' });
  }
});

// POST submit an appeal
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.workerId!;
    const { claimId, reason, proofUrl } = req.body;

    const claim = await prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim || claim.workerId !== workerId) {
      return res.status(403).json({ error: 'Not authorized to appeal this claim' });
    }

    if (claim.status !== 'flagged' && claim.status !== 'rejected') {
      return res.status(400).json({ error: 'This claim cannot be appealed' });
    }

    const appeal = await prisma.appeal.create({
      data: {
        workerId,
        claimId,
        reason,
        proofUrl,
      }
    });

    res.json(appeal);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit appeal' });
  }
});

// PATCH resolve appeal (admin only)
router.patch('/:id', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, resolutionNote } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const appealId = req.params.id as string;
    const appeal = await prisma.appeal.findUnique({ where: { id: appealId }, include: { claim: true } }) as any;
    if (!appeal) return res.status(404).json({ error: 'Appeal not found' });

    const updatedAppeal = await prisma.appeal.update({
      where: { id: appealId },
      data: { status, resolvedAt: new Date() }
    });

    // Update claim status based on appeal resolution
    await prisma.claim.update({
      where: { id: appeal.claimId },
      data: {
        status: status === 'approved' ? 'approved' : 'rejected',
        reviewedAt: new Date(),
        reviewedBy: 'admin',
        fraudFlags: JSON.stringify([...JSON.parse(appeal.claim.fraudFlags || '[]'), `Appeal resolved: ${status}. ${resolutionNote || ''}`])
      }
    });

    // If approved, trigger payout
    if (status === 'approved') {
      const { createPayout } = require('../services/trigger');
      await createPayout(appeal.claimId, appeal.workerId, appeal.claim.calculatedPayout);
    }

    res.json(updatedAppeal);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to resolve appeal' });
  }
});

export default router;
