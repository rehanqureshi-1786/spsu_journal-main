"""
Audit logging service for tracking system actions and events.
"""
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.audit.models import AuditLog
from app.audit.schemas import AuditLogQueryParams


def log_action(
    db: Session,
    user_id: Optional[str],
    action: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> AuditLog:
    """
    Create a general audit log entry for system actions.
    
    Args:
        db: Database session
        user_id: ID of the user performing the action (nullable for system actions)
        action: Type of action being performed
        resource_type: Type of resource being acted upon (e.g., 'paper', 'review', 'user')
        resource_id: ID of the specific resource
        ip_address: IP address of the request
        user_agent: User agent string from the request
        details: Additional details about the action
    
    Returns:
        Created AuditLog instance
    """
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=ip_address,
        user_agent=user_agent,
        details=details
    )
    
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    
    return audit_log


def log_auth_event(
    db: Session,
    user_id: Optional[str],
    action: str,
    ip_address: str,
    user_agent: str,
    success: bool = True,
    details: Optional[Dict[str, Any]] = None
) -> AuditLog:
    """
    Create an audit log entry for authentication events.
    
    Args:
        db: Database session
        user_id: ID of the user (nullable for failed login attempts)
        action: Authentication action (e.g., 'login', 'logout', 'token_refresh')
        ip_address: IP address of the request
        user_agent: User agent string from the request
        success: Whether the authentication was successful
        details: Additional details about the authentication event
    
    Returns:
        Created AuditLog instance
    """
    if details is None:
        details = {}
    
    details['success'] = success
    
    return log_action(
        db=db,
        user_id=user_id,
        action=action,
        resource_type='auth',
        ip_address=ip_address,
        user_agent=user_agent,
        details=details
    )


def query_audit_logs(
    db: Session,
    params: AuditLogQueryParams
) -> List[AuditLog]:
    """
    Query audit logs with optional filters.
    
    Args:
        db: Database session
        params: Query parameters for filtering
    
    Returns:
        List of AuditLog instances matching the filters
    """
    from sqlalchemy.orm import joinedload
    
    query = db.query(AuditLog).options(joinedload(AuditLog.user))
    
    # Apply filters
    if params.user_id:
        query = query.filter(AuditLog.user_id == params.user_id)
    
    if params.action:
        query = query.filter(AuditLog.action == params.action)
    
    if params.resource_type:
        query = query.filter(AuditLog.resource_type == params.resource_type)
    
    if params.resource_id:
        query = query.filter(AuditLog.resource_id == params.resource_id)
    
    if params.start_date:
        query = query.filter(AuditLog.timestamp >= params.start_date)
    
    if params.end_date:
        query = query.filter(AuditLog.timestamp <= params.end_date)
    
    # Order by timestamp descending (most recent first)
    query = query.order_by(AuditLog.timestamp.desc())
    
    # Apply pagination
    query = query.offset(params.offset).limit(params.limit)
    
    return query.all()


def get_user_audit_logs(
    db: Session,
    user_id: str,
    limit: int = 100,
    offset: int = 0
) -> List[AuditLog]:
    """
    Get all audit logs for a specific user.
    
    Args:
        db: Database session
        user_id: ID of the user
        limit: Maximum number of results
        offset: Number of results to skip
    
    Returns:
        List of AuditLog instances for the user
    """
    params = AuditLogQueryParams(
        user_id=user_id,
        limit=limit,
        offset=offset
    )
    return query_audit_logs(db, params)


def get_resource_audit_logs(
    db: Session,
    resource_type: str,
    resource_id: str,
    limit: int = 100,
    offset: int = 0
) -> List[AuditLog]:
    """
    Get all audit logs for a specific resource.
    
    Args:
        db: Database session
        resource_type: Type of resource (e.g., 'paper', 'review', 'user')
        resource_id: ID of the resource
        limit: Maximum number of results
        offset: Number of results to skip
    
    Returns:
        List of AuditLog instances for the resource
    """
    params = AuditLogQueryParams(
        resource_type=resource_type,
        resource_id=resource_id,
        limit=limit,
        offset=offset
    )
    return query_audit_logs(db, params)
