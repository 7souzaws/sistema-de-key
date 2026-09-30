import { getSupabase } from '../database/supabase';
import { Application } from '../types';
import { generateAppId, generateSecret } from '../utils/crypto';

export class ApplicationService {
  private db = getSupabase();

  async findAll(): Promise<Application[]> {
    const { data, error } = await this.db
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Application[];
  }

  async findById(id: string): Promise<Application | null> {
    const { data, error } = await this.db
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as Application;
  }

  async findByAppId(appId: string): Promise<Application | null> {
    const { data, error } = await this.db
      .from('applications')
      .select('*')
      .eq('app_id', appId)
      .single();
    if (error) return null;
    return data as Application;
  }

  async create(name: string, version?: string): Promise<Application> {
    const app_id = generateAppId();
    const secret = generateSecret();
    const { data, error } = await this.db
      .from('applications')
      .insert({ name, app_id, secret, version: version || '1.0.0', status: 'active' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Application;
  }

  async update(id: string, updates: Partial<Pick<Application, 'name' | 'version' | 'status'>>): Promise<void> {
    const { error } = await this.db
      .from('applications')
      .update(updates)
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async regenerateSecret(id: string): Promise<string> {
    const newSecret = generateSecret();
    const { error } = await this.db
      .from('applications')
      .update({ secret: newSecret })
      .eq('id', id);
    if (error) throw new Error(error.message);
    return newSecret;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from('applications')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
}
