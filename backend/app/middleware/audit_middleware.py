"""
Audit logging middleware for The Essence Journal System.
Provides automatic request/response logging for audit trail.

Requirements: 11.4
"""
import time
from typing import Callable
from fastapi import Request
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.audit.service import log_action


async def audit_logging_middleware(request: Request, call_next: Callable):
    """
    Middleware to log HTTP requests and responses for audit purposes.
    
    This middleware captures request details (method, path, user, IP) and
    response details (status code, duration) and stores them in the audit log.
    
    Requirements: 11.4
    
    Args:
        request: The incoming HTTP request
        call_next: The next middleware or route handler in the chain
        
    Returns:
        Response from the next handler
    """
    # Record start time
    start_time = time.time()
    
    # Extract request information
    method = request.method
    path = request.url.path
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    # Get user_id from request state if available (set by auth middleware)
    user_id = getattr(request.state, "user_id", None)
    
    # Process the request
    response = await call_next(request)
    
    # Calculate request duration
    duration = time.time() - start_time
    
    # Determine if this request should be logged
    # Skip logging for health checks, docs, and static files
    skip_paths = ["/health", "/docs", "/openapi.json", "/redoc"]
    should_log = not any(path.startswith(skip_path) for skip_path in skip_paths)
    
    # Log the request if it's not in the skip list
    if should_log:
        db: Session = SessionLocal()
        try:
            # Determine action type based on method and path
            action = f"{method} {path}"
            
            # Extract resource information from path if possible
            resource_type = None
            resource_id = None
            
            # Parse common resource patterns
            path_parts = path.strip("/").split("/")
            if len(path_parts) >= 2:
                resource_type = path_parts[0]  # e.g., "papers", "reviews", "users"
                # Check if the second part looks like a UUID (resource_id)
                if len(path_parts) >= 2 and len(path_parts[1]) == 36:
                    resource_id = path_parts[1]
            
            # Create audit log entry
            log_action(
                db=db,
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                ip_address=ip_address,
                user_agent=user_agent,
                details={
                    "status_code": response.status_code,
                    "duration_ms": round(duration * 1000, 2),
                    "method": method,
                    "path": path,
                }
            )
            
            db.commit()
            
        except Exception as e:
            # Don't let audit logging failures break the request
            # Just log the error and continue
            print(f"Audit logging error: {str(e)}")
            db.rollback()
        finally:
            db.close()
    
    return response
