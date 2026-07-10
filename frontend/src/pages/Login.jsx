import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [tab, setTab]       = useState('login');
  const [email, setEmail]   = useState('');
  const [password, setPass] = useState('');
  const [name, setName]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const { login, register } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') await login(email, password);
      else                 await register(email, password, name);
      nav('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur de connexion — vérifiez que le backend tourne.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg1 px-4"
         style={{ backgroundImage: 'radial-gradient(ellipse at 20% 20%, rgba(0,245,212,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(124,58,237,0.08) 0%, transparent 60%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <ShieldLogo />
          <div>
            <div className="font-display font-bold text-lg text-white">ZAK<span className="text-cyan">SOFT</span></div>
            <div className="text-[9px] text-slate-400 tracking-widest">AI SECURE PLATFORM</div>
          </div>
        </div>

        <div className="card p-8">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-bg3 rounded-xl mb-7">
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  tab === t ? 'bg-bg2 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="font-display font-bold text-xl text-white">
              {tab === 'login' ? 'Bon retour 👋' : 'Créer un compte'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {tab === 'login' ? 'Connectez-vous à votre espace sécurité' : 'Démarrez votre protection cybersécurité'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red/10 border border-red/20 text-sm text-red">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {tab === 'register' && (
              <Field label="Nom complet" type="text" value={name} onChange={setName} placeholder="Aya Konan" />
            )}
            <Field label="Adresse email" type="email" value={email} onChange={setEmail} placeholder="vous@entreprise.com" />
            <Field label="Mot de passe" type="password" value={password} onChange={setPass} placeholder="••••••••" />

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 text-sm">
              {loading ? 'Chargement...' : tab === 'login' ? 'Se connecter →' : 'Créer mon compte →'}
            </button>
          </form>

          <div className="mt-6 p-3 rounded-lg bg-violet/5 border border-violet/20 text-xs text-slate-400 text-center">
            Demo : <span className="text-violet font-medium">demo@zaksoft.ai / demo1234</span>
          </div>
        </div>

        <a href="../index.html" className="block text-center mt-5 text-xs text-slate-500 hover:text-cyan transition-colors">
          ← Retour à l'accueil
        </a>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full bg-bg3 border border-white/8 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan/50 transition-colors"
      />
    </div>
  );
}

function ShieldLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
      <path d="M16 2L4 7v8c0 7.4 5.1 14.3 12 16 6.9-1.7 12-8.6 12-16V7L16 2z" fill="#0a1628" stroke="url(#sg)" strokeWidth="0.5"/>
      <circle cx="16" cy="15" r="4" fill="none" stroke="#00f5d4" strokeWidth="1.5"/>
      <circle cx="16" cy="15" r="1.5" fill="#00f5d4"/>
      <defs><linearGradient id="sg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#00f5d4"/><stop offset="100%" stopColor="#7c3aed"/></linearGradient></defs>
    </svg>
  );
}
