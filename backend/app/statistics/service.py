"""
Statistics service for dashboard analytics calculations.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, date
from typing import Optional, Dict, List
from collections import defaultdict

from app.papers.models import Paper
from app.reviews.models import Review, ReviewAssignment
from app.statistics.schemas import DashboardStatistics, MonthlySubmission


def get_dashboard_statistics(
    db: Session,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
) -> DashboardStatistics:
    """
    Calculate dashboard statistics for admin.
    
    Args:
        db: Database session
        date_from: Start date for filtering (default: start of current year)
        date_to: End date for filtering (default: today)
    
    Returns:
        DashboardStatistics with calculated metrics
    
    Requirements: 10.1-10.6
    """
    # Set default date range to current year if not provided
    if date_from is None:
        date_from = datetime(2020, 1, 1)
    if date_to is None:
        date_to = datetime.now()
    
    # Get papers within date range
    papers_query = db.query(Paper).filter(
        Paper.submitted_at >= date_from,
        Paper.submitted_at <= date_to
    )
    
    # Calculate acceptance rate
    total_papers = papers_query.count()
    accepted_papers = papers_query.filter(Paper.status == "accepted").count()
    acceptance_rate = (accepted_papers / total_papers * 100) if total_papers > 0 else 0.0
    
    # Calculate average review time
    # Review time = time from submission to first review submission
    average_review_time = calculate_average_review_time(db, date_from, date_to)
    
    # Count papers by status
    papers_by_status = count_papers_by_status(db, date_from, date_to)
    
    # Count submissions by month
    submissions_by_month = count_submissions_by_month(db, date_from, date_to)
    
    return DashboardStatistics(
        acceptance_rate=round(acceptance_rate, 2),
        average_review_time=round(average_review_time, 2),
        papers_by_status=papers_by_status,
        submissions_by_month=submissions_by_month
    )


def calculate_average_review_time(
    db: Session,
    date_from: datetime,
    date_to: datetime
) -> float:
    """
    Calculate average time from paper submission to first review.
    
    Args:
        db: Database session
        date_from: Start date for filtering
        date_to: End date for filtering
    
    Returns:
        Average review time in days
    
    Requirements: 10.2
    """
    # Query papers with their first review submission time
    papers_with_reviews = (
        db.query(
            Paper.id,
            Paper.submitted_at,
            func.min(Review.submitted_at).label('first_review_at')
        )
        .join(ReviewAssignment, Paper.id == ReviewAssignment.paper_id)
        .join(Review, ReviewAssignment.id == Review.assignment_id)
        .filter(
            Paper.submitted_at >= date_from,
            Paper.submitted_at <= date_to
        )
        .group_by(Paper.id, Paper.submitted_at)
        .all()
    )
    
    if not papers_with_reviews:
        return 0.0
    
    # Calculate time differences in days
    total_days = 0.0
    for paper_id, submitted_at, first_review_at in papers_with_reviews:
        if submitted_at and first_review_at:
            time_diff = first_review_at - submitted_at
            total_days += time_diff.total_seconds() / 86400  # Convert to days
    
    # Calculate average
    average_days = total_days / len(papers_with_reviews) if papers_with_reviews else 0.0
    
    return average_days


def count_papers_by_status(
    db: Session,
    date_from: datetime,
    date_to: datetime
) -> Dict[str, int]:
    """
    Count papers by status within date range.
    
    Args:
        db: Database session
        date_from: Start date for filtering
        date_to: End date for filtering
    
    Returns:
        Dictionary mapping status to count
    
    Requirements: 10.3
    """
    # Query papers grouped by status
    status_counts = (
        db.query(
            Paper.status,
            func.count(Paper.id).label('count')
        )
        .filter(
            Paper.submitted_at >= date_from,
            Paper.submitted_at <= date_to
        )
        .group_by(Paper.status)
        .all()
    )
    
    # Convert to dictionary
    result = {status: count for status, count in status_counts}
    
    # Ensure all common statuses are present (even if count is 0)
    common_statuses = [
        "Submitted", "Under Review", "Reviewer Assigned",
        "Revised", "Accepted", "Rejected", "Published"
    ]
    for status in common_statuses:
        if status not in result:
            result[status] = 0
    
    return result


def count_submissions_by_month(
    db: Session,
    date_from: datetime,
    date_to: datetime
) -> List[MonthlySubmission]:
    """
    Count paper submissions by month within date range.
    
    Args:
        db: Database session
        date_from: Start date for filtering
        date_to: End date for filtering
    
    Returns:
        List of MonthlySubmission objects
    
    Requirements: 10.4
    """
    # Query papers grouped by year and month
    monthly_counts = (
        db.query(
            extract('year', Paper.submitted_at).label('year'),
            extract('month', Paper.submitted_at).label('month'),
            func.count(Paper.id).label('count')
        )
        .filter(
            Paper.submitted_at >= date_from,
            Paper.submitted_at <= date_to
        )
        .group_by('year', 'month')
        .order_by('year', 'month')
        .all()
    )
    
    # Convert to list of MonthlySubmission objects
    result = []
    for year, month, count in monthly_counts:
        month_str = f"{int(year)}-{int(month):02d}"
        result.append(MonthlySubmission(month=month_str, count=count))
    
    return result
