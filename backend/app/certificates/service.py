"""
Certificate service layer for business logic.

This module provides the core business logic for certificate generation,
retrieval, verification, and management. It orchestrates interactions between
the PDF generator, ID generator, database, and audit logging.
"""
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime
from typing import List, Optional, Dict, Any
import os
import logging

from app.certificates.models import Certificate, CertificateAuditLog
from app.certificates.schemas import (
    CertificateResponse,
    CertificateVerification,
    BulkCertificateResult,
    CertificateFilters,
    BulkCertificateRecipient,
    CertificateType,
)
from app.certificates.id_generator import CertificateIDGenerator
from app.certificates.pdf_generator import PDFGenerator
from app.certificates.validators import (
    ValidationError,
    validate_recipient_name,
    validate_date,
    validate_event_exists,
    validate_role,
)
from app.events.models import Event
from app.users.models import User
from app.authors.models import Author
from app.reviewers.models import Reviewer
from app.core.config import settings
from app.middleware.error_handler import BusinessRuleError

# Configure logger
logger = logging.getLogger(__name__)


class CertificateService:
    """
    Service class for certificate operations.
    
    Provides methods for:
    - Creating subscription and event certificates
    - Bulk certificate generation
    - Certificate retrieval and filtering
    - Certificate verification
    - Audit logging
    """
    
    def __init__(self, db: Session):
        """
        Initialize the certificate service.
        
        Args:
            db: Database session
        """
        self.db = db
        self.id_generator = CertificateIDGenerator(db)
        self.pdf_generator = PDFGenerator()
    
    def create_subscription_certificate(
        self,
        user_id: str,
        subscription_date: datetime
    ) -> Certificate:
        """
        Create a subscription certificate for a user.
        
        Args:
            user_id: ID of the user receiving the certificate
            subscription_date: Date of subscription
        
        Returns:
            Certificate: The created certificate object
        
        Raises:
            ValidationError: If validation fails
            BusinessRuleError: If user not found
            Exception: If system error occurs during PDF generation or storage
        
        Requirements: 11.1, 11.2, 12.1, 12.3
        """
        try:
            # Validate subscription date
            validate_date(subscription_date, "subscription_date")
            
            # Get user information
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise BusinessRuleError(
                    message=f"User not found",
                    details={"user_id": user_id, "reason": "User does not exist in the system"}
                )
            
            # Get user's full name from author or reviewer profile
            recipient_name = self._get_user_full_name(user_id)
            
            # Validate recipient name
            validate_recipient_name(recipient_name)
            
            # Generate unique certificate ID
            certificate_id = self.id_generator.generate_id()
            
            # Create certificate record
            certificate = Certificate(
                certificate_id=certificate_id,
                certificate_type=CertificateType.SUBSCRIPTION.value,
                recipient_id=user_id,
                recipient_name=recipient_name,
                issued_date=datetime.utcnow(),
                subscription_date=subscription_date,
                download_count=0
            )
            
            self.db.add(certificate)
            self.db.commit()
            self.db.refresh(certificate)
            
            # Generate and save PDF
            try:
                pdf_data = {
                    'recipient_name': recipient_name,
                    'subscription_date': subscription_date,
                    'certificate_id': certificate_id,
                    'issued_date': certificate.issued_date
                }
                pdf_content = self.pdf_generator.generate_subscription_certificate(pdf_data)
                self._save_certificate_pdf(certificate_id, pdf_content)
            except Exception as e:
                # Log the error with full context
                logger.error(
                    f"Failed to generate or save PDF for certificate {certificate_id}",
                    exc_info=True,
                    extra={
                        "certificate_id": certificate_id,
                        "user_id": user_id,
                        "error": str(e)
                    }
                )
                # Rollback the certificate creation
                self.db.delete(certificate)
                self.db.commit()
                raise Exception("Failed to generate certificate PDF. Please try again later.")
            
            # Log certificate issuance
            self._log_audit(
                certificate_id=certificate_id,
                action='issued',
                user_id=user_id,
                details=f"Subscription certificate issued for {recipient_name}"
            )
            
            return certificate
            
        except (ValidationError, BusinessRuleError):
            # Re-raise validation and business rule errors as-is
            raise
        except Exception as e:
            # Log system errors with full context
            logger.error(
                f"System error creating subscription certificate for user {user_id}",
                exc_info=True,
                extra={"user_id": user_id, "error": str(e)}
            )
            raise
    
    def create_event_certificate(
        self,
        user_id: str,
        event_id: str,
        role: str,
        admin_id: Optional[str] = None
    ) -> Certificate:
        """
        Create an event certificate for a user.
        
        Args:
            user_id: ID of the user receiving the certificate
            event_id: ID of the event
            role: Role in the event ('author' or 'reviewer')
            admin_id: ID of the admin issuing the certificate
        
        Returns:
            Certificate: The created certificate object
        
        Raises:
            ValidationError: If validation fails
            BusinessRuleError: If user/event not found or duplicate certificate
            Exception: If system error occurs during PDF generation or storage
        
        Requirements: 11.1, 11.2, 12.1, 12.3, 12.4, 12.5
        """
        try:
            # Validate role
            validate_role(role)
            
            # Get user information
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise BusinessRuleError(
                    message=f"User not found",
                    details={"user_id": user_id, "reason": "User does not exist in the system"}
                )
            
            # Validate event exists
            event = validate_event_exists(event_id, self.db)
            
            # Note: event_date is not validated for future dates since
            # certificates can be issued for upcoming events
            
            # Check for duplicate certificate
            existing = self.db.query(Certificate).filter(
                Certificate.recipient_id == user_id,
                Certificate.event_id == event_id,
                Certificate.role == role
            ).first()
            
            if existing:
                raise BusinessRuleError(
                    message="Certificate already exists for this user and event",
                    details={
                        "user_id": user_id,
                        "event_id": event_id,
                        "role": role,
                        "existing_certificate_id": existing.certificate_id
                    }
                )
            
            # Get user's full name
            recipient_name = self._get_user_full_name(user_id)
            
            # Validate recipient name
            validate_recipient_name(recipient_name)
            
            # Generate unique certificate ID
            certificate_id = self.id_generator.generate_id()
            
            # Create certificate record
            certificate = Certificate(
                certificate_id=certificate_id,
                certificate_type=CertificateType.EVENT.value,
                recipient_id=user_id,
                recipient_name=recipient_name,
                issued_date=datetime.utcnow(),
                event_id=event_id,
                event_name=event.name,
                event_date=event.event_date,
                role=role,
                created_by=admin_id,
                download_count=0
            )
            
            self.db.add(certificate)
            self.db.commit()
            self.db.refresh(certificate)
            
            # Generate and save PDF
            try:
                pdf_data = {
                    'recipient_name': recipient_name,
                    'event_name': event.name,
                    'event_date': event.event_date,
                    'role': role,
                    'certificate_id': certificate_id,
                    'issued_date': certificate.issued_date
                }
                pdf_content = self.pdf_generator.generate_event_certificate(pdf_data)
                self._save_certificate_pdf(certificate_id, pdf_content)
            except Exception as e:
                # Log the error with full context
                logger.error(
                    f"Failed to generate or save PDF for certificate {certificate_id}",
                    exc_info=True,
                    extra={
                        "certificate_id": certificate_id,
                        "user_id": user_id,
                        "event_id": event_id,
                        "error": str(e)
                    }
                )
                # Rollback the certificate creation
                self.db.delete(certificate)
                self.db.commit()
                raise Exception("Failed to generate certificate PDF. Please try again later.")
            
            # Log certificate issuance
            self._log_audit(
                certificate_id=certificate_id,
                action='issued',
                user_id=admin_id,
                details=f"Event certificate issued to {recipient_name} for {event.name} as {role}"
            )
            
            return certificate
            
        except (ValidationError, BusinessRuleError):
            # Re-raise validation and business rule errors as-is
            raise
        except Exception as e:
            # Log system errors with full context
            logger.error(
                f"System error creating event certificate for user {user_id}",
                exc_info=True,
                extra={
                    "user_id": user_id,
                    "event_id": event_id,
                    "role": role,
                    "error": str(e)
                }
            )
            raise
    
    def bulk_create_event_certificates(
        self,
        event_id: str,
        recipients: List[BulkCertificateRecipient],
        admin_id: Optional[str] = None
    ) -> BulkCertificateResult:
        """
        Create multiple event certificates at once with duplicate prevention.
        
        Implements partial success handling - continues processing all recipients
        even if some fail, collecting detailed error information for each failure.
        
        Args:
            event_id: ID of the event
            recipients: List of recipients with their roles
            admin_id: ID of the admin issuing the certificates
        
        Returns:
            BulkCertificateResult: Summary of the bulk operation with success/failure details
        
        Requirements: 11.4 (partial success handling for bulk operations)
        """
        success_count = 0
        failure_count = 0
        failures = []
        certificates = []
        
        # Track unique recipients to prevent duplicates within the request
        seen_recipients = set()
        
        for recipient in recipients:
            # Create unique key for this recipient+role combination
            recipient_key = (recipient.recipient_id, recipient.role)
            
            # Skip if we've already processed this recipient+role in this batch
            if recipient_key in seen_recipients:
                failure_count += 1
                failures.append({
                    'recipient_id': recipient.recipient_id,
                    'role': recipient.role,
                    'reason': 'Duplicate recipient in request'
                })
                continue
            
            seen_recipients.add(recipient_key)
            
            try:
                certificate = self.create_event_certificate(
                    user_id=recipient.recipient_id,
                    event_id=event_id,
                    role=recipient.role,
                    admin_id=admin_id
                )
                certificates.append(certificate)
                success_count += 1
            except ValidationError as e:
                # Validation errors - provide specific field details
                failure_count += 1
                failures.append({
                    'recipient_id': recipient.recipient_id,
                    'role': recipient.role,
                    'reason': f"Validation error: {e.message}",
                    'field': e.field
                })
            except BusinessRuleError as e:
                # Business rule violations - provide clear message
                failure_count += 1
                failures.append({
                    'recipient_id': recipient.recipient_id,
                    'role': recipient.role,
                    'reason': e.message,
                    'details': e.details
                })
            except Exception as e:
                # System errors - log and provide user-friendly message
                logger.error(
                    f"System error in bulk certificate generation for recipient {recipient.recipient_id}",
                    exc_info=True,
                    extra={
                        "recipient_id": recipient.recipient_id,
                        "event_id": event_id,
                        "role": recipient.role,
                        "error": str(e)
                    }
                )
                failure_count += 1
                failures.append({
                    'recipient_id': recipient.recipient_id,
                    'role': recipient.role,
                    'reason': 'System error occurred. Please try again or contact support.'
                })
        
        # Log bulk generation
        if success_count > 0:
            self._log_audit(
                certificate_id='BULK',
                action='bulk_issued',
                user_id=admin_id,
                details=f"Bulk issued {success_count} certificates for event {event_id}"
            )
        
        return BulkCertificateResult(
            success_count=success_count,
            failure_count=failure_count,
            failures=failures,
            certificates=[CertificateResponse.model_validate(cert) for cert in certificates]
        )
    
    def get_user_certificates(self, user_id: str) -> List[Certificate]:
        """
        Get all certificates for a specific user.
        
        Args:
            user_id: ID of the user
        
        Returns:
            List[Certificate]: List of certificates for the user
        """
        certificates = self.db.query(Certificate).filter(
            Certificate.recipient_id == user_id
        ).order_by(Certificate.issued_date.desc()).all()
        
        return certificates
    
    def get_certificate_by_id(self, certificate_id: str) -> Optional[Certificate]:
        """
        Get a certificate by its certificate ID.
        
        Args:
            certificate_id: Unique certificate identifier
        
        Returns:
            Optional[Certificate]: The certificate if found, None otherwise
        """
        certificate = self.db.query(Certificate).filter(
            Certificate.certificate_id == certificate_id
        ).first()
        
        return certificate
    
    def get_all_certificates(self, filters: CertificateFilters) -> List[Certificate]:
        """
        Get all certificates with optional filtering.
        
        Args:
            filters: Filter criteria for certificates
        
        Returns:
            List[Certificate]: List of certificates matching the filters
        """
        query = self.db.query(Certificate)
        
        # Apply filters
        if filters.certificate_type:
            query = query.filter(Certificate.certificate_type == filters.certificate_type.value)
        
        if filters.event_id:
            query = query.filter(Certificate.event_id == filters.event_id)
        
        if filters.recipient_id:
            query = query.filter(Certificate.recipient_id == filters.recipient_id)
        
        if filters.date_from:
            query = query.filter(Certificate.issued_date >= filters.date_from)
        
        if filters.date_to:
            query = query.filter(Certificate.issued_date <= filters.date_to)
        
        if filters.search:
            # Search by certificate ID or recipient name
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Certificate.certificate_id.like(search_term),
                    Certificate.recipient_name.like(search_term)
                )
            )
        
        # Order by issued date descending
        certificates = query.order_by(Certificate.issued_date.desc()).all()
        
        return certificates
    
    def verify_certificate(self, certificate_id: str) -> Optional[CertificateVerification]:
        """
        Verify a certificate by its ID and return verification details.
        
        Args:
            certificate_id: Unique certificate identifier
        
        Returns:
            Optional[CertificateVerification]: Verification details if valid, None otherwise
        """
        certificate = self.get_certificate_by_id(certificate_id)
        
        if not certificate:
            return None
        
        # Log verification attempt
        self._log_audit(
            certificate_id=certificate_id,
            action='verified',
            user_id=None,
            details=f"Certificate verification for {certificate.recipient_name}"
        )
        
        return CertificateVerification(
            certificate_id=certificate.certificate_id,
            recipient_name=certificate.recipient_name,
            certificate_type=CertificateType(certificate.certificate_type),
            issued_date=certificate.issued_date,
            event_name=certificate.event_name,
            event_date=certificate.event_date,
            role=certificate.role
        )
    
    def get_certificate_pdf(self, certificate_id: str) -> Optional[bytes]:
        """
        Get the PDF content for a certificate.
        
        Args:
            certificate_id: Unique certificate identifier
        
        Returns:
            Optional[bytes]: PDF content if found, None otherwise
        """
        pdf_path = self._get_certificate_pdf_path(certificate_id)
        
        if not os.path.exists(pdf_path):
            return None
        
        with open(pdf_path, 'rb') as f:
            return f.read()
    
    def increment_download_count(self, certificate_id: str, user_id: Optional[str] = None):
        """
        Increment the download count for a certificate and log the download.
        
        Args:
            certificate_id: Unique certificate identifier
            user_id: ID of the user downloading the certificate
        """
        certificate = self.get_certificate_by_id(certificate_id)
        
        if certificate:
            certificate.download_count += 1
            self.db.commit()
            
            # Log download
            self._log_audit(
                certificate_id=certificate_id,
                action='downloaded',
                user_id=user_id,
                details=f"Certificate downloaded by user {user_id or 'anonymous'}"
            )
    
    def _get_user_full_name(self, user_id: str) -> str:
        """
        Get the full name of a user from their author or reviewer profile.
        
        Args:
            user_id: ID of the user
        
        Returns:
            str: Full name of the user
        
        Raises:
            BusinessRuleError: If user profile not found
        """
        # Try to get name from author profile
        author = self.db.query(Author).filter(Author.user_id == user_id).first()
        if author:
            return f"{author.first_name} {author.last_name}"
        
        # Try to get name from reviewer profile
        reviewer = self.db.query(Reviewer).filter(Reviewer.user_id == user_id).first()
        if reviewer:
            return f"{reviewer.first_name} {reviewer.last_name}"
        
        # If no profile found, raise error - certificates require proper names
        raise BusinessRuleError(
            message="User profile not found",
            details={
                "user_id": user_id,
                "reason": "User must have an author or reviewer profile to receive certificates"
            }
        )
    
    def _save_certificate_pdf(self, certificate_id: str, pdf_content: bytes):
        """
        Save certificate PDF to storage.
        
        Args:
            certificate_id: Unique certificate identifier
            pdf_content: PDF file content as bytes
        """
        pdf_path = self._get_certificate_pdf_path(certificate_id)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
        
        # Write PDF file
        with open(pdf_path, 'wb') as f:
            f.write(pdf_content)
    
    def _get_certificate_pdf_path(self, certificate_id: str) -> str:
        """
        Get the file path for a certificate PDF.
        
        Args:
            certificate_id: Unique certificate identifier
        
        Returns:
            str: Full path to the PDF file
        """
        return os.path.join(settings.CERTIFICATES_PATH, f"{certificate_id}.pdf")
    
    def get_certificate_audit_trail(self, certificate_id: str) -> List[CertificateAuditLog]:
        """
        Get the complete audit trail for a specific certificate.
        
        Args:
            certificate_id: Unique certificate identifier
        
        Returns:
            List[CertificateAuditLog]: List of audit log entries for the certificate
        """
        audit_logs = self.db.query(CertificateAuditLog).filter(
            CertificateAuditLog.certificate_id == certificate_id
        ).order_by(CertificateAuditLog.timestamp.desc()).all()
        
        return audit_logs
    
    def get_audit_logs(
        self,
        certificate_id: Optional[str] = None,
        action: Optional[str] = None,
        user_id: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> List[CertificateAuditLog]:
        """
        Get audit logs with optional filtering.
        
        Args:
            certificate_id: Filter by certificate ID
            action: Filter by action type
            user_id: Filter by user ID
            date_from: Filter by start date
            date_to: Filter by end date
        
        Returns:
            List[CertificateAuditLog]: List of audit log entries matching the filters
        """
        query = self.db.query(CertificateAuditLog)
        
        # Apply filters
        if certificate_id:
            query = query.filter(CertificateAuditLog.certificate_id == certificate_id)
        
        if action:
            query = query.filter(CertificateAuditLog.action == action)
        
        if user_id:
            query = query.filter(CertificateAuditLog.user_id == user_id)
        
        if date_from:
            query = query.filter(CertificateAuditLog.timestamp >= date_from)
        
        if date_to:
            query = query.filter(CertificateAuditLog.timestamp <= date_to)
        
        # Order by timestamp descending
        audit_logs = query.order_by(CertificateAuditLog.timestamp.desc()).all()
        
        return audit_logs
    
    def log_certificate_issued(
        self,
        certificate_id: str,
        recipient_id: str,
        admin_id: Optional[str] = None,
        ip_address: Optional[str] = None
    ):
        """
        Log a certificate issuance event.
        
        Args:
            certificate_id: Certificate identifier
            recipient_id: ID of the recipient
            admin_id: ID of the admin issuing the certificate (for event certificates)
            ip_address: IP address of the request
        """
        details = f"Certificate issued to user {recipient_id}"
        if admin_id:
            details += f" by admin {admin_id}"
        
        self._log_audit(
            certificate_id=certificate_id,
            action='issued',
            user_id=admin_id or recipient_id,
            ip_address=ip_address,
            details=details
        )
    
    def log_certificate_downloaded(
        self,
        certificate_id: str,
        user_id: str,
        ip_address: Optional[str] = None
    ):
        """
        Log a certificate download event.
        
        Args:
            certificate_id: Certificate identifier
            user_id: ID of the user downloading the certificate
            ip_address: IP address of the request
        """
        self._log_audit(
            certificate_id=certificate_id,
            action='downloaded',
            user_id=user_id,
            ip_address=ip_address,
            details=f"Certificate downloaded by user {user_id}"
        )
    
    def log_certificate_verified(
        self,
        certificate_id: str,
        ip_address: Optional[str] = None
    ):
        """
        Log a certificate verification event.
        
        Args:
            certificate_id: Certificate identifier
            ip_address: IP address of the request
        """
        self._log_audit(
            certificate_id=certificate_id,
            action='verified',
            user_id=None,
            ip_address=ip_address,
            details=f"Certificate verification requested"
        )
    
    def log_bulk_generation(
        self,
        event_id: str,
        count: int,
        admin_id: str,
        ip_address: Optional[str] = None
    ):
        """
        Log a bulk certificate generation event.
        
        Args:
            event_id: ID of the event
            count: Number of certificates generated
            admin_id: ID of the admin performing bulk generation
            ip_address: IP address of the request
        """
        self._log_audit(
            certificate_id='BULK',
            action='bulk_issued',
            user_id=admin_id,
            ip_address=ip_address,
            details=f"Bulk issued {count} certificates for event {event_id}"
        )
    
    def _log_audit(
        self,
        certificate_id: str,
        action: str,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        details: Optional[str] = None
    ):
        """
        Log a certificate-related action to the audit log.
        
        Args:
            certificate_id: Certificate identifier
            action: Action performed ('issued', 'downloaded', 'verified', 'bulk_issued')
            user_id: ID of the user performing the action
            ip_address: IP address of the request
            details: Additional details about the action
        """
        audit_log = CertificateAuditLog(
            certificate_id=certificate_id,
            action=action,
            user_id=user_id,
            ip_address=ip_address,
            details=details
        )
        
        self.db.add(audit_log)
        self.db.commit()
