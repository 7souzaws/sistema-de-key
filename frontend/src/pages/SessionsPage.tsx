import { useState, useEffect, useCallback } from 'react';
import { Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { sessionApi } from '../services/api';
import { usePagination } from '../hooks/usePagination';
import type { Session } from '../types';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { page, limit, totalPages, total, updatePagination, nextPage, prevPage } = usePagination();

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sessionApi.getAll({ page, limit });
      setSessions(res.data.data);
      updatePagination(res.data.total, res.data.totalPages);
    } catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  }, [page, limit]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleDelete = async (id: string) => {
    try { await sessionApi.delete(id); toast.success('Session revoked'); loadSessions(); }
    catch { toast.error('Failed'); }
  };

  const handleCleanExpired = async () => {
    try {
      const res = await sessionApi.cleanExpired();
      toast.success(`${res.data.deleted} expired sessions cleaned`);
      loadSessions();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Sessions</h1>
          <p className="text-sm text-surface-400 mt-1">{total} active sessions</p>
        </div>
        <button onClick={handleCleanExpired} className="btn-secondary flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Clean Expired
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700 text-left">
                <th className="px-4 py-3 text-surface-400 font-medium">License Key</th>
                <th className="px-4 py-3 text-surface-400 font-medium hidden md:table-cell">HWID</th>
                <th className="px-4 py-3 text-surface-400 font-medium hidden md:table-cell">IP</th>
                <th className="px-4 py-3 text-surface-400 font-medium">Created</th>
                <th className="px-4 py-3 text-surface-400 font-medium">Expires</th>
                <th className="px-4 py-3 text-surface-400 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="table-row">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-700 rounded animate-pulse w-20"></div></td>
                    ))}
                  </tr>
                ))
              ) : sessions.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-surface-500">
                  No active sessions
                </td></tr>
              ) : sessions.map((s, idx) => (
                <tr key={s.id} className="table-row animate-fade-in-up" style={{ animationDelay: `${Math.min(idx, 12) * 35}ms` }}>
                  <td className="px-4 py-3 font-mono text-xs text-brand-400">{s.license_key || 'N/A'}</td>
                  <td className="px-4 py-3 text-xs font-mono text-surface-500 max-w-[150px] truncate hidden md:table-cell" title={s.hwid || ''}>{s.hwid || '—'}</td>
                  <td className="px-4 py-3 text-xs text-surface-400 hidden md:table-cell">{s.ip_address || '—'}</td>
                  <td className="px-4 py-3 text-xs text-surface-400">{new Date(s.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-surface-400">{new Date(s.expires_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(s.id)} className="btn-ghost p-1.5 text-red-400" title="Revoke">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
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
