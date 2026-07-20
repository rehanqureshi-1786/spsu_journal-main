"""
Unit tests for certificate service layer.
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.certificates.service import CertificateService
from app.certificates.models import Certificate
from app.certificates.schemas import BulkCertificateRecipient, CertificateFilters, CertificateType
from app.events.models import Event
from app.users.models import User, Role
from app.authors.models import Author
from app.reviewers.models import Reviewer


class TestCertificateService:
    """Test suite for CertificateService."""
    
    def test_create_subscription_certificate(self, db: Session, test_user, test_author):
        """Test creating a subscription certificate."""
        service = CertificateService(db)
        subscription_date = datetime.utcnow() - timedelta(days=1)
        
        certificate = service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=subscription_date
        )
        
        assert certificate is not None
        assert certificate.certificate_type == 'subscription'
        assert certificate.recipient_id == test_user.id
        assert certificate.recipient_name == f"{test_author.first_name} {test_author.last_name}"
        assert certificate.subscription_date == subscription_date
        assert certificate.certificate_id.startswith('CERT-')
        assert len(certificate.certificate_id) == 22
        assert certificate.download_count == 0
    
    def test_create_event_certificate(self, db: Session, test_user, test_author, test_event, test_admin):
        """Test creating an event certificate."""
        service = CertificateService(db)
        
        certificate = service.create_event_certificate(
            user_id=test_user.id,
            event_id=test_event.id,
            role='author',
            admin_id=test_admin.id
        )
        
        assert certificate is not None
        assert certificate.certificate_type == 'event'
        assert certificate.recipient_id == test_user.id
        assert certificate.event_id == test_event.id
        assert certificate.event_name == test_event.name
        assert certificate.role == 'author'
        assert certificate.created_by == test_admin.id
        assert certificate.certificate_id.startswith('CERT-')
    
    def test_create_event_certificate_duplicate_prevention(
        self, db: Session, test_user, test_author, test_event, test_admin
    ):
        """Test that duplicate event certificates are prevented."""
        from app.middleware.error_handler import BusinessRuleError
        
        service = CertificateService(db)
        
        # Create first certificate
        service.create_event_certificate(
            user_id=test_user.id,
            event_id=test_event.id,
            role='author',
            admin_id=test_admin.id
        )
        
        # Attempt to create duplicate
        with pytest.raises(BusinessRuleError, match="Certificate already exists"):
            service.create_event_certificate(
                user_id=test_user.id,
                event_id=test_event.id,
                role='author',
                admin_id=test_admin.id
            )
    
    def test_bulk_create_event_certificates(
        self, db: Session, test_user, test_user2, test_author, test_event, test_admin
    ):
        """Test bulk certificate creation."""
        service = CertificateService(db)
        
        recipients = [
            BulkCertificateRecipient(recipient_id=test_user.id, role='author'),
            BulkCertificateRecipient(recipient_id=test_user2.id, role='reviewer'),
        ]
        
        result = service.bulk_create_event_certificates(
            event_id=test_event.id,
            recipients=recipients,
            admin_id=test_admin.id
        )
        
        assert result.success_count == 2
        assert result.failure_count == 0
        assert len(result.certificates) == 2
        assert len(result.failures) == 0
    
    def test_bulk_create_with_duplicates_in_request(
        self, db: Session, test_user, test_author, test_event, test_admin
    ):
        """Test bulk creation with duplicate recipients in the same request."""
        service = CertificateService(db)
        
        recipients = [
            BulkCertificateRecipient(recipient_id=test_user.id, role='author'),
            BulkCertificateRecipient(recipient_id=test_user.id, role='author'),  # Duplicate
        ]
        
        result = service.bulk_create_event_certificates(
            event_id=test_event.id,
            recipients=recipients,
            admin_id=test_admin.id
        )
        
        assert result.success_count == 1
        assert result.failure_count == 1
        assert len(result.failures) == 1
        assert 'Duplicate recipient' in result.failures[0]['reason']
    
    def test_bulk_generation_summary_with_partial_success(
        self, db: Session, test_user, test_user2, test_author, test_event, test_admin
    ):
        """
        Test bulk generation summary with mixed success and failures.
        
        Validates Requirement 4.3: Summary includes success count, failure count,
        and list of failures with reasons. Partial success is handled gracefully.
        """
        service = CertificateService(db)
        
        # Create a mix of valid and invalid recipients
        recipients = [
            BulkCertificateRecipient(recipient_id=test_user.id, role='author'),  # Valid
            BulkCertificateRecipient(recipient_id=test_user2.id, role='reviewer'),  # Valid
            BulkCertificateRecipient(recipient_id=test_user.id, role='author'),  # Duplicate
            BulkCertificateRecipient(recipient_id='nonexistent-user-id', role='author'),  # Invalid user
        ]
        
        result = service.bulk_create_event_certificates(
            event_id=test_event.id,
            recipients=recipients,
            admin_id=test_admin.id
        )
        
        # Verify summary accuracy
        assert result.success_count == 2, "Should have 2 successful certificates"
        assert result.failure_count == 2, "Should have 2 failures"
        
        # Verify successful certificates are returned
        assert len(result.certificates) == 2, "Should return 2 certificate objects"
        assert all(cert.certificate_id for cert in result.certificates), "All certificates should have IDs"
        
        # Verify failure details are provided
        assert len(result.failures) == 2, "Should have 2 failure entries"
        
        # Check that failures include recipient_id, role, and reason
        for failure in result.failures:
            assert 'recipient_id' in failure, "Failure should include recipient_id"
            assert 'role' in failure, "Failure should include role"
            assert 'reason' in failure, "Failure should include reason"
            assert len(failure['reason']) > 0, "Reason should not be empty"
        
        # Verify specific failure reasons
        failure_reasons = [f['reason'] for f in result.failures]
        assert any('Duplicate' in reason for reason in failure_reasons), "Should have duplicate error"
        
        # Verify counts match the actual data
        assert result.success_count + result.failure_count == len(recipients), \
            "Total count should match input recipients"
    
    def test_bulk_generation_summary_all_failures(
        self, db: Session, test_event, test_admin
    ):
        """
        Test bulk generation summary when all recipients fail.
        
        Validates Requirement 4.3: Summary accurately reports all failures.
        """
        service = CertificateService(db)
        
        # All invalid recipients
        recipients = [
            BulkCertificateRecipient(recipient_id='invalid-1', role='author'),
            BulkCertificateRecipient(recipient_id='invalid-2', role='reviewer'),
        ]
        
        result = service.bulk_create_event_certificates(
            event_id=test_event.id,
            recipients=recipients,
            admin_id=test_admin.id
        )
        
        # Verify all failed
        assert result.success_count == 0, "Should have 0 successful certificates"
        assert result.failure_count == 2, "Should have 2 failures"
        assert len(result.certificates) == 0, "Should return no certificates"
        assert len(result.failures) == 2, "Should have 2 failure entries"
        
        # Verify each failure has details
        for failure in result.failures:
            assert failure['recipient_id'] in ['invalid-1', 'invalid-2']
            assert failure['role'] in ['author', 'reviewer']
            assert len(failure['reason']) > 0
    
    def test_bulk_generation_summary_empty_list(
        self, db: Session, test_event, test_admin
    ):
        """
        Test bulk generation with empty recipient list.
        
        Validates Requirement 4.3: Summary handles edge case of empty input.
        """
        service = CertificateService(db)
        
        recipients = []
        
        result = service.bulk_create_event_certificates(
            event_id=test_event.id,
            recipients=recipients,
            admin_id=test_admin.id
        )
        
        # Verify empty result
        assert result.success_count == 0
        assert result.failure_count == 0
        assert len(result.certificates) == 0
        assert len(result.failures) == 0
    
    def test_get_user_certificates(self, db: Session, test_user, test_author, test_event, test_admin):
        """Test retrieving all certificates for a user."""
        service = CertificateService(db)
        
        # Create subscription certificate
        service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=datetime.utcnow()
        )
        
        # Create event certificate
        service.create_event_certificate(
            user_id=test_user.id,
            event_id=test_event.id,
            role='author',
            admin_id=test_admin.id
        )
        
        certificates = service.get_user_certificates(test_user.id)
        
        assert len(certificates) == 2
        assert any(c.certificate_type == 'subscription' for c in certificates)
        assert any(c.certificate_type == 'event' for c in certificates)
    
    def test_get_certificate_by_id(self, db: Session, test_user, test_author):
        """Test retrieving a certificate by its ID."""
        service = CertificateService(db)
        
        created_cert = service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=datetime.utcnow()
        )
        
        retrieved_cert = service.get_certificate_by_id(created_cert.certificate_id)
        
        assert retrieved_cert is not None
        assert retrieved_cert.certificate_id == created_cert.certificate_id
        assert retrieved_cert.recipient_id == test_user.id
    
    def test_get_all_certificates_with_filters(
        self, db: Session, test_user, test_user2, test_author, test_event, test_admin
    ):
        """Test retrieving certificates with filters."""
        service = CertificateService(db)
        
        # Create subscription certificate
        service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=datetime.utcnow()
        )
        
        # Create event certificate
        service.create_event_certificate(
            user_id=test_user2.id,
            event_id=test_event.id,
            role='reviewer',
            admin_id=test_admin.id
        )
        
        # Filter by type
        filters = CertificateFilters(certificate_type=CertificateType.SUBSCRIPTION)
        subscription_certs = service.get_all_certificates(filters)
        assert len(subscription_certs) == 1
        assert subscription_certs[0].certificate_type == 'subscription'
        
        # Filter by event
        filters = CertificateFilters(event_id=test_event.id)
        event_certs = service.get_all_certificates(filters)
        assert len(event_certs) == 1
        assert event_certs[0].event_id == test_event.id
        
        # Filter by recipient
        filters = CertificateFilters(recipient_id=test_user.id)
        user_certs = service.get_all_certificates(filters)
        assert len(user_certs) == 1
        assert user_certs[0].recipient_id == test_user.id
    
    def test_verify_certificate_valid(self, db: Session, test_user, test_author):
        """Test verifying a valid certificate."""
        service = CertificateService(db)
        
        certificate = service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=datetime.utcnow()
        )
        
        verification = service.verify_certificate(certificate.certificate_id)
        
        assert verification is not None
        assert verification.certificate_id == certificate.certificate_id
        assert verification.recipient_name == certificate.recipient_name
        assert verification.certificate_type == CertificateType.SUBSCRIPTION
    
    def test_verify_certificate_invalid(self, db: Session):
        """Test verifying an invalid certificate."""
        service = CertificateService(db)
        
        verification = service.verify_certificate('INVALID-CERT-ID')
        
        assert verification is None
    
    def test_verify_certificate_event_type(self, db: Session, test_user, test_author, test_event, test_admin):
        """Test verifying an event certificate returns all event details."""
        service = CertificateService(db)
        
        # Create event certificate
        certificate = service.create_event_certificate(
            user_id=test_user.id,
            event_id=test_event.id,
            role='author',
            admin_id=test_admin.id
        )
        
        # Verify the certificate
        verification = service.verify_certificate(certificate.certificate_id)
        
        assert verification is not None
        assert verification.certificate_id == certificate.certificate_id
        assert verification.recipient_name == certificate.recipient_name
        assert verification.certificate_type == CertificateType.EVENT
        assert verification.event_name == test_event.name
        assert verification.event_date == test_event.event_date
        assert verification.role == 'author'
    
    def test_verify_certificate_logs_audit(self, db: Session, test_user, test_author):
        """Test that certificate verification is logged in audit trail."""
        from app.certificates.models import CertificateAuditLog
        
        service = CertificateService(db)
        
        # Create certificate
        certificate = service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=datetime.utcnow()
        )
        
        # Count audit logs before verification
        initial_count = db.query(CertificateAuditLog).filter(
            CertificateAuditLog.certificate_id == certificate.certificate_id,
            CertificateAuditLog.action == 'verified'
        ).count()
        
        # Verify certificate
        service.verify_certificate(certificate.certificate_id)
        
        # Check audit log was created
        final_count = db.query(CertificateAuditLog).filter(
            CertificateAuditLog.certificate_id == certificate.certificate_id,
            CertificateAuditLog.action == 'verified'
        ).count()
        
        assert final_count == initial_count + 1
        
        # Verify audit log details
        audit_log = db.query(CertificateAuditLog).filter(
            CertificateAuditLog.certificate_id == certificate.certificate_id,
            CertificateAuditLog.action == 'verified'
        ).first()
        
        assert audit_log is not None
        assert audit_log.action == 'verified'
        assert certificate.recipient_name in audit_log.details
    
    def test_increment_download_count(self, db: Session, test_user, test_author):
        """Test incrementing download count."""
        service = CertificateService(db)
        
        certificate = service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=datetime.utcnow()
        )
        
        assert certificate.download_count == 0
        
        service.increment_download_count(certificate.certificate_id, test_user.id)
        
        # Refresh from database
        db.refresh(certificate)
        assert certificate.download_count == 1
        
        service.increment_download_count(certificate.certificate_id, test_user.id)
        db.refresh(certificate)
        assert certificate.download_count == 2
    
    def test_search_certificates(self, db: Session, test_user, test_author):
        """Test searching certificates by certificate ID or recipient name."""
        service = CertificateService(db)
        
        certificate = service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=datetime.utcnow()
        )
        
        # Search by certificate ID
        filters = CertificateFilters(search=certificate.certificate_id[:10])
        results = service.get_all_certificates(filters)
        assert len(results) >= 1
        assert any(c.certificate_id == certificate.certificate_id for c in results)
        
        # Search by recipient name
        filters = CertificateFilters(search=test_author.first_name)
        results = service.get_all_certificates(filters)
        assert len(results) >= 1
        assert any(c.recipient_name.startswith(test_author.first_name) for c in results)
    
    def test_get_certificate_audit_trail(self, db: Session, test_user, test_author):
        """Test retrieving audit trail for a specific certificate."""
        from app.certificates.models import CertificateAuditLog
        
        service = CertificateService(db)
        
        # Create certificate (this logs 'issued')
        certificate = service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=datetime.utcnow()
        )
        
        # Download certificate (this logs 'downloaded')
        service.increment_download_count(certificate.certificate_id, test_user.id)
        
        # Verify certificate (this logs 'verified')
        service.verify_certificate(certificate.certificate_id)
        
        # Get audit trail
        audit_trail = service.get_certificate_audit_trail(certificate.certificate_id)
        
        assert len(audit_trail) == 3
        actions = [log.action for log in audit_trail]
        assert 'issued' in actions
        assert 'downloaded' in actions
        assert 'verified' in actions
        
        # Verify ordering (most recent first)
        assert audit_trail[0].timestamp >= audit_trail[1].timestamp
        assert audit_trail[1].timestamp >= audit_trail[2].timestamp
    
    def test_get_audit_logs_no_filters(self, db: Session, test_user, test_user2, test_author, test_event, test_admin):
        """Test retrieving all audit logs without filters."""
        service = CertificateService(db)
        
        # Create multiple certificates
        cert1 = service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=datetime.utcnow()
        )
        
        cert2 = service.create_event_certificate(
            user_id=test_user2.id,
            event_id=test_event.id,
            role='reviewer',
            admin_id=test_admin.id
        )
        
        # Get all audit logs
        audit_logs = service.get_audit_logs()
        
        assert len(audit_logs) >= 2
        certificate_ids = [log.certificate_id for log in audit_logs]
        assert cert1.certificate_id in certificate_ids
        assert cert2.certificate_id in certificate_ids
    
    def test_get_audit_logs_filter_by_certificate_id(self, db: Session, test_user, test_user2, test_author):
        """Test filtering audit logs by certificate ID."""
        service = CertificateService(db)
        
        # Create two certificates
        cert1 = service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=datetime.utcnow()
        )
        
        cert2 = service.create_subscription_certificate(
            user_id=test_user2.id,
            subscription_date=datetime.utcnow()
        )
        
        # Filter by first certificate ID
        audit_logs = service.get_audit_logs(certificate_id=cert1.certificate_id)
        
        assert len(audit_logs) >= 1
        assert all(log.certificate_id == cert1.certificate_id for log in audit_logs)
    
    def test_get_audit_logs_filter_by_action(self, db: Session, test_user, test_author):
        """Test filtering audit logs by action type."""
        service = CertificateService(db)
        
        # Create certificate and perform multiple actions
        certificate = service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=datetime.utcnow()
        )
        
        service.increment_download_count(certificate.certificate_id, test_user.id)
        service.verify_certificate(certificate.certificate_id)
        
        # Filter by 'downloaded' action
        audit_logs = service.get_audit_logs(action='downloaded')
        
        assert len(audit_logs) >= 1
        assert all(log.action == 'downloaded' for log in audit_logs)
    
    def test_get_audit_logs_filter_by_user_id(self, db: Session, test_user, test_user2, test_author, test_event, test_admin):
        """Test filtering audit logs by user ID."""
        service = CertificateService(db)
        
        # Create certificates with different users
        cert1 = service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=datetime.utcnow()
        )
        
        cert2 = service.create_event_certificate(
            user_id=test_user2.id,
            event_id=test_event.id,
            role='reviewer',
            admin_id=test_admin.id
        )
        
        # Filter by admin user ID
        audit_logs = service.get_audit_logs(user_id=test_admin.id)
        
        assert len(audit_logs) >= 1
        assert all(log.user_id == test_admin.id for log in audit_logs)
    
    def test_get_audit_logs_filter_by_date_range(self, db: Session, test_user, test_author):
        """Test filtering audit logs by date range."""
        service = CertificateService(db)
        
        # Create certificate
        certificate = service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=datetime.utcnow()
        )
        
        # Define date range
        date_from = datetime.utcnow() - timedelta(hours=1)
        date_to = datetime.utcnow() + timedelta(hours=1)
        
        # Filter by date range
        audit_logs = service.get_audit_logs(date_from=date_from, date_to=date_to)
        
        assert len(audit_logs) >= 1
        assert all(date_from <= log.timestamp <= date_to for log in audit_logs)
    
    def test_get_audit_logs_multiple_filters(self, db: Session, test_user, test_author):
        """Test filtering audit logs with multiple criteria."""
        service = CertificateService(db)
        
        # Create certificate
        certificate = service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=datetime.utcnow()
        )
        
        service.increment_download_count(certificate.certificate_id, test_user.id)
        
        # Filter by certificate ID and action
        audit_logs = service.get_audit_logs(
            certificate_id=certificate.certificate_id,
            action='downloaded'
        )
        
        assert len(audit_logs) >= 1
        assert all(
            log.certificate_id == certificate.certificate_id and log.action == 'downloaded'
            for log in audit_logs
        )
    
    def test_log_certificate_issued(self, db: Session, test_user, test_author):
        """Test explicit certificate issuance logging."""
        from app.certificates.models import CertificateAuditLog
        
        service = CertificateService(db)
        
        # Create a certificate to get a valid certificate ID
        certificate = service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=datetime.utcnow()
        )
        
        # Log issuance explicitly with IP address
        service.log_certificate_issued(
            certificate_id=certificate.certificate_id,
            recipient_id=test_user.id,
            admin_id=None,
            ip_address='192.168.1.1'
        )
        
        # Verify log was created
        audit_logs = db.query(CertificateAuditLog).filter(
            CertificateAuditLog.certificate_id == certificate.certificate_id,
            CertificateAuditLog.action == 'issued',
            CertificateAuditLog.ip_address == '192.168.1.1'
        ).all()
        
        assert len(audit_logs) >= 1
        assert any(log.ip_address == '192.168.1.1' for log in audit_logs)
    
    def test_log_certificate_downloaded(self, db: Session, test_user, test_author):
        """Test explicit certificate download logging."""
        from app.certificates.models import CertificateAuditLog
        
        service = CertificateService(db)
        
        # Create certificate
        certificate = service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=datetime.utcnow()
        )
        
        # Log download explicitly with IP address
        service.log_certificate_downloaded(
            certificate_id=certificate.certificate_id,
            user_id=test_user.id,
            ip_address='10.0.0.1'
        )
        
        # Verify log was created
        audit_log = db.query(CertificateAuditLog).filter(
            CertificateAuditLog.certificate_id == certificate.certificate_id,
            CertificateAuditLog.action == 'downloaded',
            CertificateAuditLog.ip_address == '10.0.0.1'
        ).first()
        
        assert audit_log is not None
        assert audit_log.user_id == test_user.id
        assert audit_log.ip_address == '10.0.0.1'
    
    def test_log_certificate_verified(self, db: Session, test_user, test_author):
        """Test explicit certificate verification logging."""
        from app.certificates.models import CertificateAuditLog
        
        service = CertificateService(db)
        
        # Create certificate
        certificate = service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=datetime.utcnow()
        )
        
        # Log verification explicitly with IP address
        service.log_certificate_verified(
            certificate_id=certificate.certificate_id,
            ip_address='172.16.0.1'
        )
        
        # Verify log was created
        audit_logs = db.query(CertificateAuditLog).filter(
            CertificateAuditLog.certificate_id == certificate.certificate_id,
            CertificateAuditLog.action == 'verified',
            CertificateAuditLog.ip_address == '172.16.0.1'
        ).all()
        
        assert len(audit_logs) >= 1
        assert any(log.ip_address == '172.16.0.1' for log in audit_logs)
    
    def test_log_bulk_generation(self, db: Session, test_event, test_admin):
        """Test bulk generation logging."""
        from app.certificates.models import CertificateAuditLog
        
        service = CertificateService(db)
        
        # Log bulk generation
        service.log_bulk_generation(
            event_id=test_event.id,
            count=10,
            admin_id=test_admin.id,
            ip_address='192.168.1.100'
        )
        
        # Verify log was created
        audit_log = db.query(CertificateAuditLog).filter(
            CertificateAuditLog.certificate_id == 'BULK',
            CertificateAuditLog.action == 'bulk_issued',
            CertificateAuditLog.user_id == test_admin.id
        ).first()
        
        assert audit_log is not None
        assert audit_log.ip_address == '192.168.1.100'
        assert '10' in audit_log.details
        assert str(test_event.id) in audit_log.details
    
    def test_audit_trail_ordering(self, db: Session, test_user, test_author):
        """Test that audit trail is ordered by timestamp descending."""
        service = CertificateService(db)
        
        # Create certificate and perform multiple actions
        certificate = service.create_subscription_certificate(
            user_id=test_user.id,
            subscription_date=datetime.utcnow()
        )
        
        # Perform actions with slight delays
        service.increment_download_count(certificate.certificate_id, test_user.id)
        service.increment_download_count(certificate.certificate_id, test_user.id)
        service.verify_certificate(certificate.certificate_id)
        
        # Get audit trail
        audit_trail = service.get_certificate_audit_trail(certificate.certificate_id)
        
        # Verify ordering (most recent first)
        for i in range(len(audit_trail) - 1):
            assert audit_trail[i].timestamp >= audit_trail[i + 1].timestamp


# Fixtures for testing
@pytest.fixture
def test_user(db: Session):
    """Create a test user."""
    role = db.query(Role).filter(Role.name == "author").first()
    if not role:
        role = Role(name="author", permissions={})
        db.add(role)
        db.commit()
    
    user = User(
        email="testuser@example.com",
        password_hash="hashed_password",
        role_id=role.id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_user2(db: Session):
    """Create a second test user."""
    role = db.query(Role).filter(Role.name == "reviewer").first()
    if not role:
        role = Role(name="reviewer", permissions={})
        db.add(role)
        db.commit()
    
    user = User(
        email="testuser2@example.com",
        password_hash="hashed_password",
        role_id=role.id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create reviewer profile
    reviewer = Reviewer(
        user_id=user.id,
        first_name="Jane",
        last_name="Smith",
        affiliation="Test University",
        expertise=["AI", "ML"]
    )
    db.add(reviewer)
    db.commit()
    
    return user


@pytest.fixture
def test_author(db: Session, test_user):
    """Create a test author profile."""
    author = Author(
        user_id=test_user.id,
        first_name="John",
        last_name="Doe",
        affiliation="Test University",
        orcid="0000-0001-2345-6789"
    )
    db.add(author)
    db.commit()
    db.refresh(author)
    return author


@pytest.fixture
def test_admin(db: Session):
    """Create a test admin user."""
    role = db.query(Role).filter(Role.name == "admin").first()
    if not role:
        role = Role(name="admin", permissions={})
        db.add(role)
        db.commit()
    
    admin = User(
        email="admin@example.com",
        password_hash="hashed_password",
        role_id=role.id,
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@pytest.fixture
def test_event(db: Session, test_admin):
    """Create a test event."""
    event = Event(
        name="Test Conference 2024",
        event_date=datetime.utcnow() - timedelta(days=30),
        event_type="conference",
        description="A test conference",
        created_by=test_admin.id
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
