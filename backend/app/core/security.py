"""
Security utilities for The Essence Journal System.
Handles password hashing, JWT token generation, and token verification.

Requirements: 1.1, 1.4
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from jose import JWTError, jwt
from .config import settings


# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a plaintext password using bcrypt.
    
    Args:
        password: The plaintext password to hash
        
    Returns:
        The bcrypt hashed password
        
    Example:
        >>> hashed = hash_password("my_secure_password")
        >>> hashed.startswith("$2b$")
        True
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plaintext password against a bcrypt hash.
    
    Args:
        plain_password: The plaintext password to verify
        hashed_password: The bcrypt hashed password to check against
        
    Returns:
        True if the password matches, False otherwise
        
    Example:
        >>> hashed = hash_password("my_password")
        >>> verify_password("my_password", hashed)
        True
        >>> verify_password("wrong_password", hashed)
        False
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary of claims to encode in the token (e.g., {"sub": user_id, "role": "author"})
        expires_delta: Optional custom expiration time. If not provided, uses ACCESS_TOKEN_EXPIRE_MINUTES from settings
        
    Returns:
        Encoded JWT token string
        
    Example:
        >>> token = create_access_token({"sub": "user123", "role": "author"})
        >>> isinstance(token, str)
        True
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        data: Dictionary of claims to encode in the token (e.g., {"sub": user_id})
        expires_delta: Optional custom expiration time. If not provided, uses REFRESH_TOKEN_EXPIRE_DAYS from settings
        
    Returns:
        Encoded JWT token string
        
    Example:
        >>> token = create_refresh_token({"sub": "user123"})
        >>> isinstance(token, str)
        True
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


def verify_token(token: str, token_type: Optional[str] = None) -> Dict[str, Any]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: The JWT token string to verify
        token_type: Optional token type to verify ("access" or "refresh"). If provided, validates the token type matches.
        
    Returns:
        Dictionary containing the decoded token payload
        
    Raises:
        JWTError: If the token is invalid, expired, or malformed
        ValueError: If token_type is specified and doesn't match the token's type claim
        
    Example:
        >>> token = create_access_token({"sub": "user123", "role": "author"})
        >>> payload = verify_token(token, token_type="access")
        >>> payload["sub"]
        'user123'
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Verify token type if specified
        if token_type:
            token_type_claim = payload.get("type")
            if token_type_claim != token_type:
                raise ValueError(f"Invalid token type. Expected '{token_type}', got '{token_type_claim}'")
        
        return payload
        
    except JWTError as e:
        raise JWTError(f"Token verification failed: {str(e)}")


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode a JWT token without verification (for debugging/inspection only).
    
    WARNING: This function does not verify the token signature or expiration.
    Use verify_token() for production authentication.
    
    Args:
        token: The JWT token string to decode
        
    Returns:
        Dictionary containing the decoded token payload, or None if decoding fails
        
    Example:
        >>> token = create_access_token({"sub": "user123"})
        >>> payload = decode_token(token)
        >>> payload["sub"]
        'user123'
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM], options={"verify_signature": False})
        return payload
    except JWTError:
        return None
