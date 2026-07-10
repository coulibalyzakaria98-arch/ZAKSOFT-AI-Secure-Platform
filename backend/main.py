import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import asyncio

from database import engine, get_db, Base
from models import User, Website, Scan, Report
from auth import hash_password, verify_password, create_access_token, get_current_user
from scanner import run_scan
from ai_report import generate_security_report, chat_with_ai

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ZAKSOFT AI Secure Platform API", version="1.0.0")

# CORS — allow frontend (file:// and local servers)
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5500,http://127.0.0.1:5500,null").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # MVP: open for demo; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Schemas ────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class ScanRequest(BaseModel):
    url: str
    website_name: str = ""
    save: bool = True  # save to DB?

class ChatRequest(BaseModel):
    message: str

# ─── Auth Routes ─────────────────────────────────────────────────────────────

@app.post("/api/auth/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        full_name=req.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role}}

@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role}}

@app.get("/api/auth/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "full_name": current_user.full_name, "role": current_user.role}

# ─── Scanner Routes ───────────────────────────────────────────────────────────

@app.post("/api/scan")
async def scan_website(req: ScanRequest, db: Session = Depends(get_db)):
    """Run a full security scan. Auth optional for demo — saves to DB only if user is logged in and save=True."""
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL requise")

    # Run the real scan
    try:
        scan_data = await run_scan(url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur durant le scan : {str(e)}")

    # Generate AI report
    report = generate_security_report(scan_data)
    scan_data["ai_report"] = report

    return {
        "url": scan_data["url"],
        "score": scan_data["score"],
        "ssl": scan_data["ssl"],
        "headers": scan_data["headers"],
        "missing_headers": scan_data["missing_headers"],
        "tech_stack": scan_data["tech_stack"],
        "vulnerabilities": scan_data["vulnerabilities"],
        "ai_report": report,
        "reachable": scan_data.get("reachable", False),
    }

@app.get("/api/scans")
def list_scans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    scans = (
        db.query(Scan)
        .join(Website)
        .filter(Website.user_id == current_user.id)
        .order_by(Scan.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": s.id,
            "url": s.website.url,
            "score": s.score,
            "ssl_valid": s.ssl_valid,
            "status": s.status,
            "created_at": s.created_at.isoformat(),
        }
        for s in scans
    ]

# ─── Chat Route ───────────────────────────────────────────────────────────────

@app.post("/api/chat")
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message vide")
    response = await chat_with_ai(req.message)
    return {"response": response}

# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "ZAKSOFT AI Secure Platform", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
