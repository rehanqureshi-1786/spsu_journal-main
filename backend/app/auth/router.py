"""
Authentication router for login, token refresh, and logout endpoints.

Requirements: 1.1, 1.2, 1.7
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.users.models import User
from app.audit.service import log_auth_event
from .schemas import LoginRequest, TokenResponse, StatusResponse, RefreshRequest
from .service import (
    authenticate_user,
    generate_tokens,
    refresh_access_token,
    invalidate_tokens
)


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(
    credentials: LoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return JWT tokens in HttpOnly cookies.
    
    **Requirements: 1.1**
    
    Args:
        credentials: User email and password
        response: FastAPI response object to set cookies
        request: FastAPI request object for IP and user agent
        db: Database session
        
    Returns:
        TokenResponse with access_token and refresh_token
        
    Raises:
        HTTPException: 401 if credentials are invalid
        
    Example:
        POST /auth/login
        {
            "email": "author@example.com",
            "password": "secure_password"
        }
    """
    # Authenticate user
    user = authenticate_user(credentials.email, credentials.password, db)
    
    if not user:
        # Log failed login attempt
        log_auth_event(
            db=db,
            user_id=None,
            action="login_failed",
            ip_address=request.client.host if request.client else "unknown",
            user_agent=request.headers.get("user-agent", "unknown"),
            success=False,
            details={"email": credentials.email}
        )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate tokens
    tokens = generate_tokens(user)
    
    # Log successful login
    log_auth_event(
        db=db,
        user_id=user.id,
        action="login",
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("user-agent", "unknown"),
        success=True,
        details={"email": credentials.email}
    )
    
    # Set tokens in HttpOnly Secure cookies
    # Access token - short-lived (15 minutes)
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        secure=False,  # Requires HTTPS in production
        samesite="lax",
        max_age=15 * 60,  # 15 minutes in seconds
    )
    
    # Refresh token - long-lived (7 days)
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        secure=False,  # Requires HTTPS in production
        samesite="lax",
        max_age=1 * 24 * 60 * 60,  # 7 days in seconds
    )
    
    return tokens


@router.post("/refresh", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def refresh(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    """
    Refresh access token using a valid refresh token from cookie.
    
    **Requirements: 1.2**
    
    Args:
        response: FastAPI response object to set new access token cookie
        refresh_token: Refresh token from HttpOnly cookie
        db: Database session
        
    Returns:
        TokenResponse with new access_token and existing refresh_token
        
    Raises:
        HTTPException: 401 if refresh token is missing, invalid, or expired
        
    Example:
        POST /auth/refresh
        (refresh_token automatically sent via cookie)
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Generate new access token
        tokens = refresh_access_token(refresh_token, db)
        
        # Set new access token in cookie
        response.set_cookie(
            key="access_token",
            value=tokens.access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=15 * 60,  # 15 minutes
        )
        
        return tokens
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/logout", response_model=StatusResponse, status_code=status.HTTP_200_OK)
async def logout(
    response: Response,
    request: Request,
    refresh_token: Optional[str] = Cookie(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout user and invalidate tokens by clearing cookies.
    
    **Requirements: 1.7, 15.6**
    
    Args:
        response: FastAPI response object to clear cookies
        request: FastAPI request object for IP and user agent
        refresh_token: Refresh token from cookie to invalidate
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        StatusResponse confirming logout
        
    Example:
        POST /auth/logout
        (requires valid access_token in cookie)
    """
    # Invalidate the refresh token
    if refresh_token:
        invalidate_tokens(current_user.id, refresh_token)
    
    # Log logout event
    log_auth_event(
        db=db,
        user_id=current_user.id,
        action="logout",
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("user-agent", "unknown"),
        success=True
    )
    
    # Clear access_token cookie with all attributes matching the set_cookie call
    response.delete_cookie(
        key="access_token",
        path="/",
        domain=None,
        secure=False,
        httponly=True,
        samesite="lax"
    )
    
    # Clear refresh_token cookie with all attributes matching the set_cookie call
    response.delete_cookie(
        key="refresh_token",
        path="/",
        domain=None,
        secure=False,
        httponly=True,
        samesite="lax"
    )
    
    return StatusResponse(
        message="Successfully logged out",
        success=True
    )
