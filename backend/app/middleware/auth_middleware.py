"""
Authentication middleware for The Essence Journal System.
Provides token verification and role-based access control middleware.

Requirements: 1.5, 1.6
"""
from typing import Callable, Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from jose import JWTError

from app.core.database import SessionLocal
from app.core.security import verify_token
from app.users.models import User


async def verify_token_middleware(request: Request, call_next: Callable):
    """
    Middleware to verify JWT tokens for protected routes.
    
    This middleware checks for the presence and validity of access tokens
    in cookies for all routes except public endpoints.
    
    Requirements: 1.6
    
    Args:
        request: The incoming HTTP request
        call_next: The next middleware or route handler in the chain
        
    Returns:
        Response from the next handler or error response if authentication fails
    """
    # Define public paths that don't require authentication
    public_paths = [
        "/",
        "/health",
        "/docs",
        "/openapi.json",
        "/redoc",
        "/auth/login",
        "/authors/signup",
        "/publications/volumes",
        "/publications/issues",
    ]
    
    # Check if the path is public or starts with a public prefix
    path = request.url.path
    is_public = any(
        path == public_path or path.startswith(f"{public_path}/")
        for public_path in public_paths
    )
    
    # Allow public paths and OPTIONS requests (CORS preflight)
    if is_public or request.method == "OPTIONS":
        return await call_next(request)
    
    # Check for access token in cookies
    access_token = request.cookies.get("access_token")
    
    if not access_token:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "error": {
                    "code": "MISSING_TOKEN",
                    "message": "Authentication required",
                    "details": {"reason": "No access token provided"},
                }
            },
        )
    
    try:
        # Verify the token
        payload = verify_token(access_token, token_type="access")
        user_id = payload.get("sub")
        
        if not user_id:
            raise ValueError("Token missing user ID")
        
        # Attach user_id to request state for use in route handlers
        request.state.user_id = user_id
        
    except (JWTError, ValueError) as e:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "error": {
                    "code": "INVALID_TOKEN",
                    "message": "Invalid or expired token",
                    "details": {"reason": str(e)},
                }
            },
        )
    
    # Continue to the next middleware or route handler
    response = await call_next(request)
    return response


async def role_guard_middleware(request: Request, call_next: Callable):
    """
    Middleware to enforce role-based access control.
    
    This middleware checks if the authenticated user has the required role
    to access specific route prefixes.
    
    Requirements: 1.5
    
    Args:
        request: The incoming HTTP request
        call_next: The next middleware or route handler in the chain
        
    Returns:
        Response from the next handler or error response if authorization fails
    """
    # Define role-based route restrictions
    role_restrictions = {
        "/admin": ["admin"],
        "/users": ["admin"],
        "/reviewers": ["admin", "reviewer"],
        "/authors/profile": ["author"],
        "/papers": ["admin", "author", "reviewer"],
        "/reviews": ["admin", "reviewer"],
        "/audit": ["admin"],
    }
    
    path = request.url.path
    
    # Check if this path requires role checking
    required_roles = None
    for route_prefix, roles in role_restrictions.items():
        if path.startswith(route_prefix):
            required_roles = roles
            break
    
    # If no role restriction applies, continue
    if not required_roles:
        return await call_next(request)
    
    # Get user_id from request state (set by verify_token_middleware)
    user_id = getattr(request.state, "user_id", None)
    
    if not user_id:
        # If no user_id in state, authentication hasn't been verified
        return await call_next(request)
    
    # Query the database to get user role
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "error": {
                        "code": "USER_NOT_FOUND",
                        "message": "User not found",
                        "details": {"reason": "User account may have been deleted"},
                    }
                },
            )
        
        if not user.is_active:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "error": {
                        "code": "ACCOUNT_INACTIVE",
                        "message": "User account is inactive",
                        "details": {"reason": "Account has been deactivated"},
                    }
                },
            )
        
        # Check if user has required role
        user_role = user.role.name
        
        if user_role not in required_roles:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "error": {
                        "code": "INSUFFICIENT_PERMISSIONS",
                        "message": "Access denied",
                        "details": {
                            "required_roles": required_roles,
                            "user_role": user_role,
                        },
                    }
                },
            )
        
        # Attach user object to request state for use in route handlers
        request.state.user = user
        
    finally:
        db.close()
    
    # Continue to the next middleware or route handler
    response = await call_next(request)
    return response
