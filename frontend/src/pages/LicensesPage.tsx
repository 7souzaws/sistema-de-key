import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronLeft, ChevronRight, Eye, Copy, Ban, CheckCircle, Trash2,
  RotateCcw, Filter, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { licenseApi, applicationApi } from '../services/api';
import { usePagination } from '../hooks/usePagination';
import type { License, Application } from '../types';

const statusColors: Record<string, string> = {
  unused: 'badge-gray',
  active: 'badge-green',
  expired: 'badge-yellow',
  banned: 'badge-red',
  disabled: 'badge-blue',
};

const durationLabels: Record<string, string> = {
  '1h': '1 Hour', '1d': '1 Day', '3d': '3 Days', '7d': '7 Days',
  '15d': '15 Days', '30d': '30 Days', '90d': '90 Days', '180d': '180 Days',
  '365d': '365 Days', lifetime: 'Lifetime',
};

export default function LicensesPage() {
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [appFilter, setAppFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { page, limit, totalPages, total, updatePagination, nextPage, prevPage, setPage } = usePagination();

  const loadLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (appFilter) params.application_id = appFilter;

      const res = await licenseApi.getAll(params);
      setLicenses(res.data.data);
      updatePagination(res.data.total, res.data.totalPages);
    } catch { toast.error('Failed to load licenses'); }
    finally { setLoading(false); }
  }, [page, limit, search, statusFilter, appFilter]);

  useEffect(() => {
    applicationApi.getAll().then((res) => setApps(res.data)).catch(() => {});
  }, []);

  useEffect(() => { loadLicenses(); }, [loadLicenses]);

  const copyKey = (key: string) => { navigator.clipboard.writeText(key); toast.success('Copied'); };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await licenseApi.updateStatus(id, status);
      toast.success(`License ${status}`);
      loadLicenses();
    } catch { toast.error('Failed to update'); }
  };

  const handleResetHwid = async (id: string) => {
    if (!confirm('Reset HWID? The user will need to reactivate on their device.')) return;
    try {
      await licenseApi.resetHwid(id);
      toast.success('HWID reset');
      loadLicenses();
    } catch { toast.error('Failed to reset HWID'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this license?')) return;
    try {
      await licenseApi.delete(id);
      toast.success('Deleted');
      loadLicenses();
    } catch { toast.error('Failed to delete'); }
  };

  const hasFilters = statusFilter || appFilter;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Licenses</h1>
        <p className="text-sm text-surface-400 mt-1">{total} total licenses</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-10"
            placeholder="Search by license key..."
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary flex items-center gap-2 ${hasFilters ? 'border-white text-white' : ''}`}>
          <Filter className="w-4 h-4" />
          Filters
          {hasFilters && <span className="w-5 h-5 bg-white text-black rounded-full text-xs font-semibold flex items-center justify-center">{[statusFilter, appFilter].filter(Boolean).length}</span>}
        </button>
      </div>

      {showFilters && (
        <div className="card p-4 flex flex-wrap gap-3 animate-slide-down">
          <div>
            <label className="block text-xs text-surface-400 mb-1">Status</label>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select w-40">
              <option value="">All</option>
              <option value="unused">Unused</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="banned">Banned</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-surface-400 mb-1">Application</label>
            <select value={appFilter} onChange={(e) => { setAppFilter(e.target.value); setPage(1); }} className="select w-48">
              <option value="">All</option>
              {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button onClick={() => { setStatusFilter(''); setAppFilter(''); setPage(1); }} className="btn-ghost text-surface-400 self-end">
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
                <th className="px-4 py-3 text-surface-400 font-medium">Key</th>
                <th className="px-4 py-3 text-surface-400 font-medium">Status</th>
                <th className="px-4 py-3 text-surface-400 font-medium hidden md:table-cell">Application</th>
                <th className="px-4 py-3 text-surface-400 font-medium hidden lg:table-cell">Plan</th>
                <th className="px-4 py-3 text-surface-400 font-medium hidden lg:table-cell">Created</th>
                <th className="px-4 py-3 text-surface-400 font-medium hidden xl:table-cell">HWID</th>
                <th className="px-4 py-3 text-surface-400 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="table-row">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-700 rounded animate-pulse w-20"></div></td>
                    ))}
                  </tr>
                ))
              ) : licenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-surface-500">
                    No licenses found
                  </td>
                </tr>
              ) : (
                licenses.map((lic, idx) => {
                  const appName = apps.find((a) => a.id === lic.application_id)?.name || 'N/A';
                  return (
                    <tr key={lic.id} className="table-row animate-fade-in-up" style={{ animationDelay: `${Math.min(idx, 12) * 35}ms` }}>
                      <td className="px-4 py-3">
                        <button onClick={() => copyKey(lic.license_key)} className="font-mono text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1.5" title="Click to copy">
                          {lic.license_key}
                          <Copy className="w-3 h-3 opacity-50" />
                        </button>
                      </td>
                      <td className="px-4 py-3"><span className={statusColors[lic.status] || 'badge-gray'}>{lic.status}</span></td>
                      <td className="px-4 py-3 text-surface-300 hidden md:table-cell">{appName}</td>
                      <td className="px-4 py-3 text-surface-300 hidden lg:table-cell">{lic.plan}</td>
                      <td className="px-4 py-3 text-surface-400 text-xs hidden lg:table-cell">{new Date(lic.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-xs font-mono text-surface-500 max-w-[120px] truncate hidden xl:table-cell" title={lic.hwid || ''}>{lic.hwid || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => navigate(`/licenses/${lic.id}`)} className="btn-ghost p-1.5" title="View"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => copyKey(lic.license_key)} className="btn-ghost p-1.5" title="Copy"><Copy className="w-4 h-4" /></button>
                          {lic.status === 'banned' ? (
                            <button onClick={() => handleStatusChange(lic.id, 'active')} className="btn-ghost p-1.5 text-white" title="Unban"><CheckCircle className="w-4 h-4" /></button>
                          ) : (
                            <button onClick={() => handleStatusChange(lic.id, 'banned')} className="btn-ghost p-1.5 text-red-400" title="Ban"><Ban className="w-4 h-4" /></button>
                          )}
                          <button onClick={() => handleResetHwid(lic.id)} className="btn-ghost p-1.5" title="Reset HWID"><RotateCcw className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(lic.id)} className="btn-ghost p-1.5 text-red-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-surface-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={prevPage} disabled={page <= 1} className="btn-secondary px-3 py-1.5 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={nextPage} disabled={page >= totalPages} className="btn-secondary px-3 py-1.5 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
