"""
Integration tests for user management endpoints.
Tests user CRUD operations (admin only).

Requirements: 2.1, 2.2
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import hash_password
from app.users.models import User, Role
import uuid
from tests.conftest import TestingSessionLocal


client = TestClient(app)


@pytest.fixture
def test_roles():
    """Create test roles."""
    db = TestingSessionLocal()
    
    admin_role = Role(
        id=str(uuid.uuid4()),
        name="admin",
        permissions={"full_access": True}
    )
    author_role = Role(
        id=str(uuid.uuid4()),
        name="author",
        permissions={"can_submit_papers": True}
    )
    reviewer_role = Role(
        id=str(uuid.uuid4()),
        name="reviewer",
        permissions={"can_review_papers": True}
    )
    
    db.add(admin_role)
    db.add(author_role)
    db.add(reviewer_role)
    db.commit()
    
    roles = {
        "admin": admin_role,
        "author": author_role,
        "reviewer": reviewer_role
    }
    
    yield roles
    
    db.close()


@pytest.fixture
def admin_user(test_roles):
    """Create an admin user for testing."""
    db = TestingSessionLocal()
    
    user = User(
        id=str(uuid.uuid4()),
        email="admin@example.com",
        password_hash=hash_password("adminpass123"),
        role_id=test_roles["admin"].id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    yield user
    
    db.close()


@pytest.fixture
def author_user(test_roles):
    """Create an author user for testing."""
    db = TestingSessionLocal()
    
    user = User(
        id=str(uuid.uuid4()),
        email="author@example.com",
        password_hash=hash_password("authorpass123"),
        role_id=test_roles["author"].id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    yield user
    
    db.close()


@pytest.fixture
def admin_token(admin_user):
    """Get access token for admin user."""
    response = client.post(
        "/auth/login",
        json={
            "email": "admin@example.com",
            "password": "adminpass123"
        }
    )
    assert response.status_code == 200
    return response.cookies.get("access_token")


@pytest.fixture
def author_token(author_user):
    """Get access token for author user."""
    response = client.post(
        "/auth/login",
        json={
            "email": "author@example.com",
            "password": "authorpass123"
        }
    )
    assert response.status_code == 200
    return response.cookies.get("access_token")


class TestGetUsers:
    """Test GET /users endpoint."""
    
    def test_get_users_as_admin(self, admin_token, admin_user, author_user):
        """Test admin can retrieve all users."""
        response = client.get(
            "/users",
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "users" in data
        assert "total" in data
        assert data["total"] >= 2  # At least admin and author
        assert len(data["users"]) >= 2
        
        # Check user structure
        user = data["users"][0]
        assert "id" in user
        assert "email" in user
        assert "role" in user
        assert "is_active" in user
    
    def test_get_users_as_non_admin(self, author_token):
        """Test non-admin cannot retrieve users."""
        response = client.get(
            "/users",
            cookies={"access_token": author_token}
        )
        
        assert response.status_code == 403
        assert "Access denied" in response.json()["detail"]
    
    def test_get_users_without_auth(self):
        """Test unauthenticated request is rejected."""
        response = client.get("/users")
        
        assert response.status_code == 401


class TestGetUser:
    """Test GET /users/{user_id} endpoint."""
    
    def test_get_user_as_admin(self, admin_token, author_user):
        """Test admin can retrieve specific user."""
        response = client.get(
            f"/users/{author_user.id}",
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == author_user.id
        assert data["email"] == author_user.email
        assert "role" in data
    
    def test_get_user_not_found(self, admin_token):
        """Test retrieving non-existent user."""
        fake_id = str(uuid.uuid4())
        response = client.get(
            f"/users/{fake_id}",
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 404
    
    def test_get_user_as_non_admin(self, author_token, admin_user):
        """Test non-admin cannot retrieve user details."""
        response = client.get(
            f"/users/{admin_user.id}",
            cookies={"access_token": author_token}
        )
        
        assert response.status_code == 403


class TestCreateUser:
    """Test POST /users endpoint."""
    
    def test_create_user_as_admin(self, admin_token, test_roles):
        """Test admin can create new user."""
        response = client.post(
            "/users",
            json={
                "email": "newuser@example.com",
                "password": "newpass123",
                "role_id": test_roles["reviewer"].id,
                "is_active": True
            },
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["email"] == "newuser@example.com"
        assert data["role_id"] == test_roles["reviewer"].id
        assert data["is_active"] is True
        assert "id" in data
    
    def test_create_user_duplicate_email(self, admin_token, author_user, test_roles):
        """Test creating user with existing email fails."""
        response = client.post(
            "/users",
            json={
                "email": author_user.email,
                "password": "password123",
                "role_id": test_roles["reviewer"].id,
                "is_active": True
            },
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]
    
    def test_create_user_invalid_role(self, admin_token):
        """Test creating user with invalid role_id fails."""
        fake_role_id = str(uuid.uuid4())
        response = client.post(
            "/users",
            json={
                "email": "newuser@example.com",
                "password": "password123",
                "role_id": fake_role_id,
                "is_active": True
            },
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 400
        assert "Invalid role_id" in response.json()["detail"]
    
    def test_create_user_as_non_admin(self, author_token, test_roles):
        """Test non-admin cannot create users."""
        response = client.post(
            "/users",
            json={
                "email": "newuser@example.com",
                "password": "password123",
                "role_id": test_roles["reviewer"].id,
                "is_active": True
            },
            cookies={"access_token": author_token}
        )
        
        assert response.status_code == 403


class TestUpdateUser:
    """Test PUT /users/{user_id} endpoint."""
    
    def test_update_user_email(self, admin_token, author_user):
        """Test admin can update user email."""
        response = client.put(
            f"/users/{author_user.id}",
            json={"email": "newemail@example.com"},
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["email"] == "newemail@example.com"
        assert data["id"] == author_user.id
    
    def test_update_user_password(self, admin_token, author_user):
        """Test admin can update user password."""
        response = client.put(
            f"/users/{author_user.id}",
            json={"password": "newpassword123"},
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 200
        
        # Verify new password works
        login_response = client.post(
            "/auth/login",
            json={
                "email": author_user.email,
                "password": "newpassword123"
            }
        )
        assert login_response.status_code == 200
    
    def test_update_user_role(self, admin_token, author_user, test_roles):
        """Test admin can update user role."""
        response = client.put(
            f"/users/{author_user.id}",
            json={"role_id": test_roles["reviewer"].id},
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["role_id"] == test_roles["reviewer"].id
    
    def test_update_user_not_found(self, admin_token):
        """Test updating non-existent user."""
        fake_id = str(uuid.uuid4())
        response = client.put(
            f"/users/{fake_id}",
            json={"email": "newemail@example.com"},
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 404
    
    def test_update_user_as_non_admin(self, author_token, admin_user):
        """Test non-admin cannot update users."""
        response = client.put(
            f"/users/{admin_user.id}",
            json={"email": "newemail@example.com"},
            cookies={"access_token": author_token}
        )
        
        assert response.status_code == 403


class TestDeleteUser:
    """Test DELETE /users/{user_id} endpoint."""
    
    def test_delete_user_as_admin(self, admin_token, author_user):
        """Test admin can delete user."""
        response = client.delete(
            f"/users/{author_user.id}",
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "deleted successfully" in data["message"]
        
        # Verify user is deleted
        get_response = client.get(
            f"/users/{author_user.id}",
            cookies={"access_token": admin_token}
        )
        assert get_response.status_code == 404
    
    def test_delete_user_not_found(self, admin_token):
        """Test deleting non-existent user."""
        fake_id = str(uuid.uuid4())
        response = client.delete(
            f"/users/{fake_id}",
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 404
    
    def test_delete_user_as_non_admin(self, author_token, admin_user):
        """Test non-admin cannot delete users."""
        response = client.delete(
            f"/users/{admin_user.id}",
            cookies={"access_token": author_token}
        )
        
        assert response.status_code == 403
