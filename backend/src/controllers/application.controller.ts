import { Request, Response } from 'express';
import { ApplicationService } from '../services/application.service';

const applicationService = new ApplicationService();

export class ApplicationController {
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const apps = await applicationService.findAll();
      res.json(apps);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const app = await applicationService.findById(req.params.id);
      if (!app) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }
      res.json(app);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, version } = req.body;
      if (!name) {
        res.status(400).json({ error: 'Name is required' });
        return;
      }
      const app = await applicationService.create(name, version);
      res.status(201).json(app);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { name, version, status } = req.body;
      await applicationService.update(req.params.id, { name, version, status });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async regenerateSecret(req: Request, res: Response): Promise<void> {
    try {
      const secret = await applicationService.regenerateSecret(req.params.id);
      res.json({ secret });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await applicationService.delete(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
