"""
Publication models for journal volumes, issues, and publications.
"""
from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


def generate_uuid():
    """Generate a UUID string for primary keys."""
    return str(uuid.uuid4())


class Volume(Base):
    """Volume model for journal volumes."""
    __tablename__ = "volumes"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    volume_number = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False, index=True)
    title = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    issues = relationship("Issue", back_populates="volume", cascade="all, delete-orphan")
    
    # Unique constraint on volume_number and year
    __table_args__ = (
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
    )


class Issue(Base):
    """Issue model for journal issues."""
    __tablename__ = "issues"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    volume_id = Column(String(36), ForeignKey("volumes.id", ondelete="CASCADE"), nullable=False, index=True)
    issue_number = Column(Integer, nullable=False)
    publication_date = Column(Date, nullable=False, index=True)
    title = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    volume = relationship("Volume", back_populates="issues")
    publications = relationship("Publication", back_populates="issue", cascade="all, delete-orphan")
    
    # Unique constraint on volume_id and issue_number
    __table_args__ = (
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
    )


class Publication(Base):
    """Publication model for published papers."""
    __tablename__ = "publications"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    paper_id = Column(String(36), ForeignKey("papers.id"), unique=True, nullable=False, index=True)
    issue_id = Column(String(36), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    page_start = Column(Integer, nullable=True)
    page_end = Column(Integer, nullable=True)
    doi = Column(String(255), nullable=True)
    published_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    paper = relationship("Paper", back_populates="publication")
    issue = relationship("Issue", back_populates="publications")
