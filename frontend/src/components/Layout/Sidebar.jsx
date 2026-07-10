import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const nav = [
  { to: '/dashboard',   label: 'Vue d\'ensemble', icon: GridIcon },
  { to: '/scanner',     label: 'Scanner IA',       icon: SearchIcon, badge: 'Live' },
  { to: '/assistant',   label: 'AI Assistant',     icon: ChatIcon },
  { to: '/training',    label: 'Formation',        icon: BookIcon },
  { to: '/dev',         label: 'Dev Assistant',    icon: CodeIcon, badge: 'Nouveau' },
  { to: '/reports',     label: 'Rapports',         icon: FileIcon },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();

  const initials = (user?.full_name || user?.email || 'AK')
    .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className={`flex flex-col h-screen bg-bg2 border-r border-white/8 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} shrink-0`}>
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-white/8 h-16">
        <ShieldLogo />
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-display font-bold text-sm text-white">
              ZAK<span className="text-cyan">SOFT</span>
            </div>
            <div className="text-[9px] text-slate-400 tracking-widest">AI SECURE</div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto text-slate-400 hover:text-white p-1 rounded"
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* User badge */}
      {!collapsed && (
        <div className="flex items-center gap-2 px-3 py-2 mx-3 my-2 rounded-lg bg-bg3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan to-violet text-bg1 text-xs font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-white truncate">{user?.full_name || user?.email?.split('@')[0] || 'Demo'}</div>
            <div className="text-[10px] text-slate-400">{user?.role || 'Admin'}</div>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-green-400 shrink-0" />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto space-y-0.5">
        {nav.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-cyan/10 text-cyan'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 truncate">{label}</span>
                {badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan/15 text-cyan border border-cyan/20">
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer score */}
      {!collapsed && (
        <div className="p-3 border-t border-white/8">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Score global</span><span className="text-white font-medium">72/100</span>
          </div>
          <div className="h-1.5 rounded-full bg-bg3 overflow-hidden">
            <div className="h-full w-[72%] bg-gradient-to-r from-cyan to-violet rounded-full" />
          </div>
          <button
            onClick={logout}
            className="mt-3 w-full text-xs text-slate-500 hover:text-red-400 transition-colors text-left"
          >
            Déconnexion →
          </button>
        </div>
      )}
    </aside>
  );
}

/* ── Inline SVG icons ─────────────────────────────────────────── */
function ShieldLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="shrink-0">
      <path d="M16 2L4 7v8c0 7.4 5.1 14.3 12 16 6.9-1.7 12-8.6 12-16V7L16 2z" fill="#0a1628" stroke="url(#sg)" strokeWidth="0.5"/>
      <circle cx="16" cy="15" r="4" fill="none" stroke="#00f5d4" strokeWidth="1.5"/>
      <circle cx="16" cy="15" r="1.5" fill="#00f5d4"/>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00f5d4"/><stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
function GridIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg>;
}
function SearchIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function ChatIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8"/></svg>;
}
function BookIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M6 12v5c3 3 9 3 12 0v-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>;
}
function CodeIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="8 6 2 12 8 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function FileIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>;
}
