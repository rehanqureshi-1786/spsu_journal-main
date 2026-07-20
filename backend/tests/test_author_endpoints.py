"""
Tests for author endpoints.
Tests author self-registration and profile management.

Requirements: 3.1
"""
import pytest
import uuid
from fastapi.testclient import TestClient

from app.main import app
from app.users.models import User, Role
from app.authors.models import Author
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
        db.query(Author).delete()
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
    
    author_role = Role(
        id=str(uuid.uuid4()),
        name="author",
        permissions={"submit_papers": True}
    )
    
    db.add(author_role)
    db.commit()
    db.refresh(author_role)
    
    # Store the role ID before closing the session
    role_id = author_role.id
    
    db.close()
    return {"author_id": role_id}


class TestAuthorSignup:
    """Test author self-registration endpoint."""
    
    def test_signup_success(self, test_roles):
        """Test successful author signup."""
        signup_data = {
            "email": "newauthor@example.com",
            "password": "securepassword123",
            "first_name": "John",
            "last_name": "Doe",
            "affiliation": "University of Example",
            "orcid": "0000-0001-2345-6789",
            "bio": "Research interests include testing"
        }
        
        response = client.post("/authors/signup", json=signup_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == signup_data["email"]
        assert data["first_name"] == signup_data["first_name"]
        assert data["last_name"] == signup_data["last_name"]
        assert data["affiliation"] == signup_data["affiliation"]
        assert data["orcid"] == signup_data["orcid"]
        assert data["bio"] == signup_data["bio"]
        assert "id" in data
        assert "user_id" in data
        assert "created_at" in data
    
    def test_signup_duplicate_email(self, test_roles):
        """Test signup with duplicate email fails."""
        signup_data = {
            "email": "duplicate@example.com",
            "password": "securepassword123",
            "first_name": "John",
            "last_name": "Doe",
            "affiliation": "University of Example"
        }
        
        # First signup should succeed
        response1 = client.post("/authors/signup", json=signup_data)
        assert response1.status_code == 201
        
        # Second signup with same email should fail
        response2 = client.post("/authors/signup", json=signup_data)
        assert response2.status_code == 400
        assert "already registered" in response2.json()["detail"].lower()
    
    def test_signup_missing_required_fields(self, test_roles):
        """Test signup with missing required fields fails."""
        signup_data = {
            "email": "incomplete@example.com",
            "password": "securepassword123"
            # Missing first_name, last_name, affiliation
        }
        
        response = client.post("/authors/signup", json=signup_data)
        assert response.status_code == 400  # Validation error
    
    def test_signup_generates_subscription_certificate(self, test_roles):
        """Test that signup automatically generates a subscription certificate."""
        signup_data = {
            "email": "certtest@example.com",
            "password": "securepassword123",
            "first_name": "Certificate",
            "last_name": "Tester",
            "affiliation": "Test University"
        }
        
        response = client.post("/authors/signup", json=signup_data)
        assert response.status_code == 201
        
        # Verify certificate was created
        db = TestingSessionLocal()
        try:
            user = db.query(User).filter(User.email == signup_data["email"]).first()
            assert user is not None
            
            certificate = db.query(Certificate).filter(
                Certificate.recipient_id == user.id,
                Certificate.certificate_type == "subscription"
            ).first()
            
            assert certificate is not None
            assert certificate.recipient_name == f"{signup_data['first_name']} {signup_data['last_name']}"
            assert certificate.certificate_id is not None
            assert certificate.certificate_id.startswith("CERT-")
        finally:
            db.close()


class TestAuthorProfile:
    """Test author profile endpoints."""
    
    @pytest.fixture
    def author_user(self, test_roles):
        """Create a test author user."""
        db = TestingSessionLocal()
        
        # Create user
        user = User(
            id=str(uuid.uuid4()),
            email="author@example.com",
            password_hash=hash_password("password123"),
            role_id=test_roles["author_id"],
            is_active=True
        )
        db.add(user)
        db.flush()
        
        # Create author profile
        author = Author(
            id=str(uuid.uuid4()),
            user_id=user.id,
            first_name="Jane",
            last_name="Smith",
            affiliation="Test University",
            orcid="0000-0002-3456-7890",
            bio="Test bio"
        )
        db.add(author)
        db.commit()
        
        # Store IDs before closing session
        user_id = user.id
        
        # Generate access token
        token = create_access_token({"sub": user_id, "role": "author"})
        
        db.close()
        return {"token": token}
    
    def test_get_profile_success(self, author_user):
        """Test getting author profile."""
        response = client.get(
            "/authors/profile",
            cookies={"access_token": author_user["token"]}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "author@example.com"
        assert data["first_name"] == "Jane"
        assert data["last_name"] == "Smith"
        assert data["affiliation"] == "Test University"
    
    def test_get_profile_without_auth(self):
        """Test getting profile without authentication fails."""
        response = client.get("/authors/profile")
        assert response.status_code == 401
    
    def test_update_profile_success(self, author_user):
        """Test updating author profile."""
        update_data = {
            "first_name": "Janet",
            "affiliation": "New University",
            "bio": "Updated research interests"
        }
        
        response = client.put(
            "/authors/profile",
            json=update_data,
            cookies={"access_token": author_user["token"]}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "Janet"
        assert data["affiliation"] == "New University"
        assert data["bio"] == "Updated research interests"
        assert data["last_name"] == "Smith"  # Unchanged
    
    def test_update_profile_without_auth(self):
        """Test updating profile without authentication fails."""
        update_data = {"first_name": "NewName"}
        
        response = client.put("/authors/profile", json=update_data)
        assert response.status_code == 401
