import { getSupabase } from '../database/supabase';
import { Log, LogEvent, PaginatedResponse } from '../types';

export class LogService {
  private db = getSupabase();

  async create(params: {
    event: LogEvent;
    license_id?: string;
    application_id?: string;
    ip_address?: string;
    hwid?: string;
    details?: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await this.db
      .from('logs')
      .insert({
        event: params.event,
        license_id: params.license_id || null,
        application_id: params.application_id || null,
        ip_address: params.ip_address || null,
        hwid: params.hwid || null,
        details: params.details || null,
      });
    if (error) console.error('[LOG ERROR]', error.message);
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    event?: string;
    application_id?: string;
    license_id?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Log>> {
    const { page, limit, event, application_id, license_id, search, startDate, endDate } = params;
    const offset = (page - 1) * limit;

    let query = this.db.from('logs').select('*', { count: 'exact' });

    if (event) query = query.eq('event', event);
    if (application_id) query = query.eq('application_id', application_id);
    if (license_id) query = query.eq('license_id', license_id);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return {
      data: (data || []) as Log[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async count(): Promise<number> {
    const { count, error } = await this.db
      .from('logs')
      .select('*', { count: 'exact', head: true });
    if (error) throw new Error(error.message);
    return count || 0;
  }
}
