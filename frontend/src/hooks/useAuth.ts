import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';
import type { Admin } from '../types';

export function useAuth() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await adminApi.me();
      setAdmin(res.data.admin);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await adminApi.login(email, password);
    setAdmin(res.data.admin);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    await adminApi.logout();
    setAdmin(null);
  }, []);

  return { admin, loading, login, logout, checkAuth };
}
