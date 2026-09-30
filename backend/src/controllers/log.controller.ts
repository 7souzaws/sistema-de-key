import { Request, Response } from 'express';
import { LogService } from '../services/log.service';

const logService = new LogService();

export class LogController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const event = req.query.event as string;
      const application_id = req.query.application_id as string;
      const license_id = req.query.license_id as string;
      const search = req.query.search as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const result = await logService.findPaginated({
        page, limit, event, application_id, license_id, search, startDate, endDate,
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
