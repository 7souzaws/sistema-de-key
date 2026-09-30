import { Request, Response } from 'express';
import { LicenseService } from '../services/license.service';
import { SessionService } from '../services/session.service';
import { ApplicationService } from '../services/application.service';
import { LogService } from '../services/log.service';
import { calculateExpiresAt, hashToken } from '../utils/crypto';
import { getSupabase } from '../database/supabase';

const licenseService = new LicenseService();
const sessionService = new SessionService();
const applicationService = new ApplicationService();
const logService = new LogService();

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { license: licenseKey, hwid, app_id } = req.body;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      if (!licenseKey || !hwid || !app_id) {
        res.status(400).json({
          success: false,
          error: 'INVALID_LICENSE',
          message: 'license, hwid, and app_id are required',
        });
        return;
      }

      const app = await applicationService.findByAppId(app_id);
      if (!app || app.status !== 'active') {
        await logService.create({
          event: 'INVALID_APPLICATION',
          ip_address: ip,
          hwid,
          details: { app_id },
        });
        res.status(400).json({
          success: false,
          error: 'INVALID_APPLICATION',
          message: 'Invalid or inactive application',
        });
        return;
      }

      const license = await licenseService.findByKey(licenseKey);
      if (!license) {
        await logService.create({
          event: 'INVALID_LICENSE',
          application_id: app.id,
          ip_address: ip,
          hwid,
          details: { license_key: licenseKey },
        });
        res.status(400).json({
          success: false,
          error: 'INVALID_LICENSE',
          message: 'License not found',
        });
        return;
      }

      if (license.status === 'banned') {
        res.status(403).json({
          success: false,
          error: 'LICENSE_BANNED',
          message: 'License has been banned',
        });
        return;
      }

      if (license.status === 'disabled') {
        res.status(403).json({
          success: false,
          error: 'LICENSE_DISABLED',
          message: 'License has been disabled',
        });
        return;
      }

      if (license.status === 'expired') {
        res.status(403).json({
          success: false,
          error: 'LICENSE_EXPIRED',
          message: 'License has expired',
        });
        return;
      }

      if (license.expires_at && new Date(license.expires_at) < new Date()) {
        await licenseService.updateStatus(license.id, 'expired');
        res.status(403).json({
          success: false,
          error: 'LICENSE_EXPIRED',
          message: 'License has expired',
        });
        return;
      }

      if (license.hwid && license.hwid !== hwid) {
        await logService.create({
          event: 'HWID_MISMATCH',
          license_id: license.id,
          application_id: app.id,
          ip_address: ip,
          hwid,
        });
        res.status(403).json({
          success: false,
          error: 'HWID_MISMATCH',
          message: 'HWID does not match',
        });
        return;
      }

      const now = new Date();
      const updates: Record<string, any> = {
        last_login: now.toISOString(),
        last_ip: ip,
      };

      if (!license.hwid) {
        const expiresAt = calculateExpiresAt(license.duration);
        updates.hwid = hwid;
        updates.hwid_bound_at = now.toISOString();
        updates.status = 'active';
        updates.activated_at = license.activated_at || now.toISOString();
        updates.expires_at = expiresAt ? expiresAt.toISOString() : null;
      }

      const { error: updateError } = await getSupabase()
        .from('licenses')
        .update(updates)
        .eq('id', license.id);

      if (updateError) {
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to update license' });
        return;
      }

      const updatedLicense = await licenseService.findById(license.id);
      if (!updatedLicense) {
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'License not found after update' });
        return;
      }

      const expiresAt = updatedLicense.expires_at || new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const sessionToken = await sessionService.create(
        updatedLicense.id,
        hwid,
        ip,
        expiresAt
      );

      const remainingTime = Math.floor((new Date(expiresAt).getTime() - now.getTime()) / 1000);

      await logService.create({
        event: updatedLicense.activated_at === updatedLicense.created_at ? 'LICENSE_ACTIVATED' : 'LICENSE_LOGIN',
        license_id: updatedLicense.id,
        application_id: app.id,
        ip_address: ip,
        hwid,
      });

      res.json({
        success: true,
        message: 'Authenticated',
        expires_at: expiresAt,
        remaining_time: remainingTime,
        session_token: sessionToken,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: err.message });
    }
  }

  async validate(req: Request, res: Response): Promise<void> {
    try {
      const { license: licenseKey, hwid } = req.body;
      if (!licenseKey || !hwid) {
        res.status(400).json({ success: false, error: 'INVALID_LICENSE', message: 'Missing parameters' });
        return;
      }

      const license = await licenseService.validate(licenseKey, hwid);
      res.json({
        success: true,
        valid: true,
        expires_at: license.expires_at,
        plan: license.plan,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, valid: false, error: err.message });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { session_token } = req.body;
      if (!session_token) {
        res.status(400).json({ success: false, error: 'Missing session_token' });
        return;
      }

      const tokenHash = hashToken(session_token);

      await getSupabase()
        .from('sessions')
        .delete()
        .eq('token_hash', tokenHash);

      res.json({ success: true, message: 'Logged out' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
