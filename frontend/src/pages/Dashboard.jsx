import { useNavigate } from 'react-router-dom';
import KPICard from '../components/Dashboard/KPICard';

const RECENT_SCANS = [
  { url: 'boutique-eclat.ci',        time: 'Il y a 2h',     score: 88, status: 'done' },
  { url: 'api.boutique-eclat.ci',    time: 'Il y a 1 jour', score: 65, status: 'warn' },
  { url: 'admin.boutique-eclat.ci',  time: 'Il y a 3 jours',score: 34, status: 'bad' },
];

const ALERTS = [
  { icon: '🚨', level: 'critical', title: 'Certificat SSL expire dans 7 jours', sub: 'admin.boutique-eclat.ci' },
  { icon: '⚠️', level: 'warning',  title: 'Vulnérabilité OWASP A03:2021',       sub: 'Injection — api.boutique-eclat.ci' },
  { icon: 'ℹ️', level: 'info',     title: 'Formation incomplète',                sub: '2 employés n\'ont pas terminé' },
];

export default function Dashboard() {
  const nav = useNavigate();

  const scoreColor = s =>
    s >= 80 ? 'text-green-400' : s >= 60 ? 'text-amber' : 'text-red';

  return (
    <div className="p-6 space-y-6 max-w-7xl animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Vue d'ensemble</h1>
          <p className="text-sm text-slate-400 mt-1">État de sécurité de votre organisation</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Dernier scan : il y a 2h</span>
          <button
            onClick={() => nav('/scanner')}
            className="btn-primary px-4 py-2 text-sm"
          >
            Nouveau scan →
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon="🛡️" value="72" unit="/100" label="Score sécurité"  trend="+8 ce mois"   trendUp />
        <KPICard icon="🚨" value="3"  unit=""      label="Risques critiques" trend="-2 cette sem" trendUp />
        <KPICard icon="🔍" value="47" unit=""      label="Scans ce mois"    trend="+12 vs mois"  trendUp />
        <KPICard icon="🎓" value="8"  unit="/10"   label="Employés formés"  trend="80% équipe"   trendUp />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Score evolution */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold text-sm text-white">Évolution du score</h3>
            <div className="flex gap-1">
              {['7j', '30j', '90j'].map((t, i) => (
                <button key={t} className={`text-xs px-3 py-1 rounded-lg transition-colors ${i === 0 ? 'bg-cyan/10 text-cyan' : 'text-slate-400 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <svg viewBox="0 0 400 120" className="w-full">
            <defs>
              <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00f5d4" stopOpacity=".2"/>
                <stop offset="100%" stopColor="#00f5d4" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00f5d4"/>
                <stop offset="100%" stopColor="#7c3aed"/>
              </linearGradient>
            </defs>
            {[40, 70, 100].map(y => (
              <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            ))}
            <path d="M0,100 C50,90 80,80 120,70 C160,60 180,65 220,55 C260,45 280,40 320,30 C360,20 380,15 400,12 L400,120 L0,120 Z" fill="url(#ag)"/>
            <path d="M0,100 C50,90 80,80 120,70 C160,60 180,65 220,55 C260,45 280,40 320,30 C360,20 380,15 400,12" fill="none" stroke="url(#lg)" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="400" cy="12" r="4" fill="#7c3aed" stroke="white" strokeWidth="2"/>
          </svg>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => <span key={d}>{d}</span>)}
          </div>
        </div>

        {/* Donut */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-sm text-white mb-5">Répartition des risques</h3>
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 160 160" className="w-32 h-32">
              <circle cx="80" cy="80" r="60" fill="none" stroke="#1a2744" strokeWidth="24"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#ef4444" strokeWidth="24" strokeDasharray="113 264" strokeDashoffset="0" transform="rotate(-90 80 80)"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#f59e0b" strokeWidth="24" strokeDasharray="170 207" strokeDashoffset="-113" transform="rotate(-90 80 80)"/>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#7c3aed" strokeWidth="24" strokeDasharray="94 283" strokeDashoffset="-283" transform="rotate(-90 80 80)"/>
              <text x="80" y="76" textAnchor="middle" fill="#f0f6ff" fontSize="18" fontWeight="800" fontFamily="Space Grotesk">18</text>
              <text x="80" y="90" textAnchor="middle" fill="#94a3b8" fontSize="9">Problèmes</text>
            </svg>
            <div className="mt-3 space-y-1.5 w-full">
              {[['#ef4444','Critiques (30%)'],['#f59e0b','Avertissements (45%)'],['#7c3aed','Informatifs (25%)']].map(([c,l]) => (
                <div key={l} className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c }}/>
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent scans + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent scans */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm text-white">Scans récents</h3>
            <button onClick={() => nav('/reports')} className="text-xs text-slate-400 hover:text-cyan transition-colors">
              Voir tout →
            </button>
          </div>
          <div className="space-y-2">
            {RECENT_SCANS.map(s => (
              <div key={s.url} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{s.url}</div>
                  <div className="text-xs text-slate-500">{s.time}</div>
                </div>
                <span className={`text-sm font-bold font-display ${scoreColor(s.score)}`}>{s.score}/100</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm text-white">Alertes actives</h3>
            <span className="text-xs bg-red/10 text-red px-2 py-0.5 rounded-full">{ALERTS.length} actives</span>
          </div>
          <div className="space-y-2">
            {ALERTS.map((a, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
                a.level === 'critical' ? 'bg-red/5 border border-red/15' :
                a.level === 'warning'  ? 'bg-amber/5 border border-amber/15' :
                'bg-blue-500/5 border border-blue-500/15'
              }`}>
                <span className="text-base shrink-0 mt-0.5">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white">{a.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{a.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
