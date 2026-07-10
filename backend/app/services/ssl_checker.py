import ssl
import socket
from datetime import datetime, timezone
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.x509.oid import ExtensionOID, NameOID
from app.core.config import settings


async def check_ssl(hostname: str, port: int = 443) -> dict:
    """
    Deep SSL/TLS inspection using the cryptography library.
    Extracts: validity, issuer, expiry, protocol, cipher, SANs, issues.
    """
    result = {
        "valid": False,
        "issuer": "N/A",
        "issuer_org": "N/A",
        "subject": hostname,
        "expiry_date": "N/A",
        "expiry_days": 0,
        "protocol": "unknown",
        "cipher": "unknown",
        "san_domains": [],
        "self_signed": False,
        "error": None,
        "issues": [],
    }

    try:
        ctx = ssl.create_default_context()
        conn = socket.create_connection((hostname, port), timeout=settings.SSL_TIMEOUT)

        with ctx.wrap_socket(conn, server_hostname=hostname) as sock:
            result["protocol"] = sock.version() or "TLS"
            cipher_info = sock.cipher()
            result["cipher"] = cipher_info[0] if cipher_info else "unknown"

            # Get raw DER certificate for deep inspection
            cert_der = sock.getpeercert(binary_form=True)

        cert = x509.load_der_x509_certificate(cert_der, default_backend())

        # ── Validity ────────────────────────────────────────────────────────
        result["valid"] = True

        # Python 3.12+ deprecates not_valid_after — use not_valid_after_utc
        try:
            expiry_dt = cert.not_valid_after_utc
        except AttributeError:
            expiry_dt = cert.not_valid_after.replace(tzinfo=timezone.utc)

        result["expiry_date"] = expiry_dt.strftime("%Y-%m-%d")
        delta = expiry_dt - datetime.now(timezone.utc)
        result["expiry_days"] = delta.days

        # ── Issuer ──────────────────────────────────────────────────────────
        try:
            result["issuer"] = cert.issuer.rfc4514_string()
            org = cert.issuer.get_attributes_for_oid(NameOID.ORGANIZATION_NAME)
            result["issuer_org"] = org[0].value if org else "Inconnu"
        except Exception:
            pass

        # ── Self-signed detection ────────────────────────────────────────────
        result["self_signed"] = cert.issuer == cert.subject

        # ── Subject Alternative Names ────────────────────────────────────────
        try:
            san_ext = cert.extensions.get_extension_for_oid(ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
            # get_values_for_type returns plain strings for DNSName
            names = san_ext.value.get_values_for_type(x509.DNSName)
            result["san_domains"] = [n if isinstance(n, str) else n.value for n in names][:10]
        except x509.ExtensionNotFound:
            pass

        # ── Security issues ──────────────────────────────────────────────────
        if result["self_signed"]:
            result["issues"].append("Certificat auto-signé — les navigateurs afficheront un avertissement de sécurité.")

        if result["expiry_days"] < 0:
            result["issues"].append(f"Certificat EXPIRÉ depuis {abs(result['expiry_days'])} jours. Danger critique immédiat.")
            result["valid"] = False
        elif result["expiry_days"] < 14:
            result["issues"].append(f"Certificat expire dans {result['expiry_days']} jours — renouvellement URGENT.")
        elif result["expiry_days"] < 30:
            result["issues"].append(f"Certificat expire dans {result['expiry_days']} jours. Planifiez le renouvellement.")

        if result["protocol"] in ("TLSv1", "TLSv1.1", "SSLv3"):
            result["issues"].append(f"Protocole obsolète détecté ({result['protocol']}). Passez à TLS 1.2 minimum, TLS 1.3 recommandé.")

    except ssl.SSLCertVerificationError as e:
        result["error"] = "Certificat invalide ou auto-signé"
        result["issues"].append(str(e)[:120])
    except ssl.SSLError as e:
        result["error"] = f"Erreur SSL : {str(e)[:80]}"
        result["issues"].append(result["error"])
    except OSError as e:
        result["error"] = f"Port 443 inaccessible : {str(e)[:80]}"
        result["issues"].append(result["error"])
    except Exception as e:
        result["error"] = str(e)[:100]
        result["issues"].append(result["error"])

    return result
