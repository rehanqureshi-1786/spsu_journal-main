"""
Tests for certificate management endpoints.

This module tests the certificate API endpoints including:
- Subscription certificate creation
- Event certificate issuance (single and bulk)
- Certificate retrieval and filtering
- Certificate download
- Certificate verification (public endpoint)
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

from app.main import app
from app.core.security import hash_password
from app.users.models import User, Role
from app.authors.models import Author
from app.reviewers.models import Reviewer
from app.events.models import Event
from app.certificates.models import Certificate
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
def test_admin(test_roles):
    """Create a test admin user."""
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
    
    result = {
        "user_id": user.id,
        "email": user.email,
        "password": "admin123"
    }
    
    db.close()
    return result


@pytest.fixture
def test_author(test_roles):
    """Create a test author user."""
    db = TestingSessionLocal()
    
    user = User(
        email="author@test.com",
        password_hash=hash_password("password123"),
        role_id=test_roles["author"],
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    author = Author(
        user_id=user.id,
        first_name="Test",
        last_name="Author",
        affiliation="Test University",
        orcid="0000-0000-0000-0001"
    )
    db.add(author)
    db.commit()
    db.refresh(author)
    
    result = {
        "user_id": user.id,
        "author_id": author.id,
        "email": user.email,
        "password": "password123",
        "full_name": "Test Author"
    }
    
    db.close()
    return result


@pytest.fixture
def test_reviewer(test_roles):
    """Create a test reviewer user."""
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
    
    reviewer = Reviewer(
        user_id=user.id,
        first_name="Test",
        last_name="Reviewer",
        affiliation="Test University",
        expertise=["AI", "ML"]
    )
    db.add(reviewer)
    db.commit()
    db.refresh(reviewer)
    
    result = {
        "user_id": user.id,
        "reviewer_id": reviewer.id,
        "email": user.email,
        "password": "reviewer123",
        "full_name": "Test Reviewer"
    }
    
    db.close()
    return result


@pytest.fixture
def test_event(test_admin):
    """Create a test event."""
    db = TestingSessionLocal()
    
    event = Event(
        name="Test Conference 2024",
        event_date=datetime.utcnow() - timedelta(days=30),
        event_type="conference",
        description="Test conference for certificate testing",
        created_by=test_admin["user_id"]
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    result = {
        "event_id": event.id,
        "name": event.name,
        "event_date": event.event_date
    }
    
    db.close()
    return result


def login_user(email: str, password: str):
    """Helper function to login and get access token."""
    response = client.post(
        "/auth/login",
        json={"email": email, "password": password}
    )
    assert response.status_code == 200
    # Access token is set in HttpOnly cookie
    return response.cookies


class TestSubscriptionCertificates:
    """Tests for subscription certificate endpoints."""
    
    def test_create_subscription_certificate_success(self, test_author):
        """Test successful subscription certificate creation."""
        cookies = login_user(test_author["email"], test_author["password"])
        
        subscription_date = datetime.utcnow() - timedelta(days=7)
        response = client.post(
            "/certificates/subscription",
            json={"subscription_date": subscription_date.isoformat()},
            cookies=cookies
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["certificate_type"] == "subscription"
        assert data["recipient_id"] == test_author["user_id"]
        assert data["recipient_name"] == test_author["full_name"]
        assert "certificate_id" in data
        assert data["certificate_id"].startswith("CERT-")
    
    def test_create_subscription_certificate_unauthenticated(self):
        """Test subscription certificate creation without authentication."""
        subscription_date = datetime.utcnow()
        response = client.post(
            "/certificates/subscription",
            json={"subscription_date": subscription_date.isoformat()}
        )
        
        assert response.status_code == 401


class TestEventCertificates:
    """Tests for event certificate endpoints."""
    
    def test_issue_event_certificate_success(self, test_admin, test_author, test_event):
        """Test successful event certificate issuance."""
        cookies = login_user(test_admin["email"], test_admin["password"])
        
        response = client.post(
            f"/certificates/events/{test_event['event_id']}/issue",
            json={
                "recipient_id": test_author["user_id"],
                "role": "author"
            },
            cookies=cookies
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["certificate_type"] == "event"
        assert data["recipient_id"] == test_author["user_id"]
        assert data["event_id"] == test_event["event_id"]
        assert data["event_name"] == test_event["name"]
        assert data["role"] == "author"
        assert "certificate_id" in data
    
    def test_issue_event_certificate_non_admin(self, test_author, test_event):
        """Test event certificate issuance by non-admin user."""
        cookies = login_user(test_author["email"], test_author["password"])
        
        response = client.post(
            f"/certificates/events/{test_event['event_id']}/issue",
            json={
                "recipient_id": test_author["user_id"],
                "role": "author"
            },
            cookies=cookies
        )
        
        assert response.status_code == 403
    
    def test_issue_event_certificate_invalid_event(self, test_admin, test_author):
        """Test event certificate issuance with invalid event ID."""
        cookies = login_user(test_admin["email"], test_admin["password"])
        
        response = client.post(
            "/certificates/events/99999/issue",
            json={
                "recipient_id": test_author["user_id"],
                "role": "author"
            },
            cookies=cookies
        )
        
        assert response.status_code == 400
    
    def test_issue_duplicate_event_certificate(self, test_admin, test_author, test_event):
        """Test issuing duplicate event certificate."""
        cookies = login_user(test_admin["email"], test_admin["password"])
        
        # Issue first certificate
        response1 = client.post(
            f"/certificates/events/{test_event['event_id']}/issue",
            json={
                "recipient_id": test_author["user_id"],
                "role": "author"
            },
            cookies=cookies
        )
        assert response1.status_code == 201
        
        # Try to issue duplicate
        response2 = client.post(
            f"/certificates/events/{test_event['event_id']}/issue",
            json={
                "recipient_id": test_author["user_id"],
                "role": "author"
            },
            cookies=cookies
        )
        assert response2.status_code == 400
        assert "already exists" in response2.json()["detail"].lower()


class TestBulkCertificates:
    """Tests for bulk certificate issuance."""
    
    def test_bulk_issue_certificates_success(self, test_admin, test_author, test_reviewer, test_event):
        """Test successful bulk certificate issuance."""
        cookies = login_user(test_admin["email"], test_admin["password"])
        
        response = client.post(
            f"/certificates/events/{test_event['event_id']}/bulk-issue",
            json={
                "recipients": [
                    {"recipient_id": test_author["user_id"], "role": "author"},
                    {"recipient_id": test_reviewer["user_id"], "role": "reviewer"}
                ]
            },
            cookies=cookies
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success_count"] == 2
        assert data["failure_count"] == 0
        assert len(data["certificates"]) == 2
    
    def test_bulk_issue_with_duplicates(self, test_admin, test_author, test_event):
        """Test bulk issuance with duplicate recipients in request."""
        cookies = login_user(test_admin["email"], test_admin["password"])
        
        response = client.post(
            f"/certificates/events/{test_event['event_id']}/bulk-issue",
            json={
                "recipients": [
                    {"recipient_id": test_author["user_id"], "role": "author"},
                    {"recipient_id": test_author["user_id"], "role": "author"}  # Duplicate
                ]
            },
            cookies=cookies
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success_count"] == 1
        assert data["failure_count"] == 1
        assert "duplicate" in data["failures"][0]["reason"].lower()
    
    def test_bulk_issue_summary_with_partial_success(self, test_admin, test_author, test_reviewer, test_event):
        """
        Test bulk issuance returns detailed summary with partial success.
        
        Validates Requirement 4.3: Summary includes success count, failure count,
        and list of failures with reasons. Partial success is handled gracefully.
        """
        cookies = login_user(test_admin["email"], test_admin["password"])
        
        response = client.post(
            f"/certificates/events/{test_event['event_id']}/bulk-issue",
            json={
                "recipients": [
                    {"recipient_id": test_author["user_id"], "role": "author"},  # Valid
                    {"recipient_id": test_reviewer["user_id"], "role": "reviewer"},  # Valid
                    {"recipient_id": test_author["user_id"], "role": "author"},  # Duplicate
                    {"recipient_id": "nonexistent-user-id", "role": "author"}  # Invalid
                ]
            },
            cookies=cookies
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify summary structure
        assert "success_count" in data, "Response should include success_count"
        assert "failure_count" in data, "Response should include failure_count"
        assert "failures" in data, "Response should include failures list"
        assert "certificates" in data, "Response should include certificates list"
        
        # Verify counts
        assert data["success_count"] == 2, "Should have 2 successful certificates"
        assert data["failure_count"] == 2, "Should have 2 failures"
        
        # Verify successful certificates are returned
        assert len(data["certificates"]) == 2, "Should return 2 certificate objects"
        for cert in data["certificates"]:
            assert "certificate_id" in cert, "Certificate should have certificate_id"
            assert "recipient_name" in cert, "Certificate should have recipient_name"
            assert "event_name" in cert, "Certificate should have event_name"
        
        # Verify failure details
        assert len(data["failures"]) == 2, "Should have 2 failure entries"
        for failure in data["failures"]:
            assert "recipient_id" in failure, "Failure should include recipient_id"
            assert "role" in failure, "Failure should include role"
            assert "reason" in failure, "Failure should include reason"
            assert len(failure["reason"]) > 0, "Reason should not be empty"
        
        # Verify total count matches
        assert data["success_count"] + data["failure_count"] == 4, \
            "Total count should match input recipients"
    
    def test_bulk_issue_non_admin(self, test_author, test_event):
        """Test bulk issuance by non-admin user."""
        cookies = login_user(test_author["email"], test_author["password"])
        
        response = client.post(
            f"/certificates/events/{test_event['event_id']}/bulk-issue",
            json={
                "recipients": [
                    {"recipient_id": test_author["user_id"], "role": "author"}
                ]
            },
            cookies=cookies
        )
        
        assert response.status_code == 403


class TestCertificateRetrieval:
    """Tests for certificate retrieval endpoints."""
    
    def test_get_my_certificates(self, test_author):
        """Test retrieving user's own certificates."""
        cookies = login_user(test_author["email"], test_author["password"])
        
        # Create a subscription certificate first
        subscription_date = datetime.utcnow()
        client.post(
            "/certificates/subscription",
            json={"subscription_date": subscription_date.isoformat()},
            cookies=cookies
        )
        
        # Get user's certificates
        response = client.get("/certificates/me", cookies=cookies)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["recipient_id"] == test_author["user_id"]
    
    def test_get_certificate_details_own(self, test_author):
        """Test getting details of own certificate."""
        cookies = login_user(test_author["email"], test_author["password"])
        
        # Create a certificate
        subscription_date = datetime.utcnow()
        create_response = client.post(
            "/certificates/subscription",
            json={"subscription_date": subscription_date.isoformat()},
            cookies=cookies
        )
        certificate_id = create_response.json()["certificate_id"]
        
        # Get certificate details
        response = client.get(f"/certificates/{certificate_id}", cookies=cookies)
        
        assert response.status_code == 200
        data = response.json()
        assert data["certificate_id"] == certificate_id
        assert data["recipient_id"] == test_author["user_id"]
    
    def test_get_certificate_details_other_user(self, test_author, test_reviewer):
        """Test getting details of another user's certificate (should fail)."""
        # Create certificate for author
        author_cookies = login_user(test_author["email"], test_author["password"])
        subscription_date = datetime.utcnow()
        create_response = client.post(
            "/certificates/subscription",
            json={"subscription_date": subscription_date.isoformat()},
            cookies=author_cookies
        )
        certificate_id = create_response.json()["certificate_id"]
        
        # Try to access as reviewer
        reviewer_cookies = login_user(test_reviewer["email"], test_reviewer["password"])
        response = client.get(f"/certificates/{certificate_id}", cookies=reviewer_cookies)
        
        assert response.status_code == 403
    
    def test_get_all_certificates_admin(self, test_admin, test_author):
        """Test admin getting all certificates."""
        # Create a certificate
        author_cookies = login_user(test_author["email"], test_author["password"])
        subscription_date = datetime.utcnow()
        client.post(
            "/certificates/subscription",
            json={"subscription_date": subscription_date.isoformat()},
            cookies=author_cookies
        )
        
        # Get all certificates as admin
        admin_cookies = login_user(test_admin["email"], test_admin["password"])
        response = client.get("/certificates", cookies=admin_cookies)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
    
    def test_get_all_certificates_non_admin(self, test_author):
        """Test non-admin trying to get all certificates."""
        cookies = login_user(test_author["email"], test_author["password"])
        response = client.get("/certificates", cookies=cookies)
        
        assert response.status_code == 403
    
    def test_filter_certificates_by_type(self, test_admin, test_author):
        """Test filtering certificates by type."""
        # Create a subscription certificate
        author_cookies = login_user(test_author["email"], test_author["password"])
        subscription_date = datetime.utcnow()
        client.post(
            "/certificates/subscription",
            json={"subscription_date": subscription_date.isoformat()},
            cookies=author_cookies
        )
        
        # Filter by type as admin
        admin_cookies = login_user(test_admin["email"], test_admin["password"])
        response = client.get(
            "/certificates?certificate_type=subscription",
            cookies=admin_cookies
        )
        
        assert response.status_code == 200
        data = response.json()
        assert all(cert["certificate_type"] == "subscription" for cert in data)
    
    def test_search_certificates(self, test_admin, test_author):
        """Test searching certificates by recipient name."""
        # Create a certificate
        author_cookies = login_user(test_author["email"], test_author["password"])
        subscription_date = datetime.utcnow()
        client.post(
            "/certificates/subscription",
            json={"subscription_date": subscription_date.isoformat()},
            cookies=author_cookies
        )
        
        # Search by name as admin
        admin_cookies = login_user(test_admin["email"], test_admin["password"])
        response = client.get(
            "/certificates?search=Test Author",
            cookies=admin_cookies
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert "Test Author" in data[0]["recipient_name"]


class TestCertificateDownload:
    """Tests for certificate download endpoint."""
    
    def test_download_own_certificate(self, test_author):
        """Test downloading own certificate."""
        cookies = login_user(test_author["email"], test_author["password"])
        
        # Create a certificate
        subscription_date = datetime.utcnow()
        create_response = client.post(
            "/certificates/subscription",
            json={"subscription_date": subscription_date.isoformat()},
            cookies=cookies
        )
        certificate_id = create_response.json()["certificate_id"]
        
        # Download certificate
        response = client.get(f"/certificates/{certificate_id}/download", cookies=cookies)
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert "attachment" in response.headers["content-disposition"]
    
    def test_download_increments_count(self, test_author):
        """Test that downloading increments the download count."""
        cookies = login_user(test_author["email"], test_author["password"])
        
        # Create a certificate
        subscription_date = datetime.utcnow()
        create_response = client.post(
            "/certificates/subscription",
            json={"subscription_date": subscription_date.isoformat()},
            cookies=cookies
        )
        certificate_id = create_response.json()["certificate_id"]
        
        # Download twice
        client.get(f"/certificates/{certificate_id}/download", cookies=cookies)
        client.get(f"/certificates/{certificate_id}/download", cookies=cookies)
        
        # Check download count
        response = client.get(f"/certificates/{certificate_id}", cookies=cookies)
        assert response.json()["download_count"] == 2
    
    def test_download_other_user_certificate(self, test_author, test_reviewer):
        """Test downloading another user's certificate (should fail)."""
        # Create certificate for author
        author_cookies = login_user(test_author["email"], test_author["password"])
        subscription_date = datetime.utcnow()
        create_response = client.post(
            "/certificates/subscription",
            json={"subscription_date": subscription_date.isoformat()},
            cookies=author_cookies
        )
        certificate_id = create_response.json()["certificate_id"]
        
        # Try to download as reviewer
        reviewer_cookies = login_user(test_reviewer["email"], test_reviewer["password"])
        response = client.get(f"/certificates/{certificate_id}/download", cookies=reviewer_cookies)
        
        assert response.status_code == 403


class TestCertificateVerification:
    """Tests for certificate verification endpoint."""
    
    def test_verify_valid_certificate(self, test_author):
        """Test verifying a valid certificate (public endpoint)."""
        # Create a certificate
        cookies = login_user(test_author["email"], test_author["password"])
        subscription_date = datetime.utcnow()
        create_response = client.post(
            "/certificates/subscription",
            json={"subscription_date": subscription_date.isoformat()},
            cookies=cookies
        )
        certificate_id = create_response.json()["certificate_id"]
        
        # Verify without authentication
        response = client.get(f"/certificates/verify/{certificate_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["certificate_id"] == certificate_id
        assert data["recipient_name"] == test_author["full_name"]
        assert data["certificate_type"] == "subscription"
    
    def test_verify_invalid_certificate(self):
        """Test verifying an invalid certificate ID."""
        response = client.get("/certificates/verify/CERT-INVALID-ID")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_verify_no_authentication_required(self, test_author):
        """Test that verification works without authentication."""
        # Create a certificate
        cookies = login_user(test_author["email"], test_author["password"])
        subscription_date = datetime.utcnow()
        create_response = client.post(
            "/certificates/subscription",
            json={"subscription_date": subscription_date.isoformat()},
            cookies=cookies
        )
        certificate_id = create_response.json()["certificate_id"]
        
        # Verify without any cookies
        response = client.get(f"/certificates/verify/{certificate_id}")
        
        assert response.status_code == 200
