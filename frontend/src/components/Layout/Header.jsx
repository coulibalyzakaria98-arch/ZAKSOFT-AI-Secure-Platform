import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header({ onMenuClick }) {
  const [query, setQuery] = useState('');
  const nav = useNavigate();

  const handleSearch = (e) => {
    if (e.key !== 'Enter') return;
    const q = query.toLowerCase();
    if (q.includes('scan') || q.includes('site'))          nav('/scanner');
    else if (q.includes('assist') || q.includes('chat'))   nav('/assistant');
    else if (q.includes('form') || q.includes('quiz'))     nav('/training');
    else if (q.includes('code') || q.includes('dev'))      nav('/dev');
    else if (q.includes('rapport') || q.includes('report')) nav('/reports');
    setQuery('');
  };

  return (
    <header className="h-16 flex items-center justify-between px-5 border-b border-white/8 bg-bg1/80 backdrop-blur-md shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-slate-400 hover:text-white p-1"
        >
          ☰
        </button>
        <div className="flex items-center gap-2 bg-bg3 rounded-lg px-3 py-2 w-56">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-slate-400">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Rechercher..."
            className="bg-transparent text-sm text-white placeholder-slate-500 outline-none flex-1"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
          <BellIcon />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red text-[8px] flex items-center justify-center font-bold text-white" />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-white/8">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan to-violet flex items-center justify-center text-bg1 text-xs font-bold">
            AK
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-medium text-white leading-none">ZAKSOFT</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function BellIcon() {
  return <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
