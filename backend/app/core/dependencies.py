"""
Authentication dependencies for FastAPI.
Provides dependency functions for user authentication and role-based access control.

Requirements: 1.5
"""
from typing import List, Optional
from fastapi import Depends, HTTPException, status, Cookie
from sqlalchemy.orm import Session
from jose import JWTError

from .database import get_db
from .security import verify_token
from app.users.models import User


async def get_current_user(
    access_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from the access token cookie.
    
    Args:
        access_token: JWT access token from HttpOnly cookie
        db: Database session
        
    Returns:
        The authenticated User object
        
    Raises:
        HTTPException: 401 if token is missing, invalid, or user not found
        
    Example:
        @app.get("/protected")
        async def protected_route(current_user: User = Depends(get_current_user)):
            return {"user_id": current_user.id}
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not access_token:
        raise credentials_exception
    
    try:
        # Verify the token and check it's an access token
        payload = verify_token(access_token, token_type="access")
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception
            
    except (JWTError, ValueError) as e:
        raise credentials_exception
    
    # Fetch user from database
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user


def require_role(required_roles: List[str]):
    """
    Dependency factory to create a role-based access control dependency.
    
    Args:
        required_roles: List of role names that are allowed to access the endpoint
        
    Returns:
        A dependency function that checks if the current user has one of the required roles
        
    Raises:
        HTTPException: 403 if user doesn't have the required role
        
    Example:
        @app.get("/admin/users")
        async def admin_only(current_user: User = Depends(require_role(["admin"]))):
            return {"message": "Admin access granted"}
            
        @app.get("/papers")
        async def papers(current_user: User = Depends(require_role(["admin", "author", "reviewer"]))):
            return {"papers": []}
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        """Check if the current user has one of the required roles."""
        # Load the role relationship if not already loaded
        user_role_name = current_user.role.name
        
        if user_role_name not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(required_roles)}"
            )
        
        return current_user
    
    return role_checker


async def get_current_user_optional(
    access_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Dependency to optionally get the current authenticated user.
    Returns None if no valid token is provided instead of raising an exception.
    
    Useful for endpoints that have different behavior for authenticated vs unauthenticated users.
    
    Args:
        access_token: JWT access token from HttpOnly cookie
        db: Database session
        
    Returns:
        The authenticated User object or None if not authenticated
        
    Example:
        @app.get("/public-or-private")
        async def mixed_route(current_user: Optional[User] = Depends(get_current_user_optional)):
            if current_user:
                return {"message": f"Hello {current_user.email}"}
            return {"message": "Hello guest"}
    """
    if not access_token:
        return None
    
    try:
        payload = verify_token(access_token, token_type="access")
        user_id: str = payload.get("sub")
        
        if user_id is None:
            return None
            
    except (JWTError, ValueError):
        return None
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None or not user.is_active:
        return None
    
    return user
