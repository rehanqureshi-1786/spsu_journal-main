"""
Author router for author self-registration and profile management.

Requirements: 3.1
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.users.models import User
from .schemas import AuthorSignupRequest, AuthorProfileUpdateRequest, AuthorProfileResponse
from .service import AuthorService


router = APIRouter(prefix="/authors", tags=["Authors"])


@router.post("/signup", response_model=AuthorProfileResponse, status_code=status.HTTP_201_CREATED)
async def signup_author(
    signup_data: AuthorSignupRequest,
    db: Session = Depends(get_db)
):
    """
    Public endpoint for author self-registration.
    Creates both a User account and an Author profile.
    Automatically generates a subscription certificate for the new user.
    
    **Requirements: 3.1, Certificate System 1.1, 1.2**
    
    Args:
        signup_data: Author signup request data including credentials and profile info
        db: Database session
        
    Returns:
        AuthorProfileResponse with created author profile
        
    Raises:
        HTTPException: 400 if email already exists or validation fails
        
    Example:
        POST /authors/signup
        {
            "email": "author@example.com",
            "password": "secure_password",
            "first_name": "John",
            "last_name": "Doe",
            "affiliation": "University of Example",
            "orcid": "0000-0001-2345-6789",
            "bio": "Research interests include..."
        }
    """
    author = AuthorService.signup_author(db, signup_data)
    
    # Load the user relationship to get email
    db.refresh(author)
    
    # Automatically generate subscription certificate
    from datetime import datetime, timezone
    from app.certificates.service import CertificateService
    
    try:
        certificate_service = CertificateService(db)
        certificate_service.create_subscription_certificate(
            user_id=author.user_id,
            subscription_date=datetime.now(timezone.utc).replace(tzinfo=None)
        )
    except Exception as e:
        # Log the error but don't fail signup if certificate generation fails
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to generate subscription certificate for user {author.user_id}: {str(e)}")
    
    # Build response with email from user
    return AuthorProfileResponse(
        id=author.id,
        user_id=author.user_id,
        email=author.user.email,
        first_name=author.first_name,
        last_name=author.last_name,
        affiliation=author.affiliation,
        orcid=author.orcid,
        bio=author.bio,
        created_at=author.created_at
    )


@router.get("/profile", response_model=AuthorProfileResponse, status_code=status.HTTP_200_OK)
async def get_author_profile(
    current_user: User = Depends(require_role(["author"])),
    db: Session = Depends(get_db)
):
    """
    Get the current author's profile.
    Requires authentication with author role.
    
    **Requirements: 3.1**
    
    Args:
        current_user: Current authenticated user (must be author)
        db: Database session
        
    Returns:
        AuthorProfileResponse with author profile data
        
    Raises:
        HTTPException: 404 if author profile not found
        
    Example:
        GET /authors/profile
        (requires valid access_token cookie with author role)
    """
    author = AuthorService.get_author_by_user_id(db, current_user.id)
    
    if not author:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Author profile not found"
        )
    
    return AuthorProfileResponse(
        id=author.id,
        user_id=author.user_id,
        email=current_user.email,
        first_name=author.first_name,
        last_name=author.last_name,
        affiliation=author.affiliation,
        orcid=author.orcid,
        bio=author.bio,
        created_at=author.created_at
    )


@router.put("/profile", response_model=AuthorProfileResponse, status_code=status.HTTP_200_OK)
async def update_author_profile(
    update_data: AuthorProfileUpdateRequest,
    current_user: User = Depends(require_role(["author"])),
    db: Session = Depends(get_db)
):
    """
    Update the current author's profile.
    Requires authentication with author role.
    
    **Requirements: 3.1**
    
    Args:
        update_data: Author profile update request data
        current_user: Current authenticated user (must be author)
        db: Database session
        
    Returns:
        AuthorProfileResponse with updated author profile
        
    Raises:
        HTTPException: 404 if author profile not found
        
    Example:
        PUT /authors/profile
        {
            "first_name": "Jane",
            "affiliation": "New University",
            "bio": "Updated research interests..."
        }
    """
    author = AuthorService.update_author_profile(db, current_user.id, update_data)
    
    return AuthorProfileResponse(
        id=author.id,
        user_id=author.user_id,
        email=current_user.email,
        first_name=author.first_name,
        last_name=author.last_name,
        affiliation=author.affiliation,
        orcid=author.orcid,
        bio=author.bio,
        created_at=author.created_at
    )
