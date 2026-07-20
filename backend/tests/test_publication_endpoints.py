"""
Tests for publication endpoints.
"""
import pytest
import uuid
from fastapi.testclient import TestClient
from datetime import date

from app.main import app
from app.users.models import User, Role
from app.authors.models import Author
from app.papers.models import Paper
from app.publications.models import Volume, Issue, Publication
from app.core.security import hash_password, create_access_token
from tests.conftest import TestingSessionLocal


client = TestClient(app)


@pytest.fixture
def test_roles():
    """Create test roles."""
    db = TestingSessionLocal()
    
    admin_role = Role(
        id=str(uuid.uuid4()),
        name="admin",
        permissions={"all": True}
    )
    author_role = Role(
        id=str(uuid.uuid4()),
        name="author",
        permissions={"submit_papers": True}
    )
    
    db.add(admin_role)
    db.add(author_role)
    db.commit()
    
    admin_role_id = admin_role.id
    author_role_id = author_role.id
    
    db.close()
    return {"admin_id": admin_role_id, "author_id": author_role_id}


@pytest.fixture
def admin_user(test_roles):
    """Create admin user."""
    db = TestingSessionLocal()
    
    user = User(
        id=str(uuid.uuid4()),
        email="admin@example.com",
        password_hash=hash_password("adminpass"),
        role_id=test_roles["admin_id"],
        is_active=True
    )
    
    db.add(user)
    db.commit()
    
    user_id = user.id
    
    db.close()
    return {"id": user_id, "email": "admin@example.com"}


@pytest.fixture
def author_user(test_roles):
    """Create author user with author profile."""
    db = TestingSessionLocal()
    
    user = User(
        id=str(uuid.uuid4()),
        email="author@example.com",
        password_hash=hash_password("authorpass"),
        role_id=test_roles["author_id"],
        is_active=True
    )
    db.add(user)
    db.flush()
    
    author = Author(
        id=str(uuid.uuid4()),
        user_id=user.id,
        first_name="John",
        last_name="Doe",
        affiliation="University of Example"
    )
    db.add(author)
    db.commit()
    
    user_id = user.id
    author_id = author.id
    
    db.close()
    return {"id": user_id, "author_id": author_id, "email": "author@example.com"}


@pytest.fixture
def admin_token(admin_user):
    """Generate admin access token."""
    return create_access_token({"sub": admin_user["id"], "role": "admin"})


@pytest.fixture
def author_token(author_user):
    """Generate author access token."""
    return create_access_token({"sub": author_user["id"], "role": "author"})


def create_test_paper(author_id: str, status: str = "Submitted"):
    """Helper to create a test paper."""
    db = TestingSessionLocal()
    
    paper = Paper(
        id=str(uuid.uuid4()),
        author_id=author_id,
        title="Test Paper",
        abstract="Test abstract",
        keywords=["test", "paper"],
        original_filename="test.pdf",
        anonymized_filename=f"PAPER-{uuid.uuid4()}-0001.pdf",
        file_hash="abc123",
        status=status
    )
    db.add(paper)
    db.commit()
    
    paper_id = paper.id
    
    db.close()
    return paper_id


def test_create_volume_admin_only(admin_token):
    """Test that only admins can create volumes."""
    response = client.post(
        "/publications/volumes",
        json={
            "volume_number": 1,
            "year": 2024,
            "title": "Volume 1 - 2024"
        },
        cookies={"access_token": admin_token}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["volume_number"] == 1
    assert data["year"] == 2024
    assert data["title"] == "Volume 1 - 2024"


def test_create_volume_unauthorized(author_token):
    """Test that non-admins cannot create volumes."""
    response = client.post(
        "/publications/volumes",
        json={
            "volume_number": 1,
            "year": 2024,
            "title": "Volume 1 - 2024"
        },
        cookies={"access_token": author_token}
    )
    assert response.status_code == 403


def test_list_volumes_public():
    """Test that volumes can be listed without authentication."""
    response = client.get("/publications/volumes")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_issue_admin_only(admin_token):
    """Test that only admins can create issues."""
    # First create a volume
    volume_response = client.post(
        "/publications/volumes",
        json={
            "volume_number": 1,
            "year": 2024,
            "title": "Volume 1"
        },
        cookies={"access_token": admin_token}
    )
    volume_id = volume_response.json()["id"]
    
    # Create issue
    response = client.post(
        "/publications/issues",
        json={
            "volume_id": volume_id,
            "issue_number": 1,
            "publication_date": "2024-03-15",
            "title": "Spring Issue"
        },
        cookies={"access_token": admin_token}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["issue_number"] == 1
    assert data["volume_id"] == volume_id


def test_create_issue_requires_valid_volume(admin_token):
    """Test that issue creation requires a valid volume."""
    response = client.post(
        "/publications/issues",
        json={
            "volume_id": "invalid-uuid",
            "issue_number": 1,
            "publication_date": "2024-03-15",
            "title": "Spring Issue"
        },
        cookies={"access_token": admin_token}
    )
    assert response.status_code == 404


def test_list_issues_public():
    """Test that issues can be listed without authentication."""
    response = client.get("/publications/issues")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_publish_paper_admin_only(admin_token, author_user):
    """Test that only admins can publish papers."""
    # Create volume and issue
    volume_response = client.post(
        "/publications/volumes",
        json={"volume_number": 1, "year": 2024},
        cookies={"access_token": admin_token}
    )
    volume_id = volume_response.json()["id"]
    
    issue_response = client.post(
        "/publications/issues",
        json={
            "volume_id": volume_id,
            "issue_number": 1,
            "publication_date": "2024-03-15"
        },
        cookies={"access_token": admin_token}
    )
    issue_id = issue_response.json()["id"]
    
    # Create an accepted paper
    paper_id = create_test_paper(author_user["author_id"], status="Accepted")
    
    # Publish paper
    response = client.post(
        "/publications/publish",
        json={
            "paper_id": paper_id,
            "issue_id": issue_id,
            "page_start": 1,
            "page_end": 15
        },
        cookies={"access_token": admin_token}
    )
    if response.status_code != 201:
        print(f"Error response: {response.json()}")
    assert response.status_code == 201
    data = response.json()
    assert data["paper_id"] == paper_id
    assert data["issue_id"] == issue_id


def test_publish_paper_requires_accepted_status(admin_token, author_user):
    """Test that only accepted papers can be published."""
    # Create volume and issue
    volume_response = client.post(
        "/publications/volumes",
        json={"volume_number": 1, "year": 2024},
        cookies={"access_token": admin_token}
    )
    volume_id = volume_response.json()["id"]
    
    issue_response = client.post(
        "/publications/issues",
        json={
            "volume_id": volume_id,
            "issue_number": 1,
            "publication_date": "2024-03-15"
        },
        cookies={"access_token": admin_token}
    )
    issue_id = issue_response.json()["id"]
    
    # Create a submitted paper (not accepted)
    paper_id = create_test_paper(author_user["author_id"], status="Submitted")
    
    # Try to publish paper
    response = client.post(
        "/publications/publish",
        json={
            "paper_id": paper_id,
            "issue_id": issue_id
        },
        cookies={"access_token": admin_token}
    )
    assert response.status_code == 400
    assert "Accepted" in response.json()["detail"]


def test_get_published_paper_public(admin_token, author_user):
    """Test that published papers can be accessed without authentication."""
    # Create volume, issue, and publish a paper
    volume_response = client.post(
        "/publications/volumes",
        json={"volume_number": 1, "year": 2024},
        cookies={"access_token": admin_token}
    )
    volume_id = volume_response.json()["id"]
    
    issue_response = client.post(
        "/publications/issues",
        json={
            "volume_id": volume_id,
            "issue_number": 1,
            "publication_date": "2024-03-15"
        },
        cookies={"access_token": admin_token}
    )
    issue_id = issue_response.json()["id"]
    
    paper_id = create_test_paper(author_user["author_id"], status="Accepted")
    
    client.post(
        "/publications/publish",
        json={
            "paper_id": paper_id,
            "issue_id": issue_id
        },
        cookies={"access_token": admin_token}
    )
    
    # Access published paper without authentication
    response = client.get(f"/publications/papers/{paper_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == paper_id
    assert data["title"] == "Test Paper"
    assert "author_name" in data
    assert "author_affiliation" in data


def test_get_unpublished_paper_not_found(author_user):
    """Test that unpublished papers are not accessible via public endpoint."""
    paper_id = create_test_paper(author_user["author_id"], status="Submitted")
    
    response = client.get(f"/publications/papers/{paper_id}")
    assert response.status_code == 404
