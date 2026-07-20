"""
Pydantic schemas for authentication endpoints.
"""
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Request schema for user login."""
    email: EmailStr
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "author@example.com",
                "password": "secure_password123"
            }
        }


class UserInfo(BaseModel):
    """User information included in token response."""
    id: str
    email: str
    role: dict
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Response schema for token generation."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserInfo
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "email": "author@example.com",
                    "role": {"name": "author"}
                }
            }
        }


class RefreshRequest(BaseModel):
    """Request schema for token refresh."""
    refresh_token: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }


class StatusResponse(BaseModel):
    """Generic status response."""
    message: str
    success: bool = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Operation completed successfully",
                "success": True
            }
        }
