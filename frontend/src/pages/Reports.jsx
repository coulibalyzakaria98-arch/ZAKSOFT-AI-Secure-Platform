import { useState, useEffect } from 'react';
import { scanAPI } from '../services/api';

const MOCK = [
  { id: '1', url: 'boutique-eclat.ci',       score: 88, ssl_valid: true,  status: 'completed', created_at: '2026-07-09T10:00:00' },
  { id: '2', url: 'api.boutique-eclat.ci',   score: 65, ssl_valid: true,  status: 'completed', created_at: '2026-07-08T14:30:00' },
  { id: '3', url: 'admin.boutique-eclat.ci', score: 34, ssl_valid: false, status: 'completed', created_at: '2026-07-06T09:15:00' },
];

export default function Reports() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scanAPI.history()
      .then(r => setScans(r.data.length ? r.data : MOCK))
      .catch(() => setScans(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const scoreClass = s =>
    s >= 80 ? 'text-green-400 bg-green/8'
    : s >= 60 ? 'text-amber bg-amber/8'
    : 'text-red bg-red/8';

  const fmt = iso => new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });

  return (
    <div className="p-6 max-w-5xl animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Rapports</h1>
          <p className="text-sm text-slate-400 mt-1">Historique complet de vos analyses</p>
        </div>
        <button className="btn-primary px-4 py-2 text-sm">Exporter PDF</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Chargement…</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8 text-left">
                {['Site', 'Date', 'Score', 'SSL', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {scans.map(s => (
                <tr key={s.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-white">{s.url}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{fmt(s.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${scoreClass(s.score)}`}>
                      {s.score}/100
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {s.ssl_valid
                      ? <span className="text-green-400">Valide</span>
                      : <span className="text-red">Invalide</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-green-400 bg-green/8 px-2.5 py-1 rounded-full">
                      Complété
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-slate-400 hover:text-cyan transition-colors">Voir →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
