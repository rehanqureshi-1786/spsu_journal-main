"""
Tests for audit logging endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import get_db
from app.audit.service import log_action, log_auth_event
from app.users.models import User, Role
from app.core.security import hash_password, create_access_token
from datetime import timedelta


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def test_db(tmp_path):
    """Create test database."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.core.database import Base
    
    # Create test database
    db_path = tmp_path / "test_audit.db"
    engine = create_engine(f"sqlite:///{db_path}")
    Base.metadata.create_all(bind=engine)
    
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    
    # Create admin role
    admin_role = Role(name="admin", permissions={})
    db.add(admin_role)
    db.commit()
    db.refresh(admin_role)
    
    # Create admin user
    admin_user = User(
        email="admin@test.com",
        password_hash=hash_password("admin123"),
        role_id=admin_role.id,
        is_active=True
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    yield db
    
    db.close()
    Base.metadata.drop_all(bind=engine)


def test_log_action(test_db):
    """Test creating an audit log entry."""
    # Get admin user
    admin = test_db.query(User).filter(User.email == "admin@test.com").first()
    
    # Log an action
    log = log_action(
        db=test_db,
        user_id=admin.id,
        action="test_action",
        resource_type="test_resource",
        resource_id="test-id-123",
        ip_address="127.0.0.1",
        user_agent="test-agent",
        details={"key": "value"}
    )
    
    assert log.id is not None
    assert log.user_id == admin.id
    assert log.action == "test_action"
    assert log.resource_type == "test_resource"
    assert log.resource_id == "test-id-123"
    assert log.ip_address == "127.0.0.1"
    assert log.user_agent == "test-agent"
    assert log.details == {"key": "value"}


def test_log_auth_event(test_db):
    """Test creating an authentication audit log entry."""
    # Get admin user
    admin = test_db.query(User).filter(User.email == "admin@test.com").first()
    
    # Log auth event
    log = log_auth_event(
        db=test_db,
        user_id=admin.id,
        action="login",
        ip_address="127.0.0.1",
        user_agent="test-agent",
        success=True,
        details={"email": "admin@test.com"}
    )
    
    assert log.id is not None
    assert log.user_id == admin.id
    assert log.action == "login"
    assert log.resource_type == "auth"
    assert log.ip_address == "127.0.0.1"
    assert log.details["success"] is True
    assert log.details["email"] == "admin@test.com"


def test_get_audit_logs_requires_admin(client):
    """Test that audit logs endpoint requires admin role."""
    # Try to access without authentication
    response = client.get("/audit/logs")
    assert response.status_code == 401


def test_audit_log_filtering(test_db):
    """Test audit log filtering functionality."""
    from app.audit.service import query_audit_logs
    from app.audit.schemas import AuditLogQueryParams
    
    # Get admin user
    admin = test_db.query(User).filter(User.email == "admin@test.com").first()
    
    # Create multiple log entries
    log_action(test_db, admin.id, "action1", "paper", "paper-1", details={"test": 1})
    log_action(test_db, admin.id, "action2", "paper", "paper-2", details={"test": 2})
    log_action(test_db, admin.id, "action1", "review", "review-1", details={"test": 3})
    
    # Query by action
    params = AuditLogQueryParams(action="action1")
    logs = query_audit_logs(test_db, params)
    assert len(logs) == 2
    assert all(log.action == "action1" for log in logs)
    
    # Query by resource type
    params = AuditLogQueryParams(resource_type="paper")
    logs = query_audit_logs(test_db, params)
    assert len(logs) == 2
    assert all(log.resource_type == "paper" for log in logs)
    
    # Query by user
    params = AuditLogQueryParams(user_id=admin.id)
    logs = query_audit_logs(test_db, params)
    assert len(logs) == 3
    assert all(log.user_id == admin.id for log in logs)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
