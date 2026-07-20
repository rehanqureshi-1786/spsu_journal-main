"""
Tests for paper management endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from io import BytesIO

from app.main import app
from app.core.security import hash_password
from app.users.models import User, Role
from app.authors.models import Author
from app.papers.models import Paper
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
        "password": "password123"
    }
    
    db.close()
    return result


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


def login_user(email: str, password: str):
    """Helper function to login and get cookies."""
    response = client.post(
        "/auth/login",
        json={"email": email, "password": password}
    )
    assert response.status_code == 200
    return response.cookies


def test_submit_paper_success(test_author):
    """Test successful paper submission by author."""
    # Login as author
    cookies = login_user(test_author["email"], test_author["password"])
    
    # Create a fake PDF file
    pdf_content = b"%PDF-1.4\n%Test PDF content"
    files = {
        "file": ("test_paper.pdf", BytesIO(pdf_content), "application/pdf")
    }
    data = {
        "title": "Test Paper Title",
        "abstract": "This is a test abstract for the paper.",
        "keywords": "machine learning, AI, testing"
    }
    
    # Submit paper
    response = client.post(
        "/papers",
        files=files,
        data=data,
        cookies=cookies
    )
    
    assert response.status_code == 201
    paper_data = response.json()
    
    assert paper_data["title"] == "Test Paper Title"
    assert paper_data["abstract"] == "This is a test abstract for the paper."
    assert paper_data["keywords"] == ["machine learning", "AI", "testing"]
    assert paper_data["status"] == "Submitted"
    assert "id" in paper_data
    assert "submitted_at" in paper_data


def test_submit_paper_invalid_file_type(test_author):
    """Test paper submission with invalid file type."""
    cookies = login_user(test_author["email"], test_author["password"])
    
    # Create a fake text file
    files = {
        "file": ("test_paper.txt", BytesIO(b"Not a PDF"), "text/plain")
    }
    data = {
        "title": "Test Paper Title",
        "abstract": "This is a test abstract.",
        "keywords": "testing"
    }
    
    response = client.post(
        "/papers",
        files=files,
        data=data,
        cookies=cookies
    )
    
    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]


def test_get_papers_as_author(test_author):
    """Test getting papers as author (should see only own papers)."""
    cookies = login_user(test_author["email"], test_author["password"])
    
    # Submit a paper first
    pdf_content = b"%PDF-1.4\n%Test PDF content"
    files = {
        "file": ("test_paper.pdf", BytesIO(pdf_content), "application/pdf")
    }
    data = {
        "title": "Test Paper",
        "abstract": "Test abstract",
        "keywords": "test"
    }
    
    client.post("/papers", files=files, data=data, cookies=cookies)
    
    # Get papers
    response = client.get("/papers", cookies=cookies)
    
    assert response.status_code == 200
    papers = response.json()
    assert len(papers) == 1
    assert papers[0]["title"] == "Test Paper"


def test_get_paper_by_id(test_author):
    """Test getting a specific paper by ID."""
    cookies = login_user(test_author["email"], test_author["password"])
    
    # Submit a paper
    pdf_content = b"%PDF-1.4\n%Test PDF content"
    files = {
        "file": ("test_paper.pdf", BytesIO(pdf_content), "application/pdf")
    }
    data = {
        "title": "Test Paper",
        "abstract": "Test abstract",
        "keywords": "test"
    }
    
    submit_response = client.post("/papers", files=files, data=data, cookies=cookies)
    paper_id = submit_response.json()["id"]
    
    # Get paper by ID
    response = client.get(f"/papers/{paper_id}", cookies=cookies)
    
    assert response.status_code == 200
    paper = response.json()
    assert paper["id"] == paper_id
    assert paper["title"] == "Test Paper"


def test_update_paper_status_as_admin(test_author, test_admin):
    """Test updating paper status as admin."""
    # Submit paper as author
    author_cookies = login_user(test_author["email"], test_author["password"])
    
    pdf_content = b"%PDF-1.4\n%Test PDF content"
    files = {
        "file": ("test_paper.pdf", BytesIO(pdf_content), "application/pdf")
    }
    data = {
        "title": "Test Paper",
        "abstract": "Test abstract",
        "keywords": "test"
    }
    
    submit_response = client.post("/papers", files=files, data=data, cookies=author_cookies)
    paper_id = submit_response.json()["id"]
    
    # Login as admin and update status
    admin_cookies = login_user(test_admin["email"], test_admin["password"])
    
    response = client.put(
        f"/papers/{paper_id}/status",
        json={"status": "Under Review", "notes": "Moving to review"},
        cookies=admin_cookies
    )
    
    assert response.status_code == 200
    paper = response.json()
    assert paper["status"] == "Under Review"


def test_get_paper_timeline(test_author):
    """Test getting paper timeline."""
    cookies = login_user(test_author["email"], test_author["password"])
    
    # Submit paper
    pdf_content = b"%PDF-1.4\n%Test PDF content"
    files = {
        "file": ("test_paper.pdf", BytesIO(pdf_content), "application/pdf")
    }
    data = {
        "title": "Test Paper",
        "abstract": "Test abstract",
        "keywords": "test"
    }
    
    submit_response = client.post("/papers", files=files, data=data, cookies=cookies)
    paper_id = submit_response.json()["id"]
    
    # Get timeline
    response = client.get(f"/papers/{paper_id}/timeline", cookies=cookies)
    
    assert response.status_code == 200
    timeline = response.json()
    assert timeline["paper_id"] == paper_id
    assert len(timeline["timeline"]) >= 1
    assert timeline["timeline"][0]["status"] == "Submitted"


def test_unauthorized_access(test_author):
    """Test that unauthenticated users cannot access papers."""
    response = client.get("/papers")
    assert response.status_code == 401


def test_author_cannot_update_status(test_author):
    """Test that authors cannot update paper status."""
    cookies = login_user(test_author["email"], test_author["password"])
    
    # Submit paper
    pdf_content = b"%PDF-1.4\n%Test PDF content"
    files = {
        "file": ("test_paper.pdf", BytesIO(pdf_content), "application/pdf")
    }
    data = {
        "title": "Test Paper",
        "abstract": "Test abstract",
        "keywords": "test"
    }
    
    submit_response = client.post("/papers", files=files, data=data, cookies=cookies)
    paper_id = submit_response.json()["id"]
    
    # Try to update status
    response = client.put(
        f"/papers/{paper_id}/status",
        json={"status": "Accepted"},
        cookies=cookies
    )
    
    assert response.status_code == 403
