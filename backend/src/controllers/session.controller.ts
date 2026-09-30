import { Request, Response } from 'express';
import { SessionService } from '../services/session.service';
import { LicenseService } from '../services/license.service';

const sessionService = new SessionService();
const licenseService = new LicenseService();

export class SessionController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const license_id = req.query.license_id as string;

      const result = await sessionService.findAllPaginated({ page, limit, license_id });

      const enrichedData = await Promise.all(
        result.data.map(async (session) => {
          const license = await licenseService.findById(session.license_id);
          return { ...session, license_key: license?.license_key || 'N/A' };
        })
      );

      res.json({ ...result, data: enrichedData });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await sessionService.delete(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async cleanExpired(_req: Request, res: Response): Promise<void> {
    try {
      const count = await sessionService.cleanExpired();
      res.json({ success: true, deleted: count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
