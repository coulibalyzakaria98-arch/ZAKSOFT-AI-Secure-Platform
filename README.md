# ZAKSOFT AI Secure Platform

AI-powered cybersecurity assistant for African SMEs — detect, understand, and fix vulnerabilities without technical expertise.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)

---

## Features

| Module | Description | Status |
|--------|-------------|--------|
| **AI Scanner** | SSL, security headers, OWASP Top 10 | MVP |
| **AI Assistant** | Cybersecurity chatbot (FR/EN) | MVP |
| **Dashboard** | Real-time scan overview and alerts | MVP |
| **Training** | Cybersecurity quizzes and awareness | MVP |
| **Dev Assistant** | Source code vulnerability analysis | MVP |
| **Reports** | AI-generated reports and history | MVP |

---

## Why ZAKSOFT?

- **73%** of African SMEs lack adequate digital security
- **89%** of vulnerabilities go undetected without automated scanning
- **$50K+/year** to hire a cybersecurity expert — inaccessible for most SMEs

---

## Quick Start

### Local development

```bash
git clone https://github.com/coulibalyzakaria98-arch/ZAKSOFT-AI-Secure-Platform.git
cd ZAKSOFT-AI-Secure-Platform

# Start PostgreSQL + backend (with hot reload)
docker compose up -d

# Start React frontend
cd frontend && npm install && npm run dev
# → http://localhost:5173

# Landing page: open index.html in a browser
```

### Production (VPS — Ubuntu 22.04)

```bash
bash scripts/setup-vps.sh

cp .env.example .env.prod
nano .env.prod   # Set passwords + GROQ_API_KEY

docker compose -f docker-compose.prod.yml up -d --build

certbot --nginx -d yourdomain.com   # Free SSL
```

---

## Project Structure

```
ZAKSOFT-AI-Secure-Platform/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── core/          # Config, JWT security
│   │   ├── models/        # SQLAlchemy ORM (User, Website, Scan, Report)
│   │   ├── routers/       # /api/scan  /api/auth  /api/chat  /api/health
│   │   ├── schemas/       # Pydantic validation
│   │   └── services/      # Scanner, SSL checker, AI report (multi-provider)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/              # React 18 dashboard
│   ├── src/
│   │   ├── components/    # Layout, Scanner, Dashboard widgets
│   │   ├── context/       # AuthContext (JWT persistence)
│   │   ├── pages/         # 6 pages: Dashboard Scanner Assistant Training Dev Reports
│   │   └── services/      # Axios client with JWT interceptor
│   ├── Dockerfile
│   └── nginx.conf         # SPA serving + /api/ proxy to backend
├── index.html             # Public landing page (connected to backend)
├── app.js                 # Landing scanner — real fetch() + fallback
├── scripts/
│   ├── setup-vps.sh       # Docker + Nginx + Certbot on Ubuntu 22.04
│   └── deploy.sh          # git pull + docker compose rebuild
├── docker-compose.yml         # Development
├── docker-compose.prod.yml    # Production
└── .env.example
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | FastAPI (Python 3.11) |
| Database | PostgreSQL 15 (SQLite in dev) |
| AI | Groq / Anthropic / OpenAI — cascade with local fallback |
| Scanner | httpx + ssl + cryptography.x509 |
| Auth | JWT (python-jose) + bcrypt |
| Deployment | Docker Compose + Nginx |

---

## Environment Variables

Copy `.env.example` to `.env.prod` and set:

| Variable | Description |
|----------|-------------|
| `DB_PASSWORD` | PostgreSQL password |
| `SECRET_KEY` | JWT secret — `python -c "import secrets; print(secrets.token_hex(32))"` |
| `GROQ_API_KEY` | Free AI — get at console.groq.com |
| `ANTHROPIC_API_KEY` | Optional — Claude Haiku |
| `OPENAI_API_KEY` | Optional — GPT-4o-mini |

At least one AI key is required for the AI report and assistant features. Groq is free and recommended.

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/scan` | No | Full security scan |
| POST | `/api/scan/save` | JWT | Scan + save to history |
| GET | `/api/scans` | JWT | Scan history |
| POST | `/api/chat` | No | AI assistant |
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Get JWT token |
| GET | `/api/auth/me` | JWT | Current user |
| GET | `/api/health` | No | Health check |

Interactive docs: `http://localhost:8000/docs`

---

## License

MIT — see [LICENSE](LICENSE)

Made in Cote d'Ivoire for African SMEs.
