"""
Authentication service for user login, token generation, and token management.

Requirements: 1.1, 1.2, 1.7
"""
from typing import Optional
from sqlalchemy.orm import Session
from jose import JWTError

from app.users.models import User
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token
)
from .schemas import TokenResponse


# In-memory token blacklist (in production, use Redis or database)
# This stores invalidated refresh tokens
_token_blacklist = set()


def authenticate_user(email: str, password: str, db: Session) -> Optional[User]:
    """
    Authenticate a user by email and password.
    
    Args:
        email: User's email address
        password: User's plaintext password
        db: Database session
        
    Returns:
        User object if authentication succeeds, None otherwise
        
    Example:
        >>> user = authenticate_user("author@example.com", "password123", db)
        >>> user.email if user else None
        'author@example.com'
    """
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        return None
    
    if not user.is_active:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    return user


def generate_tokens(user: User) -> TokenResponse:
    """
    Generate access and refresh tokens for a user.
    
    Args:
        user: User object to generate tokens for
        
    Returns:
        TokenResponse containing access_token, refresh_token, token_type, and user info
        
    Example:
        >>> tokens = generate_tokens(user)
        >>> tokens.token_type
        'bearer'
    """
    # Create token payload with user ID and role
    token_data = {
        "sub": user.id,
        "email": user.email,
        "role": user.role.name
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token({"sub": user.id})
    
    # Import UserInfo here to avoid circular imports
    from .schemas import UserInfo
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserInfo(
            id=str(user.id),
            email=user.email,
            role={"name": user.role.name}
        )
    )


def refresh_access_token(refresh_token: str, db: Session) -> TokenResponse:
    """
    Generate a new access token using a valid refresh token.
    
    Args:
        refresh_token: Valid refresh token
        db: Database session
        
    Returns:
        TokenResponse with new access token, same refresh token, and user info
        
    Raises:
        ValueError: If refresh token is invalid, expired, or blacklisted
        
    Example:
        >>> tokens = refresh_access_token(old_refresh_token, db)
        >>> isinstance(tokens.access_token, str)
        True
    """
    # Check if token is blacklisted
    if refresh_token in _token_blacklist:
        raise ValueError("Refresh token has been invalidated")
    
    try:
        # Verify the refresh token
        payload = verify_token(refresh_token, token_type="refresh")
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise ValueError("Invalid token payload")
            
    except (JWTError, ValueError) as e:
        raise ValueError(f"Invalid refresh token: {str(e)}")
    
    # Fetch user from database
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise ValueError("User not found")
    
    if not user.is_active:
        raise ValueError("User account is inactive")
    
    # Generate new access token
    token_data = {
        "sub": user.id,
        "email": user.email,
        "role": user.role.name
    }
    
    new_access_token = create_access_token(token_data)
    
    # Import UserInfo here to avoid circular imports
    from .schemas import UserInfo
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=refresh_token,  # Return the same refresh token
        token_type="bearer",
        user=UserInfo(
            id=str(user.id),
            email=user.email,
            role={"name": user.role.name}
        )
    )


def invalidate_tokens(user_id: str, refresh_token: Optional[str] = None) -> bool:
    """
    Invalidate user tokens (logout).
    
    Args:
        user_id: User ID whose tokens should be invalidated
        refresh_token: Optional specific refresh token to invalidate
        
    Returns:
        True if tokens were invalidated successfully
        
    Note:
        In production, this should invalidate all tokens for the user in Redis/database.
        Currently uses in-memory blacklist for refresh tokens.
        Access tokens will expire naturally (15 minutes).
        
    Example:
        >>> success = invalidate_tokens("user123", refresh_token)
        >>> success
        True
    """
    if refresh_token:
        _token_blacklist.add(refresh_token)
    
    # In production, you would:
    # 1. Add all user's refresh tokens to blacklist in Redis
    # 2. Optionally add access tokens to blacklist (if short-lived, may not be necessary)
    # 3. Clear any session data
    
    return True


def is_token_blacklisted(token: str) -> bool:
    """
    Check if a token is blacklisted.
    
    Args:
        token: Token to check
        
    Returns:
        True if token is blacklisted, False otherwise
    """
    return token in _token_blacklist
