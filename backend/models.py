import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Integer, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base


def new_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=new_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, default="")
    role = Column(String, default="admin")  # admin | viewer
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    websites = relationship("Website", back_populates="owner", cascade="all, delete")


class Website(Base):
    __tablename__ = "websites"

    id = Column(String, primary_key=True, default=new_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    url = Column(String, nullable=False)
    name = Column(String, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="websites")
    scans = relationship("Scan", back_populates="website", cascade="all, delete")


class Scan(Base):
    __tablename__ = "scans"

    id = Column(String, primary_key=True, default=new_uuid)
    website_id = Column(String, ForeignKey("websites.id"), nullable=False)
    score = Column(Integer, default=0)
    ssl_valid = Column(Boolean, default=False)
    ssl_expiry_days = Column(Integer, default=0)
    headers = Column(JSON, default=dict)
    tech_stack = Column(JSON, default=dict)
    vulnerabilities = Column(JSON, default=list)
    status = Column(String, default="pending")  # pending | processing | completed | failed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    website = relationship("Website", back_populates="scans")
    report = relationship("Report", back_populates="scan", uselist=False, cascade="all, delete")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=new_uuid)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False)
    ai_summary = Column(Text, default="")
    recommendations = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    scan = relationship("Scan", back_populates="report")
