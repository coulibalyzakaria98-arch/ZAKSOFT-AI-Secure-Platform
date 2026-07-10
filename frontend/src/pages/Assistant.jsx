import { useState, useRef, useEffect } from 'react';
import { scanAPI } from '../services/api';

const QUICK_QS = [
  'Comment configurer un SSL gratuit ?',
  'Mon site WordPress est-il sécurisé ?',
  'Comment protéger ma base de données ?',
  'Qu\'est-ce que le phishing ?',
];

const INIT_MSG = {
  role: 'ai',
  text: `Bonjour ! Je suis **ZAKSOFT AI**, votre assistant en cybersécurité.

Je peux vous aider à :
- 🔐 Analyser votre configuration de sécurité
- 🛡️ Expliquer les vulnérabilités OWASP
- ⚡ Proposer des corrections prioritaires
- 📋 Répondre à vos questions techniques

Comment puis-je vous aider aujourd'hui ?`,
};

export default function Assistant() {
  const [messages, setMessages] = useState([INIT_MSG]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const { data } = await scanAPI.chat(userMsg);
      setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '🔌 Backend hors ligne. Lancez **start_backend.bat** pour activer l\'IA.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl flex flex-col h-full animate-fade-in">
      <div className="mb-4">
        <h1 className="font-display font-bold text-2xl text-white">AI Security Assistant</h1>
        <p className="text-sm text-slate-400 mt-1">Posez vos questions de cybersécurité</p>
      </div>

      {/* Chat window */}
      <div className="card flex-1 flex flex-col overflow-hidden min-h-0" style={{ minHeight: 400 }}>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-bold ${
                m.role === 'ai'
                  ? 'bg-violet/20 text-violet border border-violet/30'
                  : 'bg-cyan/20 text-cyan border border-cyan/30'
              }`}>
                {m.role === 'ai' ? '🤖' : 'AK'}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'ai'
                  ? 'bg-bg3 text-slate-200'
                  : 'bg-cyan/10 text-white border border-cyan/20'
              }`}>
                <Markdown text={m.text} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-violet/20 border border-violet/30 flex items-center justify-center text-sm">🤖</div>
              <div className="bg-bg3 rounded-2xl px-4 py-3 flex gap-1.5 items-center">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick questions */}
        <div className="px-5 py-3 border-t border-white/8 flex gap-2 flex-wrap">
          {QUICK_QS.map(q => (
            <button
              key={q}
              onClick={() => send(q)}
              className="text-xs px-3 py-1.5 rounded-full bg-bg3 text-slate-400 hover:text-cyan hover:border-cyan/30 border border-white/8 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/8 flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Posez votre question de sécurité..."
            rows={1}
            className="flex-1 bg-bg3 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan/50 resize-none"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="btn-primary px-4 py-2 shrink-0"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function Markdown({ text }) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function SendIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}
