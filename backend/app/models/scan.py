import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Scan(Base):
    __tablename__ = "scans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    website_id = Column(String, ForeignKey("websites.id"), nullable=False)
    score = Column(Integer, default=0)
    ssl_valid = Column(Boolean, default=False)
    ssl_expiry_days = Column(Integer, default=0)
    ssl_protocol = Column(String, default="")
    headers = Column(JSON, default=dict)
    tech_stack = Column(JSON, default=dict)
    vulnerabilities = Column(JSON, default=list)
    # pending | processing | completed | failed
    status = Column(String, default="completed")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    website = relationship("Website", back_populates="scans")
    report = relationship("Report", back_populates="scan", uselist=False, cascade="all, delete")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False)
    ai_summary = Column(Text, default="")
    ai_dangers = Column(Text, default="")
    ai_action_plan = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    scan = relationship("Scan", back_populates="report")
