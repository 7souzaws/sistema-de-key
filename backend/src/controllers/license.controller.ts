import { Request, Response } from 'express';
import { LicenseService } from '../services/license.service';
import { LogService } from '../services/log.service';
import { SessionService } from '../services/session.service';

const licenseService = new LicenseService();
const logService = new LogService();
const sessionService = new SessionService();

export class LicenseController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const application_id = req.query.application_id as string;
      const plan = req.query.plan as string;
      const search = req.query.search as string;
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc';

      const result = await licenseService.findPaginated({
        page, limit, status, application_id, plan, search, sortBy, sortOrder,
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const license = await licenseService.findById(req.params.id);
      if (!license) {
        res.status(404).json({ error: 'License not found' });
        return;
      }
      res.json(license);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async generateKeys(req: Request, res: Response): Promise<void> {
    try {
      const { application_id, plan, duration, amount, prefix, notes } = req.body;

      if (!application_id || !duration || !amount) {
        res.status(400).json({ error: 'application_id, duration, and amount are required' });
        return;
      }

      if (amount < 1 || amount > 500) {
        res.status(400).json({ error: 'Amount must be between 1 and 500' });
        return;
      }

      const keys = await licenseService.generateKeys({
        application_id,
        plan: plan || 'default',
        duration,
        amount,
        prefix,
        notes,
      });

      for (const key of keys) {
        await logService.create({
          event: 'LICENSE_CREATED',
          license_id: key.id,
          application_id,
        });
      }

      res.status(201).json({ keys, count: keys.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.body;
      if (!['unused', 'active', 'expired', 'banned', 'disabled'].includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }
      await licenseService.updateStatus(req.params.id, status);

      const eventMap: Record<string, string> = {
        banned: 'LICENSE_BANNED',
        disabled: 'LICENSE_DISABLED',
      };
      if (eventMap[status]) {
        await logService.create({
          event: eventMap[status] as any,
          license_id: req.params.id,
        });
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async resetHwid(req: Request, res: Response): Promise<void> {
    try {
      await licenseService.resetHwid(req.params.id);
      await logService.create({
        event: 'HWID_RESET',
        license_id: req.params.id,
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await sessionService.deleteByLicenseId(req.params.id);
      await licenseService.delete(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getInfo(req: Request, res: Response): Promise<void> {
    try {
      const { license: licenseKey, hwid, app_id } = req.query;
      if (!licenseKey || !hwid || !app_id) {
        res.status(400).json({ error: 'license, hwid, and app_id are required' });
        return;
      }
      const license = await licenseService.validate(licenseKey as string, hwid as string);
      res.json({
        license_key: license.license_key,
        status: license.status,
        plan: license.plan,
        expires_at: license.expires_at,
        activated_at: license.activated_at,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
