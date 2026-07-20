"""
Publication router for managing volumes, issues, and paper publications.

Requirements: 8.1, 8.6, 9.1, 9.2, 9.5
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import require_role, get_current_user_optional
from app.users.models import User
from app.audit.service import log_action
from .schemas import (
    VolumeCreate, VolumeResponse,
    IssueCreate, IssueResponse,
    PublishPaperRequest, PublicationResponse,
    PublicPaperResponse
)
from .service import (
    create_volume, get_volumes, get_volume_by_id,
    create_issue, get_issues, get_issue_by_id,
    publish_paper, get_published_papers, get_published_paper_by_id
)


router = APIRouter(prefix="/publications", tags=["Publications"])


@router.post("/volumes", response_model=VolumeResponse, status_code=status.HTTP_201_CREATED)
async def create_new_volume(
    volume_data: VolumeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """
    Create a new journal volume (Admin only).
    
    **Requirements: 8.1**
    
    Args:
        volume_data: Volume creation data
        db: Database session
        current_user: Authenticated admin user
        
    Returns:
        VolumeResponse with created volume
        
    Raises:
        HTTPException: 400 if volume already exists, 403 if not admin
        
    Example:
        POST /publications/volumes
        {
            "volume_number": 1,
            "year": 2024,
            "title": "Volume 1 - 2024"
        }
    """
    return create_volume(db, volume_data)


@router.get("/volumes", response_model=List[VolumeResponse])
async def list_volumes(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Get all volumes (Public access).
    
    **Requirements: 9.1**
    
    Args:
        db: Database session
        current_user: Optional authenticated user
        
    Returns:
        List of VolumeResponse objects
        
    Example:
        GET /publications/volumes
    """
    return get_volumes(db)


@router.post("/issues", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
async def create_new_issue(
    issue_data: IssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """
    Create a new journal issue (Admin only).
    
    **Requirements: 8.1**
    
    Args:
        issue_data: Issue creation data
        db: Database session
        current_user: Authenticated admin user
        
    Returns:
        IssueResponse with created issue
        
    Raises:
        HTTPException: 400 if issue already exists, 404 if volume not found, 403 if not admin
        
    Example:
        POST /publications/issues
        {
            "volume_id": "uuid-here",
            "issue_number": 1,
            "publication_date": "2024-03-15",
            "title": "Spring Issue"
        }
    """
    return create_issue(db, issue_data)


@router.get("/issues", response_model=List[IssueResponse])
async def list_issues(
    volume_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Get all issues, optionally filtered by volume (Public access).
    
    **Requirements: 9.1**
    
    Args:
        volume_id: Optional volume ID to filter by
        db: Database session
        current_user: Optional authenticated user
        
    Returns:
        List of IssueResponse objects
        
    Example:
        GET /publications/issues
        GET /publications/issues?volume_id=uuid-here
    """
    return get_issues(db, volume_id)


@router.get("/issues/{issue_id}/papers")
async def get_issue_papers(
    issue_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Get all published papers for a specific issue (Public access).
    
    Returns list of published papers with full metadata and paper count.
    
    **Requirements: 1.4**
    
    Args:
        issue_id: Issue ID
        db: Database session
        current_user: Optional authenticated user
        
    Returns:
        Object with papers list and count
        
    Raises:
        HTTPException: 404 if issue not found
        
    Example:
        GET /publications/issues/uuid-here/papers
    """
    from .service import get_published_papers_by_issue
    
    # Verify issue exists
    issue = get_issue_by_id(db, issue_id)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue with ID {issue_id} not found"
        )
    
    # Get published papers for this issue
    papers = get_published_papers_by_issue(db, issue_id)
    
    # Build response with author information
    papers_response = []
    for paper in papers:
        author = paper.author
        paper_data = PublicPaperResponse(
            id=paper.id,
            title=paper.title,
            abstract=paper.abstract,
            keywords=paper.keywords or [],
            author_name=f"{author.first_name} {author.last_name}",
            author_affiliation=author.affiliation,
            status=paper.status,
            submitted_at=paper.submitted_at,
            publication=paper.publication
        )
        papers_response.append(paper_data)
    
    return {
        "papers": papers_response,
        "count": len(papers_response)
    }


@router.post("/publish", response_model=PublicationResponse, status_code=status.HTTP_201_CREATED)
async def publish_paper_to_issue(
    publish_data: PublishPaperRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """
    Publish a paper to an issue (Admin only).
    
    Moves the manuscript file to the published directory and updates paper status to "Published".
    
    **Requirements: 8.6**
    
    Args:
        publish_data: Publication data including paper_id and issue_id
        request: FastAPI request object for IP and user agent
        db: Database session
        current_user: Authenticated admin user
        
    Returns:
        PublicationResponse with publication details
        
    Raises:
        HTTPException: 
            - 400 if paper is not in "Accepted" status or already published
            - 404 if paper or issue not found
            - 403 if not admin
        
    Example:
        POST /publications/publish
        {
            "paper_id": "uuid-here",
            "issue_id": "uuid-here",
            "page_start": 1,
            "page_end": 15,
            "doi": "10.1234/example.2024.001"
        }
    """
    publication = publish_paper(db, publish_data, current_user.id)
    
    # Log publication action
    log_action(
        db=db,
        user_id=current_user.id,
        action="paper_published",
        resource_type="paper",
        resource_id=publish_data.paper_id,
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("user-agent", "unknown"),
        details={
            "issue_id": publish_data.issue_id,
            "doi": publish_data.doi
        }
    )
    
    return publication


@router.get("/papers/{paper_id}", response_model=PublicPaperResponse)
async def get_published_paper(
    paper_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Get a published paper by ID (Public access).
    
    Returns full paper details including author information for published papers only.
    
    **Requirements: 9.2, 9.5**
    
    Args:
        paper_id: Paper ID
        db: Database session
        current_user: Optional authenticated user
        
    Returns:
        PublicPaperResponse with full paper details
        
    Raises:
        HTTPException: 404 if paper not found or not published
        
    Example:
        GET /publications/papers/uuid-here
    """
    paper = get_published_paper_by_id(db, paper_id)
    
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Published paper not found"
        )
    
    # Build response with author information
    author = paper.author
    response = PublicPaperResponse(
        id=paper.id,
        title=paper.title,
        abstract=paper.abstract,
        keywords=paper.keywords or [],
        author_name=f"{author.first_name} {author.last_name}",
        author_affiliation=author.affiliation,
        status=paper.status,
        submitted_at=paper.submitted_at,
        publication=paper.publication
    )
    
    return response


@router.get("/papers/{paper_id}/download")
async def download_published_paper(
    paper_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Download a published paper file (Public access).
    
    Published papers are publicly accessible without authentication.
    Uses file access middleware to verify the paper is published.
    
    **Requirements: 8.6, 9.2, 10.6**
    
    Args:
        paper_id: Paper ID
        request: FastAPI request object for logging
        db: Database session
        current_user: Optional authenticated user
        
    Returns:
        FileResponse with the published paper PDF
        
    Raises:
        HTTPException: 404 if paper not found or not published
        
    Example:
        GET /publications/papers/uuid-here/download
    """
    from fastapi.responses import FileResponse
    from app.middleware.file_access_middleware import verify_file_access
    from app.audit.service import log_action
    
    # Verify access and get file details (allows public access for published papers)
    paper, file_path, download_filename = verify_file_access(
        db=db,
        paper_id=paper_id,
        current_user=current_user,
        file_type="published"
    )
    
    # Log file download
    log_action(
        db=db,
        user_id=current_user.id if current_user else None,
        action="file_download",
        resource_type="published_paper",
        resource_id=paper.id,
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("user-agent", "unknown"),
        details={
            "filename": download_filename,
            "role": current_user.role.name.lower() if current_user else "public"
        }
    )
    
    return FileResponse(
        path=file_path,
        filename=download_filename,
        media_type="application/pdf"
    )
