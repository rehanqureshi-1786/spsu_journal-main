"""
Tests for CSV export endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import io
import csv

from app.main import app
from tests.conftest import TestingSessionLocal, engine
from app.core.database import Base
from app.users.models import User, Role
from app.authors.models import Author
from app.papers.models import Paper
from app.audit.models import AuditLog
from app.core.security import hash_password, create_access_token


client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test and drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_roles():
    """Create test roles."""
    db = TestingSessionLocal()
    try:
        admin_role = Role(id="admin-role-id", name="admin")
        author_role = Role(id="author-role-id", name="author")
        db.add(admin_role)
        db.add(author_role)
        db.commit()
        return {"admin": admin_role, "author": author_role}
    finally:
        db.close()


@pytest.fixture
def test_admin(test_roles):
    """Create a test admin user."""
    db = TestingSessionLocal()
    try:
        admin_user = User(
            id="admin-user-id",
            email="admin@test.com",
            hashed_password=hash_password("admin123"),
            role_id=test_roles["admin"].id,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        return {
            "user": admin_user,
            "email": "admin@test.com",
            "password": "admin123"
        }
    finally:
        db.close()


@pytest.fixture
def test_author_with_papers(test_roles):
    """Create a test author with papers."""
    db = TestingSessionLocal()
    try:
        # Create author user
        author_user = User(
            id="author-user-id",
            email="author@test.com",
            hashed_password=hash_password("author123"),
            role_id=test_roles["author"].id,
            is_active=True
        )
        db.add(author_user)
        db.flush()
        
        # Create author profile
        author = Author(
            id="author-id",
            user_id=author_user.id,
            first_name="Test",
            last_name="Author",
            affiliation="Test University",
            orcid="0000-0000-0000-0001"
        )
        db.add(author)
        db.flush()
        
        # Create test papers
        paper1 = Paper(
            id="paper-1",
            author_id=author.id,
            title="Test Paper 1",
            abstract="Abstract for paper 1",
            keywords=["test", "paper"],
            original_filename="paper1.pdf",
            anonymized_filename="PAPER-paper-1-0001.pdf",
            file_hash="hash1",
            status="Submitted"
        )
        paper2 = Paper(
            id="paper-2",
            author_id=author.id,
            title="Test Paper 2",
            abstract="Abstract for paper 2",
            keywords=["test", "research"],
            original_filename="paper2.pdf",
            anonymized_filename="PAPER-paper-2-0001.pdf",
            file_hash="hash2",
            status="Under Review"
        )
        db.add(paper1)
        db.add(paper2)
        db.commit()
        
        return {
            "user": author_user,
            "author": author,
            "papers": [paper1, paper2]
        }
    finally:
        db.close()


def login_user(email: str, password: str):
    """Helper function to login and get cookies."""
    response = client.post(
        "/auth/login",
        json={"email": email, "password": password}
    )
    return response.cookies


def test_export_papers_as_admin(test_admin, test_author_with_papers):
    """Test exporting papers to CSV as admin."""
    # Login as admin
    cookies = login_user(test_admin["email"], test_admin["password"])
    
    # Export papers
    response = client.get("/papers/export", cookies=cookies)
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert "attachment" in response.headers["content-disposition"]
    assert "papers_export_" in response.headers["content-disposition"]
    
    # Parse CSV content
    csv_content = response.text
    csv_reader = csv.reader(io.StringIO(csv_content))
    rows = list(csv_reader)
    
    # Check header row
    assert len(rows) > 0
    header = rows[0]
    assert "Paper ID" in header
    assert "Title" in header
    assert "Author Name" in header
    assert "Status" in header
    
    # Check data rows (should have 2 papers)
    assert len(rows) == 3  # Header + 2 papers
    
    # Verify paper data
    paper_titles = [row[1] for row in rows[1:]]  # Title is second column
    assert "Test Paper 1" in paper_titles
    assert "Test Paper 2" in paper_titles


def test_export_papers_with_filters(test_admin, test_author_with_papers):
    """Test exporting papers with status filter."""
    # Login as admin
    cookies = login_user(test_admin["email"], test_admin["password"])
    
    # Export papers with status filter
    response = client.get("/papers/export?status=Submitted", cookies=cookies)
    
    assert response.status_code == 200
    
    # Parse CSV content
    csv_content = response.text
    csv_reader = csv.reader(io.StringIO(csv_content))
    rows = list(csv_reader)
    
    # Should only have 1 paper with "Submitted" status
    assert len(rows) == 2  # Header + 1 paper
    assert "Test Paper 1" in rows[1][1]  # Title column


def test_export_papers_unauthorized(test_author_with_papers):
    """Test that non-admin users cannot export papers."""
    # Try to export without authentication
    response = client.get("/papers/export")
    
    assert response.status_code == 401


def test_export_audit_logs_as_admin(test_admin):
    """Test exporting audit logs to CSV as admin."""
    db = TestingSessionLocal()
    try:
        # Create test audit logs
        log1 = AuditLog(
            user_id=test_admin["user"].id,
            action="login",
            resource_type="user",
            resource_id=test_admin["user"].id,
            ip_address="127.0.0.1",
            user_agent="test-agent"
        )
        log2 = AuditLog(
            user_id=test_admin["user"].id,
            action="file_upload",
            resource_type="paper",
            resource_id="paper-1",
            ip_address="127.0.0.1",
            user_agent="test-agent"
        )
        db.add(log1)
        db.add(log2)
        db.commit()
    finally:
        db.close()
    
    # Login as admin
    cookies = login_user(test_admin["email"], test_admin["password"])
    
    # Export audit logs
    response = client.get("/audit/export", cookies=cookies)
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert "attachment" in response.headers["content-disposition"]
    assert "audit_logs_export_" in response.headers["content-disposition"]
    
    # Parse CSV content
    csv_content = response.text
    csv_reader = csv.reader(io.StringIO(csv_content))
    rows = list(csv_reader)
    
    # Check header row
    assert len(rows) > 0
    header = rows[0]
    assert "Log ID" in header
    assert "User Email" in header
    assert "Action" in header
    assert "Resource Type" in header
    
    # Check data rows (should have 2 logs)
    assert len(rows) == 3  # Header + 2 logs


def test_export_audit_logs_with_filter(test_admin):
    """Test exporting audit logs with action filter."""
    db = TestingSessionLocal()
    try:
        # Create test audit logs
        log1 = AuditLog(
            user_id=test_admin["user"].id,
            action="login",
            resource_type="user",
            resource_id=test_admin["user"].id,
            ip_address="127.0.0.1",
            user_agent="test-agent"
        )
        log2 = AuditLog(
            user_id=test_admin["user"].id,
            action="file_upload",
            resource_type="paper",
            resource_id="paper-1",
            ip_address="127.0.0.1",
            user_agent="test-agent"
        )
        db.add(log1)
        db.add(log2)
        db.commit()
    finally:
        db.close()
    
    # Login as admin
    cookies = login_user(test_admin["email"], test_admin["password"])
    
    # Export audit logs with action filter
    response = client.get("/audit/export?action=login", cookies=cookies)
    
    assert response.status_code == 200
    
    # Parse CSV content
    csv_content = response.text
    csv_reader = csv.reader(io.StringIO(csv_content))
    rows = list(csv_reader)
    
    # Should only have 1 log with "login" action
    assert len(rows) == 2  # Header + 1 log
    assert "login" in rows[1][3]  # Action column


def test_export_audit_logs_unauthorized():
    """Test that non-admin users cannot export audit logs."""
    # Try to export without authentication
    response = client.get("/audit/export")
    
    assert response.status_code == 401
