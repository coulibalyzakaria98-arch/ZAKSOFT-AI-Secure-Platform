import ssl
import socket
import re
from datetime import datetime, timezone
from urllib.parse import urlparse
import httpx


SECURITY_HEADERS = {
    "strict-transport-security": {"points": 15, "label": "HSTS", "desc": "Force HTTPS sur tous les sous-domaines"},
    "content-security-policy": {"points": 20, "label": "Content Security Policy", "desc": "Protège contre les injections XSS"},
    "x-frame-options": {"points": 10, "label": "X-Frame-Options", "desc": "Prévient le clickjacking"},
    "x-content-type-options": {"points": 8, "label": "X-Content-Type-Options", "desc": "Empêche le MIME sniffing"},
    "referrer-policy": {"points": 7, "label": "Referrer-Policy", "desc": "Contrôle les informations de référent"},
    "permissions-policy": {"points": 5, "label": "Permissions-Policy", "desc": "Restreint les APIs du navigateur"},
}

VULNERABLE_JS = [
    (r'jquery[.-](\d+\.\d+\.\d+)', "jQuery"),
    (r'bootstrap[.-](\d+\.\d+\.\d+)', "Bootstrap"),
    (r'angular[.-](\d+\.\d+\.\d+)', "Angular"),
    (r'vue[.-](\d+\.\d+\.\d+)', "Vue.js"),
]

DANGEROUS_PATTERNS = [
    (r'wp-content|wp-admin|wp-includes', "WordPress", "info"),
    (r'X-Powered-By:\s*PHP', "Version PHP exposée", "warning"),
    (r'Server:\s*(Apache|nginx)/[\d.]+', "Version serveur exposée", "warning"),
    (r'\.git/', "Dossier .git accessible", "critical"),
    (r'\.env', "Fichier .env potentiellement exposé", "critical"),
]


async def run_scan(url: str) -> dict:
    """Execute the full security scan pipeline and return structured results."""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    parsed = urlparse(url)
    hostname = parsed.netloc or parsed.path
    results = {
        "url": url,
        "hostname": hostname,
        "ssl": {"valid": False, "expiry_days": 0, "protocol": "unknown", "error": None},
        "headers": {},
        "missing_headers": [],
        "tech_stack": {},
        "vulnerabilities": [],
        "score": 0,
        "reachable": False,
    }

    # Phase 1: HTTP request
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0, verify=False) as client:
            response = await client.get(url)
            results["reachable"] = True
            results["status_code"] = response.status_code
            raw_headers = dict(response.headers)
            html = response.text[:50000]
    except Exception as e:
        results["vulnerabilities"].append({
            "level": "critical",
            "title": "Site inaccessible",
            "desc": f"Impossible de contacter {url} : {str(e)[:120]}",
        })
        return results

    # Phase 2: SSL check
    if parsed.scheme == "https" or url.startswith("https://"):
        results["ssl"] = await _check_ssl(hostname, parsed.port or 443)
    else:
        results["vulnerabilities"].append({
            "level": "critical",
            "title": "HTTPS non activé",
            "desc": "Le site utilise HTTP non chiffré. Les données transitent en clair.",
        })

    # Phase 3: Security headers
    score = 0
    if results["ssl"]["valid"]:
        score += 20
    if results["ssl"]["expiry_days"] > 30:
        score += 5

    header_keys_lower = {k.lower(): v for k, v in raw_headers.items()}

    for header, meta in SECURITY_HEADERS.items():
        if header in header_keys_lower:
            score += meta["points"]
            results["headers"][meta["label"]] = {"present": True, "value": header_keys_lower[header][:120]}
        else:
            results["headers"][meta["label"]] = {"present": False, "value": None}
            results["missing_headers"].append(meta["label"])
            results["vulnerabilities"].append({
                "level": "warning" if header not in ("content-security-policy",) else "critical",
                "title": f"{meta['label']} absent",
                "desc": meta["desc"],
            })

    # Server version exposure
    server = header_keys_lower.get("server", "")
    x_powered = header_keys_lower.get("x-powered-by", "")
    results["tech_stack"]["server"] = server
    results["tech_stack"]["x_powered_by"] = x_powered

    if re.search(r"[\d.]{3,}", server):
        results["vulnerabilities"].append({
            "level": "warning",
            "title": "Version du serveur exposée",
            "desc": f"L'en-tête Server révèle : {server[:80]}. Masquez-la dans la config.",
        })
    else:
        score += 10

    # Phase 4: HTML analysis
    _analyze_html(html, results, raw_headers)

    # Clamp and finalize score
    results["score"] = max(5, min(100, score))
    return results


async def _check_ssl(hostname: str, port: int) -> dict:
    result = {"valid": False, "expiry_days": 0, "protocol": "unknown", "error": None}
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.create_connection((hostname, port), timeout=10), server_hostname=hostname) as sock:
            cert = sock.getpeercert()
            result["protocol"] = sock.version()
            result["valid"] = True
            expire_str = cert.get("notAfter", "")
            if expire_str:
                expire_dt = datetime.strptime(expire_str, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
                delta = expire_dt - datetime.now(timezone.utc)
                result["expiry_days"] = max(0, delta.days)
    except ssl.SSLCertVerificationError as e:
        result["error"] = "Certificat invalide ou auto-signé"
    except ssl.SSLError as e:
        result["error"] = str(e)[:100]
    except Exception as e:
        result["error"] = str(e)[:100]
    return result


def _analyze_html(html: str, results: dict, raw_headers: dict):
    cms = "Inconnu"
    if "wp-content" in html or "wp-includes" in html:
        cms = "WordPress"
        results["tech_stack"]["cms"] = cms
        wp_ver = re.search(r'ver=(\d+\.\d+\.?\d*)', html)
        if wp_ver:
            ver = wp_ver.group(1)
            results["tech_stack"]["cms_version"] = ver
            major = int(ver.split(".")[0])
            if major < 6:
                results["vulnerabilities"].append({
                    "level": "critical",
                    "title": f"WordPress obsolète (v{ver})",
                    "desc": "Des versions WordPress < 6.x contiennent des vulnérabilités connues. Mettez à jour immédiatement.",
                })
    elif "drupal" in html.lower():
        results["tech_stack"]["cms"] = "Drupal"
    elif "joomla" in html.lower():
        results["tech_stack"]["cms"] = "Joomla"

    # jQuery version check
    jq = re.search(r'jquery[/-](\d+\.\d+\.\d+)', html.lower())
    if jq:
        ver = jq.group(1)
        results["tech_stack"]["jquery"] = ver
        parts = [int(x) for x in ver.split(".")]
        if parts[0] < 3 or (parts[0] == 3 and parts[1] < 6):
            results["vulnerabilities"].append({
                "level": "warning",
                "title": f"jQuery vulnérable (v{ver})",
                "desc": "Cette version de jQuery contient des vulnérabilités XSS. Mettez à jour vers 3.7+.",
            })

    # Inline scripts and sensitive patterns
    if "eval(" in html:
        results["vulnerabilities"].append({
            "level": "warning",
            "title": "eval() détecté dans le HTML",
            "desc": "L'utilisation de eval() est risquée et peut faciliter des injections de code.",
        })

    content_type = raw_headers.get("content-type", raw_headers.get("Content-Type", ""))
    if "text/html" in content_type and "charset" not in content_type.lower():
        results["vulnerabilities"].append({
            "level": "info",
            "title": "Charset non spécifié",
            "desc": "Spécifiez le charset dans Content-Type pour éviter le sniffing de MIME.",
        })
