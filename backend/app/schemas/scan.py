from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ScanRequest(BaseModel):
    url: str
    website_name: str = ""
    save: bool = False


class VulnerabilityOut(BaseModel):
    level: str   # critical | warning | info
    title: str
    desc: str


class SSLOut(BaseModel):
    valid: bool
    issuer: str = "N/A"
    issuer_org: str = "N/A"
    subject: str = ""
    expiry_date: str = "N/A"
    expiry_days: int = 0
    protocol: str = "unknown"
    cipher: str = "unknown"
    san_domains: list[str] = []
    self_signed: bool = False
    error: Optional[str] = None
    issues: list[str] = []


class AIReportOut(BaseModel):
    summary: str
    dangers: str
    action_plan: str
    full_text: str


class ScanOut(BaseModel):
    url: str
    score: int
    ssl: SSLOut
    headers: dict
    missing_headers: list
    tech_stack: dict
    vulnerabilities: list[VulnerabilityOut]
    ai_report: AIReportOut
    reachable: bool


class ScanHistoryItem(BaseModel):
    id: str
    url: str
    score: int
    ssl_valid: bool
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    message: str
    context: str = ""


class ChatResponse(BaseModel):
    response: str
