import asyncio
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.scan import ScanRequest, ScanOut, ChatRequest, ChatResponse, ScanHistoryItem
from app.services.scanner import scan_website
from app.services.ssl_checker import check_ssl
from app.services.ai_report import generate_security_report, chat_response
from app.core.security import get_current_user
from app.models.user import User
from app.models.website import Website
from app.models.scan import Scan, Report

router = APIRouter(tags=["Scanner"])


def _extract_hostname(url: str) -> tuple[str, int]:
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    parsed = urlparse(url)
    return parsed.hostname or "", parsed.port or (443 if parsed.scheme == "https" else 80)


async def _run_full_scan(url: str) -> tuple[dict, dict]:
    """
    Run HTTP scan and SSL check in parallel with asyncio.gather.
    Returns (scan_data, ssl_data).
    """
    hostname, port = _extract_hostname(url)

    # Both tasks start at the same time — no sequential waiting
    scan_task = scan_website(url)
    ssl_task = check_ssl(hostname, port) if port == 443 else _no_ssl()

    scan_data, ssl_data = await asyncio.gather(scan_task, ssl_task)

    # Merge SSL result into scan_data (scanner has a basic ssl field; replace with deep one)
    scan_data["ssl"] = ssl_data

    # Add SSL-specific vulnerabilities to the main vuln list
    for issue in ssl_data.get("issues", []):
        level = "critical" if any(w in issue.lower() for w in ["expiré", "urgent", "invalide", "auto-signé"]) else "warning"
        vuln = {"level": level, "title": "SSL/TLS", "desc": issue}
        # Avoid duplicates with basic SSL check already in scan_data
        if not any(v.get("title") == "SSL/TLS" and v.get("desc") == issue for v in scan_data["vulnerabilities"]):
            scan_data["vulnerabilities"].insert(0, vuln)

    return scan_data, ssl_data


async def _no_ssl() -> dict:
    return {"valid": False, "issuer_org": "N/A", "expiry_days": 0,
            "protocol": "N/A", "cipher": "N/A", "san_domains": [],
            "self_signed": False, "error": "HTTP seulement", "issues": []}


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/scan", response_model=ScanOut)
async def run_scan(req: ScanRequest):
    """
    Full security scan: HTTP headers + deep SSL + AI report.
    No auth required — results are not persisted.
    """
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL requise")

    try:
        scan_data, ssl_data = await _run_full_scan(url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur scanner : {str(e)}")

    ai_report = generate_security_report(scan_data, ssl_data)

    return ScanOut(
        url=scan_data["url"],
        score=scan_data["score"],
        ssl=ssl_data,
        headers=scan_data["headers"],
        missing_headers=scan_data["missing_headers"],
        tech_stack=scan_data["tech_stack"],
        vulnerabilities=scan_data["vulnerabilities"],
        ai_report=ai_report,
        reachable=scan_data.get("reachable", False),
    )


@router.post("/scan/save")
async def run_and_save_scan(
    req: ScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run scan and persist to user history (requires JWT)."""
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL requise")

    scan_data, ssl_data = await _run_full_scan(url)
    ai_report = generate_security_report(scan_data, ssl_data)

    # Upsert website
    website = db.query(Website).filter(
        Website.user_id == current_user.id, Website.url == url
    ).first()
    if not website:
        website = Website(user_id=current_user.id, url=url, name=req.website_name or url)
        db.add(website)
        db.flush()

    scan = Scan(
        website_id=website.id,
        score=scan_data["score"],
        ssl_valid=ssl_data.get("valid", False),
        ssl_expiry_days=ssl_data.get("expiry_days", 0),
        ssl_protocol=ssl_data.get("protocol", ""),
        headers=scan_data["headers"],
        tech_stack=scan_data["tech_stack"],
        vulnerabilities=scan_data["vulnerabilities"],
        status="completed",
    )
    db.add(scan)
    db.flush()

    db.add(Report(
        scan_id=scan.id,
        ai_summary=ai_report.get("summary", ""),
        ai_dangers=ai_report.get("dangers", ""),
        ai_action_plan=ai_report.get("action_plan", ""),
    ))
    db.commit()

    return {"message": "Scan enregistré", "scan_id": scan.id, "score": scan.score}


@router.get("/scans", response_model=list[ScanHistoryItem])
def list_scans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Scan history for the authenticated user."""
    scans = (
        db.query(Scan)
        .join(Website)
        .filter(Website.user_id == current_user.id)
        .order_by(Scan.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        ScanHistoryItem(
            id=s.id,
            url=s.website.url,
            score=s.score,
            ssl_valid=s.ssl_valid,
            status=s.status,
            created_at=s.created_at,
        )
        for s in scans
    ]


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message vide")
    return ChatResponse(response=await chat_response(req.message))
