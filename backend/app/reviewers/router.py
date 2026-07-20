"""
Reviewer router for reviewer management and assignments.

Requirements: 2.1, 5.1
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.users.models import User
from .schemas import (
    ReviewerCreateRequest, 
    ReviewerResponse, 
    ReviewerListResponse,
    AssignmentResponse
)
from .service import ReviewerService


router = APIRouter(prefix="/reviewers", tags=["Reviewers"])


@router.get("", response_model=ReviewerListResponse, status_code=status.HTTP_200_OK)
async def get_all_reviewers(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Get all reviewers (admin only).
    Requires authentication with admin role.
    
    **Requirements: 2.1**
    
    Args:
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        current_user: Current authenticated user (must be admin)
        db: Database session
        
    Returns:
        ReviewerListResponse with list of reviewers and total count
        
    Example:
        GET /reviewers?skip=0&limit=100
        (requires valid access_token cookie with admin role)
    """
    reviewers = ReviewerService.get_all_reviewers(db, skip=skip, limit=limit)
    total = ReviewerService.get_reviewers_count(db)
    
    # Build response with email from user relationship
    reviewer_responses = []
    for reviewer in reviewers:
        reviewer_responses.append(
            ReviewerResponse(
                id=reviewer.id,
                user_id=reviewer.user_id,
                email=reviewer.user.email,
                first_name=reviewer.first_name,
                last_name=reviewer.last_name,
                affiliation=reviewer.affiliation,
                expertise=reviewer.expertise,
                created_at=reviewer.created_at
            )
        )
    
    return ReviewerListResponse(
        reviewers=reviewer_responses,
        total=total
    )


@router.post("", response_model=ReviewerResponse, status_code=status.HTTP_201_CREATED)
async def create_reviewer(
    reviewer_data: ReviewerCreateRequest,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Create a new reviewer account (admin only).
    Creates both a User account and a Reviewer profile.
    Automatically generates a subscription certificate for the new reviewer.
    Requires authentication with admin role.
    
    **Requirements: 2.1, Certificate System 1.1, 1.2**
    
    Args:
        reviewer_data: Reviewer creation request data including credentials and profile info
        current_user: Current authenticated user (must be admin)
        db: Database session
        
    Returns:
        ReviewerResponse with created reviewer profile
        
    Raises:
        HTTPException: 400 if email already exists or validation fails
        
    Example:
        POST /reviewers
        {
            "email": "reviewer@example.com",
            "password": "secure_password",
            "first_name": "Jane",
            "last_name": "Smith",
            "affiliation": "University of Example",
            "expertise": ["Machine Learning", "Computer Vision"]
        }
    """
    reviewer = ReviewerService.create_reviewer(db, reviewer_data)
    
    # Load the user relationship to get email
    db.refresh(reviewer)
    
    # Automatically generate subscription certificate
    from datetime import datetime, timezone
    from app.certificates.service import CertificateService
    
    try:
        certificate_service = CertificateService(db)
        certificate_service.create_subscription_certificate(
            user_id=reviewer.user_id,
            subscription_date=datetime.now(timezone.utc).replace(tzinfo=None)
        )
    except Exception as e:
        # Log the error but don't fail registration if certificate generation fails
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to generate subscription certificate for reviewer {reviewer.user_id}: {str(e)}")
    
    # Build response with email from user
    return ReviewerResponse(
        id=reviewer.id,
        user_id=reviewer.user_id,
        email=reviewer.user.email,
        first_name=reviewer.first_name,
        last_name=reviewer.last_name,
        affiliation=reviewer.affiliation,
        expertise=reviewer.expertise,
        created_at=reviewer.created_at
    )


@router.delete("/{reviewer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reviewer(
    reviewer_id: str,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Delete a reviewer account (admin only).
    Deletes both the Reviewer profile and associated User account.
    Requires authentication with admin role.
    
    **Requirements: 2.1**
    
    Args:
        reviewer_id: Reviewer ID to delete
        current_user: Current authenticated user (must be admin)
        db: Database session
        
    Raises:
        HTTPException: 404 if reviewer not found
        
    Example:
        DELETE /reviewers/{reviewer_id}
        (requires valid access_token cookie with admin role)
    """
    ReviewerService.delete_reviewer(db, reviewer_id)
    return None


@router.get("/assignments", response_model=list[AssignmentResponse], status_code=status.HTTP_200_OK)
async def get_reviewer_assignments(
    current_user: User = Depends(require_role(["reviewer"])),
    db: Session = Depends(get_db)
):
    """
    Get all assignments for the current reviewer.
    Requires authentication with reviewer role.
    
    **Requirements: 5.1**
    
    Args:
        current_user: Current authenticated user (must be reviewer)
        db: Database session
        
    Returns:
        List of AssignmentResponse with assigned papers
        
    Note:
        This endpoint will be fully implemented when the ReviewAssignment 
        and Paper models are available. Currently returns an empty list.
        
    Example:
        GET /reviewers/assignments
        (requires valid access_token cookie with reviewer role)
    """
    # Get reviewer profile
    reviewer = ReviewerService.get_reviewer_by_user_id(db, current_user.id)
    
    if not reviewer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reviewer profile not found"
        )
    
    # TODO: Implement when ReviewAssignment and Paper models are available
    # For now, return empty list as a placeholder
    # This will be implemented in task 9 (Implement review assignment and submission)
    
    # Future implementation will query review_assignments table:
    # assignments = db.query(ReviewAssignment).filter(
    #     ReviewAssignment.reviewer_id == reviewer.id
    # ).all()
    # 
    # return [
    #     AssignmentResponse(
    #         id=assignment.id,
    #         paper_id=assignment.paper_id,
    #         paper_title=assignment.paper.title,
    #         anonymized_filename=assignment.paper.anonymized_filename,
    #         assigned_at=assignment.assigned_at,
    #         deadline=assignment.deadline,
    #         status=assignment.status
    #     )
    #     for assignment in assignments
    # ]
    
    return []


@router.get("/workload", status_code=status.HTTP_200_OK)
async def get_reviewers_workload(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Get workload information for all reviewers (admin only).
    Returns assigned papers count and pending reviews count for each reviewer.
    Requires authentication with admin role.
    
    **Requirements: 11.1, 11.2**
    
    Args:
        current_user: Current authenticated user (must be admin)
        db: Database session
        
    Returns:
        List of dictionaries with reviewer_id, assigned_count, and pending_count
        
    Example:
        GET /reviewers/workload
        (requires valid access_token cookie with admin role)
    """
    workload_data = ReviewerService.get_all_reviewers_workload(db)
    return workload_data
