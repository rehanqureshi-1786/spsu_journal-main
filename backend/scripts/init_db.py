"""
Database initialization script.
Creates initial roles and optionally creates an admin user.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.core.database import engine, SessionLocal, Base
from app.core.config import settings
import uuid

# Import ALL models to ensure they're registered with Base
from app.users.models import Role, User
from app.authors.models import Author
from app.reviewers.models import Reviewer
from app.papers.models import Paper, PaperVersion, PaperStatusHistory
from app.reviews.models import ReviewAssignment, Review
from app.publications.models import Volume, Issue, Publication
from app.audit.models import AuditLog


def generate_uuid():
    """Generate a UUID string."""
    return str(uuid.uuid4())


def init_roles(db: Session):
    """Initialize default roles."""
    roles_data = [
        {
            "id": generate_uuid(),
            "name": "admin",
            "permissions": {
                "can_manage_users": True,
                "can_manage_reviewers": True,
                "can_assign_reviewers": True,
                "can_manage_papers": True,
                "can_publish": True,
                "can_view_audit_logs": True,
            }
        },
        {
            "id": generate_uuid(),
            "name": "reviewer",
            "permissions": {
                "can_view_assigned_papers": True,
                "can_submit_reviews": True,
            }
        },
        {
            "id": generate_uuid(),
            "name": "author",
            "permissions": {
                "can_submit_papers": True,
                "can_view_own_papers": True,
                "can_upload_revisions": True,
            }
        },
        {
            "id": generate_uuid(),
            "name": "public",
            "permissions": {
                "can_view_published": True,
            }
        },
    ]
    
    for role_data in roles_data:
        existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing_role:
            role = Role(**role_data)
            db.add(role)
            print(f"✓ Created role: {role_data['name']}")
        else:
            print(f"- Role already exists: {role_data['name']}")
    
    db.commit()


def create_admin_user(db: Session, email: str, password: str):
    """Create an admin user."""
    from passlib.context import CryptContext
    
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        print(f"- Admin user already exists: {email}")
        return
    
    # Get admin role
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        print("✗ Admin role not found. Please run init_roles first.")
        return
    
    # Create admin user
    admin_user = User(
        id=generate_uuid(),
        email=email,
        password_hash=pwd_context.hash(password),
        role_id=admin_role.id,
        is_active=True,
    )
    
    db.add(admin_user)
    db.commit()
    print(f"✓ Created admin user: {email}")


def main():
    """Main initialization function."""
    print("=" * 60)
    print("The Essence - Database Initialization")
    print("=" * 60)
    
    # Create all tables
    print("\n1. Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")
    
    # Initialize roles
    print("\n2. Initializing roles...")
    db = SessionLocal()
    try:
        init_roles(db)
    finally:
        db.close()
    
    # Optionally create admin user
    print("\n3. Admin user setup")
    create_admin = input("Create admin user? (y/n): ").lower().strip()
    if create_admin == 'y':
        email = input("Admin email: ").strip()
        password = input("Admin password: ").strip()
        
        db = SessionLocal()
        try:
            create_admin_user(db, email, password)
        finally:
            db.close()
    
    print("\n" + "=" * 60)
    print("✓ Database initialization complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
