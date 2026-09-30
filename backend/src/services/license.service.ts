import { getSupabase } from '../database/supabase';
import { License, GenerateKeysRequest, PaginatedResponse } from '../types';
import { generateLicenseKey, calculateExpiresAt } from '../utils/crypto';

export class LicenseService {
  private db = getSupabase();

  async findById(id: string): Promise<License | null> {
    const { data, error } = await this.db
      .from('licenses')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as License;
  }

  async findByKey(licenseKey: string): Promise<License | null> {
    const { data, error } = await this.db
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .single();
    if (error) return null;
    return data as License;
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    status?: string;
    application_id?: string;
    plan?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<License>> {
    const { page, limit, status, application_id, plan, search, sortBy = 'created_at', sortOrder = 'desc' } = params;
    const offset = (page - 1) * limit;

    let query = this.db.from('licenses').select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (application_id) query = query.eq('application_id', application_id);
    if (plan) query = query.eq('plan', plan);
    if (search) query = query.ilike('license_key', `%${search}%`);

    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return {
      data: (data || []) as License[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async generateKeys(request: GenerateKeysRequest): Promise<License[]> {
    const keys: License[] = [];
    const { application_id, plan, duration, amount, prefix, notes } = request;

    for (let i = 0; i < amount; i++) {
      const license_key = generateLicenseKey(prefix);
      const { data, error } = await this.db
        .from('licenses')
        .insert({
          license_key,
          application_id,
          plan,
          duration,
          duration_days: duration === 'lifetime' ? null : null,
          status: 'unused',
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      keys.push(data as License);
    }

    return keys;
  }

  async activate(licenseKey: string, hwid: string, ip: string): Promise<{ license: License; sessionToken: string }> {
    const license = await this.findByKey(licenseKey);
    if (!license) throw new Error('INVALID_LICENSE');
    if (license.status === 'banned') throw new Error('LICENSE_BANNED');
    if (license.status === 'disabled') throw new Error('LICENSE_DISABLED');
    if (license.status === 'expired') throw new Error('LICENSE_EXPIRED');

    const now = new Date().toISOString();

    if (!license.hwid) {
      const expires_at = calculateExpiresAt(license.duration);
      const { error } = await this.db
        .from('licenses')
        .update({
          hwid,
          hwid_bound_at: now,
          status: 'active',
          activated_at: license.activated_at || now,
          expires_at: expires_at ? expires_at.toISOString() : null,
          last_login: now,
          last_ip: ip,
        })
        .eq('id', license.id);
      if (error) throw new Error(error.message);
    } else if (license.hwid !== hwid) {
      throw new Error('HWID_MISMATCH');
    } else {
      const { error } = await this.db
        .from('licenses')
        .update({
          last_login: now,
          last_ip: ip,
        })
        .eq('id', license.id);
      if (error) throw new Error(error.message);
    }

    const updatedLicense = await this.findById(license.id);
    if (!updatedLicense) throw new Error('INVALID_LICENSE');

    if (updatedLicense.expires_at && new Date(updatedLicense.expires_at) < new Date()) {
      await this.db
        .from('licenses')
        .update({ status: 'expired' })
        .eq('id', updatedLicense.id);
      updatedLicense.status = 'expired';
      throw new Error('LICENSE_EXPIRED');
    }

    return { license: updatedLicense, sessionToken: '' };
  }

  async validate(licenseKey: string, hwid: string): Promise<License> {
    const license = await this.findByKey(licenseKey);
    if (!license) throw new Error('INVALID_LICENSE');
    if (license.status === 'banned') throw new Error('LICENSE_BANNED');
    if (license.status === 'disabled') throw new Error('LICENSE_DISABLED');
    if (license.status === 'expired') throw new Error('LICENSE_EXPIRED');

    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      await this.db
        .from('licenses')
        .update({ status: 'expired' })
        .eq('id', license.id);
      throw new Error('LICENSE_EXPIRED');
    }

    if (license.hwid && license.hwid !== hwid) {
      throw new Error('HWID_MISMATCH');
    }

    return license;
  }

  async resetHwid(id: string): Promise<void> {
    const license = await this.findById(id);
    if (!license) throw new Error('License not found');

    const { error } = await this.db
      .from('licenses')
      .update({
        hwid: null,
        hwid_bound_at: null,
        hwid_resets: (license.hwid_resets || 0) + 1,
      })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async updateStatus(id: string, status: License['status']): Promise<void> {
    const { error } = await this.db
      .from('licenses')
      .update({ status })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from('licenses')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async count(): Promise<number> {
    const { count, error } = await this.db
      .from('licenses')
      .select('*', { count: 'exact', head: true });
    if (error) throw new Error(error.message);
    return count || 0;
  }

  async countByStatus(): Promise<Record<string, number>> {
    const statuses = ['unused', 'active', 'expired', 'banned', 'disabled'];
    const result: Record<string, number> = {};
    for (const status of statuses) {
      const { count } = await this.db
        .from('licenses')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);
      result[status] = count || 0;
    }
    return result;
  }

  async countActivationsByDay(days: number): Promise<{ date: string; count: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data } = await this.db
      .from('licenses')
      .select('activated_at')
      .not('activated_at', 'is', null)
      .gte('activated_at', since.toISOString());
    
    return this.groupByDay((data || []).map((d: any) => d.activated_at), days);
  }

  async countLoginsByDay(days: number): Promise<{ date: string; count: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data } = await this.db
      .from('licenses')
      .select('last_login')
      .not('last_login', 'is', null)
      .gte('last_login', since.toISOString());
    
    return this.groupByDay((data || []).map((d: any) => d.last_login), days);
  }

  async countCreatedByDay(days: number): Promise<{ date: string; count: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data } = await this.db
      .from('licenses')
      .select('created_at')
      .gte('created_at', since.toISOString());
    
    return this.groupByDay((data || []).map((d: any) => d.created_at), days);
  }

  private groupByDay(dates: string[], days: number): { date: string; count: number }[] {
    const result: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = dates.filter((dt) => dt && dt.startsWith(dateStr)).length;
      result.push({ date: dateStr, count });
    }
    return result;
  }
}
