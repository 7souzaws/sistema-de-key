import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import type { Admin } from '../types';

interface Props {
  admin: Admin;
  onLogout: () => void;
}

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/applications', label: 'Applications' },
  { to: '/licenses', label: 'Licenses' },
  { to: '/generate', label: 'Generate' },
  { to: '/integration', label: 'Integration' },
  { to: '/sessions', label: 'Sessions' },
  { to: '/logs', label: 'Logs' },
];

export default function AdminLayout({ admin, onLogout }: Props) {
  const location = useLocation();

  const pillClass = ({ isActive }: { isActive: boolean }) =>
    `pill ${isActive ? 'pill-active' : ''}`;

  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-0 z-40 bg-surface-950/60 backdrop-blur-xl border-b border-white/5 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4 h-16">
            <div className="flex items-center flex-shrink-0">
              <img src="/logo.png" alt="Key Souza" className="h-8 w-auto hidden sm:block" />
            </div>

            <nav className="pill-nav hidden md:inline-flex mx-auto">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} className={pillClass}>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="ml-auto md:ml-0 flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/5">
                <div className="w-7 h-7 rounded-full bg-surface-800 flex items-center justify-center text-[11px] font-semibold text-white">
                  {admin.username[0].toUpperCase()}
                </div>
                <span className="text-xs text-surface-400 px-1.5 hidden lg:block max-w-24 truncate">
                  {admin.username}
                </span>
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={onLogout}
                title="Sign out"
                className="sm:hidden w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 bg-white/5 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <nav className="pill-nav md:hidden overflow-x-auto no-scrollbar w-full justify-start pb-3">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={pillClass}>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main key={location.pathname} className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in-up">
        {!['/', '/applications', '/licenses', '/generate', '/integration', '/sessions', '/logs'].includes(location.pathname) && (
          <h2 className="text-lg font-semibold text-white mb-4">
            {navItems.find((n) => n.to === location.pathname)?.label || 'Details'}
          </h2>
        )}
        <Outlet />
      </main>
    </div>
  );
}