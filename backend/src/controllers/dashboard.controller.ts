import { Request, Response } from 'express';
import { LicenseService } from '../services/license.service';
import { ApplicationService } from '../services/application.service';
import { SessionService } from '../services/session.service';
import { LogService } from '../services/log.service';

const licenseService = new LicenseService();
const applicationService = new ApplicationService();
const sessionService = new SessionService();
const logService = new LogService();

export class DashboardController {
  async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const [totalLicenses, statusCounts, totalApps, totalSessions, activationsByDay, loginsByDay, licensesByDay] =
        await Promise.all([
          licenseService.count(),
          licenseService.countByStatus(),
          (async () => {
            const apps = await applicationService.findAll();
            return apps.length;
          })(),
          sessionService.count(),
          licenseService.countActivationsByDay(30),
          licenseService.countLoginsByDay(30),
          licenseService.countCreatedByDay(30),
        ]);

      res.json({
        totalLicenses,
        activeLicenses: statusCounts.active || 0,
        expiredLicenses: statusCounts.expired || 0,
        bannedLicenses: statusCounts.banned || 0,
        unusedLicenses: statusCounts.unused || 0,
        disabledLicenses: statusCounts.disabled || 0,
        totalApplications: totalApps,
        totalSessions,
        activationsByDay,
        loginsByDay,
        licensesByDay,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
