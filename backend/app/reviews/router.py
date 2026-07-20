"""
Review router for peer review management endpoints.
Handles reviewer assignment, review submission, and review retrieval.

Requirements: 2.3, 5.1, 5.3, 5.4, 6.3
"""
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.users.models import User
from app.reviews import service
from app.reviews.schemas import (
    AssignReviewerRequest,
    ReviewSubmissionRequest,
    ReviewAssignmentResponse,
    ReviewResponse,
    ReviewListResponse
)


router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("/assign", response_model=ReviewAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def assign_reviewer(
    assignment_request: AssignReviewerRequest,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Assign a reviewer to a paper (admin only).
    
    Creates a review assignment and updates paper status to "Reviewer Assigned"
    if the paper is in "Submitted" or "Initial Screening" status.
    
    Requirements: 2.3
    """
    assignment = service.assign_reviewer_to_paper(db, assignment_request, current_user)
    
    # Filter assignment data for admin role
    assignment_data = service.filter_assignment_data_for_role(assignment, "admin")
    
    return ReviewAssignmentResponse(**assignment_data)


@router.get("/assignments/{assignment_id}", response_model=ReviewAssignmentResponse)
async def get_assignment(
    assignment_id: str,
    current_user: User = Depends(require_role(["reviewer", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Get review assignment by ID (reviewer or admin).
    
    Reviewers can only access their own assignments.
    Admins can access all assignments.
    
    Requirements: 5.1
    """
    assignment = service.get_assignment_by_id(db, assignment_id, current_user)
    
    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Review assignment not found"
        )
    
    # Filter assignment data based on role
    role_name = current_user.role.name.lower()
    assignment_data = service.filter_assignment_data_for_role(assignment, role_name)
    
    return ReviewAssignmentResponse(**assignment_data)


@router.get("/assignments", response_model=List[ReviewAssignmentResponse])
async def get_reviewer_assignments(
    current_user: User = Depends(require_role(["reviewer"])),
    db: Session = Depends(get_db)
):
    """
    Get all review assignments for the current reviewer.
    
    Returns a list of papers assigned to the reviewer with deadlines and status.
    
    Requirements: 5.1
    """
    assignments = service.get_reviewer_assignments(db, current_user)
    
    # Filter assignment data for reviewer role
    assignments_data = [
        ReviewAssignmentResponse(**service.filter_assignment_data_for_role(a, "reviewer"))
        for a in assignments
    ]
    
    return assignments_data


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def submit_review(
    assignment_id: str = Form(...),
    recommendation: str = Form(...),
    comments_for_author: str = Form(...),
    comments_for_editor: str = Form(...),
    review_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_role(["reviewer"])),
    db: Session = Depends(get_db)
):
    """
    Submit a review for an assigned paper (reviewer only).
    
    Updates the assignment status to "completed" and may update the paper status
    to "Under Review" if all assigned reviewers have submitted their reviews.
    
    Requirements: 5.3, 5.4
    """
    # Create ReviewSubmissionRequest from form data
    review_submission = ReviewSubmissionRequest(
        assignment_id=assignment_id,
        recommendation=recommendation,
        comments_for_author=comments_for_author,
        comments_for_editor=comments_for_editor
    )
    
    review = service.submit_review(db, review_submission, current_user, review_file)
    
    # Get the assignment to access paper_id
    assignment = review.assignment
    
    # Return review with anonymized identity (for consistency)
    review_data = {
        "id": review.id,
        "paper_id": assignment.paper_id,
        "reviewer_identity": "You",  # Current reviewer
        "recommendation": review.recommendation,
        "comments_for_author": review.comments_for_author,
        "comments_for_editor": review.comments_for_editor,
        "submitted_at": review.submitted_at,
        "review_file": review.review_file
    }
    
    return ReviewResponse(**review_data)


@router.get("/paper/{paper_id}", response_model=ReviewListResponse)
async def get_reviews_for_paper(
    paper_id: str,
    current_user: User = Depends(require_role(["author", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Get all reviews for a paper (author or admin).
    
    Authors see anonymized reviewer identities ("Reviewer #1", "Reviewer #2", etc.)
    and only comments_for_author.
    
    Admins see full reviewer information and both comments_for_author and
    comments_for_editor.
    
    Requirements: 6.3, 4.5, 4.7
    """
    reviews = service.get_reviews_for_paper(db, paper_id, current_user)
    
    # Anonymize reviewer identities based on role
    role_name = current_user.role.name.lower()
    reviews_data = service.anonymize_reviewer_identity(reviews, role_name)
    
    return ReviewListResponse(
        reviews=[ReviewResponse(**r) for r in reviews_data],
        total=len(reviews_data)
    )


@router.post("/assignments/{assignment_id}/decline", status_code=status.HTTP_200_OK)
async def decline_assignment(
    assignment_id: str,
    current_user: User = Depends(require_role(["reviewer"])),
    db: Session = Depends(get_db)
):
    """
    Decline a review assignment (reviewer only).
    Sets assignment status to 'declined' and reverts paper status
    so admin can reassign to another reviewer.
    """
    return service.decline_assignment(db, assignment_id, current_user)
