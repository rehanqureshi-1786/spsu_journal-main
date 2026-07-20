"""
Tests for statistics endpoints.
"""
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app


client = TestClient(app)


class TestStatisticsEndpoint:
    """Test statistics dashboard endpoint."""
    
    def test_get_statistics_requires_auth(self, db: Session):
        """Test that statistics endpoint requires authentication."""
        response = client.get("/statistics/dashboard")
        assert response.status_code == 401
    
    def test_get_statistics_requires_admin(self, db: Session, author_token: str):
        """Test that statistics endpoint requires admin role."""
        response = client.get(
            "/statistics/dashboard",
            headers={"Authorization": f"Bearer {author_token}"}
        )
        # Author role should be forbidden (403) or unauthorized (401)
        assert response.status_code in [401, 403]
    
    def test_get_statistics_structure(self, client, admin_user, test_paper):
        """Test successful statistics retrieval with correct structure."""
        # Login as admin
        login_response = client.post(
            "/auth/login",
            json={"email": admin_user.email, "password": "admin123"}
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Get statistics
        response = client.get(
            "/statistics/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "acceptance_rate" in data
        assert "average_review_time" in data
        assert "papers_by_status" in data
        assert "submissions_by_month" in data
        
        # Check data types
        assert isinstance(data["acceptance_rate"], (int, float))
        assert isinstance(data["average_review_time"], (int, float))
        assert isinstance(data["papers_by_status"], dict)
        assert isinstance(data["submissions_by_month"], list)
        
        # Check that we have at least the submitted paper
        assert "submitted" in data["papers_by_status"]
        assert data["papers_by_status"]["submitted"] >= 1
    
    def test_get_statistics_with_date_range(self, client, admin_user, test_paper):
        """Test statistics with custom date range."""
        # Login as admin
        login_response = client.post(
            "/auth/login",
            json={"email": admin_user.email, "password": "admin123"}
        )
        token = login_response.json()["access_token"]
        
        # Get statistics for last 30 days
        date_to = datetime.now().date()
        date_from = (datetime.now() - timedelta(days=30)).date()
        
        response = client.get(
            "/statistics/dashboard",
            params={
                "date_from": date_from.isoformat(),
                "date_to": date_to.isoformat()
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should have valid statistics
        assert data["acceptance_rate"] >= 0
        assert data["average_review_time"] >= 0
    
    def test_submissions_by_month_format(self, client, admin_user, test_paper):
        """Test that submissions by month has correct format."""
        # Login as admin
        login_response = client.post(
            "/auth/login",
            json={"email": admin_user.email, "password": "admin123"}
        )
        token = login_response.json()["access_token"]
        
        response = client.get(
            "/statistics/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check format of monthly submissions
        for item in data["submissions_by_month"]:
            assert "month" in item
            assert "count" in item
            # Month should be in YYYY-MM format
            assert len(item["month"]) == 7
            assert item["month"][4] == "-"
            assert isinstance(item["count"], int)


