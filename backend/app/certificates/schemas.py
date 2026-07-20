"""
Pydantic schemas for certificate management.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum


class CertificateType(str, Enum):
    """Certificate type enumeration."""
    SUBSCRIPTION = "subscription"
    EVENT = "event"


class Role(str, Enum):
    """Role enumeration for event certificates."""
    AUTHOR = "author"
    REVIEWER = "reviewer"


class SubscriptionCertificateCreate(BaseModel):
    """Schema for creating a subscription certificate."""
    subscription_date: datetime


class EventCertificateCreate(BaseModel):
    """Schema for creating an event certificate."""
    recipient_id: str
    role: Role


class BulkCertificateRecipient(BaseModel):
    """Schema for bulk certificate recipient."""
    recipient_id: str
    role: Role


class BulkCertificateCreate(BaseModel):
    """Schema for bulk certificate creation."""
    recipients: List[BulkCertificateRecipient]


class CertificateResponse(BaseModel):
    """Schema for certificate response."""
    id: str
    certificate_id: str
    certificate_type: CertificateType
    recipient_id: str
    recipient_name: str
    issued_date: datetime
    subscription_date: Optional[datetime] = None
    event_id: Optional[str] = None
    event_name: Optional[str] = None
    event_date: Optional[datetime] = None
    role: Optional[Role] = None
    created_at: datetime
    created_by: Optional[str] = None
    download_count: int
    
    class Config:
        from_attributes = True


class CertificateVerification(BaseModel):
    """Schema for certificate verification response."""
    certificate_id: str
    recipient_name: str
    certificate_type: CertificateType
    issued_date: datetime
    event_name: Optional[str] = None
    event_date: Optional[datetime] = None
    role: Optional[Role] = None


class BulkCertificateResult(BaseModel):
    """Schema for bulk certificate generation result."""
    success_count: int
    failure_count: int
    failures: List[dict]
    certificates: List[CertificateResponse]


class CertificateFilters(BaseModel):
    """Schema for certificate filtering."""
    certificate_type: Optional[CertificateType] = None
    event_id: Optional[str] = None
    recipient_id: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    search: Optional[str] = None  # Search by certificate ID or recipient name


class AuditLogResponse(BaseModel):
    """Schema for audit log response."""
    id: str
    certificate_id: str
    action: str
    user_id: Optional[str] = None
    timestamp: datetime
    ip_address: Optional[str] = None
    details: Optional[str] = None
    
    class Config:
        from_attributes = True
