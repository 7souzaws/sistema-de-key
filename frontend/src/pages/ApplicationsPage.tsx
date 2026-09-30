import { useState, useEffect } from 'react';
import { Plus, Trash2, Power, PowerOff, Copy, RefreshCw, Eye, EyeOff, AppWindow } from 'lucide-react';
import toast from 'react-hot-toast';
import { applicationApi } from '../services/api';
import type { Application } from '../types';

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newVersion, setNewVersion] = useState('1.0.0');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadApps(); }, []);

  const loadApps = async () => {
    try {
      const res = await applicationApi.getAll();
      setApps(res.data);
    } catch { toast.error('Failed to load applications'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { toast.error('Name is required'); return; }
    setCreating(true);
    try {
      await applicationApi.create(newName, newVersion);
      toast.success('Application created');
      setShowModal(false);
      setNewName('');
      setNewVersion('1.0.0');
      loadApps();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create');
    } finally { setCreating(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will also delete all its licenses.`)) return;
    try {
      await applicationApi.delete(id);
      toast.success('Deleted');
      loadApps();
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggleStatus = async (id: string, current: string) => {
    try {
      await applicationApi.update(id, { status: current === 'active' ? 'inactive' : 'active' });
      toast.success('Status updated');
      loadApps();
    } catch { toast.error('Failed to update'); }
  };

  const handleRegenerateSecret = async (id: string) => {
    if (!confirm('Regenerate secret? The old secret will stop working immediately.')) return;
    try {
      const res = await applicationApi.regenerateSecret(id);
      toast.success(`New secret: ${res.data.secret}`);
      loadApps();
    } catch { toast.error('Failed to regenerate'); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  const toggleSecret = (id: string) => {
    setShowSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Applications</h1>
          <p className="text-sm text-surface-400 mt-1">Manage your software applications</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Application
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-surface-700 rounded w-48 mb-3"></div>
              <div className="h-4 bg-surface-700 rounded w-32"></div>
            </div>
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="card p-12 text-center">
          <AppWindow className="w-12 h-12 text-surface-600 mx-auto mb-3" />
          <p className="text-surface-400">No applications yet</p>
          <p className="text-sm text-surface-500 mt-1">Create your first application to start generating licenses</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {apps.map((app) => (
            <div key={app.id} className="card card-hover p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white">{app.name}</h3>
                    <span className={app.status === 'active' ? 'badge-green' : 'badge-red'}>
                      {app.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-surface-400">
                    <span className="flex items-center gap-1">
                      App ID:
                      <code className="font-mono text-surface-300 bg-surface-800 px-1.5 py-0.5 rounded">{app.app_id}</code>
                      <button onClick={() => copyToClipboard(app.app_id)} className="text-surface-500 hover:text-white"><Copy className="w-3 h-3" /></button>
                    </span>
                    <span>Version: {app.version}</span>
                    <span className="flex items-center gap-1">
                      Secret:
                      <code className="font-mono text-surface-300 bg-surface-800 px-1.5 py-0.5 rounded">
                        {showSecrets[app.id] ? app.secret : '••••••••'}
                      </code>
                      <button onClick={() => toggleSecret(app.id)} className="text-surface-500 hover:text-white">
                        {showSecrets[app.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      {showSecrets[app.id] && (
                        <button onClick={() => copyToClipboard(app.secret)} className="text-surface-500 hover:text-white"><Copy className="w-3 h-3" /></button>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleToggleStatus(app.id, app.status)} className="btn-ghost" title={app.status === 'active' ? 'Deactivate' : 'Activate'}>
                    {app.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleRegenerateSecret(app.id)} className="btn-ghost" title="Regenerate Secret">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(app.id, app.name)} className="btn-ghost text-red-400 hover:text-red-300" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="card p-6 w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">New Application</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="input" placeholder="My Software" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Version</label>
                <input value={newVersion} onChange={(e) => setNewVersion(e.target.value)} className="input" placeholder="1.0.0" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
