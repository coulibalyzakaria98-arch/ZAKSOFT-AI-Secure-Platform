import { useState } from 'react';

const VULNS = {
  'injection sql':   { level: 'critical', title: 'Injection SQL (OWASP A03:2021)', desc: 'La concaténation directe de variables dans les requêtes SQL permet à un attaquant d\'accéder à toute la base de données.', fix: 'Utilisez des requêtes préparées : `db.query("SELECT * FROM users WHERE id = ?", [id])`' },
  'console.log':     { level: 'warning',  title: 'Exposition de données sensibles', desc: 'Les logs contenant des mots de passe peuvent être consultés par des personnes non autorisées.', fix: 'Supprimez les console.log en production. Utilisez Winston ou Pino.' },
  'password':        { level: 'critical', title: 'Mot de passe stocké en clair', desc: 'Si la base est compromise, tous les mots de passe sont exposés immédiatement.', fix: 'Utilisez bcrypt : `const hash = await bcrypt.hash(password, 12);`' },
  'eval(':           { level: 'critical', title: 'Utilisation de eval()', desc: 'eval() exécute du code JavaScript arbitraire — vecteur d\'injection si les données viennent d\'une source non fiable.', fix: 'Évitez absolument eval(). Utilisez JSON.parse() pour les données JSON.' },
  'admin123':        { level: 'critical', title: 'Mot de passe par défaut détecté', desc: 'Des identifiants par défaut dans le code source constituent une vulnérabilité critique immédiatement exploitable.', fix: 'Utilisez des variables d\'environnement : `process.env.ADMIN_PASSWORD`' },
  'http://':         { level: 'warning',  title: 'Connexion HTTP non sécurisée', desc: 'Les connexions HTTP transmettent les données en clair (attaque Man-in-the-Middle possible).', fix: 'Utilisez HTTPS pour toutes les connexions externes.' },
};

const SAMPLE = `// Exemple de code vulnérable — Analysez-le !
const express = require('express');
const app = express();

app.get('/user', (req, res) => {
  const userId = req.query.id;
  // Injection SQL possible ici
  const query = \`SELECT * FROM users WHERE id = \${userId}\`;
  db.query(query, (err, result) => res.json(result));
});

app.post('/login', (req, res) => {
  const { password } = req.body;
  console.log('Tentative avec:', password);
  if (password === 'admin123') {
    res.json({ token: 'abc123' });
  }
});`;

export default function DevAssistant() {
  const [code, setCode]     = useState(SAMPLE);
  const [results, setResults] = useState(null);

  const analyze = () => {
    const lower = code.toLowerCase();
    const found = [];
    for (const [key, v] of Object.entries(VULNS)) {
      if (lower.includes(key)) found.push(v);
    }
    const criticals = found.filter(f => f.level === 'critical').length;
    const warnings  = found.filter(f => f.level === 'warning').length;
    const score = Math.max(10, 100 - criticals * 25 - warnings * 10);
    setResults({ found, score, criticals, warnings });
  };

  const levelStyle = {
    critical: 'border-red/30 bg-red/5',
    warning:  'border-amber/30 bg-amber/5',
  };
  const levelText = {
    critical: 'text-red',
    warning:  'text-amber',
  };

  return (
    <div className="p-6 max-w-6xl animate-fade-in">
      <div className="mb-5">
        <h1 className="font-display font-bold text-2xl text-white">Secure Dev Assistant</h1>
        <p className="text-sm text-slate-400 mt-1">Analysez votre code et détectez les vulnérabilités</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="card flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
            <select className="bg-bg3 text-slate-300 text-xs rounded-lg px-3 py-1.5 border border-white/8 outline-none">
              <option>JavaScript</option><option>Python</option><option>PHP</option><option>SQL</option>
            </select>
            <button onClick={analyze} className="btn-primary px-4 py-1.5 text-xs ml-auto">Analyser le code</button>
            <button onClick={() => { setCode(''); setResults(null); }} className="text-xs text-slate-400 hover:text-red px-2 py-1.5 rounded">Effacer</button>
          </div>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            className="flex-1 bg-transparent p-4 text-xs text-slate-300 font-mono outline-none resize-none leading-relaxed"
            style={{ minHeight: 400 }}
            spellCheck={false}
          />
        </div>

        {/* Results */}
        <div className="card overflow-y-auto" style={{ maxHeight: 500 }}>
          {!results ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm text-slate-400">Collez votre code à gauche et cliquez sur <strong className="text-white">Analyser</strong></p>
            </div>
          ) : results.found.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="text-4xl mb-3">✅</div>
              <div className="font-display font-bold text-green-400 mb-2">Aucune vulnérabilité détectée</div>
              <p className="text-sm text-slate-400">Le code analysé suit les bonnes pratiques de sécurité.</p>
            </div>
          ) : (
            <>
              {/* Score banner */}
              <div className={`p-4 flex items-center justify-between ${results.score >= 80 ? 'bg-green/10' : results.score >= 60 ? 'bg-amber/10' : 'bg-red/10'}`}>
                <div>
                  <span className="font-display font-bold text-2xl text-white">{results.score}</span>
                  <span className="text-slate-400 text-sm">/100</span>
                  <div className="text-xs text-slate-400 mt-0.5">Score de sécurité du code</div>
                </div>
                <div className="text-right text-xs text-slate-300">
                  <div>{results.criticals} critique(s)</div>
                  <div>{results.warnings} avertissement(s)</div>
                </div>
              </div>
              {/* Vulns */}
              <div className="p-4 space-y-3">
                {results.found.map((v, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${levelStyle[v.level]}`}>
                    <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${levelText[v.level]}`}>
                      {v.level === 'critical' ? '❌ CRITIQUE' : '⚠️ ATTENTION'}
                    </div>
                    <div className="font-semibold text-sm text-white mb-1">{v.title}</div>
                    <p className="text-xs text-slate-400 mb-2 leading-relaxed">{v.desc}</p>
                    <div className="text-xs text-cyan bg-cyan/5 border border-cyan/15 rounded-lg px-3 py-2">
                      💡 <strong>Correction :</strong> {v.fix}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
