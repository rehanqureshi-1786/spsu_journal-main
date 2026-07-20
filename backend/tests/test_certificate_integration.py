"""
Integration tests for Certificate Generation System.

This module tests complete end-to-end workflows for the certificate system:
- Subscription certificate flow (signup â†’ certificate generation â†’ download)
- Event certificate flow (create event â†’ issue certificate â†’ download)
- Bulk certificate generation with various recipient lists
- Certificate verification with valid and invalid IDs
- Admin certificate management (view all, filter, search)
- Audit logging for all certificate operations

Task 20: Final checkpoint - Integration testing
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import io

from app.main import app
from app.core.security import hash_password
from app.users.models import User, Role
from app.authors.models import Author
from app.reviewers.models import Reviewer
from app.events.models import Event
from app.certificates.models import Certificate, CertificateAuditLog
from tests.conftest import TestingSessionLocal


client = TestClient(app)


@pytest.fixture
def test_roles():
    """Create test roles."""
    db = TestingSessionLocal()
    
    admin_role = Role(name="admin", permissions={})
    author_role = Role(name="author", permissions={})
    reviewer_role = Role(name="reviewer", permissions={})
    
    db.add_all([admin_role, author_role, reviewer_role])
    db.commit()
    
    roles = {
        "admin": admin_role.id,
        "author": author_role.id,
        "reviewer": reviewer_role.id
    }
    
    db.close()
    return roles


@pytest.fixture
def admin_user(test_roles):
    """Create admin user for testing."""
    db = TestingSessionLocal()
    
    user = User(
        email="admin@test.com",
        password_hash=hash_password("admin123"),
        role_id=test_roles["admin"],
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    user_id = user.id
    db.close()
    return user_id


@pytest.fixture
def author_user(test_roles):
    """Create author user for testing."""
    db = TestingSessionLocal()
    
    user = User(
        email="author@test.com",
        password_hash=hash_password("author123"),
        role_id=test_roles["author"],
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create author profile
    author = Author(
        user_id=user.id,
        first_name="Author",
        last_name="User",
        affiliation="Test University",
        bio="Test bio"
    )
    db.add(author)
    db.commit()
    
    user_id = user.id
    db.close()
    return user_id


@pytest.fixture
def reviewer_user(test_roles):
    """Create reviewer user for testing."""
    db = TestingSessionLocal()
    
    user = User(
        email="reviewer@test.com",
        password_hash=hash_password("reviewer123"),
        role_id=test_roles["reviewer"],
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create reviewer profile
    reviewer = Reviewer(
        user_id=user.id,
        first_name="Reviewer",
        last_name="User",
        expertise=["AI", "ML"],
        affiliation="Test Institute"
    )
    db.add(reviewer)
    db.commit()
    
    user_id = user.id
    db.close()
    return user_id


@pytest.fixture
def admin_token(admin_user):
    """Get admin authentication cookies."""
    response = client.post(
        "/auth/login",
        json={"email": "admin@test.com", "password": "admin123"}
    )
    assert response.status_code == 200
    return response.cookies


@pytest.fixture
def author_token(author_user):
    """Get author authentication cookies."""
    response = client.post(
        "/auth/login",
        json={"email": "author@test.com", "password": "author123"}
    )
    assert response.status_code == 200
    return response.cookies


@pytest.fixture
def reviewer_token(reviewer_user):
    """Get reviewer authentication cookies."""
    response = client.post(
        "/auth/login",
        json={"email": "reviewer@test.com", "password": "reviewer123"}
    )
    assert response.status_code == 200
    return response.cookies


def test_subscription_certificate_flow(author_user, author_token):
    """
    Test complete subscription certificate flow:
    1. Create subscription certificate
    2. Verify certificate appears in user's certificates
    3. Download certificate PDF
    4. Verify audit log entries
    """
    # Step 1: Create subscription certificate
    response = client.post(
        "/certificates/subscription",
        cookies=author_token,
        json={"subscription_date": datetime.now().isoformat()}
    )
    assert response.status_code == 201
    cert_data = response.json()
    assert cert_data["certificate_type"] == "subscription"
    assert cert_data["recipient_id"] == author_user
    assert "certificate_id" in cert_data
    certificate_id = cert_data["certificate_id"]
    
    # Step 2: Verify certificate appears in user's certificates
    response = client.get(
        "/certificates/me",
        cookies=author_token
    )
    assert response.status_code == 200
    certificates = response.json()
    assert len(certificates) >= 1
    assert any(c["certificate_id"] == certificate_id for c in certificates)
    
    # Step 3: Download certificate PDF
    response = client.get(
        f"/certificates/{certificate_id}/download",
        cookies=author_token
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 0
    assert len(response.content) < 2 * 1024 * 1024  # Under 2MB
    
    # Step 4: Verify audit log entries
    db = TestingSessionLocal()
    audit_logs = db.query(CertificateAuditLog).filter(
        CertificateAuditLog.certificate_id == certificate_id
    ).all()
    
    # Should have issuance and download logs
    actions = [log.action for log in audit_logs]
    assert "issued" in actions
    assert "downloaded" in actions
    
    db.close()


def test_event_certificate_flow(admin_user, admin_token, author_user):
    """
    Test complete event certificate flow:
    1. Create event
    2. Issue event certificate to participant
    3. Verify certificate appears in participant's certificates
    4. Download certificate PDF
    5. Verify audit log entries
    """
    # Step 1: Create event
    event_data = {
        "name": "Test Conference 2024",
        "event_date": (datetime.now() - timedelta(days=30)).isoformat(),
        "event_type": "conference",
        "description": "Annual test conference"
    }
    response = client.post(
        "/events",
        cookies=admin_token,
        json=event_data
    )
    assert response.status_code == 201
    event = response.json()
    event_id = event["id"]
    
    # Step 2: Issue event certificate
    response = client.post(
        f"/certificates/events/{event_id}/issue",
        cookies=admin_token,
        json={"recipient_id": author_user, "role": "author"}
    )
    assert response.status_code == 201
    cert_data = response.json()
    assert cert_data["certificate_type"] == "event"
    assert cert_data["event_id"] == event_id
    assert cert_data["role"] == "author"
    certificate_id = cert_data["certificate_id"]
    
    # Step 3: Verify certificate in database
    db = TestingSessionLocal()
    certificate = db.query(Certificate).filter(
        Certificate.certificate_id == certificate_id
    ).first()
    assert certificate is not None
    assert certificate.recipient_id == author_user
    assert certificate.event_name == "Test Conference 2024"
    db.close()
    
    # Step 4: Download certificate PDF
    response = client.get(
        f"/certificates/{certificate_id}/download",
        cookies=admin_token
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 0
    
    # Step 5: Verify audit log entries
    db = TestingSessionLocal()
    audit_logs = db.query(CertificateAuditLog).filter(
        CertificateAuditLog.certificate_id == certificate_id
    ).all()
    
    actions = [log.action for log in audit_logs]
    assert "issued" in actions
    assert "downloaded" in actions
    
    db.close()


def test_bulk_certificate_generation(admin_user, admin_token, author_user, reviewer_user):
    """
    Test bulk certificate generation with various recipient lists:
    1. Create event
    2. Bulk issue certificates to multiple recipients
    3. Verify all certificates created
    4. Test duplicate prevention
    5. Test partial failure handling
    """
    # Step 1: Create event
    event_data = {
        "name": "Workshop 2024",
        "event_date": datetime.now().isoformat(),
        "event_type": "workshop",
        "description": "Test workshop"
    }
    response = client.post(
        "/events",
        cookies=admin_token,
        json=event_data
    )
    assert response.status_code == 200
    event_id = response.json()["id"]
    
    # Step 2: Bulk issue certificates
    recipients = [
        {"recipient_id": author_user, "role": "author"},
        {"recipient_id": reviewer_user, "role": "reviewer"}
    ]
    response = client.post(
        f"/certificates/events/{event_id}/bulk-issue",
        cookies=admin_token,
        json={"recipients": recipients}
    )
    assert response.status_code == 200
    result = response.json()
    assert result["success_count"] == 2
    assert result["failure_count"] == 0
    assert len(result["certificates"]) == 2
    
    # Step 3: Verify all certificates created
    db = TestingSessionLocal()
    certificates = db.query(Certificate).filter(
        Certificate.event_id == event_id
    ).all()
    assert len(certificates) == 2
    
    recipient_ids = [c.recipient_id for c in certificates]
    assert author_user in recipient_ids
    assert reviewer_user in recipient_ids
    
    # Step 4: Test duplicate prevention
    response = client.post(
        f"/certificates/events/{event_id}/bulk-issue",
        cookies=admin_token,
        json={"recipients": recipients}
    )
    assert response.status_code == 200
    result = response.json()
    # Should not create duplicates
    assert result["success_count"] == 0
    assert result["failure_count"] == 2
    
    # Verify still only 2 certificates
    certificates = db.query(Certificate).filter(
        Certificate.event_id == event_id
    ).all()
    assert len(certificates) == 2
    
    # Step 5: Test partial failure handling (invalid recipient)
    recipients_with_invalid = [
        {"recipient_id": 99999, "role": "author"},  # Invalid user
        {"recipient_id": author_user, "role": "reviewer"}  # Valid but duplicate
    ]
    response = client.post(
        f"/certificates/events/{event_id}/bulk-issue",
        cookies=admin_token,
        json={"recipients": recipients_with_invalid}
    )
    assert response.status_code == 200
    result = response.json()
    assert result["failure_count"] == 2
    assert len(result["failures"]) == 2
    
    db.close()


def test_certificate_verification(admin_user, admin_token, author_user):
    """
    Test certificate verification with valid and invalid IDs:
    1. Create certificate
    2. Verify with valid certificate ID
    3. Verify with invalid certificate ID
    4. Verify audit logging for verification attempts
    """
    # Step 1: Create certificate
    response = client.post(
        "/events",
        cookies=admin_token,
        json={
            "name": "Verification Test Event",
            "event_date": datetime.now().isoformat(),
            "event_type": "seminar",
            "description": "Test"
        }
    )
    event_id = response.json()["id"]
    
    response = client.post(
        f"/certificates/events/{event_id}/issue",
        cookies=admin_token,
        json={"recipient_id": author_user, "role": "author"}
    )
    certificate_id = response.json()["certificate_id"]
    
    # Step 2: Verify with valid certificate ID (public endpoint, no auth)
    response = client.get(f"/certificates/verify/{certificate_id}")
    assert response.status_code == 200
    verification = response.json()
    assert verification["valid"] is True
    assert verification["certificate_id"] == certificate_id
    assert verification["certificate_type"] == "event"
    assert "recipient_name" in verification
    assert "issued_date" in verification
    assert verification["event_name"] == "Verification Test Event"
    
    # Step 3: Verify with invalid certificate ID
    invalid_id = "CERT-INVALID-123456"
    response = client.get(f"/certificates/verify/{invalid_id}")
    assert response.status_code == 200
    verification = response.json()
    assert verification["valid"] is False
    assert "message" in verification
    
    # Step 4: Verify audit logging
    db = TestingSessionLocal()
    
    # Valid verification should be logged
    valid_log = db.query(CertificateAuditLog).filter(
        CertificateAuditLog.certificate_id == certificate_id,
        CertificateAuditLog.action == "verified"
    ).first()
    assert valid_log is not None
    
    # Invalid verification should also be logged
    invalid_log = db.query(CertificateAuditLog).filter(
        CertificateAuditLog.certificate_id == invalid_id,
        CertificateAuditLog.action == "verified"
    ).first()
    assert invalid_log is not None
    
    db.close()


def test_admin_certificate_management(admin_user, admin_token, author_user, reviewer_user):
    """
    Test admin certificate management:
    1. Create multiple certificates of different types
    2. View all certificates
    3. Filter by certificate type
    4. Filter by event
    5. Search by certificate ID
    6. Search by recipient name
    """
    # Step 1: Create multiple certificates
    
    # Subscription certificate for author
    response = client.post(
        "/certificates/subscription",
        cookies=admin_token,
        json={"subscription_date": datetime.now().isoformat()}
    )
    subscription_cert_id = response.json()["certificate_id"]
    
    # Create two events
    event1_response = client.post(
        "/events",
        cookies=admin_token,
        json={
            "name": "Event Alpha",
            "event_date": datetime.now().isoformat(),
            "event_type": "conference",
            "description": "First event"
        }
    )
    event1_id = event1_response.json()["id"]
    
    event2_response = client.post(
        "/events",
        cookies=admin_token,
        json={
            "name": "Event Beta",
            "event_date": datetime.now().isoformat(),
            "event_type": "workshop",
            "description": "Second event"
        }
    )
    event2_id = event2_response.json()["id"]
    
    # Event certificates
    response = client.post(
        f"/certificates/events/{event1_id}/issue",
        cookies=admin_token,
        json={"recipient_id": author_user, "role": "author"}
    )
    event1_cert_id = response.json()["certificate_id"]
    
    response = client.post(
        f"/certificates/events/{event2_id}/issue",
        cookies=admin_token,
        json={"recipient_id": reviewer_user, "role": "reviewer"}
    )
    event2_cert_id = response.json()["certificate_id"]
    
    # Step 2: View all certificates
    response = client.get(
        "/api/certificates",
        cookies=admin_token
    )
    assert response.status_code == 200
    all_certs = response.json()
    assert len(all_certs) >= 3
    
    # Step 3: Filter by certificate type
    response = client.get(
        "/api/certificates?certificate_type=subscription",
        cookies=admin_token
    )
    assert response.status_code == 200
    subscription_certs = response.json()
    assert all(c["certificate_type"] == "subscription" for c in subscription_certs)
    assert any(c["certificate_id"] == subscription_cert_id for c in subscription_certs)
    
    response = client.get(
        "/api/certificates?certificate_type=event",
        cookies=admin_token
    )
    assert response.status_code == 200
    event_certs = response.json()
    assert all(c["certificate_type"] == "event" for c in event_certs)
    
    # Step 4: Filter by event
    response = client.get(
        f"/api/certificates?event_id={event1_id}",
        cookies=admin_token
    )
    assert response.status_code == 200
    event1_certs = response.json()
    assert all(c["event_id"] == event1_id for c in event1_certs)
    assert any(c["certificate_id"] == event1_cert_id for c in event1_certs)
    
    # Step 5: Search by certificate ID
    response = client.get(
        f"/api/certificates?search={event2_cert_id}",
        cookies=admin_token
    )
    assert response.status_code == 200
    search_results = response.json()
    assert len(search_results) >= 1
    assert any(c["certificate_id"] == event2_cert_id for c in search_results)
    
    # Step 6: Search by recipient name
    response = client.get(
        "/api/certificates?search=Author User",
        cookies=admin_token
    )
    assert response.status_code == 200
    search_results = response.json()
    assert len(search_results) >= 1
    assert all("Author User" in c["recipient_name"] for c in search_results)


def test_audit_logging_comprehensive(admin_user, admin_token, author_user):
    """
    Test comprehensive audit logging for all certificate operations:
    1. Certificate issuance
    2. Certificate download
    3. Certificate verification
    4. Bulk generation
    """
    db = TestingSessionLocal()
    
    # Step 1: Test issuance audit logging
    response = client.post(
        "/certificates/subscription",
        cookies=admin_token,
        json={"subscription_date": datetime.now().isoformat()}
    )
    cert_id = response.json()["certificate_id"]
    
    issuance_log = db.query(CertificateAuditLog).filter(
        CertificateAuditLog.certificate_id == cert_id,
        CertificateAuditLog.action == "issued"
    ).first()
    assert issuance_log is not None
    assert issuance_log.user_id == admin_user
    assert issuance_log.timestamp is not None
    
    # Step 2: Test download audit logging
    response = client.get(
        f"/certificates/{cert_id}/download",
        cookies=admin_token
    )
    assert response.status_code == 200
    
    download_log = db.query(CertificateAuditLog).filter(
        CertificateAuditLog.certificate_id == cert_id,
        CertificateAuditLog.action == "downloaded"
    ).first()
    assert download_log is not None
    assert download_log.user_id == admin_user
    
    # Step 3: Test verification audit logging
    response = client.get(f"/certificates/verify/{cert_id}")
    assert response.status_code == 200
    
    verification_log = db.query(CertificateAuditLog).filter(
        CertificateAuditLog.certificate_id == cert_id,
        CertificateAuditLog.action == "verified"
    ).first()
    assert verification_log is not None
    
    # Step 4: Test bulk generation audit logging
    event_response = client.post(
        "/events",
        cookies=admin_token,
        json={
            "name": "Bulk Test Event",
            "event_date": datetime.now().isoformat(),
            "event_type": "conference",
            "description": "Test"
        }
    )
    event_id = event_response.json()["id"]
    
    recipients = [{"recipient_id": author_user, "role": "author"}]
    response = client.post(
        f"/certificates/events/{event_id}/bulk-issue",
        cookies=admin_token,
        json={"recipients": recipients}
    )
    assert response.status_code == 200
    
    bulk_log = db.query(CertificateAuditLog).filter(
        CertificateAuditLog.action == "bulk_issued"
    ).first()
    assert bulk_log is not None
    assert bulk_log.user_id == admin_user
    
    db.close()


def test_multiple_downloads_idempotent(admin_user, admin_token):
    """
    Test that certificates can be downloaded multiple times and download count is tracked.
    """
    # Create certificate
    response = client.post(
        "/certificates/subscription",
        cookies=admin_token,
        json={"subscription_date": datetime.now().isoformat()}
    )
    cert_id = response.json()["certificate_id"]
    
    # Download multiple times
    for i in range(3):
        response = client.get(
            f"/certificates/{cert_id}/download",
            cookies=admin_token
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert len(response.content) > 0
    
    # Verify download count
    db = TestingSessionLocal()
    certificate = db.query(Certificate).filter(
        Certificate.certificate_id == cert_id
    ).first()
    assert certificate.download_count == 3
    
    # Verify audit logs
    download_logs = db.query(CertificateAuditLog).filter(
        CertificateAuditLog.certificate_id == cert_id,
        CertificateAuditLog.action == "downloaded"
    ).all()
    assert len(download_logs) == 3
    
    db.close()



