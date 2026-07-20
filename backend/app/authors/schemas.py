"""
Pydantic schemas for author management.
Defines request and response models for author operations.

Requirements: 3.1
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class AuthorSignupRequest(BaseModel):
    """Request schema for author self-registration."""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    affiliation: str = Field(..., min_length=1, max_length=255)
    orcid: Optional[str] = Field(None, max_length=19, description="ORCID identifier (optional)")
    bio: Optional[str] = Field(None, description="Author biography (optional)")


class AuthorProfileUpdateRequest(BaseModel):
    """Request schema for updating author profile."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    affiliation: Optional[str] = Field(None, min_length=1, max_length=255)
    orcid: Optional[str] = Field(None, max_length=19, description="ORCID identifier")
    bio: Optional[str] = Field(None, description="Author biography")


class AuthorProfileResponse(BaseModel):
    """Response schema for author profile data."""
    id: str
    user_id: str
    email: str
    first_name: str
    last_name: str
    affiliation: str
    orcid: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
