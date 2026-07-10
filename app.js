// ============================================================
// ZAKSOFT AI Secure Platform — Main Application Script
// ============================================================

// ===== NAVBAR SCROLL EFFECT =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 30) navbar.classList.add('scrolled');
  else navbar.classList.remove('scrolled');
});

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// ===== COUNTER ANIMATION =====
function animateCounter(el, target, suffix) {
  const duration = 2000;
  const start = performance.now();
  const update = (time) => {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);
    el.textContent = current.toLocaleString('fr-FR');
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target.toLocaleString('fr-FR');
  };
  requestAnimationFrame(update);
}

// Trigger counters when visible
const counters = document.querySelectorAll('.stat-number');
if (counters.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        animateCounter(el, target);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
}

// ===== SCANNER — Real API + animation =====

// Set window.ZAKSOFT_API_URL before this script to override (e.g. in index.html for production)
const API_BASE = window.ZAKSOFT_API_URL || 'http://localhost:8000';

// Fallback demo data shown when backend is offline
const FALLBACK_DATA = {
  score: 62,
  findings: [
    { level: 'critical', text: '❌ Content Security Policy (CSP) absente' },
    { level: 'critical', text: '❌ X-Frame-Options non configuré' },
    { level: 'warning',  text: '⚠️ Version serveur exposée' },
    { level: 'warning',  text: '⚠️ Cookies sans flag Secure/HttpOnly' },
    { level: 'info',     text: 'ℹ️ HSTS non activé' },
  ],
  recs: [
    '✅ Activer Content Security Policy strict',
    '✅ Configurer X-Frame-Options: DENY',
    '✅ Masquer la version du serveur',
    '✅ Activer HTTPS Strict Transport Security',
  ],
  ai: '⚠️ Backend hors ligne — résultats de démonstration. Lancez start_backend.bat pour activer l\'analyse IA en temps réel.',
  offline: true,
};

function _apiToDisplay(data) {
  const levelEmoji = { critical: '❌', warning: '⚠️', info: 'ℹ️' };
  const findings = (data.vulnerabilities || []).map(v => ({
    level: v.level,
    text: `${levelEmoji[v.level] || '•'} ${v.title} — ${v.desc}`,
  }));

  // Build recommendations from AI action plan (split on numbered lines or newlines)
  const recs = (data.ai_report?.action_plan || '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .slice(0, 6);

  const ssl = data.ssl || {};
  const sslLine = ssl.valid
    ? `✅ SSL valide · ${ssl.protocol || ''} · expire dans ${ssl.expiry_days || '?'}j`
    : `❌ SSL invalide — ${ssl.error || 'erreur inconnue'}`;

  return {
    score: data.score,
    findings: [{ level: ssl.valid ? 'info' : 'critical', text: sslLine }, ...findings],
    recs: recs.length ? recs : ['✅ Aucune action prioritaire détectée'],
    ai: data.ai_report?.summary || 'Analyse complète. Consultez les détails ci-dessus.',
    offline: false,
  };
}

async function startScan() {
  const urlInput = document.getElementById('scanUrl');
  const rawUrl = urlInput ? urlInput.value.trim() : '';

  if (!rawUrl) {
    urlInput.focus();
    urlInput.style.borderColor = 'var(--red-warn)';
    setTimeout(() => { urlInput.style.borderColor = ''; }, 2000);
    return;
  }

  // Normalize URL
  let url = rawUrl;
  if (!url.startsWith('http')) url = 'https://' + url;

  const scanBtn = document.getElementById('scanBtn');
  const progress = document.getElementById('scanProgress');
  const results  = document.getElementById('scanResults');

  scanBtn.disabled = true;
  if (results) results.style.display = 'none';
  if (progress) progress.style.display = 'block';
  progress.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Animate steps in parallel with the real API call
  const steps = [
    { id: 'step-ssl',     label: 'Vérification SSL/HTTPS en cours...', delay: 1000 },
    { id: 'step-headers', label: 'Analyse des Security Headers...',      delay: 2200 },
    { id: 'step-owasp',   label: 'Scan OWASP Top 10...',                 delay: 3400 },
    { id: 'step-server',  label: 'Détection version serveur...',         delay: 4600 },
    { id: 'step-ai',      label: 'Génération rapport IA...',             delay: 5800 },
  ];

  const progressBar   = document.getElementById('progressBar');
  const progressLabel = document.getElementById('progressLabel');

  steps.forEach((step, i) => {
    setTimeout(() => {
      const el = document.getElementById(step.id);
      if (el) el.classList.add('active');
      if (progressLabel) progressLabel.textContent = step.label;
      if (progressBar) progressBar.style.width = `${((i + 0.5) / steps.length) * 100}%`;
    }, step.delay - 350);

    setTimeout(() => {
      const el = document.getElementById(step.id);
      if (el) { el.classList.remove('active'); el.classList.add('done'); }
      if (progressBar) progressBar.style.width = `${((i + 1) / steps.length) * 100}%`;
    }, step.delay);
  });

  const ANIM_DURATION = 6500; // ms — let animation finish before showing results

  // Fire real API call immediately (no await yet)
  const apiPromise = fetch(`${API_BASE}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, save: false }),
    signal: AbortSignal.timeout(30000),
  })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .catch(() => null); // null = offline / error

  // Wait for both animation AND api (whichever takes longer)
  const [, apiData] = await Promise.all([
    new Promise(res => setTimeout(res, ANIM_DURATION)),
    apiPromise,
  ]);

  if (progress) progress.style.display = 'none';

  const display = apiData ? _apiToDisplay(apiData) : FALLBACK_DATA;
  showResults(url, display);
  scanBtn.disabled = false;
}

function showResults(url, data) {
  const results = document.getElementById('scanResults');

  // Set URL + offline badge
  const resultUrl = document.getElementById('resultUrl');
  if (resultUrl) resultUrl.textContent = url;
  const offlineBadge = document.getElementById('offlineBadge');
  if (offlineBadge) offlineBadge.style.display = data.offline ? 'inline-flex' : 'none';

  // Animate score
  const scoreVal = document.getElementById('scoreVal');
  const scoreBadge = document.getElementById('scoreBadge');
  if (scoreVal) {
    let current = 0;
    const target = data.score;
    const interval = setInterval(() => {
      current = Math.min(current + 3, target);
      scoreVal.textContent = current;
      if (current >= target) clearInterval(interval);
    }, 30);
  }
  // Color score badge
  if (scoreBadge) {
    if (data.score >= 80) scoreBadge.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
    else if (data.score >= 60) scoreBadge.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    else scoreBadge.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
  }

  // Findings
  const findingsList = document.getElementById('findingsList');
  if (findingsList) {
    findingsList.innerHTML = data.findings.map(f =>
      `<div class="finding-item ${f.level}">${f.text}</div>`
    ).join('');
  }

  // Recommendations
  const recsList = document.getElementById('recsList');
  if (recsList) {
    recsList.innerHTML = data.recs.map(r =>
      `<div class="rec-item">${r}</div>`
    ).join('');
  }

  // AI Summary
  const aiText = document.getElementById('aiSummaryText');
  if (aiText) aiText.textContent = data.ai;

  // Show
  if (results) {
    results.style.display = 'block';
    results.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Store for PDF / download
  window._lastScanData = { url, score: data.score, findings: data.findings, recs: data.recs, ai: data.ai, offline: data.offline };
}

function resetScan() {
  const progress = document.getElementById('scanProgress');
  const results = document.getElementById('scanResults');
  const urlInput = document.getElementById('scanUrl');
  const progressBar = document.getElementById('progressBar');

  if (progress) { progress.style.display = 'none'; }
  if (results) { results.style.display = 'none'; }
  if (urlInput) { urlInput.value = ''; }
  if (progressBar) { progressBar.style.width = '0%'; }

  // Reset steps
  ['step-ssl', 'step-headers', 'step-owasp', 'step-server', 'step-ai'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.className = 'scan-step pending'; }
  });
  const progressLabel = document.getElementById('progressLabel');
  if (progressLabel) progressLabel.textContent = 'Initialisation du scan...';
}

function downloadReport() {
  const data = window._lastScanData;
  if (!data) return;

  const date = new Date().toLocaleDateString('fr-FR');
  const reportContent = `
ZAKSOFT AI SECURE PLATFORM
===========================
RAPPORT DE SÉCURITÉ
Date : ${date}
Site analysé : ${data.url}
Score de sécurité : ${data.score}/100
${data.offline ? '\n⚠️ Résultats de démonstration (backend hors ligne)\n' : ''}
RISQUES DÉTECTÉS
----------------
${data.findings.map(f => '• ' + f.text).join('\n')}

RECOMMANDATIONS IA
------------------
${data.recs.join('\n')}

ANALYSE IA
----------
${data.ai}

---
Rapport généré par ZAKSOFT AI Secure Platform
contact@zaksoft.ai | Côte d'Ivoire
  `.trim();

  const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `ZAKSOFT_Security_Report_${Date.now()}.txt`;
  link.click();
}

// ===== Enter key on scanner =====
document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('scanUrl');
  if (urlInput) {
    urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') startScan();
    });
  }
});

// ===== SCROLL REVEAL =====
const revealElements = document.querySelectorAll('.problem-card, .module-card, .step-card, .testimonial-card, .pricing-card');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.animationDelay = `${i * 0.05}s`;
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.addEventListener('DOMContentLoaded', () => {
  const revEls = document.querySelectorAll('.problem-card, .module-card, .step-card, .testimonial-card, .pricing-card');
  revEls.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    revealObserver.observe(el);
  });
});

// Add revealed class style
const style = document.createElement('style');
style.textContent = `.revealed { opacity: 1 !important; transform: none !important; }`;
document.head.appendChild(style);
