"""
Certificate models for certificate generation system.
"""
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Index, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


def generate_uuid():
    """Generate a UUID string for primary keys."""
    return str(uuid.uuid4())


class Certificate(Base):
    """Certificate model for subscription and event certificates."""
    __tablename__ = "certificates"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    certificate_id = Column(String(32), unique=True, nullable=False, index=True)  # Unique certificate identifier
    certificate_type = Column(String(20), nullable=False)  # 'subscription' or 'event'
    recipient_id = Column(String(36), nullable=False, index=True)  # User ID
    recipient_name = Column(String(255), nullable=False)  # Cached for display
    issued_date = Column(DateTime(timezone=True), nullable=False)
    
    # Subscription certificate fields
    subscription_date = Column(DateTime(timezone=True), nullable=True)
    
    # Event certificate fields
    event_id = Column(String(36), ForeignKey("events.id"), nullable=True, index=True)
    event_name = Column(String(255), nullable=True)  # Cached for display
    event_date = Column(DateTime(timezone=True), nullable=True)  # Cached for display
    role = Column(String(20), nullable=True)  # 'author' or 'reviewer'
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(36), nullable=True)  # Admin ID for event certificates
    download_count = Column(Integer, default=0, nullable=False)
    
    # Relationships
    event = relationship("Event", back_populates="certificates")
    audit_logs = relationship("CertificateAuditLog", back_populates="certificate", lazy="dynamic")
    
    __table_args__ = (
        Index('idx_recipient_id', 'recipient_id'),
        Index('idx_event_id', 'event_id'),
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
    )


class CertificateAuditLog(Base):
    """Audit log model for certificate-related activities."""
    __tablename__ = "certificate_audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    certificate_id = Column(String(32), ForeignKey("certificates.certificate_id"), nullable=False, index=True)
    action = Column(String(50), nullable=False)  # 'issued', 'downloaded', 'verified'
    user_id = Column(String(36), nullable=True)  # User who performed action
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    details = Column(Text, nullable=True)  # JSON for additional context
    
    # Relationships
    certificate = relationship("Certificate", back_populates="audit_logs")
    
    __table_args__ = (
        Index('idx_certificate_id', 'certificate_id'),
        Index('idx_timestamp', 'timestamp'),
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
    )
