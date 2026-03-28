import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const router = Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, phone, password, city, pincode, zone, platform,
      avgDailyHours, avgDailyEarnings, monthsActive } = req.body;

    const existing = await prisma.worker.findUnique({ where: { phone } });
    if (existing) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const worker = await prisma.worker.create({
      data: {
        name, phone, password: hashedPassword, city, pincode, zone,
        platform, avgDailyHours: parseFloat(avgDailyHours),
        avgDailyEarnings: parseFloat(avgDailyEarnings),
        monthsActive: parseInt(monthsActive),
      }
    });

    const token = jwt.sign(
      { workerId: worker.id, isAdmin: worker.isAdmin },
      process.env.JWT_SECRET || 'gigshield-secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      worker: { ...worker, password: undefined }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    const worker = await prisma.worker.findUnique({ where: { phone } });
    if (!worker) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, worker.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { workerId: worker.id, isAdmin: worker.isAdmin },
      process.env.JWT_SECRET || 'gigshield-secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      worker: { ...worker, password: undefined }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
