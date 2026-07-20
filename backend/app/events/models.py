"""
Event models for certificate generation system.
"""
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


def generate_uuid():
    """Generate a UUID string for primary keys."""
    return str(uuid.uuid4())


class Event(Base):
    """Event model for journal events (conferences, workshops, webinars, etc.)."""
    __tablename__ = "events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    event_date = Column(DateTime(timezone=True), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)  # 'conference', 'workshop', 'webinar', etc.
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(36), nullable=False)  # Admin user ID
    
    # Relationships
    certificates = relationship("Certificate", back_populates="event", lazy="dynamic")
    
    __table_args__ = (
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
    )
