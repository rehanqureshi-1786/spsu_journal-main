"""
Audit log API endpoints.
"""
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import csv
import io

from app.core.dependencies import get_db, require_role
from app.audit.schemas import AuditLogResponse, AuditLogQueryParams
from app.audit.service import query_audit_logs, get_user_audit_logs, get_resource_audit_logs
from app.users.models import User


router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    resource_id: Optional[str] = Query(None, description="Filter by resource ID"),
    start_date: Optional[datetime] = Query(None, description="Filter logs after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter logs before this date"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Get audit logs with optional filters (Admin only).
    
    Allows filtering by user, action type, resource, and date range.
    Results are ordered by timestamp descending (most recent first).
    """
    params = AuditLogQueryParams(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )
    
    logs = query_audit_logs(db, params)
    
    # Transform logs to include user email
    result = []
    for log in logs:
        log_dict = {
            "id": log.id,
            "user_id": log.user_id,
            "user_email": log.user.email if log.user else None,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "timestamp": log.timestamp,
            "details": log.details
        }
        result.append(log_dict)
    
    return result


@router.get("/logs/user/{user_id}", response_model=List[AuditLogResponse])
async def get_user_logs(
    user_id: str,
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Get all audit logs for a specific user (Admin only).
    
    Returns logs ordered by timestamp descending (most recent first).
    """
    logs = get_user_audit_logs(db, user_id, limit, offset)
    
    # Transform logs to include user email
    result = []
    for log in logs:
        log_dict = {
            "id": log.id,
            "user_id": log.user_id,
            "user_email": log.user.email if log.user else None,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "timestamp": log.timestamp,
            "details": log.details
        }
        result.append(log_dict)
    
    return result


@router.get("/logs/resource/{resource_type}/{resource_id}", response_model=List[AuditLogResponse])
async def get_resource_logs(
    resource_type: str,
    resource_id: str,
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Get all audit logs for a specific resource (Admin only).
    
    Returns logs for a specific resource type and ID, ordered by timestamp descending.
    
    Examples:
    - /audit/logs/resource/paper/{paper_id}
    - /audit/logs/resource/review/{review_id}
    - /audit/logs/resource/user/{user_id}
    """
    logs = get_resource_audit_logs(db, resource_type, resource_id, limit, offset)
    
    # Transform logs to include user email
    result = []
    for log in logs:
        log_dict = {
            "id": log.id,
            "user_id": log.user_id,
            "user_email": log.user.email if log.user else None,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "timestamp": log.timestamp,
            "details": log.details
        }
        result.append(log_dict)
    
    return result


@router.get("/export")
async def export_audit_logs(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    resource_id: Optional[str] = Query(None, description="Filter by resource ID"),
    start_date: Optional[datetime] = Query(None, description="Filter logs after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter logs before this date"),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Export audit logs to CSV format (Admin only).
    
    Supports same filters as get_audit_logs endpoint:
    - Filter by user, action type, resource, and date range
    
    Returns: CSV file with all audit log entries
    
    Requirements: 9.2, 9.3
    """
    params = AuditLogQueryParams(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        start_date=start_date,
        end_date=end_date,
        limit=10000,  # High limit for export (no pagination)
        offset=0
    )
    
    logs = query_audit_logs(db, params)
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_ALL)
    
    # Write header row
    writer.writerow([
        'Log ID',
        'User ID',
        'User Email',
        'Action',
        'Resource Type',
        'Resource ID',
        'IP Address',
        'User Agent',
        'Timestamp',
        'Details'
    ])
    
    # Write data rows
    for log in logs:
        user_email = log.user.email if log.user else "Unknown"
        details_str = str(log.details) if log.details else ""
        
        writer.writerow([
            log.id,
            log.user_id or "",
            user_email,
            log.action,
            log.resource_type or "",
            log.resource_id or "",
            log.ip_address or "",
            log.user_agent or "",
            log.timestamp.strftime('%Y-%m-%d %H:%M:%S') if log.timestamp else "",
            details_str
        ])
    
    # Get CSV content
    csv_content = output.getvalue()
    output.close()
    
    # Return as streaming response
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=audit_logs_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )

