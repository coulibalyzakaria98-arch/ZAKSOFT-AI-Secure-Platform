import os
import json
import anthropic

_client = None


def _get_client():
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if not api_key:
            return None
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def generate_security_report(scan_data: dict) -> dict:
    """Generate an AI-powered security report from raw scan data."""
    client = _get_client()
    if not client:
        return _fallback_report(scan_data)

    score = scan_data.get("score", 0)
    url = scan_data.get("url", "")
    vulns = scan_data.get("vulnerabilities", [])
    ssl = scan_data.get("ssl", {})
    missing = scan_data.get("missing_headers", [])
    tech = scan_data.get("tech_stack", {})

    vuln_summary = "\n".join([f"- [{v['level'].upper()}] {v['title']}: {v['desc']}" for v in vulns]) or "Aucune vulnérabilité détectée."

    prompt = f"""Tu es un expert en cybersécurité qui rédige des rapports pour des chefs d'entreprise africains non-techniques.

Voici les résultats du scan de sécurité de {url} :

SCORE DE SÉCURITÉ : {score}/100
SSL : {'✅ Valide, expire dans ' + str(ssl.get('expiry_days', 0)) + ' jours' if ssl.get('valid') else '❌ Invalide ou absent'}
HEADERS MANQUANTS : {', '.join(missing) if missing else 'Aucun'}
STACK TECHNIQUE : {json.dumps(tech, ensure_ascii=False)}

VULNÉRABILITÉS TROUVÉES :
{vuln_summary}

Rédige un rapport de sécurité en 3 parties :
1. SYNTHÈSE (2-3 phrases max, ton direct, expliquer le score et le niveau de risque en termes simples)
2. DANGERS IMMÉDIATS (liste des 3 risques les plus graves et pourquoi ils menacent l'entreprise en termes business)
3. PLAN D'ACTION (3 actions prioritaires numérotées, concrètes, avec estimation du temps pour les implémenter)

Utilise un ton professionnel mais accessible. Pas de jargon technique non expliqué. Sois direct et actionnable."""

    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}]
        )
        ai_text = message.content[0].text
        parts = _parse_report(ai_text)
        return parts
    except Exception as e:
        return _fallback_report(scan_data)


def _parse_report(text: str) -> dict:
    return {
        "full_text": text,
        "summary": _extract_section(text, ["SYNTHÈSE", "SYNTHESE", "1."], ["DANGERS", "2."]),
        "dangers": _extract_section(text, ["DANGERS", "2."], ["PLAN", "3."]),
        "action_plan": _extract_section(text, ["PLAN", "3."], []),
    }


def _extract_section(text: str, start_markers: list, end_markers: list) -> str:
    lines = text.split("\n")
    capturing = False
    result = []
    for line in lines:
        if not capturing:
            if any(m.lower() in line.lower() for m in start_markers):
                capturing = True
        else:
            if end_markers and any(m.lower() in line.lower() for m in end_markers):
                break
            result.append(line)
    return "\n".join(result).strip() or text[:300]


def _fallback_report(scan_data: dict) -> dict:
    score = scan_data.get("score", 0)
    vulns = scan_data.get("vulnerabilities", [])
    criticals = [v for v in vulns if v["level"] == "critical"]
    warnings = [v for v in vulns if v["level"] == "warning"]

    if score >= 80:
        summary = f"Votre site affiche un bon score de sécurité ({score}/100). Les bases sont en place."
    elif score >= 60:
        summary = f"Score modéré ({score}/100). Des améliorations importantes sont nécessaires pour protéger vos données."
    else:
        summary = f"Score critique ({score}/100). Votre site présente des vulnérabilités sérieuses qui exposent vos clients et vos données."

    dangers = "\n".join([f"- {v['title']}: {v['desc']}" for v in (criticals + warnings)[:3]]) or "Aucun danger critique immédiat."
    action = "1. Activez HTTPS et renouvelez votre certificat SSL.\n2. Configurez les en-têtes de sécurité (CSP, HSTS).\n3. Masquez les informations de version de votre serveur."

    return {
        "full_text": f"{summary}\n\n{dangers}\n\n{action}",
        "summary": summary,
        "dangers": dangers,
        "action_plan": action,
    }


async def chat_with_ai(message: str, context: str = "") -> str:
    """Chatbot endpoint for security questions."""
    client = _get_client()
    if not client:
        return _fallback_chat(message)

    system = """Tu es ZAKSOFT AI, un assistant expert en cybersécurité pour les PME africaines.
Tu réponds en français, de manière concise et pratique.
Tu expliques les concepts techniques avec des exemples concrets adaptés au contexte africain.
Tes réponses sont structurées, utilisent des emojis pertinents et restent sous 300 mots."""

    try:
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            system=system,
            messages=[{"role": "user", "content": message}]
        )
        return msg.content[0].text
    except Exception:
        return _fallback_chat(message)


def _fallback_chat(message: str) -> str:
    msg = message.lower()
    if "ssl" in msg or "https" in msg or "certificat" in msg:
        return "🔒 **SSL/HTTPS** : Utilisez Let's Encrypt (gratuit) ou Cloudflare pour sécuriser votre site. Commande Certbot : `sudo certbot --nginx -d votre-domaine.com`"
    if "wordpress" in msg or "wp" in msg:
        return "🔐 **WordPress** : Mettez à jour core + plugins, activez le 2FA, changez l'URL /wp-admin, et installez un plugin de sécurité comme Wordfence."
    if "sql" in msg or "injection" in msg:
        return "💉 **Injection SQL** : Utilisez des requêtes préparées (prepared statements). Exemple PHP : `$stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?'); $stmt->execute([$id]);`"
    return "🤖 Je suis ZAKSOFT AI. Posez-moi des questions sur la cybersécurité : SSL, WordPress, injections SQL, phishing, sécurisation de bases de données..."
