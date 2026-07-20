"""
Tests for review management endpoints.
Tests reviewer assignment, review submission, and review retrieval.
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from io import BytesIO

from app.main import app
from app.core.security import hash_password
from app.users.models import User, Role
from app.authors.models import Author
from app.reviewers.models import Reviewer
from app.papers.models import Paper
from app.reviews.models import ReviewAssignment, Review
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
        "password": "password123"
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
        affiliation="Review University",
        expertise=["Computer Science", "AI"]
    )
    db.add(reviewer)
    db.commit()
    db.refresh(reviewer)
    
    result = {
        "user_id": user.id,
        "reviewer_id": reviewer.id,
        "email": user.email,
        "password": "reviewer123"
    }
    
    db.close()
    return result


@pytest.fixture
def test_paper(test_author):
    """Create a test paper."""
    db = TestingSessionLocal()
    
    paper = Paper(
        author_id=test_author["author_id"],
        title="Test Paper",
        abstract="This is a test abstract",
        keywords=["test", "paper"],
        original_filename="test.pdf",
        anonymized_filename="PAPER-test-0001.pdf",
        file_hash="testhash123",
        status="Submitted"
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)
    
    result = {
        "paper_id": paper.id,
        "title": paper.title
    }
    
    db.close()
    return result


def get_auth_token(email: str, password: str):
    """Helper function to get authentication token."""
    response = client.post(
        "/auth/login",
        json={"email": email, "password": password}
    )
    assert response.status_code == 200
    # Extract token from cookies
    return response.cookies.get("access_token")


def test_assign_reviewer_as_admin(test_admin, test_reviewer, test_paper):
    """Test assigning a reviewer to a paper as admin."""
    # Login as admin
    token = get_auth_token(test_admin["email"], test_admin["password"])
    
    # Assign reviewer
    deadline = (datetime.now() + timedelta(days=14)).isoformat()
    response = client.post(
        "/reviews/assign",
        json={
            "paper_id": test_paper["paper_id"],
            "reviewer_id": test_reviewer["reviewer_id"],
            "deadline": deadline
        },
        cookies={"access_token": token}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["paper_id"] == test_paper["paper_id"]
    assert data["reviewer_id"] == test_reviewer["reviewer_id"]
    assert data["status"] == "pending"


def test_assign_reviewer_as_non_admin_fails(test_author, test_reviewer, test_paper):
    """Test that non-admin users cannot assign reviewers."""
    # Login as author
    token = get_auth_token(test_author["email"], test_author["password"])
    
    # Try to assign reviewer
    deadline = (datetime.now() + timedelta(days=14)).isoformat()
    response = client.post(
        "/reviews/assign",
        json={
            "paper_id": test_paper["paper_id"],
            "reviewer_id": test_reviewer["reviewer_id"],
            "deadline": deadline
        },
        cookies={"access_token": token}
    )
    
    assert response.status_code == 403


def test_get_reviewer_assignments(test_admin, test_reviewer, test_paper):
    """Test getting reviewer assignments."""
    # Login as admin and assign reviewer
    admin_token = get_auth_token(test_admin["email"], test_admin["password"])
    deadline = (datetime.now() + timedelta(days=14)).isoformat()
    
    assign_response = client.post(
        "/reviews/assign",
        json={
            "paper_id": test_paper["paper_id"],
            "reviewer_id": test_reviewer["reviewer_id"],
            "deadline": deadline
        },
        cookies={"access_token": admin_token}
    )
    assert assign_response.status_code == 201
    
    # Login as reviewer and get assignments
    reviewer_token = get_auth_token(test_reviewer["email"], test_reviewer["password"])
    response = client.get(
        "/reviews/assignments",
        cookies={"access_token": reviewer_token}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["paper_id"] == test_paper["paper_id"]
    assert data[0]["paper_title"] == test_paper["title"]


def test_submit_review(test_admin, test_reviewer, test_paper):
    """Test submitting a review."""
    # Login as admin and assign reviewer
    admin_token = get_auth_token(test_admin["email"], test_admin["password"])
    deadline = (datetime.now() + timedelta(days=14)).isoformat()
    
    assign_response = client.post(
        "/reviews/assign",
        json={
            "paper_id": test_paper["paper_id"],
            "reviewer_id": test_reviewer["reviewer_id"],
            "deadline": deadline
        },
        cookies={"access_token": admin_token}
    )
    assert assign_response.status_code == 201
    assignment_id = assign_response.json()["id"]
    
    # Login as reviewer and submit review
    reviewer_token = get_auth_token(test_reviewer["email"], test_reviewer["password"])
    response = client.post(
        "/reviews",
        json={
            "assignment_id": assignment_id,
            "recommendation": "accept",
            "comments_for_author": "Great paper!",
            "comments_for_editor": "I recommend acceptance."
        },
        cookies={"access_token": reviewer_token}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["recommendation"] == "accept"
    assert data["comments_for_author"] == "Great paper!"


def test_get_reviews_for_paper_as_author(test_admin, test_author, test_reviewer, test_paper):
    """Test getting reviews for a paper as the author."""
    # Login as admin and assign reviewer
    admin_token = get_auth_token(test_admin["email"], test_admin["password"])
    deadline = (datetime.now() + timedelta(days=14)).isoformat()
    
    assign_response = client.post(
        "/reviews/assign",
        json={
            "paper_id": test_paper["paper_id"],
            "reviewer_id": test_reviewer["reviewer_id"],
            "deadline": deadline
        },
        cookies={"access_token": admin_token}
    )
    assignment_id = assign_response.json()["id"]
    
    # Login as reviewer and submit review
    reviewer_token = get_auth_token(test_reviewer["email"], test_reviewer["password"])
    client.post(
        "/reviews",
        json={
            "assignment_id": assignment_id,
            "recommendation": "minor_revision",
            "comments_for_author": "Please address these issues.",
            "comments_for_editor": "Minor revisions needed."
        },
        cookies={"access_token": reviewer_token}
    )
    
    # Login as author and get reviews
    author_token = get_auth_token(test_author["email"], test_author["password"])
    response = client.get(
        f"/reviews/paper/{test_paper['paper_id']}",
        cookies={"access_token": author_token}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["reviews"][0]["reviewer_identity"] == "Reviewer #1"
    assert data["reviews"][0]["comments_for_author"] == "Please address these issues."
    # comments_for_editor should not be present for authors
    assert "comments_for_editor" not in data["reviews"][0] or data["reviews"][0]["comments_for_editor"] is None


def test_get_reviews_for_paper_as_admin(test_admin, test_reviewer, test_paper):
    """Test getting reviews for a paper as admin."""
    # Login as admin and assign reviewer
    admin_token = get_auth_token(test_admin["email"], test_admin["password"])
    deadline = (datetime.now() + timedelta(days=14)).isoformat()
    
    assign_response = client.post(
        "/reviews/assign",
        json={
            "paper_id": test_paper["paper_id"],
            "reviewer_id": test_reviewer["reviewer_id"],
            "deadline": deadline
        },
        cookies={"access_token": admin_token}
    )
    assignment_id = assign_response.json()["id"]
    
    # Login as reviewer and submit review
    reviewer_token = get_auth_token(test_reviewer["email"], test_reviewer["password"])
    client.post(
        "/reviews",
        json={
            "assignment_id": assignment_id,
            "recommendation": "reject",
            "comments_for_author": "Not suitable.",
            "comments_for_editor": "Quality issues."
        },
        cookies={"access_token": reviewer_token}
    )
    
    # Get reviews as admin
    response = client.get(
        f"/reviews/paper/{test_paper['paper_id']}",
        cookies={"access_token": admin_token}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    # Admin should see full reviewer name
    assert "Test Reviewer" in data["reviews"][0]["reviewer_identity"]
    # Admin should see comments_for_editor
    assert data["reviews"][0]["comments_for_editor"] == "Quality issues."


def test_duplicate_assignment_fails(test_admin, test_reviewer, test_paper):
    """Test that duplicate reviewer assignments are prevented."""
    # Login as admin
    token = get_auth_token(test_admin["email"], test_admin["password"])
    deadline = (datetime.now() + timedelta(days=14)).isoformat()
    
    # First assignment
    response1 = client.post(
        "/reviews/assign",
        json={
            "paper_id": test_paper["paper_id"],
            "reviewer_id": test_reviewer["reviewer_id"],
            "deadline": deadline
        },
        cookies={"access_token": token}
    )
    assert response1.status_code == 201
    
    # Try duplicate assignment
    response2 = client.post(
        "/reviews/assign",
        json={
            "paper_id": test_paper["paper_id"],
            "reviewer_id": test_reviewer["reviewer_id"],
            "deadline": deadline
        },
        cookies={"access_token": token}
    )
    assert response2.status_code == 409


def test_reviewer_cannot_submit_review_for_unassigned_paper(test_admin, test_reviewer, test_paper):
    """Test that reviewers cannot submit reviews for papers not assigned to them."""
    # Login as reviewer (no assignment made)
    reviewer_token = get_auth_token(test_reviewer["email"], test_reviewer["password"])
    
    # Try to submit review with fake assignment ID
    response = client.post(
        "/reviews",
        json={
            "assignment_id": "fake-assignment-id",
            "recommendation": "accept",
            "comments_for_author": "Great!",
            "comments_for_editor": "Accept."
        },
        cookies={"access_token": reviewer_token}
    )
    
    assert response.status_code == 404
