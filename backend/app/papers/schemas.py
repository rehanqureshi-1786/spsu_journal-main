"""
Paper schemas for request/response validation.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from fastapi import UploadFile


class PaperSubmissionRequest(BaseModel):
    """Schema for paper submission request."""
    title: str = Field(..., min_length=1, max_length=500)
    abstract: str = Field(..., min_length=1)
    keywords: List[str] = Field(..., min_items=1)
    
    @validator('keywords')
    def validate_keywords(cls, v):
        """Ensure keywords are non-empty strings."""
        if not all(isinstance(k, str) and k.strip() for k in v):
            raise ValueError("All keywords must be non-empty strings")
        return [k.strip() for k in v]


class PaperRevisionRequest(BaseModel):
    """Schema for paper revision upload."""
    notes: Optional[str] = None


class PaperStatusUpdateRequest(BaseModel):
    """Schema for updating paper status (admin only)."""
    status: str = Field(..., pattern="^(Submitted|Initial Screening|Reviewer Assigned|Under Review|Revision Required|Accepted|Rejected|Published)$")
    notes: Optional[str] = None


class StatusChangeResponse(BaseModel):
    """Schema for status change in timeline."""
    status: str
    changed_by: str  # User ID
    changed_at: datetime
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True


class PaperResponse(BaseModel):
    """Schema for paper response (role-filtered)."""
    id: str
    title: str
    abstract: str
    keywords: List[str]
    status: str
    submitted_at: datetime
    updated_at: datetime
    original_filename: Optional[str] = None  # Only for author/admin
    anonymized_filename: Optional[str] = None  # Only for reviewer/admin
    author_id: Optional[str] = None  # Only for author/admin
    author_name: Optional[str] = None  # Only for author/admin (published papers)
    
    class Config:
        from_attributes = True


class PaperTimelineResponse(BaseModel):
    """Schema for paper timeline response."""
    paper_id: str
    timeline: List[StatusChangeResponse]
    
    class Config:
        from_attributes = True


class PaperVersionResponse(BaseModel):
    """Schema for paper version response."""
    id: str
    paper_id: str
    version_number: int
    filename: str
    uploaded_at: datetime
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True


class PaperListResponse(BaseModel):
    """Schema for paper list response."""
    papers: List[PaperResponse]
    total: int
    
    class Config:
        from_attributes = True


class PaperSearchResponse(BaseModel):
    """Schema for paginated paper search response."""
    items: List[PaperResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    
    class Config:
        from_attributes = True


class BulkActionRequest(BaseModel):
    """Schema for bulk action request."""
    action: str = Field(..., pattern="^(change_status|assign_reviewer)$")
    paper_ids: List[str] = Field(..., min_items=1)
    new_status: Optional[str] = Field(None, pattern="^(Submitted|Initial Screening|Reviewer Assigned|Under Review|Revision Required|Accepted|Rejected|Published)$")
    reviewer_id: Optional[str] = None
    deadline: Optional[datetime] = None
    notes: Optional[str] = None
    
    @validator('new_status')
    def validate_status_for_action(cls, v, values):
        """Ensure new_status is provided for change_status action."""
        if values.get('action') == 'change_status' and not v:
            raise ValueError("new_status is required for change_status action")
        return v
    
    @validator('reviewer_id')
    def validate_reviewer_for_action(cls, v, values):
        """Ensure reviewer_id is provided for assign_reviewer action."""
        if values.get('action') == 'assign_reviewer' and not v:
            raise ValueError("reviewer_id is required for assign_reviewer action")
        return v


class BulkActionError(BaseModel):
    """Schema for individual bulk action error."""
    paper_id: str
    error: str


class BulkActionResponse(BaseModel):
    """Schema for bulk action response."""
    successful: List[str]  # paper IDs
    failed: List[BulkActionError]
