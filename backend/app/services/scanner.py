import re
from urllib.parse import urlparse
import httpx
from app.core.config import settings
from app.services.ssl_checker import check_ssl


# Security headers to check: header_name -> (score_points, label, description)
SECURITY_HEADERS = {
    "strict-transport-security": (15, "HSTS", "Force HTTPS et protège contre le downgrade"),
    "content-security-policy": (20, "Content Security Policy", "Protège contre les injections XSS"),
    "x-frame-options": (10, "X-Frame-Options", "Prévient le clickjacking via iframes"),
    "x-content-type-options": (8, "X-Content-Type-Options", "Empêche le MIME-type sniffing"),
    "referrer-policy": (7, "Referrer-Policy", "Contrôle les informations de référent partagées"),
    "permissions-policy": (5, "Permissions-Policy", "Restreint l'accès aux APIs du navigateur"),
}


async def scan_website(url: str) -> dict:
    """
    Full security scan pipeline.
    Returns structured results ready for scoring and AI analysis.
    """
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    parsed = urlparse(url)
    hostname = parsed.hostname or parsed.path.split("/")[0]

    result = {
        "url": url,
        "hostname": hostname,
        "reachable": False,
        "status_code": 0,
        "ssl": {"valid": False, "expiry_days": 0, "protocol": "unknown", "error": None},
        "headers": {},
        "missing_headers": [],
        "tech_stack": {},
        "vulnerabilities": [],
        "score": 0,
    }

    # ── Phase 1: HTTP request ──────────────────────────────────────────────
    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=settings.HTTP_TIMEOUT,
            verify=False,
        ) as client:
            response = await client.get(url)

        result["reachable"] = True
        result["status_code"] = response.status_code
        raw_headers = {k.lower(): v for k, v in response.headers.items()}
        html = response.text[:60_000]

    except httpx.TimeoutException:
        result["vulnerabilities"].append({
            "level": "critical",
            "title": "Site inaccessible (timeout)",
            "desc": f"Le site {url} ne répond pas dans les {settings.HTTP_TIMEOUT}s imparties.",
        })
        return result
    except Exception as e:
        result["vulnerabilities"].append({
            "level": "critical",
            "title": "Site inaccessible",
            "desc": f"Impossible de contacter {url} : {str(e)[:120]}",
        })
        return result

    # ── Phase 2: SSL / HTTPS ───────────────────────────────────────────────
    score = 0

    if parsed.scheme == "https":
        ssl_result = await check_ssl(hostname, parsed.port or 443)
        result["ssl"] = ssl_result

        if ssl_result["valid"]:
            score += 20
            if ssl_result["expiry_days"] > 30:
                score += 5
            elif ssl_result["expiry_days"] <= 14:
                result["vulnerabilities"].append({
                    "level": "critical",
                    "title": f"Certificat SSL expire dans {ssl_result['expiry_days']} jours",
                    "desc": "Renouvelez votre certificat SSL immédiatement pour éviter que le site soit marqué dangereux.",
                })
        else:
            result["vulnerabilities"].append({
                "level": "critical",
                "title": "Certificat SSL invalide",
                "desc": ssl_result.get("error") or "Le certificat SSL n'est pas valide.",
            })
    else:
        result["vulnerabilities"].append({
            "level": "critical",
            "title": "HTTPS non activé",
            "desc": "Le site utilise HTTP non chiffré. Les données des utilisateurs transitent en clair sur le réseau.",
        })

    # ── Phase 3: Security headers ──────────────────────────────────────────
    for header_key, (points, label, desc) in SECURITY_HEADERS.items():
        value = raw_headers.get(header_key)
        if value:
            score += points
            result["headers"][label] = {"present": True, "value": value[:120]}
        else:
            result["headers"][label] = {"present": False, "value": None}
            result["missing_headers"].append(label)
            result["vulnerabilities"].append({
                "level": "critical" if header_key == "content-security-policy" else "warning",
                "title": f"{label} absent",
                "desc": desc,
            })

    # ── Phase 4: Server version exposure ──────────────────────────────────
    server = raw_headers.get("server", "")
    x_powered = raw_headers.get("x-powered-by", "")
    result["tech_stack"]["server"] = server
    result["tech_stack"]["x_powered_by"] = x_powered

    if re.search(r"[\d.]{3,}", server):
        result["vulnerabilities"].append({
            "level": "warning",
            "title": "Version du serveur exposée",
            "desc": f"L'en-tête Server révèle : '{server[:60]}'. Masquez cette information dans la configuration.",
        })
    else:
        score += 10

    # ── Phase 5: HTML passive analysis ────────────────────────────────────
    _analyze_html(html, result, raw_headers)

    result["score"] = max(5, min(100, score))
    return result


def _analyze_html(html: str, result: dict, raw_headers: dict) -> None:
    """Detect CMS, vulnerable JS libraries and dangerous patterns in HTML."""

    # CMS detection
    if "wp-content" in html or "wp-includes" in html:
        result["tech_stack"]["cms"] = "WordPress"
        wp_ver = re.search(r"ver=(\d+\.\d+\.?\d*)", html)
        if wp_ver:
            ver = wp_ver.group(1)
            result["tech_stack"]["cms_version"] = ver
            if int(ver.split(".")[0]) < 6:
                result["vulnerabilities"].append({
                    "level": "critical",
                    "title": f"WordPress obsolète (v{ver})",
                    "desc": "Les versions WordPress < 6.x contiennent des vulnérabilités CVE connues. Mise à jour urgente.",
                })
    elif "drupal" in html.lower():
        result["tech_stack"]["cms"] = "Drupal"
    elif "joomla" in html.lower():
        result["tech_stack"]["cms"] = "Joomla"

    # jQuery version check
    jq = re.search(r"jquery[/-](\d+\.\d+\.\d+)", html.lower())
    if jq:
        ver = jq.group(1)
        result["tech_stack"]["jquery"] = ver
        parts = [int(x) for x in ver.split(".")]
        if parts[0] < 3 or (parts[0] == 3 and parts[1] < 6):
            result["vulnerabilities"].append({
                "level": "warning",
                "title": f"jQuery vulnérable (v{ver})",
                "desc": "Cette version contient des vulnérabilités XSS documentées. Mettez à jour vers jQuery 3.7+.",
            })

    # eval() usage
    if "eval(" in html:
        result["vulnerabilities"].append({
            "level": "warning",
            "title": "eval() détecté dans le code source",
            "desc": "eval() exécute du code JavaScript arbitraire — vecteur d'injection si les données viennent d'une source externe.",
        })

    # Charset missing
    ct = raw_headers.get("content-type", "")
    if "text/html" in ct and "charset" not in ct.lower():
        result["vulnerabilities"].append({
            "level": "info",
            "title": "Charset non défini dans Content-Type",
            "desc": "Spécifiez le charset (ex: text/html; charset=UTF-8) pour éviter le MIME sniffing.",
        })
