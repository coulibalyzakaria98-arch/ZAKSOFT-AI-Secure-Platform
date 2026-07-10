import { useState } from 'react';

export default function ScanForm({ onScan, loading }) {
  const [url, setUrl] = useState('');

  const submit = (e) => {
    e.preventDefault();
    let val = url.trim();
    if (!val) return;
    if (!val.startsWith('http')) val = 'https://' + val;
    onScan(val);
  };

  return (
    <form onSubmit={submit} className="card p-5">
      <div className="flex gap-3">
        <div className="flex items-center gap-2 flex-1 bg-bg3 border border-white/8 rounded-xl px-4 py-3 focus-within:border-cyan/50 transition-colors">
          <span className="text-lg">🌐</span>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://votre-site.com"
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm font-mono"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="btn-primary px-6 py-3 text-sm flex items-center gap-2 shrink-0"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="20 40" opacity=".7"/>
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
          {loading ? 'Analyse...' : 'Scanner'}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500 px-1">
        Exemple : google.com, github.com, votre-boutique.ci
      </p>
    </form>
  );
}
