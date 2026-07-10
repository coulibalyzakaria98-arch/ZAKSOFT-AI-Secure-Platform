import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from app.database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, default="")
    role = Column(String, default="admin")  # admin | viewer
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    websites = relationship("Website", back_populates="owner", cascade="all, delete")
