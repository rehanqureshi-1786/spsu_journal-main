"""
Shared pytest configuration and fixtures for all tests.
This ensures all models are imported before database setup.
"""
import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.core.database import Base, get_db
from app.main import app

# Import ALL models to ensure they're registered with Base
from app.users.models import User, Role
from app.authors.models import Author
from app.reviewers.models import Reviewer
from app.papers.models import Paper, PaperVersion, PaperStatusHistory
from app.reviews.models import ReviewAssignment, Review
from app.publications.models import Volume, Issue, Publication
from app.audit.models import AuditLog
from app.certificates.models import Certificate, CertificateAuditLog
from app.events.models import Event


# Test database setup
TEST_DATABASE_URL = "sqlite:///./test_shared.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


# Override the database dependency
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create all tables once for the entire test session."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    yield
    # Drop all tables after all tests
    Base.metadata.drop_all(bind=engine)
    # Clean up test database file
    if os.path.exists("./test_shared.db"):
        try:
            os.remove("./test_shared.db")
        except PermissionError:
            pass  # File might be locked on Windows


@pytest.fixture(scope="function", autouse=True)
def clean_database():
    """Clean all tables before each test function."""
    db = TestingSessionLocal()
    try:
        # Delete all data from tables in reverse order of dependencies
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error cleaning database: {e}")
    finally:
        db.close()
    yield
    # Clean up after test as well
    db = TestingSessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def get_test_client():
    """Get test client for API testing."""
    return TestClient(app)


def get_test_db():
    """Get test database session."""
    return TestingSessionLocal()


# Fixtures for integration tests
@pytest.fixture
def client():
    """Provide test client for API testing."""
    return TestClient(app)


@pytest.fixture
def db():
    """Provide database session for tests."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def admin_user(db):
    """Create an admin user for testing."""
    from app.core.security import hash_password
    import uuid
    
    # Create admin role
    admin_role = Role(
        id=str(uuid.uuid4()),
        name="admin",
        permissions={}
    )
    db.add(admin_role)
    db.commit()
    
    # Create admin user
    admin = User(
        id=str(uuid.uuid4()),
        email="admin@test.com",
        password_hash=hash_password("password123"),
        role_id=admin_role.id,
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@pytest.fixture
def author_user(db):
    """Create an author user for testing."""
    from app.core.security import hash_password
    import uuid
    
    # Create author role
    author_role = db.query(Role).filter(Role.name == "author").first()
    if not author_role:
        author_role = Role(
            id=str(uuid.uuid4()),
            name="author",
            permissions={}
        )
        db.add(author_role)
        db.commit()
    
    # Create author user
    user = User(
        id=str(uuid.uuid4()),
        email="author@test.com",
        password_hash=hash_password("password123"),
        role_id=author_role.id,
        is_active=True
    )
    db.add(user)
    db.commit()
    
    # Create author profile
    author = Author(
        id=str(uuid.uuid4()),
        user_id=user.id,
        first_name="Test",
        last_name="Author",
        affiliation="Test University",
        orcid=None
    )
    db.add(author)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def reviewer_user(db):
    """Create a reviewer user for testing."""
    from app.core.security import hash_password
    import uuid
    
    # Create reviewer role
    reviewer_role = db.query(Role).filter(Role.name == "reviewer").first()
    if not reviewer_role:
        reviewer_role = Role(
            id=str(uuid.uuid4()),
            name="reviewer",
            permissions={}
        )
        db.add(reviewer_role)
        db.commit()
    
    # Create reviewer user
    user = User(
        id=str(uuid.uuid4()),
        email="reviewer@test.com",
        password_hash=hash_password("password123"),
        role_id=reviewer_role.id,
        is_active=True
    )
    db.add(user)
    db.commit()
    
    # Create reviewer profile
    reviewer = Reviewer(
        id=str(uuid.uuid4()),
        user_id=user.id,
        first_name="Test",
        last_name="Reviewer",
        affiliation="Test University",
        expertise=["testing", "integration"]
    )
    db.add(reviewer)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(client, admin_user):
    """Get authentication token for admin user."""
    response = client.post(
        "/auth/login",
        json={"email": "admin@test.com", "password": "password123"}
    )
    return response.json()["access_token"]


@pytest.fixture
def author_token(client, author_user):
    """Get authentication token for author user."""
    response = client.post(
        "/auth/login",
        json={"email": "author@test.com", "password": "password123"}
    )
    return response.json()["access_token"]


@pytest.fixture
def reviewer_token(client, reviewer_user):
    """Get authentication token for reviewer user."""
    response = client.post(
        "/auth/login",
        json={"email": "reviewer@test.com", "password": "password123"}
    )
    return response.json()["access_token"]


@pytest.fixture
def test_paper(db, author_user):
    """Create a test paper for testing."""
    import uuid
    
    # Get author profile
    author = db.query(Author).filter(Author.user_id == author_user.id).first()
    
    # Create paper
    paper = Paper(
        id=str(uuid.uuid4()),
        author_id=author.id,
        title="Test Paper",
        abstract="This is a test abstract",
        keywords=["test", "paper"],
        original_filename="test_paper.pdf",
        anonymized_filename=f"PAPER-{uuid.uuid4()}-0001.pdf",
        file_hash="test_hash",
        status="Submitted"
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)
    return paper


@pytest.fixture
def test_reviewer(db, reviewer_user):
    """Get test reviewer for testing."""
    return db.query(Reviewer).filter(Reviewer.user_id == reviewer_user.id).first()
