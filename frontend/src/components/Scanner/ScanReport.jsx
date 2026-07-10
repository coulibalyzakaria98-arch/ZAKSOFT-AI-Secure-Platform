export default function ScanReport({ data }) {
  if (!data) return null;

  const { score, ssl, headers, vulnerabilities, tech_stack, ai_report, url } = data;

  const scoreGradient =
    score >= 80 ? 'from-green to-emerald-600'
    : score >= 60 ? 'from-amber to-orange-500'
    : 'from-red to-rose-700';

  const levelColor = {
    critical: 'bg-red/10 text-red border border-red/20',
    warning:  'bg-amber/10 text-amber border border-amber/20',
    info:     'bg-slate-500/10 text-slate-400 border border-slate-600/20',
  };

  return (
    <div className="card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/8 flex-wrap gap-4">
        <div>
          <div className="font-display font-bold text-base">Rapport de Sécurité</div>
          <div className="text-xs text-slate-400 mt-0.5 font-mono">{url}</div>
          {ssl?.valid && (
            <div className="mt-1 text-xs text-green-400">
              SSL {ssl.issuer_org} · {ssl.protocol} · expire dans {ssl.expiry_days}j
            </div>
          )}
          {!ssl?.valid && ssl?.error && (
            <div className="mt-1 text-xs text-red">SSL {ssl.error}</div>
          )}
        </div>
        {/* Score donut */}
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${scoreGradient} flex flex-col items-center justify-center shadow-lg`}>
          <span className="font-display font-bold text-xl text-white leading-none">{score}</span>
          <span className="text-[9px] text-white/70">/100</span>
        </div>
      </div>

      {/* Body: Vulns + Headers */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/8">
        {/* Vulnerabilities */}
        <div className="p-5">
          <div className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">
            Vulnérabilités ({vulnerabilities?.length ?? 0})
          </div>
          <div className="space-y-2">
            {vulnerabilities?.length === 0 && (
              <div className="text-green-400 text-sm">Aucune vulnérabilité détectée</div>
            )}
            {vulnerabilities?.map((v, i) => (
              <div key={i} className={`text-xs rounded-lg px-3 py-2 ${levelColor[v.level] || levelColor.info}`}>
                <div className="font-semibold">{v.title}</div>
                <div className="mt-0.5 opacity-80 leading-relaxed">{v.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Headers */}
        <div className="p-5">
          <div className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">
            Security Headers
          </div>
          <div className="space-y-1.5">
            {Object.entries(headers || {}).map(([name, info]) => (
              <div key={name} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${
                info.present ? 'bg-green/8 text-green-400' : 'bg-red/8 text-red'
              }`}>
                <span>{info.present ? '✅' : '❌'}</span>
                <span className="font-medium">{name}</span>
              </div>
            ))}
          </div>

          {/* Tech stack */}
          {tech_stack && Object.keys(tech_stack).length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Stack détectée</div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(tech_stack).filter(([,v]) => v).map(([k, v]) => (
                  <span key={k} className="text-[11px] px-2 py-0.5 rounded-full bg-cyan/8 text-cyan border border-cyan/20">
                    {k}: {String(v)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Report */}
      {ai_report && (
        <div className="m-4 p-4 rounded-xl bg-violet/5 border border-violet/20">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-violet bg-violet/15 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            🤖 Analyse IA — ZAKSOFT Assistant
          </div>
          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {ai_report.full_text || ai_report.summary}
          </div>
        </div>
      )}
    </div>
  );
}
