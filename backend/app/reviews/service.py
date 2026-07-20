"""
Review service for peer review management business logic.
Handles reviewer assignment, review submission, and anonymization.

Requirements: 2.3, 4.4, 4.5, 4.7, 5.1, 5.3, 5.6, 6.3
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from fastapi import HTTPException, UploadFile
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from app.reviews.models import ReviewAssignment, Review
from app.reviews.schemas import (
    AssignReviewerRequest,
    ReviewSubmissionRequest,
    ReviewAssignmentResponse,
    ReviewResponse
)
from app.papers.models import Paper, PaperStatusHistory
from app.papers.file_utils import save_review_file, validate_file_type, validate_file_size
from app.reviewers.models import Reviewer
from app.users.models import User
from app.authors.models import Author
from app.audit.service import log_action


def assign_reviewer_to_paper(
    db: Session,
    assignment_request: AssignReviewerRequest,
    admin_user: User
) -> ReviewAssignment:
    """
    Assign a reviewer to a paper (admin only).
    
    Args:
        db: Database session
        assignment_request: Assignment data (paper_id, reviewer_id, deadline)
        admin_user: Admin user making the assignment
        
    Returns:
        Created ReviewAssignment object
        
    Raises:
        HTTPException: If assignment fails or already exists
        
    Requirements: 2.3
    """
    # Verify admin role
    if admin_user.role.name.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can assign reviewers")
    
    # Verify paper exists
    paper = db.query(Paper).filter(Paper.id == assignment_request.paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Verify reviewer exists
    reviewer = db.query(Reviewer).filter(Reviewer.id == assignment_request.reviewer_id).first()
    if not reviewer:
        raise HTTPException(status_code=404, detail="Reviewer not found")
    
    # Check for duplicate assignment (exclude declined)
    existing = db.query(ReviewAssignment).filter(
        and_(
            ReviewAssignment.paper_id == assignment_request.paper_id,
            ReviewAssignment.reviewer_id == assignment_request.reviewer_id,
            ReviewAssignment.status != "declined"
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=409,
            detail="This reviewer is already assigned to this paper"
        )
    
    try:
        # Create review assignment
        assignment = ReviewAssignment(
            paper_id=assignment_request.paper_id,
            reviewer_id=assignment_request.reviewer_id,
            assigned_by=admin_user.id,
            deadline=assignment_request.deadline,
            status="pending"
        )
        
        db.add(assignment)
        db.flush()
        
        # Update paper status to "Reviewer Assigned" if not already in a later stage
        if paper.status in ["Submitted", "Initial Screening"]:
            paper.status = "Reviewer Assigned"
            
            # Create status history entry
            status_history = PaperStatusHistory(
                paper_id=paper.id,
                status="Reviewer Assigned",
                changed_by=admin_user.id,
                notes=f"Reviewer assigned: {reviewer.first_name} {reviewer.last_name}"
            )
            db.add(status_history)
        
        # Log reviewer assignment
        log_action(
            db=db,
            user_id=admin_user.id,
            action="reviewer_assigned",
            resource_type="paper",
            resource_id=paper.id,
            details={
                "reviewer_id": assignment_request.reviewer_id,
                "reviewer_name": f"{reviewer.first_name} {reviewer.last_name}",
                "deadline": assignment_request.deadline.isoformat()
            }
        )
        
        db.commit()
        db.refresh(assignment)
        
        return assignment
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to assign reviewer: {str(e)}"
        )


def get_reviewer_assignments(
    db: Session,
    user: User
) -> List[ReviewAssignment]:
    """
    Get review assignments for a reviewer.
    
    Args:
        db: Database session
        user: Current user (must be reviewer)
        
    Returns:
        List of ReviewAssignment objects for this reviewer
        
    Raises:
        HTTPException: If user is not a reviewer
        
    Requirements: 5.1
    """
    # Verify user is a reviewer
    if user.role.name.lower() != "reviewer":
        raise HTTPException(status_code=403, detail="Only reviewers can access assignments")
    
    # Get reviewer record
    reviewer = db.query(Reviewer).filter(Reviewer.user_id == user.id).first()
    if not reviewer:
        raise HTTPException(status_code=404, detail="Reviewer profile not found")
    
    # Get assignments with paper details
    assignments = db.query(ReviewAssignment).options(
        joinedload(ReviewAssignment.paper)
    ).filter(
        ReviewAssignment.reviewer_id == reviewer.id
    ).order_by(ReviewAssignment.deadline.asc()).all()
    
    return assignments


def get_assignment_by_id(
    db: Session,
    assignment_id: str,
    user: User
) -> Optional[ReviewAssignment]:
    """
    Get review assignment by ID with access control.
    
    Args:
        db: Database session
        assignment_id: Assignment UUID
        user: Current user
        
    Returns:
        ReviewAssignment object if found and accessible
        
    Raises:
        HTTPException: If access denied
        
    Requirements: 4.4, 5.1
    """
    assignment = db.query(ReviewAssignment).options(
        joinedload(ReviewAssignment.paper),
        joinedload(ReviewAssignment.reviewer)
    ).filter(ReviewAssignment.id == assignment_id).first()
    
    if not assignment:
        return None
    
    role_name = user.role.name.lower()
    
    if role_name == "admin":
        # Admin can access all assignments
        return assignment
    elif role_name == "reviewer":
        # Reviewer can only access their own assignments
        reviewer = db.query(Reviewer).filter(Reviewer.user_id == user.id).first()
        if reviewer and assignment.reviewer_id == reviewer.id:
            return assignment
        raise HTTPException(status_code=403, detail="Access denied")
    else:
        # Authors and public cannot access assignments
        raise HTTPException(status_code=403, detail="Access denied")


def check_reviewer_access_to_paper(
    db: Session,
    paper_id: str,
    reviewer_id: str
) -> bool:
    """
    Check if a reviewer has access to a paper.
    
    Args:
        db: Database session
        paper_id: Paper UUID
        reviewer_id: Reviewer UUID
        
    Returns:
        True if reviewer is assigned to the paper, False otherwise
        
    Requirements: 4.4
    """
    assignment = db.query(ReviewAssignment).filter(
        and_(
            ReviewAssignment.paper_id == paper_id,
            ReviewAssignment.reviewer_id == reviewer_id
        )
    ).first()
    
    return assignment is not None


def submit_review(
    db: Session,
    review_submission: ReviewSubmissionRequest,
    user: User,
    review_file: Optional[UploadFile] = None
) -> Review:
    """
    Submit a review for an assigned paper.
    
    Args:
        db: Database session
        review_submission: Review data
        user: Current user (must be reviewer)
        review_file: Optional uploaded review file
        
    Returns:
        Created Review object
        
    Raises:
        HTTPException: If submission fails or assignment not found
        
    Requirements: 5.3
    """
    # Verify user is a reviewer
    if user.role.name.lower() != "reviewer":
        raise HTTPException(status_code=403, detail="Only reviewers can submit reviews")
    
    # Get reviewer record
    reviewer = db.query(Reviewer).filter(Reviewer.user_id == user.id).first()
    if not reviewer:
        raise HTTPException(status_code=404, detail="Reviewer profile not found")
    
    # Get assignment and verify access
    assignment = db.query(ReviewAssignment).options(
        joinedload(ReviewAssignment.paper)
    ).filter(ReviewAssignment.id == review_submission.assignment_id).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Review assignment not found")
    
    if assignment.reviewer_id != reviewer.id:
        raise HTTPException(status_code=403, detail="You can only submit reviews for your own assignments")
    
    # Check if review already exists
    existing_review = db.query(Review).filter(
        Review.assignment_id == assignment.id
    ).first()
    
    if existing_review:
        raise HTTPException(status_code=409, detail="Review already submitted for this assignment")
    
    try:
        # Handle file upload if provided
        review_file_path = None
        if review_file and review_file.filename:
            # Validate file
            validate_file_type(review_file)
            validate_file_size(review_file)
            
            # Generate unique filename for review
            file_extension = review_file.filename.split('.')[-1] if '.' in review_file.filename else 'pdf'
            review_filename = f"REVIEW-{assignment.id}-{uuid.uuid4()}.{file_extension}"
            
            # Save file
            save_review_file(review_file, review_filename)
            review_file_path = review_filename
        
        # Create review
        review = Review(
            assignment_id=assignment.id,
            recommendation=review_submission.recommendation,
            comments_for_author=review_submission.comments_for_author,
            comments_for_editor=review_submission.comments_for_editor,
            review_file=review_file_path
        )
        
        db.add(review)
        db.flush()
        
        # Update assignment status
        assignment.status = "completed"
        
        # Check if all reviews for this paper are complete
        all_assignments = db.query(ReviewAssignment).filter(
            ReviewAssignment.paper_id == assignment.paper_id
        ).all()
        
        all_complete = all(a.status == "completed" for a in all_assignments)
        
        # Update paper status based on review completion
        paper = assignment.paper
        if all_complete:
            # All reviews are complete - move to "Under Review" (ready for editorial decision)
            if paper.status in ["Reviewer Assigned", "Under Review"]:
                paper.status = "Under Review"
                
                # Create status history entry
                status_history = PaperStatusHistory(
                    paper_id=paper.id,
                    status="Under Review",
                    changed_by=user.id,
                    notes="All reviews completed - ready for editorial decision"
                )
                db.add(status_history)
        else:
            # Some reviews still pending - ensure status reflects ongoing review
            if paper.status == "Reviewer Assigned":
                paper.status = "Under Review"
                
                # Create status history entry
                status_history = PaperStatusHistory(
                    paper_id=paper.id,
                    status="Under Review",
                    changed_by=user.id,
                    notes=f"Review submitted by reviewer (pending {len([a for a in all_assignments if a.status != 'completed'])} more)"
                )
                db.add(status_history)
        
        db.commit()
        db.refresh(review)
        
        return review
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit review: {str(e)}"
        )


def get_reviews_for_paper(
    db: Session,
    paper_id: str,
    user: User
) -> List[Review]:
    """
    Get reviews for a paper with role-based filtering.
    
    Args:
        db: Database session
        paper_id: Paper UUID
        user: Current user
        
    Returns:
        List of Review objects with appropriate anonymization
        
    Raises:
        HTTPException: If access denied
        
    Requirements: 4.5, 4.7, 6.3
    """
    # Verify paper exists
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    role_name = user.role.name.lower()
    
    # Check access permissions
    if role_name == "admin":
        # Admin can see all reviews
        pass
    elif role_name == "author":
        # Author can only see reviews for their own papers
        author = db.query(Author).filter(Author.user_id == user.id).first()
        if not author or paper.author_id != author.id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif role_name == "reviewer":
        # Reviewers cannot see other reviewers' reviews
        raise HTTPException(status_code=403, detail="Reviewers cannot view other reviews")
    else:
        # Public cannot access reviews
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get reviews with assignment details
    reviews = db.query(Review).join(
        ReviewAssignment, Review.assignment_id == ReviewAssignment.id
    ).filter(
        ReviewAssignment.paper_id == paper_id
    ).options(
        joinedload(Review.assignment).joinedload(ReviewAssignment.reviewer)
    ).all()
    
    return reviews


def anonymize_reviewer_identity(
    reviews: List[Review],
    user_role: str
) -> List[Dict[str, Any]]:
    """
    Anonymize reviewer identities based on user role.
    
    Args:
        reviews: List of Review objects
        user_role: Role of the user requesting the data
        
    Returns:
        List of dictionaries with anonymized reviewer identities
        
    Requirements: 4.5, 4.7, 5.6
    """
    anonymized_reviews = []
    
    for idx, review in enumerate(reviews, start=1):
        review_data = {
            "id": review.id,
            "paper_id": review.assignment.paper_id,
            "recommendation": review.recommendation,
            "comments_for_author": review.comments_for_author,
            "submitted_at": review.submitted_at,
            "review_file": review.review_file
        }
        
        if user_role == "admin":
            # Admin sees full reviewer information
            reviewer = review.assignment.reviewer
            review_data["reviewer_identity"] = f"{reviewer.first_name} {reviewer.last_name}"
            review_data["comments_for_editor"] = review.comments_for_editor
        else:
            # Author sees anonymized reviewer identity
            review_data["reviewer_identity"] = f"Reviewer #{idx}"
            # comments_for_editor not included for authors
        
        anonymized_reviews.append(review_data)
    
    return anonymized_reviews


def filter_assignment_data_for_role(
    assignment: ReviewAssignment,
    user_role: str
) -> Dict[str, Any]:
    """
    Filter assignment data based on user role.
    
    Args:
        assignment: ReviewAssignment object
        user_role: Role of the user requesting the data
        
    Returns:
        Dictionary with filtered assignment data
        
    Requirements: 4.1, 4.2, 5.1
    """
    data = {
        "id": assignment.id,
        "paper_id": assignment.paper_id,
        "assigned_at": assignment.assigned_at,
        "deadline": assignment.deadline,
        "status": assignment.status
    }
    
    if user_role == "admin":
        # Admin sees everything
        data["reviewer_id"] = assignment.reviewer_id
        data["assigned_by"] = assignment.assigned_by
        if assignment.paper:
            data["paper_title"] = assignment.paper.title
            data["anonymized_filename"] = assignment.paper.anonymized_filename
    elif user_role == "reviewer":
        # Reviewer sees paper details but anonymized
        if assignment.paper:
            data["paper_title"] = assignment.paper.title
            data["anonymized_filename"] = assignment.paper.anonymized_filename
        # No reviewer_id or assigned_by for reviewers
    
    return data


def decline_assignment(db: Session, assignment_id: str, current_user):
    """Decline a review assignment. Sets status to declined so admin can reassign."""
    from app.reviewers.models import Reviewer

    if current_user.role.name.lower() != "reviewer":
        raise HTTPException(status_code=403, detail="Only reviewers can decline assignments")

    reviewer = db.query(Reviewer).filter(Reviewer.user_id == current_user.id).first()
    if not reviewer:
        raise HTTPException(status_code=404, detail="Reviewer profile not found")

    assignment = db.query(ReviewAssignment).filter(
        ReviewAssignment.id == assignment_id,
        ReviewAssignment.reviewer_id == reviewer.id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if assignment.status == "completed":
        raise HTTPException(status_code=409, detail="Cannot decline a completed assignment")

    if assignment.status == "declined":
        raise HTTPException(status_code=409, detail="Assignment already declined")

    assignment.status = "declined"

    # Notify admin about the decline
    from app.audit.models import Notification
    paper = db.query(Paper).filter(Paper.id == assignment.paper_id).first()
    paper_title = paper.title if paper else "Unknown"
    reviewer_name = f"{reviewer.first_name} {reviewer.last_name}" if hasattr(reviewer, 'first_name') else current_user.email
    notif = Notification(
        id=str(uuid.uuid4()),
        role="admin",
        title="Reviewer Declined Assignment",
        message=f"Reviewer {reviewer_name} has declined to review paper \"{paper_title}\". Please reassign to another reviewer.",
        type="warning"
    )
    db.add(notif)

    # Check if paper needs status update (no active reviewers left)
    active = db.query(ReviewAssignment).filter(
        ReviewAssignment.paper_id == assignment.paper_id,
        ReviewAssignment.status.in_(["pending", "in_progress"])
    ).count()

    if active == 0 and paper and paper.status in ("Reviewer Assigned", "Under Review"):
        paper.status = "Submitted"
        status_history = PaperStatusHistory(
            paper_id=paper.id,
            status="Submitted",
            changed_by=current_user.id,
            notes="Reverted: reviewer declined assignment, needs reassignment"
        )
        db.add(status_history)

    db.commit()
    return {"message": "Assignment declined. Admin will be notified to reassign.", "status": "declined"}
