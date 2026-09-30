import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardApi } from '../services/api';
import type { DashboardStats } from '../types';

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let raf = 0;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function StatCard({
  label, value, sub, delay,
}: {
  label: string;
  value: number;
  sub: string;
  delay: string;
}) {
  const n = useCountUp(value);
  return (
    <div className="card card-hover p-4 animate-fade-in-up" style={{ animationDelay: delay }}>
      <div className="min-w-0">
        <p className="text-xs text-surface-400 font-medium truncate">{label}</p>
        <p className="text-xl font-bold leading-tight tracking-tight text-white tabular-nums mt-0.5">
          {n.toLocaleString()}
        </p>
      </div>
      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-white/5">
        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
        <span className="text-[11px] text-surface-500 truncate">{sub}</span>
      </div>
    </div>
  );
}

function TrendChart({ title, color, fill, data, delay }: {
  title: string;
  color: string;
  fill: string;
  data: { date: string; count: number }[];
  delay: string;
}) {
  return (
    <div className="card p-4 animate-fade-in-up" style={{ animationDelay: delay }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          <h3 className="text-xs font-medium text-surface-300">{title}</h3>
        </div>
        <span className="text-[11px] text-surface-500">last 30 days</span>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fill} stopOpacity={0.35} />
              <stop offset="100%" stopColor={fill} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#737373' }} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#737373' }} axisLine={false} tickLine={false} width={32} />
          <Tooltip
            contentStyle={{ background: '#171717', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '12px', color: '#f5f5f5' }}
            labelStyle={{ color: '#a3a3a3' }}
            cursor={{ stroke: '#404040', strokeDasharray: '3 3' }}
          />
          <Area type="monotone" dataKey="count" stroke={color} strokeWidth={2} fill={`url(#grad-${title.replace(/\s+/g, '')})`} dot={false} activeDot={{ r: 4, fill: color, stroke: '#0a0a0a', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await dashboardApi.getStats();
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-9 h-9 rounded-xl bg-white/5"></div>
          <div className="space-y-2">
            <div className="h-4 bg-white/5 rounded w-40"></div>
            <div className="h-3 bg-white/5 rounded w-56"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/5"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-white/5 rounded w-20"></div>
                  <div className="h-6 bg-white/5 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
<div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse" style={{ gridColumn: i === 0 ? 'span 2' : undefined }}>
              <div className="h-64"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const total = stats.totalLicenses || 0;
  const activePct = total > 0 ? Math.round((stats.activeLicenses / total) * 100) : 0;
  const unusedPct = total > 0 ? Math.round((stats.unusedLicenses / total) * 100) : 0;

  const statuses = [
    { label: 'Active', value: stats.activeLicenses, color: '#ffffff' },
    { label: 'Unused', value: stats.unusedLicenses, color: '#d4d4d4' },
    { label: 'Expired', value: stats.expiredLicenses, color: '#a3a3a3' },
    { label: 'Banned', value: stats.bannedLicenses, color: '#737373' },
    { label: 'Disabled', value: stats.disabledLicenses || 0, color: '#404040' },
  ];

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight leading-tight">Dashboard</h1>
          <p className="text-xs text-surface-400 mt-0.5">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-surface-400 bg-white/5 border border-white/5 rounded-full px-3 py-1.5 self-start sm:self-auto">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
          </span>
          API online
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Licenses" value={stats.totalLicenses} sub="All keys generated" delay="0.05s" />
        <StatCard label="Active" value={stats.activeLicenses} sub={`${activePct}% of total licenses`} delay="0.1s" />
        <StatCard label="Active Sessions" value={stats.totalSessions} sub="Clients currently online" delay="0.15s" />
        <StatCard label="Applications" value={stats.totalApplications} sub="Registered software" delay="0.2s" />
      </div>

      <div className="card p-4 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white" />
            <h3 className="text-xs font-medium text-surface-300">License distribution</h3>
          </div>
          <span className="text-[11px] text-surface-500">{total.toLocaleString()} total</span>
        </div>

        {total === 0 ? (
          <p className="text-sm text-surface-500 py-2">No licenses yet — generate your first keys.</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex-shrink-0">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={statuses}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={2}
                    stroke="none"
                    cornerRadius={4}
                  >
                    {statuses.map((s) => (
                      <Cell key={s.label} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#171717', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '12px', color: '#f5f5f5' }}
                    itemStyle={{ color: '#f5f5f5' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-white tabular-nums leading-none">{total.toLocaleString()}</span>
                <span className="text-[10px] text-surface-500 mt-1 uppercase tracking-wide">licenses</span>
              </div>
            </div>

            <div className="w-full flex-1 space-y-3">
              {statuses.map((s) => {
                const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                return (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-xs text-surface-400 w-16 flex-shrink-0">{s.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: s.color }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-white tabular-nums w-12 text-right flex-shrink-0">{s.value.toLocaleString()}</span>
                    <span className="text-[11px] text-surface-500 tabular-nums w-9 text-right flex-shrink-0">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TrendChart title="Activations" color="#ffffff" fill="#ffffff" data={stats.activationsByDay} delay="0.3s" />
        </div>
        <TrendChart title="Logins" color="#a3a3a3" fill="#a3a3a3" data={stats.loginsByDay} delay="0.35s" />
        <div className="lg:col-span-3">
          <TrendChart title="Licenses created" color="#737373" fill="#a3a3a3" data={stats.licensesByDay} delay="0.4s" />
        </div>
      </div>
    </div>
  );
}