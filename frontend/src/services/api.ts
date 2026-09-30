import axios from 'axios';
import type {
  Admin, Application, License, Session, LogEntry,
  DashboardStats, PaginatedResponse,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const adminApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; admin: Admin }>('/admin/login', { email, password }),
  me: () => api.get<{ admin: Admin }>('/admin/me'),
  logout: () => api.post('/admin/logout'),
  changePassword: (password: string) => api.post('/admin/change-password', { password }),
};

export const applicationApi = {
  getAll: () => api.get<Application[]>('/applications'),
  getById: (id: string) => api.get<Application>(`/applications/${id}`),
  create: (name: string, version?: string) =>
    api.post<Application>('/applications', { name, version }),
  update: (id: string, data: Partial<Pick<Application, 'name' | 'version' | 'status'>>) =>
    api.put(`/applications/${id}`, data),
  regenerateSecret: (id: string) =>
    api.post<{ secret: string }>(`/applications/${id}/regenerate-secret`),
  delete: (id: string) => api.delete(`/applications/${id}`),
};

export const licenseApi = {
  getAll: (params: Record<string, string | number>) =>
    api.get<PaginatedResponse<License>>('/licenses', { params }),
  getById: (id: string) => api.get<License>(`/licenses/${id}`),
  generate: (data: {
    application_id: string;
    plan: string;
    duration: string;
    amount: number;
    prefix?: string;
    notes?: string;
  }) => api.post<{ keys: License[]; count: number }>('/licenses/generate', data),
  updateStatus: (id: string, status: string) =>
    api.put(`/licenses/${id}/status`, { status }),
  resetHwid: (id: string) => api.post(`/licenses/${id}/reset-hwid`),
  delete: (id: string) => api.delete(`/licenses/${id}`),
};

export const sessionApi = {
  getAll: (params: Record<string, string | number>) =>
    api.get<PaginatedResponse<Session>>('/sessions', { params }),
  delete: (id: string) => api.delete(`/sessions/${id}`),
  cleanExpired: () => api.post<{ deleted: number }>('/sessions/clean'),
};

export const logApi = {
  getAll: (params: Record<string, string | number>) =>
    api.get<PaginatedResponse<LogEntry>>('/logs', { params }),
};

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats'),
};

export default api;
