import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Ban, CheckCircle, RotateCcw, Trash2, Clock, Shield, Calendar, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { licenseApi, applicationApi } from '../services/api';
import { logApi } from '../services/api';
import type { License, Application, LogEntry, PaginatedResponse } from '../types';

const statusColors: Record<string, string> = {
  unused: 'badge-gray', active: 'badge-green', expired: 'badge-yellow', banned: 'badge-red', disabled: 'badge-blue',
};

export default function LicenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [license, setLicense] = useState<License | null>(null);
  const [app, setApp] = useState<Application | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const licRes = await licenseApi.getById(id!);
      setLicense(licRes.data);

      const appRes = await applicationApi.getById(licRes.data.application_id);
      setApp(appRes.data);

      const logsRes = await logApi.getAll({ license_id: id!, limit: 50 });
      setLogs(logsRes.data.data);
    } catch { toast.error('Failed to load details'); }
    finally { setLoading(false); }
  };

  const copyKey = (key: string) => { navigator.clipboard.writeText(key); toast.success('Copied'); };

  const handleStatusChange = async (status: string) => {
    try { await licenseApi.updateStatus(id!, status); toast.success(`License ${status}`); loadData(); }
    catch { toast.error('Failed'); }
  };

  const handleResetHwid = async () => {
    if (!confirm('Reset HWID?')) return;
    try { await licenseApi.resetHwid(id!); toast.success('HWID reset'); loadData(); }
    catch { toast.error('Failed'); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this license permanently?')) return;
    try { await licenseApi.delete(id!); toast.success('Deleted'); navigate('/licenses'); }
    catch { toast.error('Failed'); }
  };

  const getRemaining = () => {
    if (!license?.expires_at) return 'Lifetime';
    const diff = new Date(license.expires_at).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return `${days}d ${hours}h`;
  };

  if (loading) {
    return <div className="card p-8 animate-pulse"><div className="h-6 bg-surface-700 rounded w-48 mb-4"></div><div className="h-4 bg-surface-700 rounded w-32"></div></div>;
  }

  if (!license) return <div className="card p-8 text-center text-surface-400">License not found</div>;

  const eventColors: Record<string, string> = {
    LICENSE_CREATED: 'text-surface-400', LICENSE_ACTIVATED: 'text-white', LICENSE_LOGIN: 'text-surface-300',
    LICENSE_EXPIRED: 'text-surface-400', LICENSE_BANNED: 'text-surface-500', LICENSE_DISABLED: 'text-surface-500',
    HWID_RESET: 'text-surface-400', HWID_MISMATCH: 'text-surface-500', INVALID_LICENSE: 'text-surface-500',
    INVALID_APPLICATION: 'text-surface-500',
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/licenses')} className="btn-ghost flex items-center gap-2 text-surface-400">
        <ArrowLeft className="w-4 h-4" /> Back to Licenses
      </button>

      <div className="card p-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-white font-mono">{license.license_key}</h1>
              <button onClick={() => copyKey(license.license_key)} className="text-surface-500 hover:text-white"><Copy className="w-4 h-4" /></button>
              <span className={statusColors[license.status]}>{license.status}</span>
            </div>
            <p className="text-sm text-surface-400">{app?.name || 'Unknown Application'}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {license.status === 'banned' ? (
              <button onClick={() => handleStatusChange('active')} className="btn-secondary flex items-center gap-2 text-white"><CheckCircle className="w-4 h-4" /> Unban</button>
            ) : (
              <button onClick={() => handleStatusChange('banned')} className="btn-danger flex items-center gap-2"><Ban className="w-4 h-4" /> Ban</button>
            )}
            <button onClick={handleResetHwid} className="btn-secondary flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Reset HWID</button>
            <button onClick={handleDelete} className="btn-danger flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {[
            { label: 'Plan', value: license.plan, icon: Shield },
            { label: 'Duration', value: license.duration === 'lifetime' ? 'Lifetime' : license.duration, icon: Clock },
            { label: 'Created', value: new Date(license.created_at).toLocaleString(), icon: Calendar },
            { label: 'Activated', value: license.activated_at ? new Date(license.activated_at).toLocaleString() : 'Never', icon: Calendar },
            { label: 'Expires', value: license.expires_at ? new Date(license.expires_at).toLocaleString() : 'Never', icon: Clock },
            { label: 'Remaining', value: getRemaining(), icon: Clock },
            { label: 'HWID', value: license.hwid || 'Not bound', icon: Shield },
            { label: 'HWID Resets', value: String(license.hwid_resets || 0), icon: RotateCcw },
            { label: 'Last Login', value: license.last_login ? new Date(license.last_login).toLocaleString() : 'Never', icon: Globe },
            { label: 'Last IP', value: license.last_ip || 'N/A', icon: Globe },
            { label: 'Bound At', value: license.hwid_bound_at ? new Date(license.hwid_bound_at).toLocaleString() : 'N/A', icon: Calendar },
            { label: 'Notes', value: license.notes || 'N/A', icon: Shield },
          ].map((item) => (
            <div key={item.label} className="bg-surface-900/50 rounded-lg p-3 border border-surface-800">
              <div className="flex items-center gap-2 mb-1">
                <item.icon className="w-3.5 h-3.5 text-surface-500" />
                <span className="text-xs text-surface-500">{item.label}</span>
              </div>
              <p className="text-sm text-white font-medium truncate" title={item.value}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card animate-fade-in-up">
        <div className="px-5 py-4 border-b border-surface-700">
          <h2 className="font-semibold text-white">Event History</h2>
        </div>
        <div className="divide-y divide-surface-700/50">
          {logs.length === 0 ? (
            <p className="px-5 py-8 text-center text-surface-500">No events recorded</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${eventColors[log.event] || 'text-surface-400'}`}>{log.event}</span>
                  {log.ip_address && <span className="text-xs text-surface-500">{log.ip_address}</span>}
                  {log.hwid && <span className="text-xs text-surface-500 font-mono truncate max-w-[200px]">{log.hwid}</span>}
                </div>
                <span className="text-xs text-surface-500">{new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
