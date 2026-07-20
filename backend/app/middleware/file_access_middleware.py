"""
File access middleware for role-based file access verification.

Implements:
- Role-based file access verification
- Anonymization enforcement for reviewers
- Public access control for published papers

Requirements: 4.3, 10.6, 10.7
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import os

from app.users.models import User
from app.papers.models import Paper
from app.publications.models import Publication
from app.reviews.models import ReviewAssignment


class FileAccessControl:
    """
    File access control utility for verifying permissions before serving files.
    """
    
    @staticmethod
    def verify_manuscript_access(
        db: Session,
        paper: Paper,
        current_user: Optional[User],
        file_path: str
    ) -> tuple[bool, str]:
        """
        Verify if user has access to a manuscript file.
        
        Args:
            db: Database session
            paper: Paper object
            current_user: Current authenticated user (None for public)
            file_path: Path to the file being accessed
            
        Returns:
            Tuple of (has_access: bool, reason: str)
            
        Requirements: 4.3, 10.6, 10.7
        """
        # Check if file exists
        if not os.path.exists(file_path):
            return False, "File not found"
        
        # Public access - only for published papers
        if current_user is None:
            if paper.status == "Published":
                # Check if paper is actually published
                publication = db.query(Publication).filter(
                    Publication.paper_id == paper.id
                ).first()
                if publication:
                    return True, "Public access to published paper"
            return False, "Authentication required for unpublished manuscripts"
        
        # Get user role
        role_name = current_user.role.name.lower()
        
        # Admin has unrestricted access
        if role_name == "admin":
            return True, "Admin unrestricted access"
        
        # Author access - only to their own papers
        if role_name == "author":
            # Check if user is the author of this paper
            if paper.author.user_id == current_user.id:
                return True, "Author access to own manuscript"
            return False, "Authors can only access their own manuscripts"
        
        # Reviewer access - only to assigned papers
        if role_name == "reviewer":
            # Get reviewer record
            from app.reviewers.models import Reviewer
            reviewer = db.query(Reviewer).filter(
                Reviewer.user_id == current_user.id
            ).first()
            
            if not reviewer:
                return False, "Reviewer record not found"
            
            # Check if reviewer is assigned to this paper
            assignment = db.query(ReviewAssignment).filter(
                ReviewAssignment.paper_id == paper.id,
                ReviewAssignment.reviewer_id == reviewer.id
            ).first()
            
            if assignment:
                return True, "Reviewer access to assigned manuscript"
            return False, "Reviewers can only access assigned manuscripts"
        
        # Unknown role
        return False, "Invalid user role"
    
    @staticmethod
    def verify_published_file_access(
        db: Session,
        paper: Paper,
        current_user: Optional[User],
        file_path: str
    ) -> tuple[bool, str]:
        """
        Verify if user has access to a published file.
        
        Published files are publicly accessible.
        
        Args:
            db: Database session
            paper: Paper object
            current_user: Current authenticated user (None for public)
            file_path: Path to the file being accessed
            
        Returns:
            Tuple of (has_access: bool, reason: str)
            
        Requirements: 8.6, 9.2, 10.6
        """
        # Check if file exists
        if not os.path.exists(file_path):
            return False, "File not found"
        
        # Verify paper is actually published
        if paper.status != "Published":
            return False, "Paper is not published"
        
        # Check if publication record exists
        publication = db.query(Publication).filter(
            Publication.paper_id == paper.id
        ).first()
        
        if not publication:
            return False, "Publication record not found"
        
        # Published papers are publicly accessible
        return True, "Public access to published paper"
    
    @staticmethod
    def verify_review_file_access(
        db: Session,
        review_id: str,
        current_user: User,
        file_path: str
    ) -> tuple[bool, str]:
        """
        Verify if user has access to a review file.
        
        Args:
            db: Database session
            review_id: Review ID
            current_user: Current authenticated user
            file_path: Path to the file being accessed
            
        Returns:
            Tuple of (has_access: bool, reason: str)
            
        Requirements: 10.6, 10.7
        """
        # Check if file exists
        if not os.path.exists(file_path):
            return False, "File not found"
        
        from app.reviews.models import Review
        
        # Get review
        review = db.query(Review).filter(Review.id == review_id).first()
        if not review:
            return False, "Review not found"
        
        # Get user role
        role_name = current_user.role.name.lower()
        
        # Admin has unrestricted access
        if role_name == "admin":
            return True, "Admin unrestricted access"
        
        # Reviewer access - only to their own reviews
        if role_name == "reviewer":
            from app.reviewers.models import Reviewer
            reviewer = db.query(Reviewer).filter(
                Reviewer.user_id == current_user.id
            ).first()
            
            if not reviewer:
                return False, "Reviewer record not found"
            
            # Check if this is the reviewer's review
            assignment = db.query(ReviewAssignment).filter(
                ReviewAssignment.id == review.assignment_id,
                ReviewAssignment.reviewer_id == reviewer.id
            ).first()
            
            if assignment:
                return True, "Reviewer access to own review"
            return False, "Reviewers can only access their own reviews"
        
        # Author access - can view reviews of their papers
        if role_name == "author":
            # Get the paper associated with this review
            assignment = db.query(ReviewAssignment).filter(
                ReviewAssignment.id == review.assignment_id
            ).first()
            
            if not assignment:
                return False, "Review assignment not found"
            
            paper = db.query(Paper).filter(Paper.id == assignment.paper_id).first()
            if not paper:
                return False, "Paper not found"
            
            # Check if user is the author
            if paper.author.user_id == current_user.id:
                return True, "Author access to review of own paper"
            return False, "Authors can only access reviews of their own papers"
        
        # Unknown role
        return False, "Invalid user role"
    
    @staticmethod
    def enforce_anonymization_for_reviewer(
        current_user: Optional[User],
        paper: Paper,
        original_filename: str
    ) -> str:
        """
        Enforce filename anonymization for reviewers.
        
        Args:
            current_user: Current authenticated user
            paper: Paper object
            original_filename: Original filename
            
        Returns:
            Filename to use (anonymized for reviewers, original for others)
            
        Requirements: 4.1, 4.3
        """
        if current_user is None:
            # Public access to published papers - use original filename
            return original_filename
        
        role_name = current_user.role.name.lower()
        
        if role_name == "reviewer":
            # Reviewers always get anonymized filename
            return paper.anonymized_filename
        else:
            # Authors and admins get original filename
            return original_filename
    
    @staticmethod
    def get_download_filename(
        current_user: Optional[User],
        paper: Paper
    ) -> str:
        """
        Get the appropriate download filename based on user role.
        
        Args:
            current_user: Current authenticated user
            paper: Paper object
            
        Returns:
            Filename to use for download
            
        Requirements: 4.1, 4.3
        """
        if current_user is None:
            # Public access - use original filename
            return paper.original_filename
        
        role_name = current_user.role.name.lower()
        
        if role_name == "reviewer":
            # Reviewers get anonymized filename
            return paper.anonymized_filename
        else:
            # Authors and admins get original filename
            return paper.original_filename


def verify_file_access(
    db: Session,
    paper_id: str,
    current_user: Optional[User],
    file_type: str = "manuscript"
) -> tuple[Paper, str, str]:
    """
    Verify file access and return paper, file path, and download filename.
    
    This is a convenience function that combines access verification and
    filename determination.
    
    Args:
        db: Database session
        paper_id: Paper ID
        current_user: Current authenticated user (None for public)
        file_type: Type of file ("manuscript" or "published")
        
    Returns:
        Tuple of (paper, file_path, download_filename)
        
    Raises:
        HTTPException: If access is denied or file not found
        
    Requirements: 4.3, 10.6, 10.7
    """
    from app.papers.file_utils import get_file_path
    from app.core.config import settings
    
    # Get paper
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )
    
    # Determine file path based on paper status
    if paper.status == "Published" and file_type == "published":
        # Get publication to determine volume/issue
        publication = db.query(Publication).filter(
            Publication.paper_id == paper.id
        ).first()
        
        if publication:
            # Construct published file path
            volume = publication.issue.volume.volume_number
            issue = publication.issue.issue_number
            file_path = os.path.join(
                settings.PUBLISHED_PATH,
                str(volume),
                str(issue),
                paper.anonymized_filename
            )
            
            # Verify access to published file
            has_access, reason = FileAccessControl.verify_published_file_access(
                db, paper, current_user, file_path
            )
        else:
            # Published status but no publication record - treat as manuscript
            file_path = get_file_path(paper.anonymized_filename, "manuscript")
            has_access, reason = FileAccessControl.verify_manuscript_access(
                db, paper, current_user, file_path
            )
    else:
        # Manuscript file
        file_path = get_file_path(paper.anonymized_filename, "manuscript")
        has_access, reason = FileAccessControl.verify_manuscript_access(
            db, paper, current_user, file_path
        )
    
    # Check access
    if not has_access:
        if current_user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=reason
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=reason
            )
    
    # Determine download filename
    download_filename = FileAccessControl.get_download_filename(current_user, paper)
    
    return paper, file_path, download_filename
