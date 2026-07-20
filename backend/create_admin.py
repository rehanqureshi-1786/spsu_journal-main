"""
Create an admin user for The Essence Journal System.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import hash_password
import uuid

# Import ALL models to ensure they're registered
from app.users.models import Role, User
from app.authors.models import Author
from app.reviewers.models import Reviewer
from app.papers.models import Paper, PaperVersion, PaperStatusHistory
from app.reviews.models import ReviewAssignment, Review
from app.publications.models import Volume, Issue, Publication
from app.audit.models import AuditLog

def create_admin():
    """Create an admin user."""
    db = SessionLocal()
    
    try:
        # Admin credentials
        admin_email = "admin@essence.com"
        admin_password = "Admin123!"
        
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if existing_admin:
            print(f"✓ Admin user already exists: {admin_email}")
            print(f"  Email: {admin_email}")
            print(f"  Password: Admin123!")
            return
        
        # Get admin role
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            print("✗ Admin role not found. Please run init_db.py first.")
            return
        
        # Create admin user
        admin_user = User(
            id=str(uuid.uuid4()),
            email=admin_email,
            password_hash=hash_password(admin_password),
            role_id=admin_role.id,
            is_active=True,
        )
        
        db.add(admin_user)
        db.commit()
        
        print("=" * 60)
        print("✅ Admin User Created Successfully!")
        print("=" * 60)
        print(f"\nEmail:    {admin_email}")
        print(f"Password: {admin_password}")
        print("\nYou can now:")
        print("  1. Login at: http://localhost:8000/docs")
        print("  2. Use /auth/login endpoint")
        print("  3. Create reviewers via /reviewers endpoint")
        print("  4. Manage all system resources")
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"✗ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
