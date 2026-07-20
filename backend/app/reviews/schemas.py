"""
Review schemas for request/response validation.
Defines schemas for review assignment and submission.

Requirements: 2.3, 5.3, 5.4
"""
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime


class AssignReviewerRequest(BaseModel):
    """Schema for assigning a reviewer to a paper (admin only)."""
    paper_id: str = Field(..., description="UUID of the paper to assign")
    reviewer_id: str = Field(..., description="UUID of the reviewer to assign")
    deadline: datetime = Field(..., description="Review deadline")
    
    @validator('deadline')
    def validate_deadline(cls, v):
        """Ensure deadline is in the future."""
        if v <= datetime.now(v.tzinfo):
            raise ValueError("Deadline must be in the future")
        return v


class ReviewSubmissionRequest(BaseModel):
    """Schema for submitting a review (reviewer only)."""
    assignment_id: str = Field(..., description="UUID of the review assignment")
    recommendation: str = Field(
        ..., 
        pattern="^(accept|minor_revision|major_revision|reject)$",
        description="Review recommendation"
    )
    comments_for_author: str = Field(..., min_length=1, description="Comments visible to the author")
    comments_for_editor: str = Field(..., min_length=1, description="Confidential comments for the editor")
    review_file: Optional[str] = Field(None, description="Optional review file path")


class ReviewAssignmentResponse(BaseModel):
    """Schema for review assignment response."""
    id: str
    paper_id: str
    reviewer_id: Optional[str] = None  # Hidden from authors
    assigned_by: Optional[str] = None  # Admin who assigned
    assigned_at: datetime
    deadline: datetime
    status: str
    paper_title: Optional[str] = None  # Included for reviewer dashboard
    anonymized_filename: Optional[str] = None  # Included for reviewer
    
    class Config:
        from_attributes = True


class ReviewResponse(BaseModel):
    """Schema for review response (role-filtered)."""
    id: str
    paper_id: str
    reviewer_identity: str  # "Reviewer #1" for authors, full name for admin
    recommendation: str
    comments_for_author: Optional[str] = None
    comments_for_editor: Optional[str] = None  # Only visible to admin
    submitted_at: datetime
    review_file: Optional[str] = None
    
    class Config:
        from_attributes = True


class ReviewListResponse(BaseModel):
    """Schema for list of reviews."""
    reviews: list[ReviewResponse]
    total: int
