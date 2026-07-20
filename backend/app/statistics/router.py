"""
Statistics router for dashboard analytics endpoints.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import require_role
from app.users.models import User
from app.statistics import service
from app.statistics.schemas import DashboardStatistics


router = APIRouter(prefix="/statistics", tags=["statistics"])


@router.get("/dashboard", response_model=DashboardStatistics)
async def get_dashboard_statistics(
    date_from: Optional[date] = Query(None, description="Start date for statistics (default: start of current year)"),
    date_to: Optional[date] = Query(None, description="End date for statistics (default: today)"),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Get advanced statistics for admin dashboard.
    
    Calculates:
    - Acceptance rate: (accepted papers / total papers) * 100
    - Average review time: Mean time from submission to first review (in days)
    - Papers by status: Count of papers in each status
    - Submissions by month: Count of submissions per month
    
    Date range filtering:
    - Default: Current calendar year (Jan 1 to today)
    - Custom: Specify date_from and/or date_to
    
    Requirements: 10.1-10.6
    """
    # Convert date to datetime
    date_from_dt = datetime.combine(date_from, datetime.min.time()) if date_from else None
    date_to_dt = datetime.combine(date_to, datetime.max.time()) if date_to else None
    
    statistics = service.get_dashboard_statistics(
        db=db,
        date_from=date_from_dt,
        date_to=date_to_dt
    )
    
    return statistics
