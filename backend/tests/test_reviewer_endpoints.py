"""
Tests for reviewer endpoints.
Tests reviewer creation and management (admin only).

Requirements: 2.1
"""
import pytest
import uuid
from fastapi.testclient import TestClient

from app.main import app
from app.users.models import User, Role
from app.reviewers.models import Reviewer
from app.certificates.models import Certificate
from app.core.security import hash_password, create_access_token
from tests.conftest import TestingSessionLocal


client = TestClient(app)


@pytest.fixture(scope="function", autouse=True)
def clean_database():
    """Clean database between tests."""
    db = TestingSessionLocal()
    try:
        # Delete all records
        db.query(Certificate).delete()
        db.query(Reviewer).delete()
        db.query(User).delete()
        db.query(Role).delete()
        db.commit()
    finally:
        db.close()
    yield


@pytest.fixture
def test_roles():
    """Create test roles."""
    db = TestingSessionLocal()
    
    admin_role = Role(
        id=str(uuid.uuid4()),
        name="admin",
        permissions={"full_access": True}
    )
    
    reviewer_role = Role(
        id=str(uuid.uuid4()),
        name="reviewer",
        permissions={"review_papers": True}
    )
    
    db.add(admin_role)
    db.add(reviewer_role)
    db.commit()
    
    # Store the role IDs before closing the session
    admin_id = admin_role.id
    reviewer_id = reviewer_role.id
    
    db.close()
    return {"admin_id": admin_id, "reviewer_id": reviewer_id}


@pytest.fixture
def admin_user(test_roles):
    """Create a test admin user."""
    db = TestingSessionLocal()
    
    user = User(
        id=str(uuid.uuid4()),
        email="admin@example.com",
        password_hash=hash_password("adminpassword"),
        role_id=test_roles["admin_id"],
        is_active=True
    )
    db.add(user)
    db.commit()
    
    # Store ID before closing session
    user_id = user.id
    
    # Generate access token
    token = create_access_token({"sub": user_id, "role": "admin"})
    
    db.close()
    return {"token": token, "user_id": user_id}


@pytest.fixture
def reviewer_user(test_roles):
    """Create a test reviewer user."""
    db = TestingSessionLocal()
    
    # Create user
    user = User(
        id=str(uuid.uuid4()),
        email="reviewer@example.com",
        password_hash=hash_password("reviewerpassword"),
        role_id=test_roles["reviewer_id"],
        is_active=True
    )
    db.add(user)
    db.flush()
    
    # Create reviewer profile
    reviewer = Reviewer(
        id=str(uuid.uuid4()),
        user_id=user.id,
        first_name="Jane",
        last_name="Reviewer",
        affiliation="Test University",
        expertise=["Machine Learning", "AI"]
    )
    db.add(reviewer)
    db.commit()
    
    # Store ID before closing session
    user_id = user.id
    
    # Generate access token
    token = create_access_token({"sub": user_id, "role": "reviewer"})
    
    db.close()
    return {"token": token, "user_id": user_id}


class TestCreateReviewer:
    """Test reviewer creation endpoint (admin only)."""
    
    def test_create_reviewer_success(self, admin_user):
        """Test successful reviewer creation by admin."""
        reviewer_data = {
            "email": "newreviewer@example.com",
            "password": "securepassword123",
            "first_name": "John",
            "last_name": "Reviewer",
            "affiliation": "University of Example",
            "expertise": ["Computer Vision", "Deep Learning"]
        }
        
        response = client.post(
            "/reviewers",
            json=reviewer_data,
            cookies={"access_token": admin_user["token"]}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == reviewer_data["email"]
        assert data["first_name"] == reviewer_data["first_name"]
        assert data["last_name"] == reviewer_data["last_name"]
        assert data["affiliation"] == reviewer_data["affiliation"]
        assert data["expertise"] == reviewer_data["expertise"]
        assert "id" in data
        assert "user_id" in data
        assert "created_at" in data
    
    def test_create_reviewer_duplicate_email(self, admin_user):
        """Test creating reviewer with duplicate email fails."""
        reviewer_data = {
            "email": "duplicate@example.com",
            "password": "securepassword123",
            "first_name": "John",
            "last_name": "Reviewer",
            "affiliation": "University of Example"
        }
        
        # First creation should succeed
        response1 = client.post(
            "/reviewers",
            json=reviewer_data,
            cookies={"access_token": admin_user["token"]}
        )
        assert response1.status_code == 201
        
        # Second creation with same email should fail
        response2 = client.post(
            "/reviewers",
            json=reviewer_data,
            cookies={"access_token": admin_user["token"]}
        )
        assert response2.status_code == 400
        assert "already registered" in response2.json()["detail"].lower()
    
    def test_create_reviewer_without_auth(self):
        """Test creating reviewer without authentication fails."""
        reviewer_data = {
            "email": "newreviewer@example.com",
            "password": "securepassword123",
            "first_name": "John",
            "last_name": "Reviewer",
            "affiliation": "University of Example"
        }
        
        response = client.post("/reviewers", json=reviewer_data)
        assert response.status_code == 401
    
    def test_create_reviewer_non_admin(self, reviewer_user):
        """Test creating reviewer as non-admin fails."""
        reviewer_data = {
            "email": "newreviewer@example.com",
            "password": "securepassword123",
            "first_name": "John",
            "last_name": "Reviewer",
            "affiliation": "University of Example"
        }
        
        response = client.post(
            "/reviewers",
            json=reviewer_data,
            cookies={"access_token": reviewer_user["token"]}
        )
        assert response.status_code == 403
    
    def test_create_reviewer_missing_required_fields(self, admin_user):
        """Test creating reviewer with missing required fields fails."""
        reviewer_data = {
            "email": "incomplete@example.com",
            "password": "securepassword123"
            # Missing first_name, last_name, affiliation
        }
        
        response = client.post(
            "/reviewers",
            json=reviewer_data,
            cookies={"access_token": admin_user["token"]}
        )
        assert response.status_code == 400  # Validation error
    
    def test_create_reviewer_generates_subscription_certificate(self, admin_user):
        """Test that reviewer creation automatically generates a subscription certificate."""
        reviewer_data = {
            "email": "certtest@example.com",
            "password": "securepassword123",
            "first_name": "Certificate",
            "last_name": "Tester",
            "affiliation": "Test University",
            "expertise": ["Machine Learning"]
        }
        
        response = client.post(
            "/reviewers",
            json=reviewer_data,
            cookies={"access_token": admin_user["token"]}
        )
        assert response.status_code == 201
        
        # Verify certificate was created
        db = TestingSessionLocal()
        try:
            user = db.query(User).filter(User.email == reviewer_data["email"]).first()
            assert user is not None
            
            certificate = db.query(Certificate).filter(
                Certificate.recipient_id == user.id,
                Certificate.certificate_type == "subscription"
            ).first()
            
            assert certificate is not None
            assert certificate.recipient_name == f"{reviewer_data['first_name']} {reviewer_data['last_name']}"
            assert certificate.certificate_id is not None
            assert certificate.certificate_id.startswith("CERT-")
        finally:
            db.close()


class TestGetReviewers:
    """Test get all reviewers endpoint (admin only)."""
    
    def test_get_reviewers_success(self, admin_user, test_roles):
        """Test getting all reviewers as admin."""
        # Create some test reviewers
        db = TestingSessionLocal()
        
        for i in range(3):
            user = User(
                id=str(uuid.uuid4()),
                email=f"reviewer{i}@example.com",
                password_hash=hash_password("password"),
                role_id=test_roles["reviewer_id"],
                is_active=True
            )
            db.add(user)
            db.flush()
            
            reviewer = Reviewer(
                id=str(uuid.uuid4()),
                user_id=user.id,
                first_name=f"Reviewer{i}",
                last_name=f"Test{i}",
                affiliation="Test University",
                expertise=["AI"]
            )
            db.add(reviewer)
        
        db.commit()
        db.close()
        
        response = client.get(
            "/reviewers",
            cookies={"access_token": admin_user["token"]}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "reviewers" in data
        assert "total" in data
        assert data["total"] == 3
        assert len(data["reviewers"]) == 3
    
    def test_get_reviewers_without_auth(self):
        """Test getting reviewers without authentication fails."""
        response = client.get("/reviewers")
        assert response.status_code == 401
    
    def test_get_reviewers_non_admin(self, reviewer_user):
        """Test getting reviewers as non-admin fails."""
        response = client.get(
            "/reviewers",
            cookies={"access_token": reviewer_user["token"]}
        )
        assert response.status_code == 403
    
    def test_get_reviewers_pagination(self, admin_user, test_roles):
        """Test pagination for reviewers list."""
        # Create 5 test reviewers
        db = TestingSessionLocal()
        
        for i in range(5):
            user = User(
                id=str(uuid.uuid4()),
                email=f"reviewer{i}@example.com",
                password_hash=hash_password("password"),
                role_id=test_roles["reviewer_id"],
                is_active=True
            )
            db.add(user)
            db.flush()
            
            reviewer = Reviewer(
                id=str(uuid.uuid4()),
                user_id=user.id,
                first_name=f"Reviewer{i}",
                last_name=f"Test{i}",
                affiliation="Test University"
            )
            db.add(reviewer)
        
        db.commit()
        db.close()
        
        # Get first 2 reviewers
        response = client.get(
            "/reviewers?skip=0&limit=2",
            cookies={"access_token": admin_user["token"]}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 5
        assert len(data["reviewers"]) == 2


class TestGetReviewerAssignments:
    """Test get reviewer assignments endpoint."""
    
    def test_get_assignments_success(self, reviewer_user):
        """Test getting assignments as reviewer."""
        response = client.get(
            "/reviewers/assignments",
            cookies={"access_token": reviewer_user["token"]}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Currently returns empty list as placeholder
        assert len(data) == 0
    
    def test_get_assignments_without_auth(self):
        """Test getting assignments without authentication fails."""
        response = client.get("/reviewers/assignments")
        assert response.status_code == 401
    
    def test_get_assignments_non_reviewer(self, admin_user):
        """Test getting assignments as non-reviewer fails."""
        response = client.get(
            "/reviewers/assignments",
            cookies={"access_token": admin_user["token"]}
        )
        assert response.status_code == 403


class TestGetReviewersWorkload:
    """Test get reviewers workload endpoint (admin only)."""
    
    def test_get_workload_success(self, admin_user, test_roles):
        """Test getting reviewers workload as admin."""
        # Create a test reviewer
        db = TestingSessionLocal()
        
        reviewer_user = User(
            id=str(uuid.uuid4()),
            email="reviewer@example.com",
            password_hash=hash_password("password123"),
            role_id=test_roles["reviewer_id"],
            is_active=True
        )
        db.add(reviewer_user)
        db.flush()
        
        reviewer = Reviewer(
            id=str(uuid.uuid4()),
            user_id=reviewer_user.id,
            first_name="Test",
            last_name="Reviewer",
            affiliation="Test University",
            expertise=["Machine Learning"]
        )
        db.add(reviewer)
        db.commit()
        db.close()
        
        response = client.get(
            "/reviewers/workload",
            cookies={"access_token": admin_user["token"]}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Check workload data structure
        workload = data[0]
        assert "reviewer_id" in workload
        assert "assigned_count" in workload
        assert "pending_count" in workload
        assert workload["assigned_count"] >= 0
        assert workload["pending_count"] >= 0
    
    def test_get_workload_without_auth(self):
        """Test getting workload without authentication fails."""
        response = client.get("/reviewers/workload")
        assert response.status_code == 401
    
    def test_get_workload_non_admin(self, reviewer_user):
        """Test getting workload as non-admin fails."""
        response = client.get(
            "/reviewers/workload",
            cookies={"access_token": reviewer_user["token"]}
        )
        assert response.status_code == 403
