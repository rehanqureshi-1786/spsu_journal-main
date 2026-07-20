"""
Reviewer service for reviewer management operations.
Provides reviewer account creation logic and profile management.

Requirements: 2.1
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, List
from fastapi import HTTPException, status

from .models import Reviewer
from .schemas import ReviewerCreateRequest, ReviewerUpdateRequest
from app.users.models import User, Role
from app.core.security import hash_password


class ReviewerService:
    """Service class for reviewer management operations."""
    
    @staticmethod
    def create_reviewer(db: Session, reviewer_data: ReviewerCreateRequest) -> Reviewer:
        """
        Create a new reviewer account with user credentials (admin only).
        This creates both a User record and a Reviewer profile.
        
        Args:
            db: Database session
            reviewer_data: Reviewer creation request data
            
        Returns:
            Created Reviewer object
            
        Raises:
            HTTPException: If email already exists or reviewer role not found
        """
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == reviewer_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Get the reviewer role
        reviewer_role = db.query(Role).filter(Role.name == "reviewer").first()
        if not reviewer_role:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Reviewer role not found in system"
            )
        
        # Hash the password
        hashed_password = hash_password(reviewer_data.password)
        
        # Create user
        db_user = User(
            email=reviewer_data.email,
            password_hash=hashed_password,
            role_id=reviewer_role.id,
            is_active=True
        )
        
        try:
            db.add(db_user)
            db.flush()  # Flush to get the user ID
            
            # Create reviewer profile
            db_reviewer = Reviewer(
                user_id=db_user.id,
                first_name=reviewer_data.first_name,
                last_name=reviewer_data.last_name,
                affiliation=reviewer_data.affiliation,
                expertise=reviewer_data.expertise
            )
            
            db.add(db_reviewer)
            db.commit()
            db.refresh(db_reviewer)
            
            return db_reviewer
            
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Database integrity error: {str(e)}"
            )
    
    @staticmethod
    def get_reviewer_by_user_id(db: Session, user_id: str) -> Optional[Reviewer]:
        """
        Retrieve a reviewer by their user ID.
        
        Args:
            db: Database session
            user_id: User ID to retrieve reviewer for
            
        Returns:
            Reviewer object if found, None otherwise
        """
        return db.query(Reviewer).filter(Reviewer.user_id == user_id).first()
    
    @staticmethod
    def get_reviewer_by_id(db: Session, reviewer_id: str) -> Optional[Reviewer]:
        """
        Retrieve a reviewer by their reviewer ID.
        
        Args:
            db: Database session
            reviewer_id: Reviewer ID to retrieve
            
        Returns:
            Reviewer object if found, None otherwise
        """
        return db.query(Reviewer).filter(Reviewer.id == reviewer_id).first()
    
    @staticmethod
    def get_all_reviewers(db: Session, skip: int = 0, limit: int = 100) -> List[Reviewer]:
        """
        Retrieve all reviewers with pagination.
        
        Args:
            db: Database session
            skip: Number of records to skip (for pagination)
            limit: Maximum number of records to return
            
        Returns:
            List of Reviewer objects
        """
        return db.query(Reviewer).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_reviewers_count(db: Session) -> int:
        """
        Get the total count of reviewers.
        
        Args:
            db: Database session
            
        Returns:
            Total number of reviewers
        """
        return db.query(Reviewer).count()
    
    @staticmethod
    def update_reviewer_profile(
        db: Session, 
        reviewer_id: str, 
        update_data: ReviewerUpdateRequest
    ) -> Reviewer:
        """
        Update a reviewer's profile information.
        
        Args:
            db: Database session
            reviewer_id: Reviewer ID to update
            update_data: Reviewer profile update request data
            
        Returns:
            Updated Reviewer object
            
        Raises:
            HTTPException: If reviewer not found
        """
        # Get existing reviewer
        db_reviewer = ReviewerService.get_reviewer_by_id(db, reviewer_id)
        if not db_reviewer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reviewer profile not found"
            )
        
        # Update fields if provided
        if update_data.first_name is not None:
            db_reviewer.first_name = update_data.first_name
        
        if update_data.last_name is not None:
            db_reviewer.last_name = update_data.last_name
        
        if update_data.affiliation is not None:
            db_reviewer.affiliation = update_data.affiliation
        
        if update_data.expertise is not None:
            db_reviewer.expertise = update_data.expertise
        
        try:
            db.commit()
            db.refresh(db_reviewer)
            return db_reviewer
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Database integrity error: {str(e)}"
            )
    
    @staticmethod
    def delete_reviewer(db: Session, reviewer_id: str) -> None:
        """
        Delete a reviewer account (admin only).
        Deletes both the Reviewer profile and associated User account.
        
        Args:
            db: Database session
            reviewer_id: Reviewer ID to delete
            
        Raises:
            HTTPException: If reviewer not found
        """
        # Get existing reviewer
        db_reviewer = ReviewerService.get_reviewer_by_id(db, reviewer_id)
        if not db_reviewer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reviewer profile not found"
            )
        
        # Get the associated user
        user_id = db_reviewer.user_id
        db_user = db.query(User).filter(User.id == user_id).first()
        
        try:
            # Delete reviewer profile first (due to foreign key constraint)
            db.delete(db_reviewer)
            db.flush()
            
            # Delete associated user account
            if db_user:
                db.delete(db_user)
            
            db.commit()
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete reviewer: {str(e)}"
            )
    
    @staticmethod
    def get_all_reviewers_workload(db: Session) -> List[dict]:
        """
        Get workload information for all reviewers.
        Returns assigned papers count and pending reviews count for each reviewer.
        
        Args:
            db: Database session
            
        Returns:
            List of dictionaries with reviewer_id, assigned_count, and pending_count
            
        Requirements: 11.1, 11.2
        """
        from app.reviews.models import ReviewAssignment, Review
        from sqlalchemy import func, case
        
        # Query to get workload for each reviewer
        # Count total assignments and pending assignments (not completed)
        workload_query = db.query(
            Reviewer.id.label('reviewer_id'),
            func.count(ReviewAssignment.id).label('assigned_count'),
            func.sum(
                case(
                    (ReviewAssignment.status != 'completed', 1),
                    else_=0
                )
            ).label('pending_count')
        ).outerjoin(
            ReviewAssignment, Reviewer.id == ReviewAssignment.reviewer_id
        ).group_by(Reviewer.id).all()
        
        # Convert to list of dictionaries
        workload_data = []
        for row in workload_query:
            workload_data.append({
                'reviewer_id': row.reviewer_id,
                'assigned_count': row.assigned_count or 0,
                'pending_count': int(row.pending_count) if row.pending_count else 0
            })
        
        return workload_data
