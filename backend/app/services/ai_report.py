"""
AI report generation — provider cascade:
  1. Anthropic Claude Haiku  (best quality, set ANTHROPIC_API_KEY)
  2. OpenAI GPT-4o-mini      (set OPENAI_API_KEY)
  3. Groq Llama-3            (free tier, set GROQ_API_KEY)
  4. Local fallback          (no API key needed, always works)
"""
import json
from app.core.config import settings


# ── Prompt factory ────────────────────────────────────────────────────────────

def _build_scan_prompt(url: str, scan_data: dict, ssl_data: dict) -> str:
    score = scan_data.get("score", 0)
    vulns = scan_data.get("vulnerabilities", [])
    missing = scan_data.get("missing_headers", [])
    tech = scan_data.get("tech_stack", {})

    ssl_summary = (
        f"✅ Valide — émis par {ssl_data.get('issuer_org', 'inconnu')}, "
        f"expire dans {ssl_data.get('expiry_days', 0)} jours "
        f"({ssl_data.get('protocol', '')} / {ssl_data.get('cipher', '')})"
        if ssl_data.get("valid")
        else f"❌ Invalide — {ssl_data.get('error', 'inconnu')}"
    )

    ssl_issues = "\n".join(f"  - {i}" for i in ssl_data.get("issues", []))
    vuln_lines = "\n".join(
        f"  - [{v['level'].upper()}] {v['title']} : {v['desc']}"
        for v in vulns
    ) or "  - Aucune vulnérabilité détectée"

    san = ", ".join(ssl_data.get("san_domains", [])[:4]) or "N/A"

    return f"""Tu es l'expert cybersécurité de ZAKSOFT. Tu rédiges un rapport pour le propriétaire d'un site web africain — chef d'entreprise, pas technicien.

═══ DONNÉES DU SCAN ═══
Site analysé : {url}
Score de sécurité : {score}/100
Stack technique : {json.dumps(tech, ensure_ascii=False)}
Domaines couverts (SAN) : {san}

SSL/TLS : {ssl_summary}
Problèmes SSL :
{ssl_issues or "  - Aucun"}

Headers manquants : {', '.join(missing) if missing else 'Aucun'}

Vulnérabilités détectées :
{vuln_lines}
═══════════════════════

Rédige le rapport en EXACTEMENT 3 parties avec ces titres en gras :

**RÉSUMÉ EXÉCUTIF**
(1-2 phrases directes sur l'état global. Ton rassurant mais honnête.)

**RISQUES DÉTAILLÉS**
(Pour chaque risque critique ou majeur : ce que ça signifie concrètement pour l'entreprise — données clients exposées, réputation, perte de revenus. Max 3 risques, bullet points.)

**PLAN D'ACTION PRIORITAIRE**
(3 actions numérotées, ordonnées par urgence. Pour chaque action : quoi faire, outil simple recommandé, temps estimé. Termine par une phrase d'encouragement.)

Règles : français, zéro jargon non expliqué, ton professionnel et humain."""


def _build_chat_prompt(message: str) -> str:
    return message


CHAT_SYSTEM = (
    "Tu es ZAKSOFT AI, assistant expert en cybersécurité pour les PME africaines. "
    "Réponds en français, de manière concise et pratique (max 250 mots). "
    "Utilise des exemples concrets du contexte africain. "
    "Structure tes réponses avec des emojis pertinents et du markdown simple."
)


# ── Provider adapters ─────────────────────────────────────────────────────────

def _try_anthropic(prompt: str, system: str = "", max_tokens: int = 900) -> str | None:
    if not settings.ANTHROPIC_API_KEY:
        return None
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        kwargs = {"model": "claude-haiku-4-5-20251001", "max_tokens": max_tokens,
                  "messages": [{"role": "user", "content": prompt}]}
        if system:
            kwargs["system"] = system
        msg = client.messages.create(**kwargs)
        return msg.content[0].text
    except Exception:
        return None


def _try_openai(prompt: str, system: str = "", max_tokens: int = 900) -> str | None:
    if not settings.OPENAI_API_KEY:
        return None
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.7,
        )
        return resp.choices[0].message.content
    except Exception:
        return None


def _try_groq(prompt: str, system: str = "", max_tokens: int = 900) -> str | None:
    if not settings.GROQ_API_KEY:
        return None
    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.7,
        )
        return resp.choices[0].message.content
    except Exception:
        return None


def _call_ai(prompt: str, system: str = "", max_tokens: int = 900) -> str | None:
    """Try providers in order: Anthropic → OpenAI → Groq."""
    return (
        _try_anthropic(prompt, system, max_tokens)
        or _try_openai(prompt, system, max_tokens)
        or _try_groq(prompt, system, max_tokens)
    )


# ── Public API ────────────────────────────────────────────────────────────────

def generate_security_report(scan_data: dict, ssl_data: dict | None = None) -> dict:
    """
    Generate an AI-powered security report combining scan + SSL data.
    Falls back to a rule-based report if no AI key is configured.
    """
    if ssl_data is None:
        ssl_data = scan_data.get("ssl", {})

    url = scan_data.get("url", "")
    prompt = _build_scan_prompt(url, scan_data, ssl_data)
    text = _call_ai(prompt, max_tokens=900)

    if text:
        return _parse_structured_report(text)
    return _fallback_report(scan_data, ssl_data)


async def chat_response(message: str) -> str:
    """Cybersecurity chatbot — AI first, local knowledge base as fallback."""
    text = _call_ai(_build_chat_prompt(message), system=CHAT_SYSTEM, max_tokens=500)
    return text or _local_chat(message)


# ── Parsers & fallbacks ───────────────────────────────────────────────────────

def _parse_structured_report(text: str) -> dict:
    """Extract the 3 sections from the AI-generated text."""
    markers = [
        ("summary",     ["RÉSUMÉ EXÉCUTIF", "RÉSUMÉ", "RESUME", "1."]),
        ("dangers",     ["RISQUES DÉTAILLÉS", "RISQUES", "DANGERS", "2."]),
        ("action_plan", ["PLAN D'ACTION", "PLAN D'ACTION", "PLAN", "3."]),
    ]
    sections = {k: "" for k, _ in markers}
    current = None

    for line in text.split("\n"):
        stripped = line.strip().upper()
        matched = False
        for key, triggers in markers:
            if any(t in stripped for t in triggers):
                current = key
                matched = True
                break
        if not matched and current:
            sections[current] += line + "\n"

    # If parsing failed, shove everything into summary
    if not any(v.strip() for v in sections.values()):
        sections["summary"] = text

    return {
        "full_text": text,
        "summary":     sections["summary"].strip(),
        "dangers":     sections["dangers"].strip(),
        "action_plan": sections["action_plan"].strip(),
    }


def _fallback_report(scan_data: dict, ssl_data: dict) -> dict:
    score = scan_data.get("score", 0)
    vulns = scan_data.get("vulnerabilities", [])
    criticals = [v for v in vulns if v["level"] == "critical"]
    ssl_issues = ssl_data.get("issues", [])

    if score >= 80:
        summary = (
            f"Votre site affiche un bon score de sécurité ({score}/100). "
            "Les mesures essentielles sont en place."
        )
    elif score >= 60:
        summary = (
            f"Score modéré ({score}/100). Des lacunes importantes ont été identifiées. "
            "Sans corrections, vos clients et données restent exposés."
        )
    else:
        summary = (
            f"Score critique ({score}/100). Votre site présente des vulnérabilités sérieuses "
            "exploitables par des cybercriminels pour accéder à vos données clients."
        )

    top_risks = (criticals + [v for v in vulns if v["level"] == "warning"])[:3]
    dangers = "\n".join(f"- {v['title']} : {v['desc']}" for v in top_risks)
    if ssl_issues:
        dangers += "\n" + "\n".join(f"- SSL : {i}" for i in ssl_issues[:2])
    dangers = dangers or "Aucun danger critique immédiat identifié."

    expiry = ssl_data.get("expiry_days", 999)
    ssl_action = (
        "1. URGENT : Renouvelez votre certificat SSL (Let's Encrypt, gratuit — 15 min).\n"
        if expiry < 30
        else "1. Activez HTTPS avec Let's Encrypt si ce n'est pas fait (gratuit — 30 min).\n"
    )
    action_plan = (
        ssl_action
        + "2. Configurez les security headers manquants via votre serveur ou Cloudflare (2-4 heures).\n"
        + "3. Masquez les informations de version de votre stack (Apache/Nginx — 1 heure).\n"
        + "\nVous êtes sur la bonne voie — ces corrections simples peuvent doubler votre score !"
    )

    full = f"RÉSUMÉ EXÉCUTIF\n{summary}\n\nRISQUES DÉTAILLÉS\n{dangers}\n\nPLAN D'ACTION\n{action_plan}"
    return {
        "full_text":   full,
        "summary":     summary,
        "dangers":     dangers,
        "action_plan": action_plan,
    }


def _local_chat(message: str) -> str:
    msg = message.lower()
    if any(w in msg for w in ["ssl", "https", "certificat", "tls"]):
        return (
            "🔒 **SSL/HTTPS** : Utilisez **Let's Encrypt** (gratuit). "
            "Commande : `sudo certbot --nginx -d votre-domaine.com` — actif en 5 minutes. "
            "**Cloudflare** offre aussi SSL gratuit + protection DDoS sans rien installer sur votre serveur."
        )
    if any(w in msg for w in ["wordpress", "wp-admin"]):
        return (
            "🔐 **WordPress** : Mettez à jour core + plugins, activez le 2FA (plugin WP 2FA), "
            "changez l'URL /wp-admin, installez **Wordfence** (gratuit). "
            "Ces 4 actions couvrent 90 % des vecteurs d'attaque courants."
        )
    if any(w in msg for w in ["sql", "injection"]):
        return (
            "💉 **Injection SQL** : Ne jamais concaténer des variables dans une requête. "
            "Utilisez des requêtes préparées :\n"
            "```php\n$stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');\n"
            "$stmt->execute([$id]);\n```"
        )
    if any(w in msg for w in ["phishing", "hameçon", "email"]):
        return (
            "🎣 **Phishing** : Vérifiez toujours l'expéditeur (`support@b0utique.ci` ≠ `support@boutique.ci`), "
            "survolez les liens avant de cliquer, n'ouvrez jamais de pièces jointes inattendues. "
            "En cas de doute → contactez directement l'organisation par téléphone."
        )
    if any(w in msg for w in ["mot de passe", "password", "mdp"]):
        return (
            "🔑 **Mots de passe** : Minimum 12 caractères (majuscules + chiffres + symboles). "
            "Utilisez **Bitwarden** (gestionnaire gratuit). "
            "Activez le 2FA partout où c'est possible — c'est la mesure la plus efficace."
        )
    return (
        "🤖 **ZAKSOFT AI** — Posez-moi des questions sur :\n"
        "- SSL/HTTPS et certificats\n- Sécurisation WordPress\n"
        "- Injections SQL et XSS\n- Phishing et formation équipe\n"
        "- Configuration serveur (Nginx, Apache)\n- OWASP Top 10"
    )
