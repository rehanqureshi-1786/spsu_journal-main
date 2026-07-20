"""
Paper service for manuscript management business logic.
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from fastapi import HTTPException, UploadFile
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

from app.papers.models import Paper, PaperVersion, PaperStatusHistory
from app.papers.schemas import (
    PaperSubmissionRequest,
    PaperResponse,
    PaperTimelineResponse,
    StatusChangeResponse,
    PaperStatusUpdateRequest,
    PaperRevisionRequest,
    PaperSearchResponse
)
from app.papers import file_utils
from app.users.models import User
from app.authors.models import Author
from app.audit.service import log_action


def create_paper_submission(
    db: Session,
    submission: PaperSubmissionRequest,
    file: UploadFile,
    author_id: str
) -> Paper:
    """
    Create a new paper submission.
    
    Args:
        db: Database session
        submission: Paper submission data
        file: Uploaded manuscript file
        author_id: ID of the author submitting the paper
        
    Returns:
        Created Paper object
        
    Raises:
        HTTPException: If submission fails
    """
    # Get the author to retrieve user_id
    author = db.query(Author).filter(Author.id == author_id).first()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    
    # Validate and process file upload
    file_hash, original_filename = file_utils.validate_and_process_upload(file)
    
    # Generate paper UUID
    paper_id = str(uuid.uuid4())
    
    # Generate anonymized filename
    anonymized_filename = file_utils.generate_anonymized_filename(paper_id, version=1)
    
    # Save manuscript file
    file_utils.save_manuscript(file, anonymized_filename)
    
    try:
        # Create paper record
        paper = Paper(
            id=paper_id,
            author_id=author_id,
            title=submission.title,
            abstract=submission.abstract,
            keywords=submission.keywords,
            original_filename=original_filename,
            anonymized_filename=anonymized_filename,
            file_hash=file_hash,
            status="Submitted"
        )
        
        db.add(paper)
        db.flush()
        
        # Create initial status history entry using user_id (not author_id)
        status_history = PaperStatusHistory(
            paper_id=paper.id,
            status="Submitted",
            changed_by=author.user_id,  # Use user_id from author
            notes="Initial submission"
        )
        db.add(status_history)
        
        db.commit()
        db.refresh(paper)
        
        return paper
    except Exception as e:
        db.rollback()
        # Clean up uploaded file on error
        file_utils.delete_file(anonymized_filename, "manuscript")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create paper submission: {str(e)}"
        )


def get_papers_for_user(db: Session, user: User) -> List[Paper]:
    """
    Get papers filtered by user role.
    
    Args:
        db: Database session
        user: Current user
        
    Returns:
        List of Paper objects filtered by role
    """
    role_name = user.role.name.lower()
    
    if role_name == "admin":
        # Admin sees all papers
        papers = db.query(Paper).options(
            joinedload(Paper.author).joinedload(Author.user)
        ).order_by(Paper.submitted_at.desc()).all()
    elif role_name == "author":
        # Author sees only their own papers
        author = db.query(Author).filter(Author.user_id == user.id).first()
        if not author:
            return []
        papers = db.query(Paper).filter(
            Paper.author_id == author.id
        ).options(
            joinedload(Paper.author).joinedload(Author.user)
        ).order_by(Paper.submitted_at.desc()).all()
    elif role_name == "reviewer":
        # Reviewer sees only assigned papers
        from app.reviewers.models import Reviewer
        from app.reviews.models import ReviewAssignment
        
        reviewer = db.query(Reviewer).filter(Reviewer.user_id == user.id).first()
        if not reviewer:
            return []
        
        # Get papers assigned to this reviewer
        papers = db.query(Paper).join(
            ReviewAssignment, Paper.id == ReviewAssignment.paper_id
        ).filter(
            ReviewAssignment.reviewer_id == reviewer.id
        ).options(
            joinedload(Paper.author).joinedload(Author.user)
        ).order_by(Paper.submitted_at.desc()).all()
    else:
        # Public users see only published papers
        papers = db.query(Paper).filter(
            Paper.status == "Published"
        ).options(
            joinedload(Paper.author).joinedload(Author.user)
        ).order_by(Paper.submitted_at.desc()).all()
    
    return papers


def get_paper_by_id(db: Session, paper_id: str, user: User) -> Optional[Paper]:
    """
    Get paper by ID with role-based access control.
    
    Args:
        db: Database session
        paper_id: Paper UUID
        user: Current user
        
    Returns:
        Paper object if found and accessible, None otherwise
        
    Raises:
        HTTPException: If access is denied
    """
    paper = db.query(Paper).options(
        joinedload(Paper.author).joinedload(Author.user)
    ).filter(Paper.id == paper_id).first()
    
    if not paper:
        return None
    
    role_name = user.role.name.lower()
    
    # Check access permissions
    if role_name == "admin":
        # Admin can access all papers
        return paper
    elif role_name == "author":
        # Author can only access their own papers
        author = db.query(Author).filter(Author.user_id == user.id).first()
        if author and paper.author_id == author.id:
            return paper
        raise HTTPException(status_code=403, detail="Access denied")
    elif role_name == "reviewer":
        # Reviewer can only access assigned papers
        from app.reviewers.models import Reviewer
        from app.reviews.models import ReviewAssignment
        
        reviewer = db.query(Reviewer).filter(Reviewer.user_id == user.id).first()
        if not reviewer:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if reviewer is assigned to this paper
        assignment = db.query(ReviewAssignment).filter(
            and_(
                ReviewAssignment.paper_id == paper_id,
                ReviewAssignment.reviewer_id == reviewer.id
            )
        ).first()
        
        if assignment:
            return paper
        raise HTTPException(status_code=403, detail="Access denied")
    else:
        # Public can only access published papers
        if paper.status == "Published":
            return paper
        raise HTTPException(status_code=403, detail="Access denied")


def filter_paper_data_for_role(paper: Paper, user: User) -> Dict[str, Any]:
    """
    Filter paper data based on user role for anonymization.
    
    Args:
        paper: Paper object
        user: Current user
        
    Returns:
        Dictionary with filtered paper data
    """
    role_name = user.role.name.lower()
    
    # Base data available to all roles
    data = {
        "id": paper.id,
        "title": paper.title,
        "abstract": paper.abstract,
        "keywords": paper.keywords,
        "status": paper.status,
        "submitted_at": paper.submitted_at,
        "updated_at": paper.updated_at,
    }
    
    if role_name == "reviewer":
        # Reviewer sees anonymized filename only, no author info
        data["anonymized_filename"] = paper.anonymized_filename
    elif role_name == "author":
        # Author sees their own info and original filename
        data["original_filename"] = paper.original_filename
        data["author_id"] = paper.author_id
        if paper.author:
            data["author_name"] = f"{paper.author.first_name} {paper.author.last_name}"
    elif role_name == "admin":
        # Admin sees everything
        data["original_filename"] = paper.original_filename
        data["anonymized_filename"] = paper.anonymized_filename
        data["author_id"] = paper.author_id
        if paper.author:
            data["author_name"] = f"{paper.author.first_name} {paper.author.last_name}"
    else:
        # Public sees author info for published papers
        if paper.status == "Published":
            data["author_id"] = paper.author_id
            if paper.author:
                data["author_name"] = f"{paper.author.first_name} {paper.author.last_name}"
    
    return data


def get_paper_timeline(db: Session, paper_id: str, user: User) -> PaperTimelineResponse:
    """
    Get paper status timeline.
    
    Args:
        db: Database session
        paper_id: Paper UUID
        user: Current user
        
    Returns:
        PaperTimelineResponse with status history
        
    Raises:
        HTTPException: If paper not found or access denied
    """
    # Verify paper exists and user has access
    paper = get_paper_by_id(db, paper_id, user)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Only author and admin can view timeline
    role_name = user.role.name.lower()
    if role_name not in ["author", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get status history
    history = db.query(PaperStatusHistory).filter(
        PaperStatusHistory.paper_id == paper_id
    ).order_by(PaperStatusHistory.changed_at.asc()).all()
    
    timeline = [
        StatusChangeResponse(
            status=entry.status,
            changed_by=entry.changed_by,
            changed_at=entry.changed_at,
            notes=entry.notes
        )
        for entry in history
    ]
    
    return PaperTimelineResponse(paper_id=paper_id, timeline=timeline)


def update_paper_status(
    db: Session,
    paper_id: str,
    status_update: PaperStatusUpdateRequest,
    user: User
) -> Paper:
    """
    Update paper status (admin only).
    
    Prevents backwards status progression to maintain workflow integrity.
    
    Args:
        db: Database session
        paper_id: Paper UUID
        status_update: New status and notes
        user: Current user (must be admin)
        
    Returns:
        Updated Paper object
        
    Raises:
        HTTPException: If paper not found, user not authorized, or invalid status change
    """
    # Verify user is admin
    if user.role.name.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update paper status")
    
    # Get paper
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    old_status = paper.status
    new_status = status_update.status
    
    # Define status progression order (lower number = earlier in workflow)
    status_order = {
        "Submitted": 1,
        "Initial Screening": 2,
        "Reviewer Assigned": 3,
        "Under Review": 4,
        "Revision Required": 4,  # Same level as Under Review (can go back and forth)
        "Accepted": 5,
        "Rejected": 5,  # Same level as Accepted (final decisions)
        "Published": 6
    }
    
    # Validate status change - prevent backwards progression
    if old_status in status_order and new_status in status_order:
        old_order = status_order[old_status]
        new_order = status_order[new_status]
        
        # Prevent going backwards
        if new_order < old_order:
            # Exception: Can go between Under Review and Revision Required
            if not ((old_status == "Under Review" and new_status == "Revision Required") or 
                    (old_status == "Revision Required" and new_status == "Under Review")):
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot change status backwards from '{old_status}' to '{new_status}'. Status can only progress forward in the review workflow."
                )
    
    try:
        # Update paper status
        paper.status = new_status
        
        # Create status history entry
        status_history = PaperStatusHistory(
            paper_id=paper.id,
            status=new_status,
            changed_by=user.id,
            notes=status_update.notes or f"Status changed from {old_status} to {new_status}"
        )
        db.add(status_history)
        
        # Log status change
        log_action(
            db=db,
            user_id=user.id,
            action="paper_status_change",
            resource_type="paper",
            resource_id=paper.id,
            details={
                "old_status": old_status,
                "new_status": new_status,
                "notes": status_update.notes
            }
        )
        
        db.commit()
        db.refresh(paper)
        
        return paper
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update paper status: {str(e)}"
        )


def upload_paper_revision(
    db: Session,
    paper_id: str,
    file: UploadFile,
    revision_request: PaperRevisionRequest,
    user: User
) -> PaperVersion:
    """
    Upload a revised version of a paper.
    
    Args:
        db: Database session
        paper_id: Paper UUID
        file: Uploaded revision file
        revision_request: Revision notes
        user: Current user (must be paper author)
        
    Returns:
        Created PaperVersion object
        
    Raises:
        HTTPException: If paper not found, access denied, or upload fails
    """
    # Get paper and verify access
    paper = get_paper_by_id(db, paper_id, user)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Verify user is the author
    role_name = user.role.name.lower()
    if role_name != "author":
        raise HTTPException(status_code=403, detail="Only authors can upload revisions")
    
    author = db.query(Author).filter(Author.user_id == user.id).first()
    if not author or paper.author_id != author.id:
        raise HTTPException(status_code=403, detail="You can only upload revisions to your own papers")
    
    # Validate and process file upload
    file_hash, original_filename = file_utils.validate_and_process_upload(file)
    
    # Get next version number
    max_version = db.query(PaperVersion).filter(
        PaperVersion.paper_id == paper_id
    ).count()
    next_version = max_version + 2  # +1 for count to number, +1 for next version
    
    # Generate anonymized filename for this version
    anonymized_filename = file_utils.generate_anonymized_filename(paper.id, version=next_version)
    
    # Save manuscript file
    file_utils.save_manuscript(file, anonymized_filename)
    
    try:
        # Create paper version record
        version = PaperVersion(
            paper_id=paper.id,
            version_number=next_version,
            filename=anonymized_filename,
            file_hash=file_hash,
            notes=revision_request.notes
        )
        
        db.add(version)
        
        # Update paper's anonymized filename to latest version
        paper.anonymized_filename = anonymized_filename
        paper.file_hash = file_hash
        
        # Create status history entry
        status_history = PaperStatusHistory(
            paper_id=paper.id,
            status=paper.status,
            changed_by=user.id,
            notes=f"Revision uploaded (version {next_version})"
        )
        db.add(status_history)
        
        db.commit()
        db.refresh(version)
        
        return version
    except Exception as e:
        db.rollback()
        # Clean up uploaded file on error
        file_utils.delete_file(anonymized_filename, "manuscript")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload revision: {str(e)}"
        )


def get_paper_versions(db: Session, paper_id: str, user: User) -> List[PaperVersion]:
    """
    Get all versions of a paper.
    
    Args:
        db: Database session
        paper_id: Paper UUID
        user: Current user
        
    Returns:
        List of PaperVersion objects
        
    Raises:
        HTTPException: If paper not found or access denied
    """
    # Verify paper exists and user has access
    paper = get_paper_by_id(db, paper_id, user)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Get versions
    versions = db.query(PaperVersion).filter(
        PaperVersion.paper_id == paper_id
    ).order_by(PaperVersion.version_number.asc()).all()
    
    return versions



def search_papers(
    db: Session,
    user: User,
    q: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 20
) -> PaperSearchResponse:
    """
    Search and filter papers with pagination.
    
    Args:
        db: Database session
        user: Current user
        q: Search query (searches title and author name, case-insensitive)
        status: Filter by paper status
        date_from: Filter by submission date (from)
        date_to: Filter by submission date (to)
        page: Page number (1-indexed)
        page_size: Number of items per page
        
    Returns:
        PaperSearchResponse with paginated results
    """
    role_name = user.role.name.lower()
    
    # Start with base query based on role
    query = db.query(Paper).options(
        joinedload(Paper.author).joinedload(Author.user)
    )
    
    # Apply role-based filtering
    if role_name == "admin":
        # Admin sees all papers
        pass
    elif role_name == "author":
        # Author sees only their own papers
        author = db.query(Author).filter(Author.user_id == user.id).first()
        if not author:
            return PaperSearchResponse(
                items=[],
                total=0,
                page=page,
                page_size=page_size,
                total_pages=0
            )
        query = query.filter(Paper.author_id == author.id)
    elif role_name == "reviewer":
        # Reviewer sees only assigned papers
        from app.reviewers.models import Reviewer
        from app.reviews.models import ReviewAssignment
        
        reviewer = db.query(Reviewer).filter(Reviewer.user_id == user.id).first()
        if not reviewer:
            return PaperSearchResponse(
                items=[],
                total=0,
                page=page,
                page_size=page_size,
                total_pages=0
            )
        
        query = query.join(
            ReviewAssignment, Paper.id == ReviewAssignment.paper_id
        ).filter(ReviewAssignment.reviewer_id == reviewer.id)
    else:
        # Public users see only published papers
        query = query.filter(Paper.status == "Published")
    
    # Apply search filter (title or author name)
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                Paper.title.ilike(search_term),
                Author.first_name.ilike(search_term),
                Author.last_name.ilike(search_term)
            )
        )
    
    # Apply status filter
    if status:
        query = query.filter(Paper.status == status)
    
    # Apply date range filters
    if date_from:
        query = query.filter(Paper.submitted_at >= date_from)
    if date_to:
        # Include the entire day by adding 23:59:59
        from datetime import timedelta
        date_to_end = date_to + timedelta(days=1) - timedelta(seconds=1)
        query = query.filter(Paper.submitted_at <= date_to_end)
    
    # Get total count before pagination
    total = query.count()
    
    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    # Apply pagination
    offset = (page - 1) * page_size
    papers = query.order_by(Paper.submitted_at.desc()).offset(offset).limit(page_size).all()
    
    # Filter paper data based on role
    items = [
        PaperResponse(**filter_paper_data_for_role(paper, user))
        for paper in papers
    ]
    
    return PaperSearchResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


def get_papers_for_export(
    db: Session,
    user: User,
    q: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
) -> List[Paper]:
    """
    Get all papers matching filters for CSV export (no pagination).
    
    Args:
        db: Database session
        user: Current user
        q: Search query (searches title and author name, case-insensitive)
        status: Filter by paper status
        date_from: Filter by submission date (from)
        date_to: Filter by submission date (to)
        
    Returns:
        List of Paper objects with author relationships loaded
    """
    role_name = user.role.name.lower()
    
    # Start with base query
    query = db.query(Paper).options(
        joinedload(Paper.author).joinedload(Author.user)
    )
    
    # Apply role-based filtering
    if role_name == "admin":
        # Admin sees all papers
        pass
    elif role_name == "author":
        # Author sees only their own papers
        author = db.query(Author).filter(Author.user_id == user.id).first()
        if not author:
            return []
        query = query.filter(Paper.author_id == author.id)
    elif role_name == "reviewer":
        # Reviewer sees only assigned papers
        from app.reviewers.models import Reviewer
        from app.reviews.models import ReviewAssignment
        
        reviewer = db.query(Reviewer).filter(Reviewer.user_id == user.id).first()
        if not reviewer:
            return []
        
        query = query.join(
            ReviewAssignment, Paper.id == ReviewAssignment.paper_id
        ).filter(ReviewAssignment.reviewer_id == reviewer.id)
    else:
        # Public users see only published papers
        query = query.filter(Paper.status == "Published")
    
    # Apply search filter (title or author name)
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                Paper.title.ilike(search_term),
                Author.first_name.ilike(search_term),
                Author.last_name.ilike(search_term)
            )
        )
    
    # Apply status filter
    if status:
        query = query.filter(Paper.status == status)
    
    # Apply date range filters
    if date_from:
        query = query.filter(Paper.submitted_at >= date_from)
    if date_to:
        # Include the entire day by adding 23:59:59
        from datetime import timedelta
        date_to_end = date_to + timedelta(days=1) - timedelta(seconds=1)
        query = query.filter(Paper.submitted_at <= date_to_end)
    
    # Return all results ordered by submission date
    return query.order_by(Paper.submitted_at.desc()).all()


def bulk_action_papers(
    db: Session,
    action: str,
    paper_ids: List[str],
    user: User,
    new_status: Optional[str] = None,
    reviewer_id: Optional[str] = None,
    deadline: Optional[datetime] = None,
    notes: Optional[str] = None
) -> tuple[List[str], List[dict]]:
    """
    Perform bulk action on multiple papers.
    
    Args:
        db: Database session
        action: Action to perform ("change_status" or "assign_reviewer")
        paper_ids: List of paper IDs to process
        user: Current user (must be admin)
        new_status: New status for change_status action
        reviewer_id: Reviewer ID for assign_reviewer action
        deadline: Deadline for assign_reviewer action
        notes: Optional notes for the action
        
    Returns:
        Tuple of (successful_paper_ids, failed_items)
        where failed_items is a list of dicts with paper_id and error
        
    Raises:
        HTTPException: If user is not admin
    """
    from app.papers.schemas import BulkActionError
    from app.reviewers.models import Reviewer
    from app.reviews.models import ReviewAssignment
    
    # Verify user is admin
    if user.role.name.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can perform bulk actions")
    
    successful = []
    failed = []
    
    if action == "change_status":
        # Bulk status change
        for paper_id in paper_ids:
            try:
                # Get paper
                paper = db.query(Paper).filter(Paper.id == paper_id).first()
                if not paper:
                    failed.append({
                        "paper_id": paper_id,
                        "error": "Paper not found"
                    })
                    continue
                
                old_status = paper.status
                
                # Define status progression order
                status_order = {
                    "Submitted": 1,
                    "Initial Screening": 2,
                    "Reviewer Assigned": 3,
                    "Under Review": 4,
                    "Revision Required": 4,
                    "Accepted": 5,
                    "Rejected": 5,
                    "Published": 6
                }
                
                # Validate status change
                if old_status in status_order and new_status in status_order:
                    old_order = status_order[old_status]
                    new_order = status_order[new_status]
                    
                    # Prevent going backwards
                    if new_order < old_order:
                        if not ((old_status == "Under Review" and new_status == "Revision Required") or 
                                (old_status == "Revision Required" and new_status == "Under Review")):
                            failed.append({
                                "paper_id": paper_id,
                                "error": f"Cannot change status backwards from '{old_status}' to '{new_status}'"
                            })
                            continue
                
                # Update paper status
                paper.status = new_status
                
                # Create status history entry
                status_history = PaperStatusHistory(
                    paper_id=paper.id,
                    status=new_status,
                    changed_by=user.id,
                    notes=notes or f"Bulk status change from {old_status} to {new_status}"
                )
                db.add(status_history)
                
                # Log status change
                log_action(
                    db=db,
                    user_id=user.id,
                    action="bulk_paper_status_change",
                    resource_type="paper",
                    resource_id=paper.id,
                    details={
                        "old_status": old_status,
                        "new_status": new_status,
                        "notes": notes
                    }
                )
                
                successful.append(paper_id)
                
            except Exception as e:
                failed.append({
                    "paper_id": paper_id,
                    "error": str(e)
                })
    
    elif action == "assign_reviewer":
        # Bulk reviewer assignment
        # Verify reviewer exists
        reviewer = db.query(Reviewer).filter(Reviewer.id == reviewer_id).first()
        if not reviewer:
            # All papers fail if reviewer doesn't exist
            for paper_id in paper_ids:
                failed.append({
                    "paper_id": paper_id,
                    "error": "Reviewer not found"
                })
            return successful, failed
        
        for paper_id in paper_ids:
            try:
                # Verify paper exists
                paper = db.query(Paper).filter(Paper.id == paper_id).first()
                if not paper:
                    failed.append({
                        "paper_id": paper_id,
                        "error": "Paper not found"
                    })
                    continue
                
                # Check for duplicate assignment
                existing = db.query(ReviewAssignment).filter(
                    and_(
                        ReviewAssignment.paper_id == paper_id,
                        ReviewAssignment.reviewer_id == reviewer_id
                    )
                ).first()
                
                if existing:
                    failed.append({
                        "paper_id": paper_id,
                        "error": "Reviewer already assigned to this paper"
                    })
                    continue
                
                # Create review assignment
                assignment = ReviewAssignment(
                    paper_id=paper_id,
                    reviewer_id=reviewer_id,
                    assigned_by=user.id,
                    deadline=deadline,
                    status="pending"
                )
                
                db.add(assignment)
                
                # Update paper status to "Reviewer Assigned" if not already in a later stage
                if paper.status in ["Submitted", "Initial Screening"]:
                    paper.status = "Reviewer Assigned"
                    
                    # Create status history entry
                    status_history = PaperStatusHistory(
                        paper_id=paper.id,
                        status="Reviewer Assigned",
                        changed_by=user.id,
                        notes=notes or f"Bulk reviewer assignment: {reviewer.first_name} {reviewer.last_name}"
                    )
                    db.add(status_history)
                
                # Log assignment
                log_action(
                    db=db,
                    user_id=user.id,
                    action="bulk_reviewer_assignment",
                    resource_type="paper",
                    resource_id=paper.id,
                    details={
                        "reviewer_id": reviewer_id,
                        "reviewer_name": f"{reviewer.first_name} {reviewer.last_name}",
                        "deadline": deadline.isoformat() if deadline else None
                    }
                )
                
                successful.append(paper_id)
                
            except Exception as e:
                failed.append({
                    "paper_id": paper_id,
                    "error": str(e)
                })
    
    # Commit all successful changes
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        # If commit fails, all operations failed
        failed = [{"paper_id": pid, "error": "Database commit failed"} for pid in paper_ids]
        successful = []
    
    return successful, failed
