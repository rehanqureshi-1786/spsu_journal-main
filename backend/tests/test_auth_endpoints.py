"""
Integration tests for authentication endpoints.
Tests login, token refresh, and logout functionality.

Requirements: 1.1, 1.2, 1.7
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
def test_user():
    """Create a test user for authentication tests."""
    db = TestingSessionLocal()
    
    # Create author role
    role = Role(
        id=str(uuid.uuid4()),
        name="author",
        permissions={"can_submit_papers": True}
    )
    db.add(role)
    db.commit()
    
    # Create test user
    user = User(
        id=str(uuid.uuid4()),
        email="test@example.com",
        password_hash=hash_password("testpassword123"),
        role_id=role.id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    yield user
    
    db.close()


class TestLogin:
    """Test login endpoint."""
    
    def test_login_success(self, test_user):
        """Test successful login with valid credentials."""
        response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response contains tokens
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        
        # Check cookies are set
        assert "access_token" in response.cookies
        assert "refresh_token" in response.cookies
    
    def test_login_invalid_email(self, test_user):
        """Test login with non-existent email."""
        response = client.post(
            "/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "testpassword123"
            }
        )
        
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]
    
    def test_login_invalid_password(self, test_user):
        """Test login with incorrect password."""
        response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]
    
    def test_login_missing_fields(self, test_user):
        """Test login with missing required fields."""
        response = client.post(
            "/auth/login",
            json={"email": "test@example.com"}
        )
        
        assert response.status_code == 400  # Validation error (handled by error_handler)


class TestRefresh:
    """Test token refresh endpoint."""
    
    def test_refresh_success(self, test_user):
        """Test successful token refresh with valid refresh token."""
        # First login to get tokens
        login_response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword123"
            }
        )
        
        assert login_response.status_code == 200
        refresh_token = login_response.cookies.get("refresh_token")
        
        # Use refresh token to get new access token
        refresh_response = client.post(
            "/auth/refresh",
            cookies={"refresh_token": refresh_token}
        )
        
        assert refresh_response.status_code == 200
        data = refresh_response.json()
        
        # Check new access token is returned
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        
        # Check new access token cookie is set
        assert "access_token" in refresh_response.cookies
    
    def test_refresh_missing_token(self, test_user):
        """Test refresh without providing refresh token."""
        response = client.post("/auth/refresh")
        
        assert response.status_code == 401
        assert "Refresh token missing" in response.json()["detail"]
    
    def test_refresh_invalid_token(self, test_user):
        """Test refresh with invalid refresh token."""
        response = client.post(
            "/auth/refresh",
            cookies={"refresh_token": "invalid_token"}
        )
        
        assert response.status_code == 401


class TestLogout:
    """Test logout endpoint."""
    
    def test_logout_success(self, test_user):
        """Test successful logout."""
        # First login
        login_response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword123"
            }
        )
        
        assert login_response.status_code == 200
        access_token = login_response.cookies.get("access_token")
        refresh_token = login_response.cookies.get("refresh_token")
        
        # Logout
        logout_response = client.post(
            "/auth/logout",
            cookies={
                "access_token": access_token,
                "refresh_token": refresh_token
            }
        )
        
        assert logout_response.status_code == 200
        data = logout_response.json()
        
        assert data["success"] is True
        assert "logged out" in data["message"].lower()
    
    def test_logout_without_auth(self, test_user):
        """Test logout without authentication."""
        response = client.post("/auth/logout")
        
        assert response.status_code == 401


class TestCookieSecurity:
    """Test cookie security flags."""
    
    def test_cookies_have_security_flags(self, test_user):
        """Test that cookies have HttpOnly and Secure flags."""
        response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword123"
            }
        )
        
        assert response.status_code == 200
        
        # Check Set-Cookie headers
        set_cookie_headers = response.headers.get_list("set-cookie")
        
        # Verify both cookies are present
        access_cookie = None
        refresh_cookie = None
        
        for cookie in set_cookie_headers:
            if "access_token=" in cookie:
                access_cookie = cookie
            elif "refresh_token=" in cookie:
                refresh_cookie = cookie
        
        assert access_cookie is not None, "Access token cookie not found"
        assert refresh_cookie is not None, "Refresh token cookie not found"
        
        # Check security flags (HttpOnly, Secure, SameSite)
        for cookie in [access_cookie, refresh_cookie]:
            assert "HttpOnly" in cookie or "httponly" in cookie.lower()
            assert "Secure" in cookie or "secure" in cookie.lower()
            assert "SameSite" in cookie or "samesite" in cookie.lower()
