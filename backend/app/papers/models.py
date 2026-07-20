"""
Paper models for manuscript management.
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


def generate_uuid():
    """Generate a UUID string for primary keys."""
    return str(uuid.uuid4())


class Paper(Base):
    """Paper model for submitted manuscripts."""
    __tablename__ = "papers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    author_id = Column(String(36), ForeignKey("authors.id"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    abstract = Column(Text, nullable=False)
    keywords = Column(JSON, nullable=True)  # List of keywords
    original_filename = Column(String(255), nullable=False)
    anonymized_filename = Column(String(255), nullable=False)
    file_hash = Column(String(64), nullable=False)
    status = Column(String(50), nullable=False, index=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    author = relationship("Author", back_populates="papers")
    versions = relationship("PaperVersion", back_populates="paper", cascade="all, delete-orphan")
    status_history = relationship("PaperStatusHistory", back_populates="paper", cascade="all, delete-orphan")
    review_assignments = relationship("ReviewAssignment", back_populates="paper", cascade="all, delete-orphan")
    publication = relationship("Publication", back_populates="paper", uselist=False, cascade="all, delete-orphan")


class PaperVersion(Base):
    """Paper version model for tracking manuscript revisions."""
    __tablename__ = "paper_versions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    paper_id = Column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    filename = Column(String(255), nullable=False)
    file_hash = Column(String(64), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)
    
    # Relationships
    paper = relationship("Paper", back_populates="versions")
    
    # Unique constraint on paper_id and version_number
    __table_args__ = (
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
    )


class PaperStatusHistory(Base):
    """Paper status history model for tracking status changes."""
    __tablename__ = "paper_status_history"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    paper_id = Column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False)
    changed_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    paper = relationship("Paper", back_populates="status_history")
    user = relationship("User")
