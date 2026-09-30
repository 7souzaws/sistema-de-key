import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { generateAdminToken } from '../middleware/auth';

const adminService = new AdminService();

export class AdminController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const admin = await adminService.findByEmail(email);
      if (!admin) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const valid = await adminService.verifyPassword(admin, password);
      if (!valid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const token = generateAdminToken({
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
      });

      const isProduction = process.env.NODE_ENV === 'production';

      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json({
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          username: admin.username,
          role: admin.role,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      res.json({ admin: req.admin });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.json({ success: true });
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { password } = req.body;
      if (!password || password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
      }
      await adminService.updatePassword(req.admin.id, password);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
