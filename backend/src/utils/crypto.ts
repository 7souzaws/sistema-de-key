import crypto from 'crypto';

export function generateLicenseKey(prefix?: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [4, 4, 4, 4];
  const keyParts = segments.map((len) => {
    let result = '';
    for (let i = 0; i < len; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  });
  const key = keyParts.join('-');
  return prefix ? `${prefix}-${key}` : key;
}

export function generateToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateAppId(): string {
  return 'app_' + crypto.randomBytes(6).toString('hex');
}

export function generateSecret(): string {
  return 'sec_' + crypto.randomBytes(24).toString('hex');
}

export function calculateExpiresAt(duration: string, durationDays?: number | null): Date | null {
  if (duration === 'lifetime' || duration === ' Lifetime') return null;
  if (durationDays && durationDays > 0) {
    const expires = new Date();
    expires.setDate(expires.getDate() + durationDays);
    return expires;
  }
  const now = new Date();
  switch (duration) {
    case '1h': now.setHours(now.getHours() + 1); break;
    case '1d': now.setDate(now.getDate() + 1); break;
    case '3d': now.setDate(now.getDate() + 3); break;
    case '7d': now.setDate(now.getDate() + 7); break;
    case '15d': now.setDate(now.getDate() + 15); break;
    case '30d': now.setDate(now.getDate() + 30); break;
    case '90d': now.setDate(now.getDate() + 90); break;
    case '180d': now.setDate(now.getDate() + 180); break;
    case '365d': now.setDate(now.getDate() + 365); break;
    case 'lifetime': return null;
    default: now.setDate(now.getDate() + 30);
  }
  return now;
}

export function getDurationDays(duration: string): number | null {
  if (duration === 'lifetime') return null;
  const match = duration.match(/^(\d+)[hd]$/);
  if (!match) return null;
  const val = parseInt(match[1]);
  if (duration.endsWith('h')) return null;
  return val;
}

export function formatDuration(duration: string): string {
  const map: Record<string, string> = {
    '1h': '1 Hour',
    '1d': '1 Day',
    '3d': '3 Days',
    '7d': '7 Days',
    '15d': '15 Days',
    '30d': '30 Days',
    '90d': '90 Days',
    '180d': '180 Days',
    '365d': '365 Days',
    'lifetime': 'Lifetime',
  };
  return map[duration] || duration;
}
