import { getSupabase } from '../database/supabase';
import { Admin } from '../types';
import bcrypt from 'bcryptjs';

export class AdminService {
  private db = getSupabase();

  async findByEmail(email: string): Promise<Admin | null> {
    const { data, error } = await this.db
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();
    if (error) return null;
    return data as Admin;
  }

  async findByUsername(username: string): Promise<Admin | null> {
    const { data, error } = await this.db
      .from('admins')
      .select('*')
      .eq('username', username)
      .single();
    if (error) return null;
    return data as Admin;
  }

  async create(email: string, username: string, password: string): Promise<Admin> {
    const password_hash = await bcrypt.hash(password, 12);
    const { data, error } = await this.db
      .from('admins')
      .insert({ email, username, password_hash, role: 'admin' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Admin;
  }

  async verifyPassword(admin: Admin, password: string): Promise<boolean> {
    return bcrypt.compare(password, admin.password_hash);
  }

  async updatePassword(id: string, password: string): Promise<void> {
    const password_hash = await bcrypt.hash(password, 12);
    const { error } = await this.db
      .from('admins')
      .update({ password_hash })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
}
