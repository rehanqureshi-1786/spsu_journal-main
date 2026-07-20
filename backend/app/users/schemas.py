"""
Pydantic schemas for user and role management.
Defines request and response models for user operations.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class RoleResponse(BaseModel):
    """Response schema for role data."""
    id: str
    name: str
    permissions: Optional[dict] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserBase(BaseModel):
    """Base schema for user data."""
    email: EmailStr


class UserCreateRequest(BaseModel):
    """Request schema for creating a new user."""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    role_id: str
    is_active: bool = True


class UserUpdateRequest(BaseModel):
    """Request schema for updating a user."""
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8, description="Password must be at least 8 characters")
    role_id: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    """Response schema for user data."""
    id: str
    email: str
    role_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    role: RoleResponse
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Response schema for list of users."""
    users: list[UserResponse]
    total: int


class StatusResponse(BaseModel):
    """Generic status response."""
    success: bool
    message: str
