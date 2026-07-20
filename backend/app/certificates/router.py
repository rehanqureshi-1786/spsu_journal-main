"""
Certificate router for certificate management endpoints.

This module provides REST API endpoints for certificate operations including:
- Creating subscription certificates
- Issuing event certificates (single and bulk)
- Retrieving user certificates
- Downloading certificate PDFs
- Verifying certificates (public endpoint)
- Admin certificate management

Requirements: 1.1, 2.1, 2.2, 3.2, 4.1, 4.2, 5.1, 5.2, 5.3, 6.1, 6.2, 6.5, 7.1, 7.4, 7.5
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import logging

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.users.models import User
from app.certificates.service import CertificateService
from app.certificates.schemas import (
    SubscriptionCertificateCreate,
    EventCertificateCreate,
    BulkCertificateCreate,
    CertificateResponse,
    CertificateVerification,
    BulkCertificateResult,
    CertificateFilters,
    CertificateType,
)
from app.certificates.validators import ValidationError
from app.middleware.error_handler import BusinessRuleError

# Configure logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/certificates", tags=["certificates"])


@router.post("/subscription", response_model=CertificateResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription_certificate(
    certificate_data: SubscriptionCertificateCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a subscription certificate for the authenticated user.
    
    This endpoint generates a subscription certificate for a user who has subscribed
    to the journal. The certificate includes the subscriber's name, subscription date,
    and a unique certificate ID for verification.
    
    Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 11.1, 11.2
    """
    service = CertificateService(db)
    
    # ValidationError and BusinessRuleError are handled by middleware
    # System errors are logged in service and re-raised
    certificate = service.create_subscription_certificate(
        user_id=current_user.id,
        subscription_date=certificate_data.subscription_date
    )
    
    # Log issuance with IP address
    ip_address = request.client.host if request.client else None
    service.log_certificate_issued(
        certificate_id=certificate.certificate_id,
        recipient_id=current_user.id,
        ip_address=ip_address
    )
    
    return CertificateResponse.model_validate(certificate)


@router.post("/events/{event_id}/issue", response_model=CertificateResponse, status_code=status.HTTP_201_CREATED)
async def issue_event_certificate(
    event_id: str,
    certificate_data: EventCertificateCreate,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Issue an event certificate to a recipient (admin only).
    
    This endpoint allows admins to issue event certificates to participants
    (authors or reviewers) for their contribution to journal events.
    
    Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 11.1, 11.2
    """
    service = CertificateService(db)
    
    # ValidationError and BusinessRuleError are handled by middleware
    # System errors are logged in service and re-raised
    certificate = service.create_event_certificate(
        user_id=certificate_data.recipient_id,
        event_id=event_id,
        role=certificate_data.role.value,
        admin_id=current_user.id
    )
    
    # Log issuance with IP address
    ip_address = request.client.host if request.client else None
    service.log_certificate_issued(
        certificate_id=certificate.certificate_id,
        recipient_id=certificate_data.recipient_id,
        admin_id=current_user.id,
        ip_address=ip_address
    )
    
    return CertificateResponse.model_validate(certificate)


@router.post("/events/{event_id}/bulk-issue", response_model=BulkCertificateResult)
async def bulk_issue_event_certificates(
    event_id: str,
    bulk_data: BulkCertificateCreate,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Bulk issue event certificates to multiple recipients (admin only).
    
    This endpoint allows admins to issue certificates to multiple participants
    at once. It prevents duplicate certificates and provides a detailed summary
    of successes and failures. Implements partial success handling - continues
    processing all recipients even if some fail.
    
    Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 11.4
    """
    service = CertificateService(db)
    
    # Bulk operation handles errors internally and returns detailed summary
    result = service.bulk_create_event_certificates(
        event_id=event_id,
        recipients=bulk_data.recipients,
        admin_id=current_user.id
    )
    
    # Log bulk generation with IP address
    if result.success_count > 0:
        ip_address = request.client.host if request.client else None
        service.log_bulk_generation(
            event_id=event_id,
            count=result.success_count,
            admin_id=current_user.id,
            ip_address=ip_address
        )
    
    return result


@router.get("/me", response_model=List[CertificateResponse])
async def get_my_certificates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all certificates for the authenticated user.
    
    This endpoint returns all certificates (subscription and event) that have
    been issued to the current user.
    
    Requirements: 5.1, 5.2
    """
    service = CertificateService(db)
    
    certificates = service.get_user_certificates(current_user.id)
    
    return [CertificateResponse.model_validate(cert) for cert in certificates]


@router.get("/{certificate_id}", response_model=CertificateResponse)
async def get_certificate_details(
    certificate_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get certificate details by certificate ID.
    
    Users can only access their own certificates. Admins can access all certificates.
    
    Requirements: 7.2, 7.4
    """
    service = CertificateService(db)
    
    certificate = service.get_certificate_by_id(certificate_id)
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )
    
    # Check access permissions
    user_role = current_user.role.name.lower()
    if user_role != "admin" and certificate.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only view your own certificates."
        )
    
    return CertificateResponse.model_validate(certificate)


@router.get("/{certificate_id}/download")
async def download_certificate(
    certificate_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download certificate PDF.
    
    Users can only download their own certificates. Admins can download all certificates.
    The download count is incremented and the action is logged.
    
    Requirements: 2.2, 2.3, 2.4, 5.3, 5.4, 5.5, 11.3
    """
    service = CertificateService(db)
    
    certificate = service.get_certificate_by_id(certificate_id)
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )
    
    # Check access permissions
    user_role = current_user.role.name.lower()
    if user_role != "admin" and certificate.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only download your own certificates."
        )
    
    # Get PDF content
    try:
        pdf_content = service.get_certificate_pdf(certificate_id)
        
        if not pdf_content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Certificate PDF not found. Please contact support."
            )
        
        # Increment download count and log
        ip_address = request.client.host if request.client else None
        service.increment_download_count(certificate_id, current_user.id)
        service.log_certificate_downloaded(
            certificate_id=certificate_id,
            user_id=current_user.id,
            ip_address=ip_address
        )
        
        # Return PDF as response
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=certificate_{certificate_id}.pdf"
            }
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log system error and return user-friendly message
        logger.error(
            f"Failed to download certificate {certificate_id}",
            exc_info=True,
            extra={
                "certificate_id": certificate_id,
                "user_id": current_user.id,
                "error": str(e)
            }
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download certificate. Please try again later."
        )


@router.get("/verify/{certificate_id}", response_model=CertificateVerification)
async def verify_certificate(
    certificate_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Verify certificate authenticity (public endpoint, no authentication required).
    
    This endpoint allows anyone to verify a certificate by its ID. It returns
    basic certificate information if the certificate is valid, or an error if not found.
    
    Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
    """
    service = CertificateService(db)
    
    # Log verification attempt with IP address
    ip_address = request.client.host if request.client else None
    service.log_certificate_verified(
        certificate_id=certificate_id,
        ip_address=ip_address
    )
    
    verification = service.verify_certificate(certificate_id)
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found. The certificate ID may be invalid or the certificate does not exist."
        )
    
    return verification


@router.get("", response_model=List[CertificateResponse])
async def get_all_certificates(
    certificate_type: Optional[str] = Query(None, description="Filter by certificate type (subscription or event)"),
    event_id: Optional[str] = Query(None, description="Filter by event ID"),
    recipient_id: Optional[str] = Query(None, description="Filter by recipient ID"),
    date_from: Optional[datetime] = Query(None, description="Filter by issued date (from)"),
    date_to: Optional[datetime] = Query(None, description="Filter by issued date (to)"),
    search: Optional[str] = Query(None, description="Search by certificate ID or recipient name"),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Get all certificates with optional filtering (admin only).
    
    This endpoint allows admins to view all issued certificates with various
    filtering options including type, event, recipient, date range, and search.
    
    Requirements: 7.1, 7.2, 7.3, 7.5
    """
    service = CertificateService(db)
    
    # Build filters
    filters = CertificateFilters(
        certificate_type=CertificateType(certificate_type) if certificate_type else None,
        event_id=event_id,
        recipient_id=recipient_id,
        date_from=date_from,
        date_to=date_to,
        search=search
    )
    
    certificates = service.get_all_certificates(filters)
    
    return [CertificateResponse.model_validate(cert) for cert in certificates]
