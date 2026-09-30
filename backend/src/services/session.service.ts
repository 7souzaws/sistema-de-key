import { getSupabase } from '../database/supabase';
import { Session } from '../types';
import { generateToken, hashToken } from '../utils/crypto';

export class SessionService {
  private db = getSupabase();

  async create(licenseId: string, hwid: string, ip: string, expiresAt: string): Promise<string> {
    const token = generateToken();
    const tokenHash = hashToken(token);

    const { error } = await this.db
      .from('sessions')
      .insert({
        license_id: licenseId,
        token_hash: tokenHash,
        hwid,
        ip_address: ip,
        expires_at: expiresAt,
      });
    if (error) throw new Error(error.message);
    return token;
  }

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const { data, error } = await this.db
      .from('sessions')
      .select('*')
      .eq('token_hash', tokenHash)
      .single();
    if (error) return null;
    return data as Session;
  }

  async findActiveByLicenseId(licenseId: string): Promise<Session[]> {
    const { data, error } = await this.db
      .from('sessions')
      .select('*')
      .eq('license_id', licenseId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Session[];
  }

  async findAllPaginated(params: {
    page: number;
    limit: number;
    license_id?: string;
  }): Promise<{ data: Session[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page, limit, license_id } = params;
    const offset = (page - 1) * limit;

    let query = this.db.from('sessions').select('*', { count: 'exact' });
    if (license_id) query = query.eq('license_id', license_id);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return {
      data: (data || []) as Session[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    const { error } = await this.db
      .from('sessions')
      .delete()
      .eq('token_hash', tokenHash);
    if (error) throw new Error(error.message);
  }

  async deleteByLicenseId(licenseId: string): Promise<void> {
    const { error } = await this.db
      .from('sessions')
      .delete()
      .eq('license_id', licenseId);
    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from('sessions')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async cleanExpired(): Promise<number> {
    const { data, error } = await this.db
      .from('sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select();
    if (error) throw new Error(error.message);
    return data?.length || 0;
  }

  async count(): Promise<number> {
    const { count, error } = await this.db
      .from('sessions')
      .select('*', { count: 'exact', head: true });
    if (error) throw new Error(error.message);
    return count || 0;
  }
}
