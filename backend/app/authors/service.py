"""
Author service for author management operations.
Provides author signup logic and profile management.

Requirements: 3.1
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
from fastapi import HTTPException, status

from .models import Author
from .schemas import AuthorSignupRequest, AuthorProfileUpdateRequest
from app.users.models import User, Role
from app.core.security import hash_password


class AuthorService:
    """Service class for author management operations."""
    
    @staticmethod
    def signup_author(db: Session, signup_data: AuthorSignupRequest) -> Author:
        """
        Create a new author account with user credentials.
        This creates both a User record and an Author profile.
        
        Args:
            db: Database session
            signup_data: Author signup request data
            
        Returns:
            Created Author object
            
        Raises:
            HTTPException: If email already exists or author role not found
        """
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == signup_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Get the author role
        author_role = db.query(Role).filter(Role.name == "author").first()
        if not author_role:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Author role not found in system"
            )
        
        # Hash the password
        hashed_password = hash_password(signup_data.password)
        
        # Create user
        db_user = User(
            email=signup_data.email,
            password_hash=hashed_password,
            role_id=author_role.id,
            is_active=True
        )
        
        try:
            db.add(db_user)
            db.flush()  # Flush to get the user ID
            
            # Create author profile
            db_author = Author(
                user_id=db_user.id,
                first_name=signup_data.first_name,
                last_name=signup_data.last_name,
                affiliation=signup_data.affiliation,
                orcid=signup_data.orcid,
                bio=signup_data.bio
            )
            
            db.add(db_author)
            db.commit()
            db.refresh(db_author)
            
            return db_author
            
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Database integrity error: {str(e)}"
            )
    
    @staticmethod
    def get_author_by_user_id(db: Session, user_id: str) -> Optional[Author]:
        """
        Retrieve an author by their user ID.
        
        Args:
            db: Database session
            user_id: User ID to retrieve author for
            
        Returns:
            Author object if found, None otherwise
        """
        return db.query(Author).filter(Author.user_id == user_id).first()
    
    @staticmethod
    def get_author_by_id(db: Session, author_id: str) -> Optional[Author]:
        """
        Retrieve an author by their author ID.
        
        Args:
            db: Database session
            author_id: Author ID to retrieve
            
        Returns:
            Author object if found, None otherwise
        """
        return db.query(Author).filter(Author.id == author_id).first()
    
    @staticmethod
    def update_author_profile(
        db: Session, 
        user_id: str, 
        update_data: AuthorProfileUpdateRequest
    ) -> Author:
        """
        Update an author's profile information.
        
        Args:
            db: Database session
            user_id: User ID of the author to update
            update_data: Author profile update request data
            
        Returns:
            Updated Author object
            
        Raises:
            HTTPException: If author not found
        """
        # Get existing author
        db_author = AuthorService.get_author_by_user_id(db, user_id)
        if not db_author:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Author profile not found"
            )
        
        # Update fields if provided
        if update_data.first_name is not None:
            db_author.first_name = update_data.first_name
        
        if update_data.last_name is not None:
            db_author.last_name = update_data.last_name
        
        if update_data.affiliation is not None:
            db_author.affiliation = update_data.affiliation
        
        if update_data.orcid is not None:
            db_author.orcid = update_data.orcid
        
        if update_data.bio is not None:
            db_author.bio = update_data.bio
        
        try:
            db.commit()
            db.refresh(db_author)
            return db_author
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Database integrity error: {str(e)}"
            )
