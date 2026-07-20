"""
User service for user and role management operations.
Provides CRUD operations for users and role assignment logic.

Requirements: 2.1, 2.2
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, List
from fastapi import HTTPException, status

from .models import User, Role
from .schemas import UserCreateRequest, UserUpdateRequest
from app.core.security import hash_password


class UserService:
    """Service class for user management operations."""
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
        """
        Retrieve a user by their ID.
        
        Args:
            db: Database session
            user_id: User ID to retrieve
            
        Returns:
            User object if found, None otherwise
        """
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """
        Retrieve a user by their email address.
        
        Args:
            db: Database session
            email: Email address to search for
            
        Returns:
            User object if found, None otherwise
        """
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Retrieve all users with pagination.
        
        Args:
            db: Database session
            skip: Number of records to skip (for pagination)
            limit: Maximum number of records to return
            
        Returns:
            List of User objects
        """
        return db.query(User).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_users_count(db: Session) -> int:
        """
        Get the total count of users.
        
        Args:
            db: Database session
            
        Returns:
            Total number of users
        """
        return db.query(User).count()
    
    @staticmethod
    def create_user(db: Session, user_data: UserCreateRequest) -> User:
        """
        Create a new user with hashed password.
        
        Args:
            db: Database session
            user_data: User creation request data
            
        Returns:
            Created User object
            
        Raises:
            HTTPException: If email already exists or role_id is invalid
        """
        # Check if email already exists
        existing_user = UserService.get_user_by_email(db, user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Verify role exists
        role = db.query(Role).filter(Role.id == user_data.role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role_id"
            )
        
        # Hash the password
        hashed_password = hash_password(user_data.password)
        
        # Create user
        db_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            role_id=user_data.role_id,
            is_active=user_data.is_active
        )
        
        try:
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            return db_user
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Database integrity error: {str(e)}"
            )
    
    @staticmethod
    def update_user(db: Session, user_id: str, user_data: UserUpdateRequest) -> User:
        """
        Update an existing user.
        
        Args:
            db: Database session
            user_id: ID of user to update
            user_data: User update request data
            
        Returns:
            Updated User object
            
        Raises:
            HTTPException: If user not found, email already exists, or role_id is invalid
        """
        # Get existing user
        db_user = UserService.get_user_by_id(db, user_id)
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if email is being updated and if it already exists
        if user_data.email and user_data.email != db_user.email:
            existing_user = UserService.get_user_by_email(db, user_data.email)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            db_user.email = user_data.email
        
        # Update password if provided
        if user_data.password:
            db_user.password_hash = hash_password(user_data.password)
        
        # Update role if provided
        if user_data.role_id:
            role = db.query(Role).filter(Role.id == user_data.role_id).first()
            if not role:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid role_id"
                )
            db_user.role_id = user_data.role_id
        
        # Update is_active if provided
        if user_data.is_active is not None:
            db_user.is_active = user_data.is_active
        
        try:
            db.commit()
            db.refresh(db_user)
            return db_user
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Database integrity error: {str(e)}"
            )
    
    @staticmethod
    def delete_user(db: Session, user_id: str) -> bool:
        """
        Delete a user by ID.
        
        Args:
            db: Database session
            user_id: ID of user to delete
            
        Returns:
            True if user was deleted
            
        Raises:
            HTTPException: If user not found
        """
        db_user = UserService.get_user_by_id(db, user_id)
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        try:
            db.delete(db_user)
            db.commit()
            return True
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete user: {str(e)}"
            )
    
    @staticmethod
    def assign_role(db: Session, user_id: str, role_id: str) -> User:
        """
        Assign a role to a user.
        
        Args:
            db: Database session
            user_id: ID of user to update
            role_id: ID of role to assign
            
        Returns:
            Updated User object
            
        Raises:
            HTTPException: If user or role not found
        """
        # Get user
        db_user = UserService.get_user_by_id(db, user_id)
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify role exists
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role_id"
            )
        
        # Update role
        db_user.role_id = role_id
        
        try:
            db.commit()
            db.refresh(db_user)
            return db_user
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Database integrity error: {str(e)}"
            )
    
    @staticmethod
    def get_role_by_name(db: Session, role_name: str) -> Optional[Role]:
        """
        Retrieve a role by name.
        
        Args:
            db: Database session
            role_name: Name of the role (e.g., "admin", "author", "reviewer")
            
        Returns:
            Role object if found, None otherwise
        """
        return db.query(Role).filter(Role.name == role_name).first()
    
    @staticmethod
    def get_all_roles(db: Session) -> List[Role]:
        """
        Retrieve all roles.
        
        Args:
            db: Database session
            
        Returns:
            List of Role objects
        """
        return db.query(Role).all()
