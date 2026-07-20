"""
Tests for error handlers in The Essence Journal System.

Requirements: 13.1, 13.2, 13.7
"""
import pytest
from fastapi import FastAPI, Request, HTTPException
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.exc import IntegrityError
from jose import JWTError

from app.middleware.error_handler import (
    AuthenticationError,
    AuthorizationError,
    BusinessRuleError,
    register_exception_handlers,
    validation_exception_handler,
    authentication_exception_handler,
    authorization_exception_handler,
    business_rule_exception_handler,
    integrity_error_handler,
    database_exception_handler,
    generic_exception_handler,
)


# Create a test FastAPI app
@pytest.fixture
def test_app():
    """Create a test FastAPI application with error handlers registered."""
    app = FastAPI()
    register_exception_handlers(app)
    
    # Test routes that raise different exceptions
    @app.get("/test/validation-error")
    async def trigger_validation_error():
        # Simulate a validation error
        class TestModel(BaseModel):
            email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
            age: int = Field(..., ge=0, le=150)
        
        # This will raise a ValidationError
        TestModel(email="invalid-email", age=200)
    
    @app.get("/test/authentication-error")
    async def trigger_authentication_error():
        raise AuthenticationError("Invalid credentials", {"reason": "Wrong password"})
    
    @app.get("/test/jwt-error")
    async def trigger_jwt_error():
        raise JWTError("Token signature invalid")
    
    @app.get("/test/authorization-error")
    async def trigger_authorization_error():
        raise AuthorizationError("Insufficient permissions", {"required_role": "admin"})
    
    @app.get("/test/business-rule-error")
    async def trigger_business_rule_error():
        raise BusinessRuleError("Cannot publish non-accepted paper", {"status": "submitted"})
    
    @app.get("/test/integrity-error")
    async def trigger_integrity_error():
        # Simulate an IntegrityError
        from sqlalchemy.exc import IntegrityError as SQLIntegrityError
        raise SQLIntegrityError("", "", Exception("Duplicate entry 'test@example.com' for key 'email'"))
    
    @app.get("/test/generic-error")
    async def trigger_generic_error():
        raise ValueError("Something went wrong")
    
    return app


@pytest.fixture
def client(test_app):
    """Create a test client."""
    return TestClient(test_app, raise_server_exceptions=False)


class TestValidationExceptionHandler:
    """Test validation exception handler."""
    
    def test_validation_error_response_structure(self, client):
        """Test that validation errors return proper structure."""
        response = client.get("/test/validation-error")
        
        assert response.status_code == 400
        data = response.json()
        
        # Check error structure
        assert "error" in data
        assert "code" in data["error"]
        assert "message" in data["error"]
        assert "details" in data["error"]
        assert "timestamp" in data["error"]
        
        # Check error code
        assert data["error"]["code"] == "VALIDATION_ERROR"
        
        # Check details contain errors array
        assert "errors" in data["error"]["details"]
        assert isinstance(data["error"]["details"]["errors"], list)
        assert len(data["error"]["details"]["errors"]) > 0
    
    def test_validation_error_field_details(self, client):
        """Test that validation errors include field-level details."""
        response = client.get("/test/validation-error")
        
        data = response.json()
        errors = data["error"]["details"]["errors"]
        
        # Each error should have field, message, and type
        for error in errors:
            assert "field" in error
            assert "message" in error
            assert "type" in error


class TestAuthenticationExceptionHandler:
    """Test authentication exception handler."""
    
    def test_authentication_error_response(self, client):
        """Test that authentication errors return 401 status."""
        response = client.get("/test/authentication-error")
        
        assert response.status_code == 401
        data = response.json()
        
        # Check error structure
        assert data["error"]["code"] == "AUTHENTICATION_ERROR"
        assert data["error"]["message"] == "Invalid credentials"
        assert "reason" in data["error"]["details"]
    
    def test_jwt_error_response(self, client):
        """Test that JWT errors return 401 status."""
        response = client.get("/test/jwt-error")
        
        assert response.status_code == 401
        data = response.json()
        
        assert data["error"]["code"] == "AUTHENTICATION_ERROR"
        assert "token" in data["error"]["message"].lower()


class TestAuthorizationExceptionHandler:
    """Test authorization exception handler."""
    
    def test_authorization_error_response(self, client):
        """Test that authorization errors return 403 status."""
        response = client.get("/test/authorization-error")
        
        assert response.status_code == 403
        data = response.json()
        
        # Check error structure
        assert data["error"]["code"] == "AUTHORIZATION_ERROR"
        assert data["error"]["message"] == "Insufficient permissions"
        assert "required_role" in data["error"]["details"]


class TestBusinessRuleExceptionHandler:
    """Test business rule exception handler."""
    
    def test_business_rule_error_response(self, client):
        """Test that business rule errors return 400 status."""
        response = client.get("/test/business-rule-error")
        
        assert response.status_code == 400
        data = response.json()
        
        # Check error structure
        assert data["error"]["code"] == "BUSINESS_RULE_VIOLATION"
        assert "publish" in data["error"]["message"].lower()
        assert "status" in data["error"]["details"]


class TestIntegrityErrorHandler:
    """Test database integrity error handler."""
    
    def test_integrity_error_duplicate_response(self, client):
        """Test that duplicate entry errors return 409 status."""
        response = client.get("/test/integrity-error")
        
        assert response.status_code == 409
        data = response.json()
        
        # Check error structure
        assert data["error"]["code"] == "DUPLICATE_ENTRY"
        assert "integrity" in data["error"]["message"].lower()


class TestGenericExceptionHandler:
    """Test generic exception handler."""
    
    def test_generic_error_response(self, client):
        """Test that generic errors return 500 status."""
        response = client.get("/test/generic-error")
        
        assert response.status_code == 500
        data = response.json()
        
        # Check error structure
        assert data["error"]["code"] == "INTERNAL_SERVER_ERROR"
        assert "unexpected" in data["error"]["message"].lower()


class TestErrorResponseFormat:
    """Test that all error responses follow consistent format."""
    
    def test_all_errors_have_timestamp(self, client):
        """Test that all error responses include timestamp."""
        endpoints = [
            "/test/validation-error",
            "/test/authentication-error",
            "/test/authorization-error",
            "/test/business-rule-error",
            "/test/integrity-error",
            "/test/generic-error",
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            data = response.json()
            
            assert "timestamp" in data["error"]
            # Timestamp should be in ISO format with Z suffix
            assert data["error"]["timestamp"].endswith("Z")
    
    def test_all_errors_have_required_fields(self, client):
        """Test that all error responses have required fields."""
        endpoints = [
            "/test/validation-error",
            "/test/authentication-error",
            "/test/authorization-error",
            "/test/business-rule-error",
            "/test/integrity-error",
            "/test/generic-error",
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            data = response.json()
            
            # All errors should have these fields
            assert "error" in data
            assert "code" in data["error"]
            assert "message" in data["error"]
            assert "details" in data["error"]
            assert "timestamp" in data["error"]


class TestHTTPStatusCodes:
    """Test that correct HTTP status codes are returned."""
    
    def test_validation_error_returns_400(self, client):
        """Test validation errors return 400 Bad Request."""
        response = client.get("/test/validation-error")
        assert response.status_code == 400
    
    def test_authentication_error_returns_401(self, client):
        """Test authentication errors return 401 Unauthorized."""
        response = client.get("/test/authentication-error")
        assert response.status_code == 401
    
    def test_authorization_error_returns_403(self, client):
        """Test authorization errors return 403 Forbidden."""
        response = client.get("/test/authorization-error")
        assert response.status_code == 403
    
    def test_integrity_error_returns_409(self, client):
        """Test duplicate entry errors return 409 Conflict."""
        response = client.get("/test/integrity-error")
        assert response.status_code == 409
    
    def test_generic_error_returns_500(self, client):
        """Test generic errors return 500 Internal Server Error."""
        response = client.get("/test/generic-error")
        assert response.status_code == 500


class TestCustomExceptionClasses:
    """Test custom exception classes."""
    
    def test_authentication_error_creation(self):
        """Test AuthenticationError can be created with message and details."""
        error = AuthenticationError("Test message", {"key": "value"})
        
        assert error.message == "Test message"
        assert error.details == {"key": "value"}
        assert str(error) == "Test message"
    
    def test_authorization_error_creation(self):
        """Test AuthorizationError can be created with message and details."""
        error = AuthorizationError("Access denied", {"role": "admin"})
        
        assert error.message == "Access denied"
        assert error.details == {"role": "admin"}
    
    def test_business_rule_error_creation(self):
        """Test BusinessRuleError can be created with message and details."""
        error = BusinessRuleError("Rule violated", {"rule": "test"})
        
        assert error.message == "Rule violated"
        assert error.details == {"rule": "test"}
    
    def test_custom_errors_with_default_details(self):
        """Test custom errors work with default empty details."""
        auth_error = AuthenticationError("Test")
        assert auth_error.details == {}
        
        authz_error = AuthorizationError("Test")
        assert authz_error.details == {}
        
        business_error = BusinessRuleError("Test")
        assert business_error.details == {}
