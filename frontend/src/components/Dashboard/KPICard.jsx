export default function KPICard({ icon, value, unit, label, trend, trendUp }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-bg3 flex items-center justify-center text-lg shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1">
          <span className="font-display font-bold text-2xl text-white">{value}</span>
          {unit && <span className="text-sm text-slate-400">{unit}</span>}
        </div>
        <div className="text-xs text-slate-400 truncate">{label}</div>
      </div>
      {trend && (
        <div className={`text-xs font-medium shrink-0 ${trendUp ? 'text-green-400' : 'text-red'}`}>
          {trendUp ? '▲' : '▼'} {trend}
        </div>
      )}
    </div>
  );
}
