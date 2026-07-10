# 🛡️ ZAKSOFT AI Secure Platform

> **AI-powered cybersecurity platform built for African SMEs**

ZAKSOFT AI Secure Platform helps African SMEs, organizations, and institutions identify digital risks, improve security practices, and adopt safer technologies — without needing a dedicated cybersecurity expert.

---

## 🌍 Why ZAKSOFT?

- **73%** of African SMEs lack adequate digital security
- **$50K+/year** to hire a cybersecurity expert (inaccessible for SMEs)
- **89%** of vulnerabilities go undetected without automated scanning

**ZAKSOFT makes enterprise-grade cybersecurity accessible to every African business.**

---

## 🚀 Features (MVP)

### Module 1 — AI Security Assistant 🤖
- Conversational AI that answers cybersecurity questions in real time
- Analyzes configurations and proposes prioritized actions
- Supports French and English

### Module 2 — AI Website Security Scanner 🔍
- Scans for SSL/HTTPS, Security Headers, OWASP Top 10
- Detects server versions, misconfigurations, exposed files
- Generates full AI-written security reports with a security score

### Module 3 — AI Cyber Awareness Training 🎓
- Adaptive cybersecurity quizzes for non-technical employees
- Phishing simulation exercises
- Progress tracking and completion certificates

### Module 4 — Secure Development Assistant 👨🏾‍💻
- Paste code → Instant vulnerability detection (OWASP, SQL injection, weak tokens, etc.)
- Explains each vulnerability and provides secure code fixes
- Supports JavaScript, Python, PHP, SQL

---

## 📁 Project Structure

```
ZAKSOFT AI Secure Platform/
├── index.html          # Main landing page
├── styles.css          # Landing page styles (dark cyber theme)
├── app.js              # Landing page JS (scanner demo, animations)
├── dashboard.html      # Full application dashboard
├── dashboard.css       # Dashboard styles
├── dashboard.js        # Dashboard logic (chat, quiz, code analysis)
└── README.md           # This file
```

---

## 🛠️ Tech Stack (MVP Demo)

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, Vanilla CSS, Vanilla JavaScript |
| Fonts | Google Fonts (Space Grotesk, Inter) |
| Design | Dark glassmorphism, African identity motifs |
| AI (Demo) | Rule-based responses (replace with OpenAI API) |
| Deployment | Vercel / Netlify (static) |

### Planned Production Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript |
| Backend | FastAPI (Python) / Node.js |
| Database | PostgreSQL + Redis |
| AI/LLM | OpenAI GPT-4 / Claude / Mistral |
| Security Scanning | OWASP ZAP, Nmap, SSL Labs API |
| Auth | JWT + MFA (TOTP) |
| Infrastructure | Docker + Kubernetes |
| CI/CD | GitHub Actions |

---

## 🏃‍♂️ Quick Start

No installation required. Open in any modern browser:

```bash
# Clone the repository
git clone https://github.com/votre-username/zaksoft-ai-platform.git
cd zaksoft-ai-platform

# Open directly in browser
open index.html

# Or use a local server (recommended)
npx serve .
# → http://localhost:3000
```

---

## 🎯 Scanner Demo

The scanner accepts any URL and simulates a real security scan:

- **High-score URLs** (google.com, github.com, microsoft.com): Score 88-91/100
- **Standard URLs**: Score 65-72/100 with typical SME vulnerabilities
- **Test/hack URLs** (localhost, hack*, test*): Score 28-34/100 with critical issues

---

## 🗺️ Roadmap

### Mois 1 — Foundation ✅
- [x] Landing page with full design system
- [x] Dashboard with 7 sections
- [x] Scanner demo (simulated)
- [x] AI Assistant (rule-based)
- [x] Training module + Quiz
- [x] Dev code analyzer

### Mois 2 — Real Integration 🔄
- [ ] Real scanner backend (OWASP ZAP API)
- [ ] OpenAI GPT-4 integration for AI Assistant
- [ ] User authentication (JWT + MFA)
- [ ] Database (PostgreSQL)
- [ ] PDF report generation

### Mois 3 — MVP Launch 🚀
- [ ] Public beta
- [ ] Onboarding 10 pilot SMEs
- [ ] Mobile responsive polish
- [ ] API documentation
- [ ] Security audit of the platform itself

---

## 🌍 Positioning for Cyber4Africa

> *"ZAKSOFT AI Secure Platform is building an AI-powered cybersecurity assistant that helps African SMEs identify digital risks, improve security practices, and adopt safer technologies — aligned with Cyber4Africa's security-by-design and AI trust principles."*

---

## 📬 Contact

- **Email**: contact@zaksoft.ai
- **Website**: zaksoft-ai-security.vercel.app
- **LinkedIn**: linkedin.com/company/zaksoft-ai
- **Location**: Côte d'Ivoire 🇨🇮

---

## 📄 License

MIT License — Free to use, modify, and distribute.

---

*Built with ❤️ for Africa · Powered by AI · Security-by-Design*
