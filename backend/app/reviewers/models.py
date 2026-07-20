"""
Reviewer model for manuscript reviewers.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


def generate_uuid():
    """Generate a UUID string for primary keys."""
    return str(uuid.uuid4())


class Reviewer(Base):
    """Reviewer model for users who review manuscripts."""
    __tablename__ = "reviewers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    expertise = Column(JSON, nullable=True)  # List of research areas
    affiliation = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", backref="reviewer")
    review_assignments = relationship("ReviewAssignment", back_populates="reviewer", cascade="all, delete-orphan")
