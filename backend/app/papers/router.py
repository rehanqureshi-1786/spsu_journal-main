"""
Paper router for manuscript management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Request, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import os
import csv
import io

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role, get_current_user_optional
from app.users.models import User
from app.papers import service
from app.papers.schemas import (
    PaperSubmissionRequest,
    PaperResponse,
    PaperTimelineResponse,
    PaperStatusUpdateRequest,
    PaperRevisionRequest,
    PaperVersionResponse,
    PaperSearchResponse,
    BulkActionRequest,
    BulkActionResponse,
    BulkActionError
)
from app.papers import file_utils
from app.audit.service import log_action


router = APIRouter(prefix="/papers", tags=["papers"])


@router.post("", response_model=PaperResponse, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=PaperResponse, status_code=status.HTTP_201_CREATED)
async def submit_paper(
    title: str = Form(...),
    abstract: str = Form(...),
    keywords: str = Form(...),  # Comma-separated keywords
    file: UploadFile = File(...),
    request: Request = None,
    current_user: User = Depends(require_role(["author"])),
    db: Session = Depends(get_db)
):
    """
    Submit a new paper (author only).
    
    Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
    """
    # Parse keywords from comma-separated string
    keywords_list = [k.strip() for k in keywords.split(",") if k.strip()]
    
    if not keywords_list:
        raise HTTPException(
            status_code=400,
            detail="At least one keyword is required"
        )
    
    # Create submission request
    submission = PaperSubmissionRequest(
        title=title,
        abstract=abstract,
        keywords=keywords_list
    )
    
    # Get author ID
    from app.authors.models import Author
    author = db.query(Author).filter(Author.user_id == current_user.id).first()
    if not author:
        raise HTTPException(
            status_code=400,
            detail="Author profile not found"
        )
    
    # Create paper submission
    paper = service.create_paper_submission(db, submission, file, author.id)
    
    # Log file upload
    log_action(
        db=db,
        user_id=current_user.id,
        action="file_upload",
        resource_type="paper",
        resource_id=paper.id,
        ip_address=request.client.host if request and request.client else "unknown",
        user_agent=request.headers.get("user-agent", "unknown") if request else "unknown",
        details={
            "filename": file.filename,
            "title": title
        }
    )
    
    # Filter response data based on role
    paper_data = service.filter_paper_data_for_role(paper, current_user)
    
    return PaperResponse(**paper_data)


@router.get("", response_model=List[PaperResponse])
async def get_papers(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Get papers filtered by user role.
    
    - Admin: All papers
    - Author: Own papers
    - Reviewer: Assigned papers
    - Public (not authenticated): Published papers only
    
    Requirements: 4.1, 4.2
    """
    # If no user is authenticated, create a mock public user
    if not current_user:
        # Create a temporary user object for public access
        from app.users.models import Role
        public_role = db.query(Role).filter(Role.name == "public").first()
        if not public_role:
            # If public role doesn't exist, create a mock one
            public_role = Role(id=999, name="public")
        
        class PublicUser:
            def __init__(self):
                self.id = None
                self.role = public_role
        
        current_user = PublicUser()
    
    papers = service.get_papers_for_user(db, current_user)
    
    # Filter each paper's data based on role
    papers_data = [
        PaperResponse(**service.filter_paper_data_for_role(paper, current_user))
        for paper in papers
    ]
    
    return papers_data


@router.get("/search", response_model=PaperSearchResponse)
async def search_papers(
    q: Optional[str] = Query(None, description="Search query for title or author name"),
    status: Optional[str] = Query(None, description="Filter by paper status"),
    date_from: Optional[date] = Query(None, description="Filter by submission date (from)"),
    date_to: Optional[date] = Query(None, description="Filter by submission date (to)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search and filter papers with pagination.
    
    Supports:
    - Search by title or author name (case-insensitive)
    - Filter by status
    - Filter by date range
    - Multiple filters with AND logic
    - Pagination
    
    Requirements: 6.1-6.5
    """
    from datetime import datetime
    
    # Convert date to datetime for filtering
    date_from_dt = datetime.combine(date_from, datetime.min.time()) if date_from else None
    date_to_dt = datetime.combine(date_to, datetime.min.time()) if date_to else None
    
    result = service.search_papers(
        db=db,
        user=current_user,
        q=q,
        status=status,
        date_from=date_from_dt,
        date_to=date_to_dt,
        page=page,
        page_size=page_size
    )
    
    return result


@router.post("/bulk-action", response_model=BulkActionResponse)
async def bulk_action(
    bulk_request: BulkActionRequest,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Perform bulk action on multiple papers (admin only).
    
    Supports:
    - change_status: Change status of multiple papers
    - assign_reviewer: Assign a reviewer to multiple papers
    
    Returns success/failure results for each paper.
    
    Requirements: 7.2, 7.3
    """
    successful, failed = service.bulk_action_papers(
        db=db,
        action=bulk_request.action,
        paper_ids=bulk_request.paper_ids,
        user=current_user,
        new_status=bulk_request.new_status,
        reviewer_id=bulk_request.reviewer_id,
        deadline=bulk_request.deadline,
        notes=bulk_request.notes
    )
    
    return BulkActionResponse(
        successful=successful,
        failed=[BulkActionError(**item) for item in failed]
    )


@router.get("/export")
async def export_papers(
    q: Optional[str] = Query(None, description="Search query for title or author name"),
    status: Optional[str] = Query(None, description="Filter by paper status"),
    date_from: Optional[date] = Query(None, description="Filter by submission date (from)"),
    date_to: Optional[date] = Query(None, description="Filter by submission date (to)"),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Export papers to CSV format (admin only).
    
    Supports same filters as search endpoint:
    - Search by title or author name
    - Filter by status
    - Filter by date range
    
    Returns: CSV file with all paper data
    
    Requirements: 9.1, 9.3, 9.4, 9.5, 9.6
    """
    from datetime import datetime
    
    # Convert date to datetime for filtering
    date_from_dt = datetime.combine(date_from, datetime.min.time()) if date_from else None
    date_to_dt = datetime.combine(date_to, datetime.min.time()) if date_to else None
    
    # Get all papers matching filters (no pagination for export)
    papers = service.get_papers_for_export(
        db=db,
        user=current_user,
        q=q,
        status=status,
        date_from=date_from_dt,
        date_to=date_to_dt
    )
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_ALL)
    
    # Write header row
    writer.writerow([
        'Paper ID',
        'Title',
        'Author Name',
        'Author Email',
        'Status',
        'Submission Date',
        'Keywords',
        'Abstract'
    ])
    
    # Write data rows
    for paper in papers:
        author_name = f"{paper.author.first_name} {paper.author.last_name}" if paper.author else "Unknown"
        author_email = paper.author.user.email if paper.author and paper.author.user else "Unknown"
        keywords = ", ".join(paper.keywords) if paper.keywords else ""
        
        writer.writerow([
            paper.id,
            paper.title,
            author_name,
            author_email,
            paper.status,
            paper.submitted_at.strftime('%Y-%m-%d %H:%M:%S') if paper.submitted_at else "",
            keywords,
            paper.abstract
        ])
    
    # Get CSV content
    csv_content = output.getvalue()
    output.close()
    
    # Return as streaming response
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=papers_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )


@router.get("/{paper_id}", response_model=PaperResponse)
async def get_paper(
    paper_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get paper by ID with role-based filtering.
    
    Requirements: 4.1, 4.2, 4.3
    """
    paper = service.get_paper_by_id(db, paper_id, current_user)
    
    if not paper:
        raise HTTPException(
            status_code=404,
            detail="Paper not found"
        )
    
    # Filter response data based on role
    paper_data = service.filter_paper_data_for_role(paper, current_user)
    
    return PaperResponse(**paper_data)


@router.get("/{paper_id}/download")
async def download_paper(
    paper_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download paper file with role-based access control and anonymization.
    
    Uses file access middleware to verify permissions and enforce anonymization.
    - Reviewers get anonymized filename and can only access assigned papers
    - Authors can only access their own papers with original filename
    - Admins have unrestricted access with original filename
    
    Requirements: 4.3, 10.6, 10.7
    """
    from app.middleware.file_access_middleware import verify_file_access
    
    # Verify access and get file details
    paper, file_path, download_filename = verify_file_access(
        db=db,
        paper_id=paper_id,
        current_user=current_user,
        file_type="manuscript"
    )
    
    role_name = current_user.role.name.lower()
    
    # Log file download
    log_action(
        db=db,
        user_id=current_user.id,
        action="file_download",
        resource_type="paper",
        resource_id=paper.id,
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("user-agent", "unknown"),
        details={
            "filename": download_filename,
            "role": role_name
        }
    )
    
    return FileResponse(
        path=file_path,
        filename=download_filename,
        media_type="application/pdf"
    )

@router.get("/{paper_id}/download/public")
async def download_paper_public(
    paper_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Download a published paper file (public, no auth required).

    Only allows downloading papers with 'Published' status.
    """
    from app.middleware.file_access_middleware import verify_file_access

    # Verify access as public user (no auth)
    paper, file_path, download_filename = verify_file_access(
        db=db,
        paper_id=paper_id,
        current_user=None,
        file_type="manuscript"
    )

    return FileResponse(
        path=file_path,
        filename=download_filename,
        media_type="application/pdf"
    )



@router.post("/{paper_id}/revisions", response_model=PaperVersionResponse, status_code=status.HTTP_201_CREATED)
async def upload_revision(
    paper_id: str,
    file: UploadFile = File(...),
    notes: Optional[str] = Form(None),
    current_user: User = Depends(require_role(["author"])),
    db: Session = Depends(get_db)
):
    """
    Upload a revised version of a paper (author only).
    
    Requirements: 6.5, 6.6
    """
    revision_request = PaperRevisionRequest(notes=notes)
    
    version = service.upload_paper_revision(
        db, paper_id, file, revision_request, current_user
    )
    
    return PaperVersionResponse(
        id=version.id,
        paper_id=version.paper_id,
        version_number=version.version_number,
        filename=version.filename,
        uploaded_at=version.uploaded_at,
        notes=version.notes
    )


@router.get("/{paper_id}/timeline", response_model=PaperTimelineResponse)
async def get_paper_timeline(
    paper_id: str,
    current_user: User = Depends(require_role(["author", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Get paper status timeline (author and admin only).
    
    Requirements: 6.1, 6.2
    """
    timeline = service.get_paper_timeline(db, paper_id, current_user)
    return timeline


@router.put("/{paper_id}/status", response_model=PaperResponse)
async def update_paper_status(
    paper_id: str,
    status_update: PaperStatusUpdateRequest,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Update paper status (admin only).
    
    Requirements: 7.2
    """
    paper = service.update_paper_status(db, paper_id, status_update, current_user)
    
    # Filter response data based on role
    paper_data = service.filter_paper_data_for_role(paper, current_user)
    
    return PaperResponse(**paper_data)


@router.get("/{paper_id}/versions", response_model=List[PaperVersionResponse])
async def get_paper_versions(
    paper_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all versions of a paper.
    
    Requirements: 6.6
    """
    versions = service.get_paper_versions(db, paper_id, current_user)
    
    return [
        PaperVersionResponse(
            id=v.id,
            paper_id=v.paper_id,
            version_number=v.version_number,
            filename=v.filename,
            uploaded_at=v.uploaded_at,
            notes=v.notes
        )
        for v in versions
    ]


