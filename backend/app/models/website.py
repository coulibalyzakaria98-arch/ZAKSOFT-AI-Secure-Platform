import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Website(Base):
    __tablename__ = "websites"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    url = Column(String, nullable=False)
    name = Column(String, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="websites")
    scans = relationship("Scan", back_populates="website", cascade="all, delete")
