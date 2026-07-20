"""
User management router.
Provides endpoints for user CRUD operations (admin only).

Requirements: 2.2
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List

from .schemas import (
    UserResponse,
    UserListResponse,
    UserCreateRequest,
    UserUpdateRequest,
    StatusResponse
)
from .service import UserService
from app.core.database import get_db
from app.core.dependencies import require_role
from app.users.models import User
from app.audit.service import log_action


router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=UserListResponse)
async def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Get all users (admin only).
    
    Returns a list of all users with their roles and status.
    Supports pagination through skip and limit parameters.
    
    Args:
        skip: Number of records to skip (default: 0)
        limit: Maximum number of records to return (default: 100)
        current_user: Current authenticated admin user
        db: Database session
        
    Returns:
        UserListResponse containing list of users and total count
        
    Raises:
        HTTPException: 403 if user is not an admin
    """
    users = UserService.get_all_users(db, skip=skip, limit=limit)
    total = UserService.get_users_count(db)
    
    return UserListResponse(users=users, total=total)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Get a specific user by ID (admin only).
    
    Args:
        user_id: ID of the user to retrieve
        current_user: Current authenticated admin user
        db: Database session
        
    Returns:
        UserResponse containing user details
        
    Raises:
        HTTPException: 403 if user is not an admin
        HTTPException: 404 if user not found
    """
    user = UserService.get_user_by_id(db, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreateRequest,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Create a new user (admin only).
    
    This endpoint is primarily used by admins to create reviewer accounts.
    Authors should use the self-registration endpoint at /authors/signup.
    
    Args:
        user_data: User creation request data
        request: FastAPI request object for IP and user agent
        current_user: Current authenticated admin user
        db: Database session
        
    Returns:
        UserResponse containing created user details
        
    Raises:
        HTTPException: 403 if user is not an admin
        HTTPException: 400 if email already exists or role_id is invalid
    """
    user = UserService.create_user(db, user_data)
    
    # Log user creation
    log_action(
        db=db,
        user_id=current_user.id,
        action="user_created",
        resource_type="user",
        resource_id=user.id,
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("user-agent", "unknown"),
        details={
            "email": user.email,
            "role": user.role.name
        }
    )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdateRequest,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Update an existing user (admin only).
    
    Allows updating email, password, role, and active status.
    All fields are optional - only provided fields will be updated.
    
    Args:
        user_id: ID of the user to update
        user_data: User update request data
        current_user: Current authenticated admin user
        db: Database session
        
    Returns:
        UserResponse containing updated user details
        
    Raises:
        HTTPException: 403 if user is not an admin
        HTTPException: 404 if user not found
        HTTPException: 400 if email already exists or role_id is invalid
    """
    user = UserService.update_user(db, user_id, user_data)
    return user


@router.delete("/{user_id}", response_model=StatusResponse)
async def delete_user(
    user_id: str,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Delete a user (admin only).
    
    Permanently removes a user from the system.
    This action cannot be undone.
    
    Args:
        user_id: ID of the user to delete
        current_user: Current authenticated admin user
        db: Database session
        
    Returns:
        StatusResponse indicating success
        
    Raises:
        HTTPException: 403 if user is not an admin
        HTTPException: 404 if user not found
        HTTPException: 400 if user cannot be deleted due to foreign key constraints
    """
    UserService.delete_user(db, user_id)
    
    return StatusResponse(
        success=True,
        message=f"User {user_id} deleted successfully"
    )
