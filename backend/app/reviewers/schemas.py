"""
Pydantic schemas for reviewer management.
Defines request and response models for reviewer operations.

Requirements: 2.1
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class ReviewerCreateRequest(BaseModel):
    """Request schema for creating a new reviewer account (admin only)."""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    affiliation: str = Field(..., min_length=1, max_length=255)
    expertise: Optional[List[str]] = Field(None, description="List of research areas/expertise")


class ReviewerUpdateRequest(BaseModel):
    """Request schema for updating reviewer profile."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    affiliation: Optional[str] = Field(None, min_length=1, max_length=255)
    expertise: Optional[List[str]] = Field(None, description="List of research areas/expertise")


class ReviewerResponse(BaseModel):
    """Response schema for reviewer data."""
    id: str
    user_id: str
    email: str
    first_name: str
    last_name: str
    affiliation: str
    expertise: Optional[List[str]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ReviewerListResponse(BaseModel):
    """Response schema for list of reviewers."""
    reviewers: List[ReviewerResponse]
    total: int


class AssignmentResponse(BaseModel):
    """Response schema for reviewer assignments."""
    id: str
    paper_id: str
    paper_title: str
    anonymized_filename: str
    assigned_at: datetime
    deadline: datetime
    status: str
    
    class Config:
        from_attributes = True
