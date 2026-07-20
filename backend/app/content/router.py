"""
Content management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
from pathlib import Path

from app.core.database import get_db
from app.core.dependencies import require_role, get_current_user
from app.core.config import settings
from app.users.models import User
from app.content.service import (
    SlideshowService,
    PageContentService,
    SiteConfigService,
    AnnouncementService
)
from app.content.schemas import (
    SlideshowCreate, SlideshowUpdate, SlideshowReorder, SlideshowResponse,
    PageContentUpdate, PageContentResponse,
    SiteConfigUpdate, SiteConfigResponse,
    AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse
)


router = APIRouter(prefix="/content", tags=["content"])


# Slideshow Endpoints
@router.get("/slideshow", response_model=List[SlideshowResponse])
async def get_public_slides(db: Session = Depends(get_db)):
    """Get all active slideshow slides (public endpoint)."""
    service = SlideshowService(db)
    slides = service.get_all_slides(active_only=True)
    return [SlideshowResponse.model_validate(slide) for slide in slides]


@router.get("/admin/slideshow", response_model=List[SlideshowResponse])
async def get_all_slides(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Get all slideshow slides with admin details (admin only)."""
    service = SlideshowService(db)
    slides = service.get_all_slides(active_only=False)
    return [SlideshowResponse.model_validate(slide) for slide in slides]


@router.post("/admin/slideshow", response_model=SlideshowResponse, status_code=status.HTTP_201_CREATED)
async def create_slide(
    slide_data: SlideshowCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Create a new slideshow slide (admin only)."""
    service = SlideshowService(db)
    
    try:
        slide = service.create_slide(slide_data)
        return SlideshowResponse.model_validate(slide)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create slide: {str(e)}"
        )


@router.put("/admin/slideshow/{slide_id}", response_model=SlideshowResponse)
async def update_slide(
    slide_id: str,
    slide_data: SlideshowUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Update a slideshow slide (admin only)."""
    service = SlideshowService(db)
    
    try:
        slide = service.update_slide(slide_id, slide_data)
        return SlideshowResponse.model_validate(slide)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update slide: {str(e)}"
        )


@router.delete("/admin/slideshow/{slide_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_slide(
    slide_id: str,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Delete a slideshow slide (admin only)."""
    service = SlideshowService(db)
    
    try:
        service.delete_slide(slide_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete slide: {str(e)}"
        )


@router.put("/admin/slideshow/reorder", response_model=List[SlideshowResponse])
async def reorder_slides(
    reorder_data: SlideshowReorder,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Update slide order (admin only)."""
    service = SlideshowService(db)
    
    try:
        slides = service.reorder_slides(reorder_data.slide_orders)
        return [SlideshowResponse.model_validate(slide) for slide in slides]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reorder slides: {str(e)}"
        )


# Site Configuration Endpoints
@router.get("/config", response_model=SiteConfigResponse)
async def get_site_config(db: Session = Depends(get_db)):
    """Get site configuration (public endpoint)."""
    service = SiteConfigService(db)
    config = service.get_config()
    
    if not config:
        # Return default config if none exists
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site configuration not found"
        )
    
    return SiteConfigResponse.model_validate(config)


@router.put("/admin/config", response_model=SiteConfigResponse)
async def update_site_config(
    config_data: SiteConfigUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Update site configuration (admin only)."""
    service = SiteConfigService(db)
    
    try:
        config = service.update_config(config_data)
        return SiteConfigResponse.model_validate(config)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update site configuration: {str(e)}"
        )


# Announcement Endpoints
@router.get("/announcements/active", response_model=List[AnnouncementResponse])
async def get_active_announcements(db: Session = Depends(get_db)):
    """Get active announcements (public endpoint)."""
    service = AnnouncementService(db)
    announcements = service.get_active_announcements()
    return [AnnouncementResponse.model_validate(a) for a in announcements]


@router.get("/admin/announcements", response_model=List[AnnouncementResponse])
async def get_all_announcements(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Get all announcements (admin only)."""
    service = AnnouncementService(db)
    announcements = service.get_all_announcements()
    return [AnnouncementResponse.model_validate(a) for a in announcements]


@router.post("/admin/announcements", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    announcement_data: AnnouncementCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Create a new announcement (admin only)."""
    service = AnnouncementService(db)
    
    try:
        announcement = service.create_announcement(announcement_data, current_user.id)
        return AnnouncementResponse.model_validate(announcement)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create announcement: {str(e)}"
        )


@router.put("/admin/announcements/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(
    announcement_id: str,
    announcement_data: AnnouncementUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Update an announcement (admin only)."""
    service = AnnouncementService(db)
    
    try:
        announcement = service.update_announcement(announcement_id, announcement_data)
        return AnnouncementResponse.model_validate(announcement)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update announcement: {str(e)}"
        )


@router.delete("/admin/announcements/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_announcement(
    announcement_id: str,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Delete an announcement (admin only)."""
    service = AnnouncementService(db)
    
    try:
        service.delete_announcement(announcement_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete announcement: {str(e)}"
        )



# File Upload Endpoint
@router.post("/admin/upload")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["admin"])),
):
    """Upload an image file (admin only)."""
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type {file.content_type} not allowed. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024  # 5MB in bytes
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of 5MB"
        )
    
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = Path("storage/uploads")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = upload_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Return URL (relative path)
        file_url = f"/storage/uploads/{unique_filename}"
        
        return {
            "url": file_url,
            "filename": unique_filename,
            "original_filename": file.filename,
            "size": len(file_content),
            "content_type": file.content_type
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


# Page Content Endpoints (MUST be last - catch-all route)
@router.get("/pages/{page_key}", response_model=PageContentResponse)
async def get_page_content(
    page_key: str,
    db: Session = Depends(get_db)
):
    """Get page content (public endpoint). Returns empty content if page not yet created."""
    service = PageContentService(db)
    content = service.get_page_content(page_key)
    
    if not content:
        # Return empty content instead of 404 so pages render gracefully
        return PageContentResponse(
            id="",
            page_key=page_key,
            content="",
            last_updated_by=None,
            created_at=None,
            updated_at=None
        )
    
    return PageContentResponse.model_validate(content)


@router.put("/admin/pages/{page_key}", response_model=PageContentResponse)
async def update_page_content(
    page_key: str,
    content_data: PageContentUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Update page content (admin only)."""
    service = PageContentService(db)
    
    try:
        content = service.update_page_content(
            page_key=page_key,
            content=content_data.content,
            user_id=current_user.id
        )
        return PageContentResponse.model_validate(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update page content: {str(e)}"
        )
