"""
Review models for peer review management.
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


def generate_uuid():
    """Generate a UUID string for primary keys."""
    return str(uuid.uuid4())


class ReviewAssignment(Base):
    """Review assignment model for assigning reviewers to papers."""
    __tablename__ = "review_assignments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    paper_id = Column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(String(36), ForeignKey("reviewers.id"), nullable=False, index=True)
    assigned_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    deadline = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), nullable=False, index=True)
    
    # Relationships
    paper = relationship("Paper", back_populates="review_assignments")
    reviewer = relationship("Reviewer", back_populates="review_assignments")
    assigner = relationship("User")
    review = relationship("Review", back_populates="assignment", uselist=False, cascade="all, delete-orphan")
    
    # Unique constraint on paper_id and reviewer_id
    __table_args__ = (
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
    )


class Review(Base):
    """Review model for reviewer submissions."""
    __tablename__ = "reviews"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    assignment_id = Column(String(36), ForeignKey("review_assignments.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    recommendation = Column(String(50), nullable=False)
    comments_for_author = Column(Text, nullable=True)
    comments_for_editor = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    review_file = Column(String(255), nullable=True)
    
    # Relationships
    assignment = relationship("ReviewAssignment", back_populates="review")
