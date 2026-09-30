export function formatDuration(duration: string): string {
  const map: Record<string, string> = {
    '1h': '1 Hour', '1d': '1 Day', '3d': '3 Days', '7d': '7 Days',
    '15d': '15 Days', '30d': '30 Days', '90d': '90 Days', '180d': '180 Days',
    '365d': '365 Days', 'lifetime': 'Lifetime',
  };
  return map[duration] || duration;
}

export function formatDate(date: string | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatDateTime(date: string | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
}

export function getRemainingTime(expiresAt: string | null): string {
  if (!expiresAt) return 'Lifetime';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
