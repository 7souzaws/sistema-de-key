import { useState, useEffect } from 'react';
import { PlusCircle, Copy, Download, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { licenseApi, applicationApi } from '../services/api';
import type { Application, License } from '../types';

const durations = [
  { value: '1h', label: '1 Hour' }, { value: '1d', label: '1 Day' }, { value: '3d', label: '3 Days' },
  { value: '7d', label: '7 Days' }, { value: '15d', label: '15 Days' }, { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' }, { value: '180d', label: '180 Days' }, { value: '365d', label: '365 Days' },
  { value: 'lifetime', label: 'Lifetime' },
];

export default function GenerateKeysPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [generated, setGenerated] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState('');
  const [plan, setPlan] = useState('default');
  const [duration, setDuration] = useState('30d');
  const [amount, setAmount] = useState(1);
  const [prefix, setPrefix] = useState('');
  const [notes, setNotes] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    applicationApi.getAll().then((res) => setApps(res.data)).catch(() => toast.error('Failed to load apps'));
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) { toast.error('Select an application'); return; }
    if (amount < 1 || amount > 500) { toast.error('Amount must be 1-500'); return; }
    setLoading(true);
    try {
      const res = await licenseApi.generate({
        application_id: selectedApp, plan, duration, amount,
        prefix: prefix || undefined, notes: notes || undefined,
      });
      setGenerated(res.data.keys);
      toast.success(`${res.data.count} keys generated`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  const copyKey = (key: string) => { navigator.clipboard.writeText(key); toast.success('Copied'); };

  const copyAll = () => {
    const allKeys = generated.map((k) => k.license_key).join('\n');
    navigator.clipboard.writeText(allKeys);
    setCopiedAll(true);
    toast.success('All keys copied');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const exportTxt = () => {
    const blob = new Blob([generated.map((k) => k.license_key).join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'licenses.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const header = 'Key,Status,Plan,Duration\n';
    const rows = generated.map((k) => `${k.license_key},${k.status},${k.plan},${k.duration}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'licenses.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">Generate Keys</h1>
        <p className="text-sm text-surface-400 mt-1">Create new license keys in bulk</p>
      </div>

      <form onSubmit={handleGenerate} className="card p-6 space-y-4 animate-fade-in-up">
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-1.5">Application *</label>
          <select value={selectedApp} onChange={(e) => setSelectedApp(e.target.value)} className="select">
            <option value="">Select application</option>
            {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Plan</label>
            <input value={plan} onChange={(e) => setPlan(e.target.value)} className="input" placeholder="default" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Duration *</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className="select">
              {durations.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Amount (1-500)</label>
            <input type="number" min={1} max={500} value={amount} onChange={(e) => setAmount(parseInt(e.target.value) || 1)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Prefix (optional)</label>
            <input value={prefix} onChange={(e) => setPrefix(e.target.value)} className="input" placeholder="PRO, PREMIUM..." />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-300 mb-1.5">Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input" rows={2} placeholder="Internal notes..." />
        </div>

        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          {loading ? 'Generating...' : 'Generate Keys'}
        </button>
      </form>

      {generated.length > 0 && (
        <div className="card p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">{generated.length} Keys Generated</h2>
            <div className="flex gap-2">
              <button onClick={copyAll} className="btn-secondary text-xs flex items-center gap-1">
                {copiedAll ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Copy All
              </button>
              <button onClick={exportTxt} className="btn-secondary text-xs flex items-center gap-1"><Download className="w-3.5 h-3.5" /> TXT</button>
              <button onClick={exportCsv} className="btn-secondary text-xs flex items-center gap-1"><Download className="w-3.5 h-3.5" /> CSV</button>
            </div>
          </div>
          <div className="bg-surface-900/50 rounded-lg border border-surface-800 max-h-80 overflow-y-auto stagger">
            {generated.map((k) => (
              <div key={k.id} className="flex items-center justify-between px-4 py-2.5 border-b border-surface-800 last:border-0">
                <code className="font-mono text-sm text-brand-400">{k.license_key}</code>
                <button onClick={() => copyKey(k.license_key)} className="text-surface-500 hover:text-white"><Copy className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
