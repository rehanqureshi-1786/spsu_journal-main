"""
Content management service layer for business logic.
"""
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional, Dict

from app.content.models import Slideshow, PageContent, SiteConfiguration, Announcement
from app.content.schemas import (
    SlideshowCreate, SlideshowUpdate,
    PageContentUpdate,
    SiteConfigUpdate,
    AnnouncementCreate, AnnouncementUpdate
)


class SlideshowService:
    """Service class for slideshow operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_slide(self, slide_data: SlideshowCreate) -> Slideshow:
        """Create a new slideshow slide."""
        slide = Slideshow(
            image_url=slide_data.image_url,
            caption=slide_data.caption,
            link=slide_data.link,
            order=slide_data.order,
            is_active=slide_data.is_active
        )
        
        self.db.add(slide)
        self.db.commit()
        self.db.refresh(slide)
        
        return slide
    
    def get_all_slides(self, active_only: bool = False) -> List[Slideshow]:
        """Get all slideshow slides."""
        query = self.db.query(Slideshow)
        
        if active_only:
            query = query.filter(Slideshow.is_active == True)
        
        return query.order_by(Slideshow.order).all()
    
    def get_slide(self, slide_id: str) -> Optional[Slideshow]:
        """Get a specific slide by ID."""
        return self.db.query(Slideshow).filter(Slideshow.id == slide_id).first()
    
    def update_slide(self, slide_id: str, updates: SlideshowUpdate) -> Slideshow:
        """Update a slideshow slide."""
        slide = self.get_slide(slide_id)
        if not slide:
            raise ValueError(f"Slide with ID {slide_id} not found")
        
        update_data = updates.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(slide, field, value)
        
        self.db.commit()
        self.db.refresh(slide)
        
        return slide
    
    def delete_slide(self, slide_id: str) -> bool:
        """Delete a slideshow slide."""
        slide = self.get_slide(slide_id)
        if not slide:
            raise ValueError(f"Slide with ID {slide_id} not found")
        
        self.db.delete(slide)
        self.db.commit()
        
        return True
    
    def reorder_slides(self, slide_orders: List[Dict[str, int]]) -> List[Slideshow]:
        """Reorder slideshow slides."""
        for item in slide_orders:
            slide_id = item.get("id")
            order = item.get("order")
            
            if slide_id and order is not None:
                slide = self.get_slide(slide_id)
                if slide:
                    slide.order = order
        
        self.db.commit()
        
        return self.get_all_slides()


class PageContentService:
    """Service class for page content operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_page_content(self, page_key: str) -> Optional[PageContent]:
        """Get content for a specific page."""
        return self.db.query(PageContent).filter(PageContent.page_key == page_key).first()
    
    def update_page_content(
        self,
        page_key: str,
        content: str,
        user_id: str
    ) -> PageContent:
        """Update or create page content."""
        page_content = self.get_page_content(page_key)
        
        if page_content:
            page_content.content = content
            page_content.last_updated_by = user_id
        else:
            page_content = PageContent(
                page_key=page_key,
                content=content,
                last_updated_by=user_id
            )
            self.db.add(page_content)
        
        self.db.commit()
        self.db.refresh(page_content)
        
        return page_content


class SiteConfigService:
    """Service class for site configuration operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_config(self) -> Optional[SiteConfiguration]:
        """Get site configuration (there should only be one)."""
        return self.db.query(SiteConfiguration).first()
    
    def update_config(self, updates: SiteConfigUpdate) -> SiteConfiguration:
        """Update site configuration."""
        config = self.get_config()
        
        if not config:
            # Create default config if none exists
            config = SiteConfiguration(
                site_name="The Essence Journal",
                site_tagline="Academic Excellence in Research"
            )
            self.db.add(config)
        
        update_data = updates.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(config, field, value)
        
        self.db.commit()
        self.db.refresh(config)
        
        return config


class AnnouncementService:
    """Service class for announcement operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_announcement(
        self,
        announcement_data: AnnouncementCreate,
        user_id: str
    ) -> Announcement:
        """Create a new announcement."""
        announcement = Announcement(
            text=announcement_data.text,
            background_color=announcement_data.background_color,
            text_color=announcement_data.text_color,
            start_date=announcement_data.start_date,
            end_date=announcement_data.end_date,
            priority=announcement_data.priority,
            is_active=announcement_data.is_active,
            created_by=user_id
        )
        
        self.db.add(announcement)
        self.db.commit()
        self.db.refresh(announcement)
        
        return announcement
    
    def get_all_announcements(self) -> List[Announcement]:
        """Get all announcements."""
        return self.db.query(Announcement).order_by(
            Announcement.priority.desc(),
            Announcement.start_date.desc()
        ).all()
    
    def get_active_announcements(self) -> List[Announcement]:
        """Get active announcements within date range."""
        now = datetime.now()
        
        return self.db.query(Announcement).filter(
            Announcement.is_active == True,
            Announcement.start_date <= now,
            (Announcement.end_date.is_(None)) | (Announcement.end_date >= now)
        ).order_by(
            Announcement.priority.desc(),
            Announcement.start_date.desc()
        ).all()
    
    def get_announcement(self, announcement_id: str) -> Optional[Announcement]:
        """Get a specific announcement by ID."""
        return self.db.query(Announcement).filter(Announcement.id == announcement_id).first()
    
    def update_announcement(
        self,
        announcement_id: str,
        updates: AnnouncementUpdate
    ) -> Announcement:
        """Update an announcement."""
        announcement = self.get_announcement(announcement_id)
        if not announcement:
            raise ValueError(f"Announcement with ID {announcement_id} not found")
        
        update_data = updates.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(announcement, field, value)
        
        self.db.commit()
        self.db.refresh(announcement)
        
        return announcement
    
    def delete_announcement(self, announcement_id: str) -> bool:
        """Delete an announcement."""
        announcement = self.get_announcement(announcement_id)
        if not announcement:
            raise ValueError(f"Announcement with ID {announcement_id} not found")
        
        self.db.delete(announcement)
        self.db.commit()
        
        return True
