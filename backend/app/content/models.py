"""
Content management models for dynamic website content.
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


def generate_uuid():
    """Generate a UUID string for primary keys."""
    return str(uuid.uuid4())


class Slideshow(Base):
    """Slideshow model for homepage carousel images."""
    __tablename__ = "slideshow"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    image_url = Column(String(500), nullable=False)
    caption = Column(String(500), nullable=True)
    link = Column(String(500), nullable=True)
    order = Column(Integer, nullable=False, default=0, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class PageContent(Base):
    """Page content model for dynamic page content."""
    __tablename__ = "page_content"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    page_key = Column(String(100), unique=True, nullable=False, index=True)
    content = Column(Text, nullable=False)
    last_updated_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    updated_by_user = relationship("User")


class SiteConfiguration(Base):
    """Site configuration model for global site settings."""
    __tablename__ = "site_configuration"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    site_name = Column(String(255), nullable=False)
    site_tagline = Column(String(500), nullable=True)
    logo_url = Column(String(500), nullable=True)
    primary_color = Column(String(7), nullable=True)  # Hex color code
    secondary_color = Column(String(7), nullable=True)  # Hex color code
    social_links = Column(JSON, nullable=True)  # {facebook: '', twitter: '', linkedin: ''}
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    footer_text = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Announcement(Base):
    """Announcement model for site-wide announcement banners."""
    __tablename__ = "announcements"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    text = Column(Text, nullable=False)
    background_color = Column(String(7), nullable=True)  # Hex color code
    text_color = Column(String(7), nullable=True)  # Hex color code
    start_date = Column(DateTime(timezone=True), nullable=False, index=True)
    end_date = Column(DateTime(timezone=True), nullable=True, index=True)
    priority = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    creator = relationship("User")
