"""
Tests for file access middleware.

Tests role-based file access verification, anonymization enforcement,
and public access control for published papers.

Requirements: 4.3, 10.6, 10.7
"""
import pytest
import os
import tempfile
from sqlalchemy.orm import Session

from app.middleware.file_access_middleware import FileAccessControl, verify_file_access
from app.users.models import User, Role
from app.authors.models import Author
from app.reviewers.models import Reviewer
from app.papers.models import Paper
from app.publications.models import Volume, Issue, Publication
from app.reviews.models import ReviewAssignment
from tests.conftest import TestingSessionLocal
from fastapi import HTTPException


@pytest.fixture
def db_session():
    """Create a test database session."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_roles(db_session):
    """Create test roles."""
    roles = {
        "admin": Role(id="admin-role-id", name="admin"),
        "author": Role(id="author-role-id", name="author"),
        "reviewer": Role(id="reviewer-role-id", name="reviewer"),
    }
    for role in roles.values():
        db_session.add(role)
    db_session.commit()
    return roles


@pytest.fixture
def test_users(db_session, test_roles):
    """Create test users with different roles."""
    from app.core.security import hash_password
    
    users = {
        "admin": User(
            id="admin-user-id",
            email="admin@test.com",
            password_hash=hash_password("password"),
            role_id=test_roles["admin"].id,
            is_active=True
        ),
        "author": User(
            id="author-user-id",
            email="author@test.com",
            password_hash=hash_password("password"),
            role_id=test_roles["author"].id,
            is_active=True
        ),
        "reviewer": User(
            id="reviewer-user-id",
            email="reviewer@test.com",
            password_hash=hash_password("password"),
            role_id=test_roles["reviewer"].id,
            is_active=True
        ),
    }
    
    for user in users.values():
        db_session.add(user)
    db_session.commit()
    
    # Refresh to load relationships
    for user in users.values():
        db_session.refresh(user)
    
    return users


@pytest.fixture
def test_author_profile(db_session, test_users):
    """Create test author profile."""
    author = Author(
        id="author-profile-id",
        user_id=test_users["author"].id,
        first_name="Test",
        last_name="Author",
        affiliation="Test University",
        orcid=None
    )
    db_session.add(author)
    db_session.commit()
    db_session.refresh(author)
    return author


@pytest.fixture
def test_reviewer_profile(db_session, test_users):
    """Create test reviewer profile."""
    reviewer = Reviewer(
        id="reviewer-profile-id",
        user_id=test_users["reviewer"].id,
        first_name="Test",
        last_name="Reviewer",
        affiliation="Test University",
        expertise=["AI", "ML"]
    )
    db_session.add(reviewer)
    db_session.commit()
    db_session.refresh(reviewer)
    return reviewer


@pytest.fixture
def test_paper(db_session, test_author_profile):
    """Create a test paper."""
    paper = Paper(
        id="test-paper-id",
        author_id=test_author_profile.id,
        title="Test Paper",
        abstract="Test abstract",
        keywords=["test"],
        original_filename="original_paper.pdf",
        anonymized_filename="PAPER-test-paper-id-0001.pdf",
        file_hash="test-hash",
        status="Submitted"
    )
    db_session.add(paper)
    db_session.commit()
    db_session.refresh(paper)
    return paper


@pytest.fixture
def test_file(tmp_path):
    """Create a temporary test file."""
    file_path = tmp_path / "PAPER-test-paper-id-0001.pdf"
    file_path.write_bytes(b"%PDF-1.4\nTest content")
    return str(file_path)


def test_admin_has_unrestricted_access(db_session, test_users, test_paper, test_file):
    """Test that admin has unrestricted access to all manuscripts."""
    admin_user = test_users["admin"]
    
    has_access, reason = FileAccessControl.verify_manuscript_access(
        db=db_session,
        paper=test_paper,
        current_user=admin_user,
        file_path=test_file
    )
    
    assert has_access is True
    assert "Admin unrestricted access" in reason


def test_author_can_access_own_paper(db_session, test_users, test_paper, test_file):
    """Test that author can access their own manuscript."""
    author_user = test_users["author"]
    
    has_access, reason = FileAccessControl.verify_manuscript_access(
        db=db_session,
        paper=test_paper,
        current_user=author_user,
        file_path=test_file
    )
    
    assert has_access is True
    assert "Author access to own manuscript" in reason


def test_author_cannot_access_other_paper(db_session, test_users, test_paper, test_file):
    """Test that author cannot access another author's manuscript."""
    # Create another author
    from app.core.security import hash_password
    
    other_role = db_session.query(Role).filter(Role.name == "author").first()
    other_user = User(
        id="other-author-user-id",
        email="other@test.com",
        password_hash=hash_password("password"),
        role_id=other_role.id,
        is_active=True
    )
    db_session.add(other_user)
    db_session.commit()
    db_session.refresh(other_user)
    
    has_access, reason = FileAccessControl.verify_manuscript_access(
        db=db_session,
        paper=test_paper,
        current_user=other_user,
        file_path=test_file
    )
    
    assert has_access is False
    assert "Authors can only access their own manuscripts" in reason


def test_reviewer_can_access_assigned_paper(db_session, test_users, test_reviewer_profile, test_paper, test_file):
    """Test that reviewer can access assigned manuscript."""
    from datetime import datetime
    reviewer_user = test_users["reviewer"]
    
    # Create review assignment
    assignment = ReviewAssignment(
        id="test-assignment-id",
        paper_id=test_paper.id,
        reviewer_id=test_reviewer_profile.id,
        assigned_by=test_users["admin"].id,
        deadline=datetime(2024, 12, 31),
        status="pending"
    )
    db_session.add(assignment)
    db_session.commit()
    
    has_access, reason = FileAccessControl.verify_manuscript_access(
        db=db_session,
        paper=test_paper,
        current_user=reviewer_user,
        file_path=test_file
    )
    
    assert has_access is True
    assert "Reviewer access to assigned manuscript" in reason


def test_reviewer_cannot_access_unassigned_paper(db_session, test_users, test_reviewer_profile, test_paper, test_file):
    """Test that reviewer cannot access unassigned manuscript."""
    reviewer_user = test_users["reviewer"]
    
    has_access, reason = FileAccessControl.verify_manuscript_access(
        db=db_session,
        paper=test_paper,
        current_user=reviewer_user,
        file_path=test_file
    )
    
    assert has_access is False
    assert "Reviewers can only access assigned manuscripts" in reason


def test_public_cannot_access_unpublished_paper(db_session, test_paper, test_file):
    """Test that public users cannot access unpublished manuscripts."""
    has_access, reason = FileAccessControl.verify_manuscript_access(
        db=db_session,
        paper=test_paper,
        current_user=None,
        file_path=test_file
    )
    
    assert has_access is False
    assert "Authentication required" in reason


def test_public_can_access_published_paper(db_session, test_paper, test_file):
    """Test that public users can access published manuscripts."""
    from datetime import date
    
    # Create volume, issue, and publication
    volume = Volume(
        id="test-volume-id",
        volume_number=1,
        year=2024,
        title="Volume 1"
    )
    db_session.add(volume)
    db_session.commit()
    
    issue = Issue(
        id="test-issue-id",
        volume_id=volume.id,
        issue_number=1,
        publication_date=date(2024, 1, 1),
        title="Issue 1"
    )
    db_session.add(issue)
    db_session.commit()
    
    # Update paper status to Published
    test_paper.status = "Published"
    db_session.commit()
    
    publication = Publication(
        id="test-publication-id",
        paper_id=test_paper.id,
        issue_id=issue.id,
        page_start=1,
        page_end=10
    )
    db_session.add(publication)
    db_session.commit()
    
    has_access, reason = FileAccessControl.verify_manuscript_access(
        db=db_session,
        paper=test_paper,
        current_user=None,
        file_path=test_file
    )
    
    assert has_access is True
    assert "Public access to published paper" in reason


def test_anonymization_for_reviewer(db_session, test_users, test_paper):
    """Test that reviewers get anonymized filename."""
    reviewer_user = test_users["reviewer"]
    
    filename = FileAccessControl.get_download_filename(
        current_user=reviewer_user,
        paper=test_paper
    )
    
    assert filename == test_paper.anonymized_filename


def test_original_filename_for_author(db_session, test_users, test_paper):
    """Test that authors get original filename."""
    author_user = test_users["author"]
    
    filename = FileAccessControl.get_download_filename(
        current_user=author_user,
        paper=test_paper
    )
    
    assert filename == test_paper.original_filename


def test_original_filename_for_admin(db_session, test_users, test_paper):
    """Test that admins get original filename."""
    admin_user = test_users["admin"]
    
    filename = FileAccessControl.get_download_filename(
        current_user=admin_user,
        paper=test_paper
    )
    
    assert filename == test_paper.original_filename


def test_original_filename_for_public(db_session, test_paper):
    """Test that public users get original filename for published papers."""
    filename = FileAccessControl.get_download_filename(
        current_user=None,
        paper=test_paper
    )
    
    assert filename == test_paper.original_filename


def test_file_not_found(db_session, test_users, test_paper):
    """Test that non-existent files are properly handled."""
    admin_user = test_users["admin"]
    
    has_access, reason = FileAccessControl.verify_manuscript_access(
        db=db_session,
        paper=test_paper,
        current_user=admin_user,
        file_path="/nonexistent/file.pdf"
    )
    
    assert has_access is False
    assert "File not found" in reason
