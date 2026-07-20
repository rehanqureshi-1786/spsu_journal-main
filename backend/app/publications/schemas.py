"""
Publication schemas for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


class VolumeCreate(BaseModel):
    """Schema for creating a new volume."""
    volume_number: int = Field(..., gt=0, description="Volume number (must be positive)")
    year: int = Field(..., ge=1900, le=2100, description="Publication year")
    title: Optional[str] = Field(None, max_length=255, description="Optional volume title")


class VolumeResponse(BaseModel):
    """Schema for volume response."""
    id: str
    volume_number: int
    year: int
    title: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class IssueCreate(BaseModel):
    """Schema for creating a new issue."""
    volume_id: str = Field(..., description="Volume ID this issue belongs to")
    issue_number: int = Field(..., gt=0, description="Issue number (must be positive)")
    publication_date: date = Field(..., description="Publication date")
    title: Optional[str] = Field(None, max_length=255, description="Optional issue title")


class IssueResponse(BaseModel):
    """Schema for issue response."""
    id: str
    volume_id: str
    issue_number: int
    publication_date: date
    title: Optional[str]
    created_at: datetime
    volume: Optional[VolumeResponse] = None
    paper_count: int = 0  # Count of published papers in this issue
    
    class Config:
        from_attributes = True


class PublishPaperRequest(BaseModel):
    """Schema for publishing a paper."""
    paper_id: str = Field(..., description="Paper ID to publish")
    issue_id: str = Field(..., description="Issue ID to publish in")
    page_start: Optional[int] = Field(None, gt=0, description="Starting page number")
    page_end: Optional[int] = Field(None, gt=0, description="Ending page number")
    doi: Optional[str] = Field(None, max_length=255, description="Digital Object Identifier")


class PublicationResponse(BaseModel):
    """Schema for publication response."""
    id: str
    paper_id: str
    issue_id: str
    page_start: Optional[int]
    page_end: Optional[int]
    doi: Optional[str]
    published_at: datetime
    
    class Config:
        from_attributes = True


class PublicPaperResponse(BaseModel):
    """Schema for public paper response with full details."""
    id: str
    title: str
    abstract: str
    keywords: List[str]
    author_name: str
    author_affiliation: str
    status: str
    submitted_at: datetime
    publication: Optional[PublicationResponse]
    
    class Config:
        from_attributes = True
