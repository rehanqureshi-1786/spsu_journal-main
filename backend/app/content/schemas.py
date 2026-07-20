"""
Pydantic schemas for content management.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict


# Slideshow Schemas
class SlideshowCreate(BaseModel):
    """Schema for creating a slideshow slide."""
    image_url: str
    caption: Optional[str] = None
    link: Optional[str] = None
    order: int = 0
    is_active: bool = True


class SlideshowUpdate(BaseModel):
    """Schema for updating a slideshow slide."""
    image_url: Optional[str] = None
    caption: Optional[str] = None
    link: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class SlideshowReorder(BaseModel):
    """Schema for reordering slides."""
    slide_orders: List[Dict[str, int]]  # [{"id": "slide_id", "order": 0}, ...]


class SlideshowResponse(BaseModel):
    """Schema for slideshow response."""
    id: str
    image_url: str
    caption: Optional[str] = None
    link: Optional[str] = None
    order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Page Content Schemas
class PageContentUpdate(BaseModel):
    """Schema for updating page content."""
    content: str


class PageContentResponse(BaseModel):
    """Schema for page content response."""
    id: Optional[str] = None
    page_key: str
    content: str
    last_updated_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Site Configuration Schemas
class SiteConfigUpdate(BaseModel):
    """Schema for updating site configuration."""
    site_name: Optional[str] = None
    site_tagline: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    social_links: Optional[Dict[str, str]] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    footer_text: Optional[str] = None


class SiteConfigResponse(BaseModel):
    """Schema for site configuration response."""
    id: str
    site_name: str
    site_tagline: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    social_links: Optional[Dict[str, str]] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    footer_text: Optional[str] = None
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Announcement Schemas
class AnnouncementCreate(BaseModel):
    """Schema for creating an announcement."""
    text: str
    background_color: Optional[str] = None
    text_color: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    priority: int = 0
    is_active: bool = True


class AnnouncementUpdate(BaseModel):
    """Schema for updating an announcement."""
    text: Optional[str] = None
    background_color: Optional[str] = None
    text_color: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None


class AnnouncementResponse(BaseModel):
    """Schema for announcement response."""
    id: str
    text: str
    background_color: Optional[str] = None
    text_color: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    priority: int
    is_active: bool
    created_by: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
