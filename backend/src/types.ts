export interface Admin {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  role: 'superadmin' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  name: string;
  app_id: string;
  secret: string;
  version: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface License {
  id: string;
  license_key: string;
  application_id: string;
  plan: string;
  duration: string;
  duration_days: number | null;
  status: 'unused' | 'active' | 'expired' | 'banned' | 'disabled';
  hwid: string | null;
  hwid_bound_at: string | null;
  hwid_resets: number;
  activated_at: string | null;
  expires_at: string | null;
  last_login: string | null;
  last_ip: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  license_id: string;
  token_hash: string;
  hwid: string | null;
  ip_address: string | null;
  created_at: string;
  expires_at: string;
}

export interface Log {
  id: string;
  event: string;
  license_id: string | null;
  application_id: string | null;
  ip_address: string | null;
  hwid: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export type LogEvent =
  | 'LICENSE_CREATED'
  | 'LICENSE_ACTIVATED'
  | 'LICENSE_LOGIN'
  | 'LICENSE_EXPIRED'
  | 'LICENSE_BANNED'
  | 'LICENSE_DISABLED'
  | 'HWID_RESET'
  | 'HWID_MISMATCH'
  | 'INVALID_LICENSE'
  | 'INVALID_APPLICATION';

export interface DashboardStats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  bannedLicenses: number;
  unusedLicenses: number;
  totalActivations: number;
  totalLogins: number;
  activationsByDay: { date: string; count: number }[];
  loginsByDay: { date: string; count: number }[];
  licensesByDay: { date: string; count: number }[];
}

export interface GenerateKeysRequest {
  application_id: string;
  plan: string;
  duration: string;
  amount: number;
  prefix?: string;
  notes?: string;
}

export interface AuthLoginRequest {
  license: string;
  hwid: string;
  app_id: string;
}

export interface AuthLoginResponse {
  success: boolean;
  message: string;
  expires_at?: string;
  remaining_time?: number;
  session_token?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
