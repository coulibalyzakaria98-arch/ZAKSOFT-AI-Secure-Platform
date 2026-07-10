import { useState } from 'react';

const MODULES = [
  { icon: '🎣', title: 'Reconnaître le Phishing', desc: 'Identifier les emails et messages malveillants', progress: 100, badge: 'Complété', color: '#22c55e' },
  { icon: '🔐', title: 'Mots de passe forts & MFA', desc: 'Authentification robuste et 2FA', progress: 60, badge: 'En cours', color: '#f59e0b' },
  { icon: '🌐', title: 'Sécurité des réseaux', desc: 'VPN, Wi-Fi public, bonnes pratiques réseau', progress: 0, badge: 'Bientôt', color: '#64748b' },
];

const QUESTIONS = [
  { q: 'Qu\'est-ce qu\'une attaque par injection SQL ?', opts: ["Insère du code malveillant dans une requête SQL", "Un virus qui supprime votre base de données", "Un spam envoyé par email", "Une attaque physique"], correct: 0, exp: 'Une injection SQL insère du code malveillant dans les requêtes de base de données. Protégez-vous avec des requêtes préparées.' },
  { q: 'Quel protocole protège les communications web ?', opts: ['HTTP', 'FTP', 'HTTPS (TLS/SSL)', 'SMTP'], correct: 2, exp: 'HTTPS utilise TLS/SSL pour chiffrer les communications entre le navigateur et le serveur.' },
  { q: 'Que signifie MFA / 2FA ?', opts: ['Mon Fichier Autorisé', 'Authentification Multi-Facteurs', 'Mode Full Access', 'Maintenance For Apps'], correct: 1, exp: 'L\'authentification multi-facteurs ajoute une couche de sécurité supplémentaire au mot de passe.' },
  { q: 'Qu\'est-ce que le phishing ?', opts: ['Une technique de pêche', 'Un type d\'antivirus', 'Une arnaque qui usurpe l\'identité d\'une entité légitime', 'Un langage de programmation'], correct: 2, exp: 'Le phishing trompe l\'utilisateur en se faisant passer pour une entité de confiance.' },
];

export default function Training() {
  const [quizIdx, setQuizIdx]   = useState(-1);
  const [answered, setAnswered] = useState(null);

  const startQuiz = () => { setQuizIdx(0); setAnswered(null); };
  const answer = (i) => { if (answered !== null) return; setAnswered(i); };
  const next = () => {
    if (quizIdx >= QUESTIONS.length - 1) { setQuizIdx(-2); return; }
    setQuizIdx(q => q + 1);
    setAnswered(null);
  };

  const q = quizIdx >= 0 ? QUESTIONS[quizIdx] : null;

  return (
    <div className="p-6 max-w-4xl space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Formation Cyber</h1>
        <p className="text-sm text-slate-400 mt-1">Formez votre équipe aux bonnes pratiques</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[['8/10','Employés formés'],['78%','Score moyen quiz'],['3','Modules dispo'],['2','Simul. phishing']].map(([v,l]) => (
          <div key={l} className="card p-4 text-center">
            <div className="font-display font-bold text-xl text-cyan">{v}</div>
            <div className="text-xs text-slate-400 mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* Modules */}
      <div className="space-y-3">
        {MODULES.map(m => (
          <div key={m.title} className="card p-5">
            <div className="flex items-center gap-4">
              <span className="text-2xl">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-semibold text-sm text-white">{m.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: m.color + '20', color: m.color }}>
                    {m.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
                <div className="mt-2.5 h-1.5 rounded-full bg-bg3 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: m.progress + '%', background: m.color }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-semibold text-white">Quiz rapide — Testez vos connaissances</h3>
          {quizIdx === -1 && (
            <button onClick={startQuiz} className="btn-primary px-4 py-2 text-sm">Commencer →</button>
          )}
        </div>

        {quizIdx === -1 && (
          <p className="text-sm text-slate-400">4 questions sur les fondamentaux de la cybersécurité.</p>
        )}

        {quizIdx === -2 && (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">🎉</div>
            <div className="font-display font-bold text-lg text-white mb-2">Quiz terminé !</div>
            <p className="text-sm text-slate-400 mb-4">Continuez à vous former pour protéger votre organisation.</p>
            <button onClick={startQuiz} className="btn-primary px-5 py-2 text-sm">Recommencer →</button>
          </div>
        )}

        {q && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{quizIdx + 1}/{QUESTIONS.length}</span>
              <div className="h-1.5 flex-1 mx-4 rounded-full bg-bg3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan to-violet transition-all" style={{ width: ((quizIdx + 1) / QUESTIONS.length * 100) + '%' }} />
              </div>
            </div>
            <p className="font-semibold text-white text-sm">{q.q}</p>
            <div className="space-y-2">
              {q.opts.map((opt, i) => {
                const isCorrect = i === q.correct;
                const isChosen  = i === answered;
                let cls = 'border border-white/8 text-slate-300 hover:border-cyan/30 hover:text-white';
                if (answered !== null) {
                  if (isCorrect) cls = 'border border-green/50 bg-green/10 text-green-400';
                  else if (isChosen) cls = 'border border-red/50 bg-red/10 text-red';
                  else cls = 'border border-white/5 text-slate-500';
                }
                return (
                  <button key={i} onClick={() => answer(i)} disabled={answered !== null}
                    className={`w-full text-left text-sm px-4 py-2.5 rounded-xl transition-all ${cls}`}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {answered !== null && (
              <div className={`p-3 rounded-xl text-xs ${answered === q.correct ? 'bg-green/10 text-green-400 border border-green/20' : 'bg-red/10 text-red border border-red/20'}`}>
                {q.exp}
              </div>
            )}
            {answered !== null && (
              <button onClick={next} className="btn-primary px-5 py-2 text-sm">
                {quizIdx < QUESTIONS.length - 1 ? 'Question suivante →' : 'Terminer ✓'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
