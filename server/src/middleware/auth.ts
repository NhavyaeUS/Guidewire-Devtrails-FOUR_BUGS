import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  workerId?: string;
  isAdmin?: boolean;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gigshield-secret') as any;
    req.workerId = decoded.workerId;
    req.isAdmin = decoded.isAdmin || false;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // Check for admin password in header or check isAdmin flag
  const adminPassword = req.headers['x-admin-password'];
  if (adminPassword === process.env.ADMIN_PASSWORD) {
    req.isAdmin = true;
    return next();
  }
  if (req.isAdmin) {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
}
