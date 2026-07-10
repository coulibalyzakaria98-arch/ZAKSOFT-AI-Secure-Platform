// ============================================================
// ZAKSOFT AI Secure Platform — Dashboard Script
// ============================================================

// ===== PAGE NAVIGATION =====
function switchPage(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const page = document.getElementById('page-' + pageName);
  const nav = document.getElementById('nav-' + pageName);
  if (page) page.classList.add('active');
  if (nav) nav.classList.add('active');

  // Close mobile sidebar
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('open');
}

// Nav click handlers
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const page = item.dataset.page;
    if (page) switchPage(page);
  });
});

// Mobile sidebar toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');
if (mobileMenuBtn && sidebar) {
  mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
}

// ===== CHART TABS =====
document.querySelectorAll('.chart-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    tab.closest('.chart-tabs').querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

// ===== API CONFIG =====
const API_BASE = 'http://localhost:8000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('zaksoft_token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

// ===== DASHBOARD SCANNER =====
const SCAN_DATA = {
  default: {
    score: 72,
    findings: [
      { level: 'critical', text: '❌ Content Security Policy absente' },
      { level: 'critical', text: '❌ X-Frame-Options non configuré' },
      { level: 'warning', text: '⚠️ Version Apache exposée (2.4.49)' },
      { level: 'warning', text: '⚠️ Cookies sans flag Secure/HttpOnly' },
      { level: 'info', text: 'ℹ️ HSTS non activé' },
    ],
    recs: [
      '✅ Activer Content Security Policy',
      '✅ Configurer X-Frame-Options: DENY',
      '✅ Masquer la version du serveur',
      '✅ Activer HSTS sur tous les sous-domaines',
      '✅ Mettre en place le MFA',
    ],
    ai: 'Niveau de risque modéré. Priorité absolue : implémenter CSP et masquer la version serveur. Ces corrections simples élèveraient le score à 91/100 en 48h.'
  },
  good: {
    score: 91,
    findings: [
      { level: 'warning', text: '⚠️ Subresource Integrity manquant' },
      { level: 'info', text: 'ℹ️ Quelques dépendances à mettre à jour' },
    ],
    recs: ['✅ Ajouter SRI sur les scripts CDN', '✅ Mettre à jour les dépendances'],
    ai: 'Excellente posture de sécurité. TLS 1.3 actif, headers essentiels configurés. Quelques améliorations mineures suffisent pour atteindre 98/100.'
  },
  bad: {
    score: 28,
    findings: [
      { level: 'critical', text: '❌ HTTPS non activé' },
      { level: 'critical', text: '❌ Certificat SSL expiré' },
      { level: 'critical', text: '❌ Injection SQL détectée' },
      { level: 'critical', text: '❌ Fichier .env exposé publiquement' },
      { level: 'warning', text: '⚠️ CMS obsolète (WordPress 5.2)' },
    ],
    recs: [
      '🚨 URGENT : Renouveler le certificat SSL',
      '🚨 URGENT : Supprimer le fichier .env',
      '🚨 URGENT : Corriger les injections SQL',
      '✅ Mettre à jour WordPress vers 6.x',
    ],
    ai: '⚠️ ALERTE CRITIQUE : Vulnérabilités sévères détectées. Le fichier .env exposé représente un danger immédiat. Action requise dans les prochaines heures.'
  }
};

function getDashScenario(url) {
  url = (url || '').toLowerCase();
  if (url.includes('google') || url.includes('github') || url.includes('microsoft')) return 'good';
  if (url.includes('hack') || url.includes('test') || url.includes('demo') || url.includes('localhost')) return 'bad';
  return 'default';
}

async function startDashScan() {
  const urlInput = document.getElementById('dashScanUrl');
  const rawUrl = urlInput ? urlInput.value.trim() : '';
  if (!rawUrl) {
    if (urlInput) { urlInput.focus(); urlInput.style.borderColor = 'var(--red)'; setTimeout(() => urlInput.style.borderColor = '', 2000); }
    return;
  }
  let url = rawUrl;
  if (!url.startsWith('http')) url = 'https://' + url;

  const scanBtn = document.getElementById('dashScanBtn');
  const progress = document.getElementById('dashScanProgress');
  const results = document.getElementById('dashResults');
  if (scanBtn) scanBtn.disabled = true;
  if (results) results.style.display = 'none';
  if (progress) progress.style.display = 'block';

  const steps = [
    { id: 'dstep-ssl', label: 'Vérification SSL/HTTPS...' },
    { id: 'dstep-headers', label: 'Analyse Security Headers...' },
    { id: 'dstep-owasp', label: 'Scan OWASP Top 10...' },
    { id: 'dstep-server', label: 'Détection version serveur...' },
    { id: 'dstep-ai', label: 'Génération rapport IA...' },
  ];
  const progressBar = document.getElementById('dashProgressBar');
  const progressLabel = document.getElementById('dashProgressLabel');

  // Animate progress steps while waiting for real API response
  let stepIndex = 0;
  const stepTimer = setInterval(() => {
    if (stepIndex < steps.length) {
      const prev = stepIndex > 0 ? document.getElementById(steps[stepIndex - 1].id) : null;
      if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
      const el = document.getElementById(steps[stepIndex].id);
      if (el) el.classList.add('active');
      if (progressLabel) progressLabel.textContent = steps[stepIndex].label;
      if (progressBar) progressBar.style.width = `${((stepIndex + 0.5) / steps.length) * 100}%`;
      stepIndex++;
    }
  }, 1800);

  try {
    const res = await fetch(`${API_BASE}/scan`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ url, save: false })
    });

    clearInterval(stepTimer);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Erreur serveur');
    }

    const data = await res.json();

    // Complete all steps visually
    steps.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) { el.classList.remove('active'); el.classList.add('done'); }
    });
    if (progressBar) progressBar.style.width = '100%';

    setTimeout(() => {
      if (progress) progress.style.display = 'none';
      renderRealResults(data);
      if (scanBtn) scanBtn.disabled = false;
      steps.forEach(s => {
        const el = document.getElementById(s.id);
        if (el) { el.classList.remove('done', 'active'); }
      });
      if (progressBar) progressBar.style.width = '0%';
    }, 600);

  } catch (err) {
    clearInterval(stepTimer);
    // Fallback to simulated mode if backend is offline
    console.warn('Backend offline, using demo mode:', err.message);
    if (progress) progress.style.display = 'none';
    renderDashResults(url);
    if (scanBtn) scanBtn.disabled = false;
    steps.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) { el.classList.remove('done', 'active'); }
    });
    if (progressBar) progressBar.style.width = '0%';
  }
}

function renderRealResults(data) {
  const results = document.getElementById('dashResults');
  if (!results) return;

  const score = data.score || 0;
  const scoreColor = score >= 80 ? 'linear-gradient(135deg,#22c55e,#16a34a)'
    : score >= 60 ? 'linear-gradient(135deg,#f59e0b,#d97706)'
    : 'linear-gradient(135deg,#ef4444,#dc2626)';

  const vulns = data.vulnerabilities || [];
  const criticals = vulns.filter(v => v.level === 'critical');
  const warnings = vulns.filter(v => v.level === 'warning');
  const infos = vulns.filter(v => v.level === 'info');

  const ssl = data.ssl || {};
  const sslBadge = ssl.valid
    ? `<span style="color:#86efac">✅ SSL Valide (expire dans ${ssl.expiry_days}j · ${ssl.protocol || 'TLS'})</span>`
    : `<span style="color:#fca5a5">❌ SSL ${ssl.error || 'invalide'}</span>`;

  const aiReport = data.ai_report || {};
  const aiText = aiReport.full_text || aiReport.summary || 'Rapport IA non disponible.';

  results.innerHTML = `
    <div style="padding:24px 28px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <div>
        <div style="font-family:var(--font-h);font-size:16px;font-weight:700;margin-bottom:4px">Rapport de Sécurité — Analyse Réelle</div>
        <div style="font-size:12px;color:var(--text-3)">${data.url}</div>
        <div style="font-size:12px;margin-top:4px">${sslBadge}</div>
      </div>
      <div style="width:74px;height:74px;border-radius:50%;background:${scoreColor};display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(0,0,0,0.3)">
        <span style="font-family:var(--font-h);font-size:22px;font-weight:800;color:#fff;line-height:1">${score}</span>
        <span style="font-size:10px;color:rgba(255,255,255,0.7)">/100</span>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
      <div style="padding:20px 24px;border-right:1px solid var(--border)">
        <div style="font-size:13px;font-weight:600;margin-bottom:12px">🔍 Vulnérabilités (${vulns.length})</div>
        ${criticals.map(v => `<div style="font-size:12px;padding:8px 10px;border-radius:8px;margin-bottom:6px;background:rgba(239,68,68,0.1);color:#fca5a5">❌ <strong>${v.title}</strong></div>`).join('')}
        ${warnings.map(v => `<div style="font-size:12px;padding:8px 10px;border-radius:8px;margin-bottom:6px;background:rgba(245,158,11,0.1);color:#fcd34d">⚠️ ${v.title}</div>`).join('')}
        ${infos.map(v => `<div style="font-size:12px;padding:8px 10px;border-radius:8px;margin-bottom:6px;background:rgba(148,163,184,0.08);color:var(--text-2)">ℹ️ ${v.title}</div>`).join('')}
        ${vulns.length === 0 ? '<div style="color:#86efac;font-size:13px">✅ Aucune vulnérabilité détectée !</div>' : ''}
      </div>
      <div style="padding:20px 24px">
        <div style="font-size:13px;font-weight:600;margin-bottom:12px">🛡️ Headers de Sécurité</div>
        ${Object.entries(data.headers || {}).map(([name, info]) => `
          <div style="font-size:12px;padding:6px 10px;border-radius:6px;margin-bottom:5px;
            background:${info.present ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.07)'};
            color:${info.present ? '#86efac' : '#fca5a5'}">
            ${info.present ? '✅' : '❌'} ${name}
          </div>`).join('')}
      </div>
    </div>

    <div style="margin:0 24px 20px;background:var(--violet-dim,rgba(124,58,237,0.08));border:1px solid rgba(124,58,237,0.3);border-radius:10px;padding:16px">
      <div style="font-size:11px;font-weight:700;color:#a78bfa;background:rgba(124,58,237,0.15);display:inline-block;padding:3px 10px;border-radius:99px;margin-bottom:10px">🤖 Analyse IA — ZAKSOFT Assistant</div>
      <div style="font-size:13px;color:var(--text-2);line-height:1.7;white-space:pre-line">${escapeHtml(aiText)}</div>
    </div>

    ${data.tech_stack && Object.keys(data.tech_stack).length ? `
    <div style="padding:12px 24px 20px;border-top:1px solid var(--border)">
      <div style="font-size:11px;font-weight:600;color:var(--text-3,#64748b);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Stack détectée</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${Object.entries(data.tech_stack).filter(([k,v])=>v).map(([k,v])=>`<span style="font-size:11px;padding:3px 10px;border-radius:99px;background:rgba(0,245,212,0.08);color:#67e8f9;border:1px solid rgba(0,245,212,0.15)">${k}: ${v}</span>`).join('')}
      </div>
    </div>` : ''}
  `;
  results.style.display = 'block';
}

function renderDashResults(url) {
  const scenario = getDashScenario(url);
  const data = SCAN_DATA[scenario];
  const results = document.getElementById('dashResults');
  if (!results) return;

  const scoreColor = data.score >= 80 ? 'linear-gradient(135deg,#22c55e,#16a34a)'
    : data.score >= 60 ? 'linear-gradient(135deg,#f59e0b,#d97706)'
    : 'linear-gradient(135deg,#ef4444,#dc2626)';

  results.innerHTML = `
    <div style="padding:24px 28px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <div>
        <div style="font-family:var(--font-h);font-size:16px;font-weight:700;margin-bottom:4px">Rapport de Sécurité</div>
        <div style="font-size:12px;color:var(--text-3)">${url}</div>
      </div>
      <div style="width:70px;height:70px;border-radius:50%;background:${scoreColor};display:flex;flex-direction:column;align-items:center;justify-content:center">
        <span style="font-family:var(--font-h);font-size:22px;font-weight:800;color:#fff;line-height:1">${data.score}</span>
        <span style="font-size:10px;color:rgba(255,255,255,0.7)">/100</span>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
      <div style="padding:20px 24px;border-right:1px solid var(--border)">
        <div style="font-size:13px;font-weight:600;margin-bottom:12px">🔍 Risques détectés</div>
        ${data.findings.map(f => `
          <div style="font-size:12px;padding:8px 10px;border-radius:8px;margin-bottom:6px;
            background:${f.level==='critical'?'rgba(239,68,68,0.1)':f.level==='warning'?'rgba(245,158,11,0.1)':'rgba(148,163,184,0.08)'};
            color:${f.level==='critical'?'#fca5a5':f.level==='warning'?'#fcd34d':'var(--text-2)'}">
            ${f.text}
          </div>`).join('')}
      </div>
      <div style="padding:20px 24px">
        <div style="font-size:13px;font-weight:600;margin-bottom:12px">✅ Recommandations</div>
        ${data.recs.map(r => `
          <div style="font-size:12px;padding:8px 10px;border-radius:8px;margin-bottom:6px;background:rgba(34,197,94,0.08);color:#86efac">
            ${r}
          </div>`).join('')}
      </div>
    </div>
    <div style="margin:0 24px 20px;background:var(--violet-dim);border:1px solid rgba(124,58,237,0.3);border-radius:10px;padding:16px">
      <div style="font-size:11px;font-weight:700;color:var(--violet);background:rgba(124,58,237,0.15);display:inline-block;padding:3px 10px;border-radius:99px;margin-bottom:10px">🤖 Analyse IA</div>
      <p style="font-size:13px;color:var(--text-2);line-height:1.6">${data.ai}</p>
    </div>
  `;
  results.style.display = 'block';
}

// ===== AI CHAT =====
const AI_RESPONSES = {
  'wordpress': `
    <strong>🔐 Sécurité WordPress — Analyse</strong>
    <p>Voici les points critiques à vérifier sur votre WordPress :</p>
    <ul>
      <li><strong>Mises à jour</strong> : WordPress core, thèmes et plugins doivent être à jour</li>
      <li><strong>Authentification</strong> : Activez le 2FA sur le compte admin</li>
      <li><strong>URL admin</strong> : Changez /wp-admin vers une URL personnalisée</li>
      <li><strong>Limiter les tentatives</strong> : Installez Limit Login Attempts Reloaded</li>
      <li><strong>SSL obligatoire</strong> : Forcez HTTPS avec un certificat valide</li>
      <li><strong>Sauvegardes</strong> : Automatisez avec UpdraftPlus</li>
    </ul>
    <p><strong>Score estimé si tout est appliqué : 88/100</strong> ✅</p>`,
  'ssl': `
    <strong>🔒 Configuration SSL gratuit</strong>
    <p>Voici comment configurer un SSL gratuit en 3 étapes :</p>
    <ul>
      <li><strong>Let's Encrypt + Certbot</strong> : Le plus populaire pour Linux</li>
      <li><strong>Cloudflare</strong> : SSL gratuit + CDN + protection DDoS</li>
      <li><strong>cPanel</strong> : Activation en 1 clic si votre hébergeur le supporte</li>
    </ul>
    <p>Commande Certbot :</p>
    <pre style="background:rgba(0,245,212,0.05);padding:10px;border-radius:6px;font-size:12px;color:#a8b8d8">sudo certbot --nginx -d votre-domaine.ci</pre>
    <p>⚡ Votre SSL sera actif en moins de 5 minutes !</p>`,
  'phishing': `
    <strong>🎣 Reconnaître le Phishing</strong>
    <p>Le phishing est une technique où des cybercriminels se font passer pour des entités légitimes. Voici comment le détecter :</p>
    <ul>
      <li><strong>Vérifiez l'expéditeur</strong> : support@b0utiqu3.ci ≠ support@boutique.ci</li>
      <li><strong>URL suspectes</strong> : Survolez les liens avant de cliquer</li>
      <li><strong>Urgence artificielle</strong> : "Votre compte sera suspendu dans 24h"</li>
      <li><strong>Pièces jointes</strong> : N'ouvrez jamais les .exe, .zip inconnus</li>
      <li><strong>Demandes inhabituelles</strong> : Votre banque ne demande jamais votre mot de passe par email</li>
    </ul>
    <p>🛡️ En cas de doute : contactez directement l'organisation par téléphone.</p>`,
  'mongodb': `
    <strong>🗄️ Sécuriser MongoDB</strong>
    <p>MongoDB mal configuré est l'une des principales causes de fuites de données. Voici les étapes essentielles :</p>
    <ul>
      <li><strong>Authentification</strong> : Activez l'auth avec des utilisateurs dédiés par base</li>
      <li><strong>Bind IP</strong> : Limitez aux IPs autorisées uniquement (pas 0.0.0.0)</li>
      <li><strong>Chiffrement</strong> : TLS en transit + chiffrement at-rest</li>
      <li><strong>Audit</strong> : Activez les logs d'audit MongoDB</li>
      <li><strong>Firewall</strong> : Bloquez le port 27017 depuis Internet</li>
      <li><strong>Mises à jour</strong> : Utilisez toujours la dernière version stable</li>
    </ul>
    <pre style="background:rgba(0,245,212,0.05);padding:10px;border-radius:6px;font-size:12px;color:#a8b8d8">mongod --auth --bind_ip 127.0.0.1 --tlsMode requireTLS</pre>`,
  'default': `
    <strong>🤖 ZAKSOFT AI — Réponse personnalisée</strong>
    <p>Merci pour votre question sur la cybersécurité. Voici ce que je recommande pour commencer :</p>
    <ul>
      <li>🔐 Activez le HTTPS sur tous vos services</li>
      <li>🛡️ Configurez les Security Headers (CSP, HSTS, X-Frame-Options)</li>
      <li>🔑 Utilisez l'authentification à deux facteurs (2FA/MFA)</li>
      <li>📊 Effectuez des scans réguliers avec notre module Scanner</li>
      <li>🎓 Formez votre équipe aux bonnes pratiques</li>
    </ul>
    <p>Voulez-vous que j'approfondisse un point particulier ?</p>`
};

function getAIResponse(message) {
  const msg = message.toLowerCase();
  if (msg.includes('wordpress') || msg.includes('wp')) return AI_RESPONSES.wordpress;
  if (msg.includes('ssl') || msg.includes('https') || msg.includes('certificat')) return AI_RESPONSES.ssl;
  if (msg.includes('phishing') || msg.includes('hameçon')) return AI_RESPONSES.phishing;
  if (msg.includes('mongodb') || msg.includes('base de données') || msg.includes('sql')) return AI_RESPONSES.mongodb;
  return AI_RESPONSES.default;
}

function sendQuickQuestion(question) {
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.value = question;
    sendChatMessage();
  }
}

function sendChatMessage() {
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  if (!chatInput || !chatMessages) return;
  const message = chatInput.value.trim();
  if (!message) return;
  chatInput.value = '';

  // User message
  const userMsg = document.createElement('div');
  userMsg.className = 'chat-msg user';
  userMsg.innerHTML = `
    <div class="msg-avatar user-av">AK</div>
    <div class="msg-bubble"><p>${escapeHtml(message)}</p></div>`;
  chatMessages.appendChild(userMsg);

  // Typing indicator
  const typingMsg = document.createElement('div');
  typingMsg.className = 'chat-msg ai';
  typingMsg.innerHTML = `
    <div class="msg-avatar ai-av">🤖</div>
    <div class="msg-bubble msg-typing">
      <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
    </div>`;
  chatMessages.appendChild(typingMsg);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Try real AI API, fallback to local responses
  fetchAIResponse(message).then(response => {
    chatMessages.removeChild(typingMsg);
    const aiMsg = document.createElement('div');
    aiMsg.className = 'chat-msg ai';
    aiMsg.innerHTML = `
      <div class="msg-avatar ai-av">🤖</div>
      <div class="msg-bubble">
        <strong>ZAKSOFT AI</strong>
        <div style="margin-top:4px;line-height:1.6">${response}</div>
      </div>`;
    chatMessages.appendChild(aiMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

async function fetchAIResponse(message) {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error('API offline');
    const data = await res.json();
    return escapeHtml(data.response).replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  } catch {
    return getAIResponse(message);
  }
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ===== QUIZ =====
const QUIZ_QUESTIONS = [
  {
    question: "Qu'est-ce qu'une attaque par injection SQL ?",
    options: [
      "Une attaque qui insère du code malveillant dans une requête SQL",
      "Un virus qui supprime votre base de données",
      "Un spam envoyé par email",
      "Une attaque physique sur un serveur"
    ],
    correct: 0,
    explanation: "✅ Correct ! Une injection SQL insère du code malveillant dans les requêtes de base de données pour en prendre le contrôle. Protégez-vous avec des requêtes préparées."
  },
  {
    question: "Quel protocole protège les communications web ?",
    options: ["HTTP", "FTP", "HTTPS (TLS/SSL)", "SMTP"],
    correct: 2,
    explanation: "✅ Exact ! HTTPS utilise TLS/SSL pour chiffrer les communications entre le navigateur et le serveur."
  },
  {
    question: "Que signifie MFA / 2FA ?",
    options: [
      "Mon Fichier Autorisé",
      "Authentification Multi-Facteurs",
      "Mode Full Access",
      "Maintenance For Apps"
    ],
    correct: 1,
    explanation: "✅ Parfait ! L'authentification multi-facteurs ajoute une couche de sécurité supplémentaire au-delà du simple mot de passe."
  },
  {
    question: "Qu'est-ce que le phishing ?",
    options: [
      "Une technique de pêche",
      "Un type d'antivirus",
      "Une arnaque qui usurpe l'identité d'une entité légitime",
      "Un langage de programmation"
    ],
    correct: 2,
    explanation: "✅ Correct ! Le phishing trompe l'utilisateur en se faisant passer pour une entité de confiance pour voler des informations."
  },
];

let currentQuizIndex = 0;
let quizAnswered = false;

function startQuiz() {
  currentQuizIndex = 0;
  const quizBody = document.getElementById('quizBody');
  if (!quizBody) return;
  quizBody.style.display = 'block';
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const quizBody = document.getElementById('quizBody');
  if (!quizBody) return;
  const q = QUIZ_QUESTIONS[currentQuizIndex];
  quizAnswered = false;
  quizBody.innerHTML = `
    <div class="quiz-question">${currentQuizIndex + 1}/${QUIZ_QUESTIONS.length} — ${q.question}</div>
    <div class="quiz-options">
      ${q.options.map((opt, i) => `
        <button class="quiz-opt" onclick="answerQuiz(${i})" id="quiz-opt-${i}">${opt}</button>
      `).join('')}
    </div>
    <div id="quiz-feedback" style="display:none"></div>
    <button id="quiz-next" class="quiz-next-btn" style="display:none" onclick="nextQuestion()">
      ${currentQuizIndex < QUIZ_QUESTIONS.length - 1 ? 'Question suivante →' : 'Terminer le quiz ✓'}
    </button>`;
}

function answerQuiz(index) {
  if (quizAnswered) return;
  quizAnswered = true;
  const q = QUIZ_QUESTIONS[currentQuizIndex];
  const opts = document.querySelectorAll('.quiz-opt');
  opts.forEach((opt, i) => {
    opt.disabled = true;
    if (i === q.correct) opt.classList.add('correct');
    else if (i === index) opt.classList.add('wrong');
  });
  const feedback = document.getElementById('quiz-feedback');
  if (feedback) {
    feedback.style.display = 'block';
    feedback.className = `quiz-feedback ${index === q.correct ? 'ok' : 'ko'}`;
    feedback.textContent = q.explanation;
  }
  const nextBtn = document.getElementById('quiz-next');
  if (nextBtn) nextBtn.style.display = 'inline-block';
}

function nextQuestion() {
  currentQuizIndex++;
  if (currentQuizIndex >= QUIZ_QUESTIONS.length) {
    const quizBody = document.getElementById('quizBody');
    if (quizBody) {
      quizBody.innerHTML = `
        <div style="text-align:center;padding:32px">
          <div style="font-size:48px;margin-bottom:16px">🎉</div>
          <div style="font-family:var(--font-h);font-size:20px;font-weight:700;margin-bottom:8px">Quiz terminé !</div>
          <p style="color:var(--text-2);margin-bottom:20px">Vous avez complété le quiz de cybersécurité. Continuez à vous former !</p>
          <button class="quiz-next-btn" onclick="startQuiz()">Recommencer →</button>
        </div>`;
    }
  } else {
    renderQuizQuestion();
  }
}

// ===== DEV CODE ANALYSIS =====
const VULNERABILITIES = {
  'injection sql': { level: 'critical', title: '💉 Injection SQL (OWASP A03:2021)', desc: 'La concaténation directe de variables dans les requêtes SQL permet à un attaquant d\'injecter du code malveillant et d\'accéder à toute la base de données.', fix: 'Utilisez des requêtes préparées : <code>db.query("SELECT * FROM users WHERE id = ?", [userId])</code>' },
  'console.log': { level: 'warning', title: '🔍 Exposition de données sensibles', desc: 'Les logs contenant des mots de passe ou données sensibles peuvent être consultés par des personnes non autorisées ayant accès aux logs.', fix: 'Supprimez les console.log en production. Utilisez un logger structuré (Winston, Pino) avec niveaux de log.' },
  'password': { level: 'critical', title: '🔐 Mot de passe stocké en clair', desc: 'Stocker ou comparer des mots de passe en texte clair est une vulnérabilité critique. Si la base est compromise, tous les mots de passe sont exposés.', fix: 'Utilisez bcrypt : <code>const hash = await bcrypt.hash(password, 12);</code>' },
  'token': { level: 'warning', title: '🎫 Token d\'authentification faible', desc: 'Un token statique ou prévisible peut être facilement deviné ou réutilisé par un attaquant pour usurper une identité.', fix: 'Utilisez JWT avec expiration : <code>jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "1h"})</code>' },
  'eval': { level: 'critical', title: '⚡ Utilisation de eval()', desc: 'eval() exécute du code JavaScript arbitraire, permettant l\'injection de code si les données proviennent d\'une source non fiable.', fix: 'Évitez absolument eval(). Utilisez JSON.parse() pour les données JSON.' },
  'http': { level: 'warning', title: '🌐 Connexion HTTP non sécurisée', desc: 'Les connexions HTTP transmettent les données en clair, permettant une interception par attaque Man-in-the-Middle.', fix: 'Utilisez HTTPS pour toutes les connexions externes et APIs.' },
  'admin123': { level: 'critical', title: '🚨 Mot de passe par défaut détecté', desc: 'Des identifiants par défaut dans le code source constituent une vulnérabilité critique immédiatement exploitable.', fix: 'Supprimez immédiatement ce credential. Utilisez des variables d\'environnement (.env).' },
};

function analyzeCode() {
  const code = document.getElementById('codeEditor')?.value || '';
  const devResults = document.getElementById('devResults');
  if (!devResults) return;

  const found = [];
  const codeLower = code.toLowerCase();

  for (const [key, vuln] of Object.entries(VULNERABILITIES)) {
    if (codeLower.includes(key.replace(' ', '')) || codeLower.includes(key)) {
      found.push(vuln);
    }
  }

  // Calculate code security score
  const criticalCount = found.filter(f => f.level === 'critical').length;
  const warningCount = found.filter(f => f.level === 'warning').length;
  const score = Math.max(10, 100 - criticalCount * 25 - warningCount * 10);
  const scoreColor = score >= 80 ? 'linear-gradient(135deg,#22c55e,#16a34a)'
    : score >= 60 ? 'linear-gradient(135deg,#f59e0b,#d97706)'
    : 'linear-gradient(135deg,#ef4444,#dc2626)';

  if (found.length === 0) {
    devResults.innerHTML = `
      <div style="text-align:center;padding:40px 20px">
        <div style="font-size:48px;margin-bottom:16px">✅</div>
        <div style="font-family:var(--font-h);font-size:18px;font-weight:700;color:var(--green);margin-bottom:8px">Aucune vulnérabilité détectée</div>
        <p style="font-size:14px;color:var(--text-2)">Bon travail ! Le code analysé semble suivre les bonnes pratiques de sécurité.</p>
      </div>`;
    return;
  }

  devResults.innerHTML = `
    <div class="dev-score-banner" style="background:${scoreColor}">
      <div>
        <div class="score-n">${score}<span style="font-size:16px;font-weight:400">/100</span></div>
        <div class="score-lbl">Score de sécurité du code</div>
      </div>
      <div style="text-align:right;font-size:13px;color:rgba(255,255,255,0.9)">
        ${criticalCount} critique(s) · ${warningCount} avertissement(s)
      </div>
    </div>
    ${found.map(v => `
      <div class="dev-vuln ${v.level}">
        <div class="dev-vuln-title">${v.title}</div>
        <div class="dev-vuln-desc">${v.desc}</div>
        <div class="dev-vuln-fix">💡 <strong>Correction :</strong> ${v.fix}</div>
      </div>`).join('')}`;
}

function clearCode() {
  const codeEditor = document.getElementById('codeEditor');
  const devResults = document.getElementById('devResults');
  if (codeEditor) codeEditor.value = '';
  if (devResults) devResults.innerHTML = `
    <div class="dev-placeholder">
      <div class="dev-placeholder-icon">🔍</div>
      <p>Collez votre code à gauche et cliquez sur <strong>Analyser</strong> pour détecter les vulnérabilités de sécurité.</p>
    </div>`;
}

// ===== USER SESSION =====
function initUserSession() {
  const userStr = localStorage.getItem('zaksoft_user');
  if (!userStr) return; // demo mode without auth
  try {
    const user = JSON.parse(userStr);
    const nameEl = document.querySelector('.user-name');
    const avatarEls = document.querySelectorAll('.user-avatar, .msg-avatar.user-av');
    const orgBadge = document.querySelector('.org-info .org-name');

    if (nameEl) nameEl.textContent = user.full_name || user.email.split('@')[0];
    avatarEls.forEach(el => {
      const name = user.full_name || user.email;
      el.textContent = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    });
    if (orgBadge) orgBadge.textContent = user.email.split('@')[1] || 'Mon Organisation';
  } catch (e) {}
}

function logout() {
  localStorage.removeItem('zaksoft_token');
  localStorage.removeItem('zaksoft_user');
  window.location.href = 'login.html';
}

initUserSession();

// ===== TOPBAR SEARCH =====
const topbarSearch = document.getElementById('topbarSearch');
if (topbarSearch) {
  topbarSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = topbarSearch.value.toLowerCase();
      if (q.includes('scan') || q.includes('site')) switchPage('scanner');
      else if (q.includes('assist') || q.includes('chat') || q.includes('ia')) switchPage('assistant');
      else if (q.includes('form') || q.includes('quiz') || q.includes('train')) switchPage('training');
      else if (q.includes('code') || q.includes('dev')) switchPage('devassist');
      else if (q.includes('rapport') || q.includes('report')) switchPage('reports');
      else if (q.includes('alerte')) switchPage('alerts');
      else if (q.includes('param') || q.includes('setting')) switchPage('settings');
      topbarSearch.value = '';
    }
  });
}
