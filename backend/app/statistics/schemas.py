"""
Statistics schemas for dashboard analytics.
"""
from pydantic import BaseModel
from typing import Dict, List


class MonthlySubmission(BaseModel):
    """Monthly submission count."""
    month: str  # Format: "2024-01"
    count: int


class DashboardStatistics(BaseModel):
    """Dashboard statistics response."""
    acceptance_rate: float  # Percentage
    average_review_time: float  # Days
    papers_by_status: Dict[str, int]
    submissions_by_month: List[MonthlySubmission]
