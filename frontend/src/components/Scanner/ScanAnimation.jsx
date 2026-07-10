const STEPS = [
  { id: 1, icon: '🔐', label: 'Vérification SSL/HTTPS' },
  { id: 2, icon: '🛡️', label: 'Security Headers' },
  { id: 3, icon: '🔎', label: 'OWASP Top 10' },
  { id: 4, icon: '🖥️', label: 'Détection stack technique' },
  { id: 5, icon: '🤖', label: 'Génération rapport IA' },
];

export default function ScanAnimation({ step = 0 }) {
  return (
    <div className="card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <svg className="w-5 h-5 animate-spin-slow text-cyan" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="20 40"/>
        </svg>
        <span className="text-sm font-medium text-slate-300">
          {step < STEPS.length ? STEPS[step]?.label : 'Finalisation...'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-bg3 mb-5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan to-violet transition-all duration-500"
          style={{ width: `${((step + 0.5) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-all duration-300 ${
              i < step
                ? 'bg-cyan/10 text-cyan'
                : i === step
                ? 'bg-violet/10 text-violet animate-pulse'
                : 'bg-bg3 text-slate-500'
            }`}
          >
            <span>{s.icon}</span>
            <span className="truncate">{s.label}</span>
            {i < step && <span className="ml-auto text-cyan shrink-0">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
