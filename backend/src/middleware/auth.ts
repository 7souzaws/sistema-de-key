import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AdminPayload {
  id: string;
  email: string;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.admin_token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AdminPayload;
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function generateAdminToken(admin: AdminPayload): string {
  return jwt.sign(
    { id: admin.id, email: admin.email, username: admin.username, role: admin.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}
