import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { logApi } from '../services/api';
import { usePagination } from '../hooks/usePagination';
import type { LogEntry } from '../types';

const eventTypes = [
  'LICENSE_CREATED', 'LICENSE_ACTIVATED', 'LICENSE_LOGIN', 'LICENSE_EXPIRED',
  'LICENSE_BANNED', 'LICENSE_DISABLED', 'HWID_RESET', 'HWID_MISMATCH',
  'INVALID_LICENSE', 'INVALID_APPLICATION',
];

const eventColors: Record<string, string> = {
  LICENSE_CREATED: 'text-surface-400', LICENSE_ACTIVATED: 'text-white',
  LICENSE_LOGIN: 'text-surface-300', LICENSE_EXPIRED: 'text-surface-400',
  LICENSE_BANNED: 'text-surface-500', LICENSE_DISABLED: 'text-surface-500',
  HWID_RESET: 'text-surface-400', HWID_MISMATCH: 'text-surface-500',
  INVALID_LICENSE: 'text-surface-500', INVALID_APPLICATION: 'text-surface-500',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { page, limit, totalPages, total, updatePagination, nextPage, prevPage } = usePagination();

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (eventFilter) params.event = eventFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await logApi.getAll(params);
      setLogs(res.data.data);
      updatePagination(res.data.total, res.data.totalPages);
    } catch { toast.error('Failed to load logs'); }
    finally { setLoading(false); }
  }, [page, limit, eventFilter, startDate, endDate]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const hasFilters = eventFilter || startDate || endDate;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Logs</h1>
        <p className="text-sm text-surface-400 mt-1">{total} events recorded</p>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary flex items-center gap-2 ${hasFilters ? 'border-white text-white' : ''}`}>
          <Filter className="w-4 h-4" /> Filters
          {hasFilters && <span className="w-5 h-5 bg-white text-black rounded-full text-xs font-semibold flex items-center justify-center">!</span>}
        </button>
      </div>

      {showFilters && (
        <div className="card p-4 flex flex-wrap gap-3 animate-slide-down">
          <div>
            <label className="block text-xs text-surface-400 mb-1">Event Type</label>
            <select value={eventFilter} onChange={(e) => { setEventFilter(e.target.value); }} className="select w-48">
              <option value="">All Events</option>
              {eventTypes.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-surface-400 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input w-44" />
          </div>
          <div>
            <label className="block text-xs text-surface-400 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input w-44" />
          </div>
          {hasFilters && (
            <button onClick={() => { setEventFilter(''); setStartDate(''); setEndDate(''); }} className="btn-ghost text-surface-400 self-end">
              <X className="w-4 h-4 mr-1" /> Clear
            </button>
          )}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700 text-left">
                <th className="px-4 py-3 text-surface-400 font-medium">Event</th>
                <th className="px-4 py-3 text-surface-400 font-medium hidden md:table-cell">License</th>
                <th className="px-4 py-3 text-surface-400 font-medium hidden md:table-cell">IP</th>
                <th className="px-4 py-3 text-surface-400 font-medium hidden lg:table-cell">HWID</th>
                <th className="px-4 py-3 text-surface-400 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="table-row">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-700 rounded animate-pulse w-20"></div></td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-surface-500">
                  No logs found
                </td></tr>
              ) : logs.map((log, idx) => (
                <tr key={log.id} className="table-row animate-fade-in-up" style={{ animationDelay: `${Math.min(idx, 12) * 35}ms` }}>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${eventColors[log.event] || 'text-surface-400'}`}>{log.event}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-surface-500 hidden md:table-cell">{log.license_id ? log.license_id.slice(0, 8) + '...' : '—'}</td>
                  <td className="px-4 py-3 text-xs text-surface-400 hidden md:table-cell">{log.ip_address || '—'}</td>
                  <td className="px-4 py-3 text-xs font-mono text-surface-500 max-w-[150px] truncate hidden lg:table-cell" title={log.hwid || ''}>{log.hwid || '—'}</td>
                  <td className="px-4 py-3 text-xs text-surface-400">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-surface-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={prevPage} disabled={page <= 1} className="btn-secondary px-3 py-1.5 disabled:opacity-30">Prev</button>
            <button onClick={nextPage} disabled={page >= totalPages} className="btn-secondary px-3 py-1.5 disabled:opacity-30">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
