"""
Integration tests for The Essence Journal System.
Tests complete workflows: submission → review → publication
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.database import get_db
from app.users.models import User, Role
from app.authors.models import Author
from app.reviewers.models import Reviewer
from app.papers.models import Paper, PaperStatusHistory
from app.reviews.models import ReviewAssignment, Review
from app.publications.models import Volume, Issue, Publication
from app.audit.models import AuditLog
from datetime import datetime, timedelta
import io
import uuid


class TestCompleteWorkflows:
    """Test complete workflows from submission to publication."""
    
    def test_author_submission_workflow(self, client: TestClient, db: Session, author_token: str, author_user: User):
        """Test complete author submission workflow."""
        # 1. Author submits a paper
        pdf_content = b"%PDF-1.4 test content"
        files = {"file": ("test_paper.pdf", io.BytesIO(pdf_content), "application/pdf")}
        data = {
            "title": "Integration Test Paper",
            "abstract": "This is a test abstract for integration testing",
            "keywords": '["testing", "integration", "workflow"]'
        }
        
        response = client.post(
            "/papers",
            data=data,
            files=files,
            headers={"Authorization": f"Bearer {author_token}"}
        )
        assert response.status_code == 200
        paper_data = response.json()
        paper_id = paper_data["id"]
        assert paper_data["status"] == "Submitted"
        assert paper_data["title"] == "Integration Test Paper"
        
        # 2. Author views their papers
        response = client.get(
            "/papers",
            headers={"Authorization": f"Bearer {author_token}"}
        )
        assert response.status_code == 200
        papers = response.json()
        assert len(papers) > 0
        assert any(p["id"] == paper_id for p in papers)
        
        # 3. Author views paper timeline
        response = client.get(
            f"/papers/{paper_id}/timeline",
            headers={"Authorization": f"Bearer {author_token}"}
        )
        assert response.status_code == 200
        timeline = response.json()
        assert len(timeline["timeline"]) > 0
        assert timeline["timeline"][0]["status"] == "Submitted"
        
        # 4. Verify audit log was created
        audit_logs = db.query(AuditLog).filter(
            AuditLog.user_id == author_user.id,
            AuditLog.action == "paper_submitted"
        ).all()
        assert len(audit_logs) > 0
    
    def test_reviewer_assignment_and_review_workflow(
        self, 
        client: TestClient, 
        db: Session, 
        admin_token: str,
        reviewer_token: str,
        test_paper: Paper,
        test_reviewer: Reviewer
    ):
        """Test reviewer assignment and review submission workflow."""
        # 1. Admin assigns reviewer to paper
        assignment_data = {
            "paper_id": str(test_paper.id),
            "reviewer_id": str(test_reviewer.id),
            "deadline": (datetime.utcnow() + timedelta(days=14)).isoformat()
        }
        
        response = client.post(
            "/reviews/assign",
            json=assignment_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assignment = response.json()
        assignment_id = assignment["id"]
        
        # 2. Verify paper status changed to "Reviewer Assigned"
        paper = db.query(Paper).filter(Paper.id == test_paper.id).first()
        assert paper.status == "Reviewer Assigned"
        
        # 3. Reviewer views assigned papers
        response = client.get(
            "/reviewers/assignments",
            headers={"Authorization": f"Bearer {reviewer_token}"}
        )
        assert response.status_code == 200
        assignments = response.json()
        assert len(assignments) > 0
        assert any(a["id"] == assignment_id for a in assignments)
        
        # 4. Reviewer downloads anonymized manuscript
        response = client.get(
            f"/papers/{test_paper.id}/download",
            headers={"Authorization": f"Bearer {reviewer_token}"}
        )
        assert response.status_code == 200
        # Verify filename is anonymized
        content_disposition = response.headers.get("content-disposition", "")
        assert "PAPER-" in content_disposition
        assert test_paper.original_filename not in content_disposition
        
        # 5. Reviewer submits review
        review_data = {
            "assignment_id": assignment_id,
            "recommendation": "accept",
            "comments_for_author": "Great work!",
            "comments_for_editor": "I recommend acceptance."
        }
        
        response = client.post(
            "/reviews",
            json=review_data,
            headers={"Authorization": f"Bearer {reviewer_token}"}
        )
        assert response.status_code == 200
        
        # 6. Verify review was created
        review = db.query(Review).filter(Review.assignment_id == uuid.UUID(assignment_id)).first()
        assert review is not None
        assert review.recommendation == "accept"
    
    def test_publication_workflow(
        self,
        client: TestClient,
        db: Session,
        admin_token: str,
        test_paper: Paper
    ):
        """Test publication workflow from accepted paper to published."""
        # 1. Admin changes paper status to "Accepted"
        status_data = {
            "status": "Accepted",
            "notes": "Paper accepted for publication"
        }
        
        response = client.put(
            f"/papers/{test_paper.id}/status",
            json=status_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        # 2. Admin creates a volume
        volume_data = {
            "volume_number": 1,
            "year": 2024,
            "title": "Volume 1 - 2024"
        }
        
        response = client.post(
            "/publications/volumes",
            json=volume_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        volume = response.json()
        volume_id = volume["id"]
        
        # 3. Admin creates an issue
        issue_data = {
            "volume_id": volume_id,
            "issue_number": 1,
            "publication_date": "2024-03-01",
            "title": "Issue 1"
        }
        
        response = client.post(
            "/publications/issues",
            json=issue_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        issue = response.json()
        issue_id = issue["id"]
        
        # 4. Admin publishes the paper
        publish_data = {
            "paper_id": str(test_paper.id),
            "issue_id": issue_id,
            "page_start": 1,
            "page_end": 10
        }
        
        response = client.post(
            "/publications/publish",
            json=publish_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        # 5. Verify paper status is "Published"
        paper = db.query(Paper).filter(Paper.id == test_paper.id).first()
        assert paper.status == "Published"
        
        # 6. Verify publication record was created
        publication = db.query(Publication).filter(Publication.paper_id == test_paper.id).first()
        assert publication is not None
        assert publication.issue_id == uuid.UUID(issue_id)
        
        # 7. Public user can view published paper
        response = client.get(f"/publications/papers/{test_paper.id}")
        assert response.status_code == 200
        published_paper = response.json()
        assert published_paper["id"] == str(test_paper.id)
        assert "author" in published_paper  # Author info visible to public


class TestRoleBasedAccess:
    """Test role-based access control across all endpoints."""
    
    def test_author_cannot_access_admin_routes(self, client: TestClient, author_token: str):
        """Verify authors cannot access admin-only routes."""
        # Try to access user management
        response = client.get(
            "/users",
            headers={"Authorization": f"Bearer {author_token}"}
        )
        assert response.status_code == 403
        
        # Try to assign reviewers
        response = client.post(
            "/reviews/assign",
            json={"paper_id": str(uuid.uuid4()), "reviewer_id": str(uuid.uuid4()), "deadline": "2024-12-31"},
            headers={"Authorization": f"Bearer {author_token}"}
        )
        assert response.status_code == 403
        
        # Try to change paper status
        response = client.put(
            f"/papers/{uuid.uuid4()}/status",
            json={"status": "Accepted"},
            headers={"Authorization": f"Bearer {author_token}"}
        )
        assert response.status_code == 403
    
    def test_reviewer_cannot_access_author_routes(self, client: TestClient, reviewer_token: str):
        """Verify reviewers cannot submit papers."""
        pdf_content = b"%PDF-1.4 test content"
        files = {"file": ("test.pdf", io.BytesIO(pdf_content), "application/pdf")}
        data = {
            "title": "Test",
            "abstract": "Test",
            "keywords": '["test"]'
        }
        
        response = client.post(
            "/papers",
            data=data,
            files=files,
            headers={"Authorization": f"Bearer {reviewer_token}"}
        )
        assert response.status_code == 403
    
    def test_reviewer_cannot_access_unassigned_papers(
        self,
        client: TestClient,
        reviewer_token: str,
        test_paper: Paper
    ):
        """Verify reviewers can only access assigned papers."""
        # Try to download paper not assigned to this reviewer
        response = client.get(
            f"/papers/{test_paper.id}/download",
            headers={"Authorization": f"Bearer {reviewer_token}"}
        )
        assert response.status_code == 403
    
    def test_admin_has_unrestricted_access(
        self,
        client: TestClient,
        admin_token: str,
        test_paper: Paper
    ):
        """Verify admin can access all resources."""
        # Access user management
        response = client.get(
            "/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        # Access papers
        response = client.get(
            "/papers",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        # Access audit logs
        response = client.get(
            "/audit/logs",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200


class TestAuditLogging:
    """Test audit logging integration across all modules."""
    
    def test_login_creates_audit_log(self, client: TestClient, db: Session, author_user: User):
        """Verify login events are logged."""
        # Login
        response = client.post(
            "/auth/login",
            json={"email": author_user.email, "password": "password123"}
        )
        assert response.status_code == 200
        
        # Check audit log
        audit_log = db.query(AuditLog).filter(
            AuditLog.user_id == author_user.id,
            AuditLog.action == "login"
        ).first()
        assert audit_log is not None
    
    def test_paper_status_change_creates_audit_log(
        self,
        client: TestClient,
        db: Session,
        admin_token: str,
        admin_user: User,
        test_paper: Paper
    ):
        """Verify paper status changes are logged."""
        # Change status
        response = client.put(
            f"/papers/{test_paper.id}/status",
            json={"status": "Under Review"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        # Check audit log
        audit_log = db.query(AuditLog).filter(
            AuditLog.user_id == admin_user.id,
            AuditLog.action == "paper_status_changed",
            AuditLog.resource_id == test_paper.id
        ).first()
        assert audit_log is not None
    
    def test_reviewer_assignment_creates_audit_log(
        self,
        client: TestClient,
        db: Session,
        admin_token: str,
        admin_user: User,
        test_paper: Paper,
        test_reviewer: Reviewer
    ):
        """Verify reviewer assignments are logged."""
        # Assign reviewer
        assignment_data = {
            "paper_id": str(test_paper.id),
            "reviewer_id": str(test_reviewer.id),
            "deadline": (datetime.utcnow() + timedelta(days=14)).isoformat()
        }
        
        response = client.post(
            "/reviews/assign",
            json=assignment_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        # Check audit log
        audit_log = db.query(AuditLog).filter(
            AuditLog.user_id == admin_user.id,
            AuditLog.action == "reviewer_assigned"
        ).first()
        assert audit_log is not None


class TestBlindReviewAnonymization:
    """Test blind review anonymization end-to-end."""
    
    def test_reviewer_sees_anonymized_data(
        self,
        client: TestClient,
        db: Session,
        admin_token: str,
        reviewer_token: str,
        test_paper: Paper,
        test_reviewer: Reviewer
    ):
        """Verify reviewers see anonymized author information."""
        # Admin assigns reviewer
        assignment_data = {
            "paper_id": str(test_paper.id),
            "reviewer_id": str(test_reviewer.id),
            "deadline": (datetime.utcnow() + timedelta(days=14)).isoformat()
        }
        
        client.post(
            "/reviews/assign",
            json=assignment_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Reviewer views paper details
        response = client.get(
            f"/papers/{test_paper.id}",
            headers={"Authorization": f"Bearer {reviewer_token}"}
        )
        assert response.status_code == 200
        paper_data = response.json()
        
        # Verify author information is excluded
        assert "author_id" not in paper_data or paper_data.get("author_id") is None
        assert "author" not in paper_data
        assert "author_name" not in paper_data
        
        # Verify filename is anonymized
        assert paper_data["anonymized_filename"].startswith("PAPER-")
    
    def test_author_sees_anonymized_reviewer_identity(
        self,
        client: TestClient,
        db: Session,
        admin_token: str,
        author_token: str,
        reviewer_token: str,
        test_paper: Paper,
        test_reviewer: Reviewer
    ):
        """Verify authors see anonymized reviewer identities."""
        # Admin assigns reviewer and reviewer submits review
        assignment_data = {
            "paper_id": str(test_paper.id),
            "reviewer_id": str(test_reviewer.id),
            "deadline": (datetime.utcnow() + timedelta(days=14)).isoformat()
        }
        
        response = client.post(
            "/reviews/assign",
            json=assignment_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assignment_id = response.json()["id"]
        
        # Reviewer submits review
        review_data = {
            "assignment_id": assignment_id,
            "recommendation": "minor_revision",
            "comments_for_author": "Please address these minor issues.",
            "comments_for_editor": "Good paper overall."
        }
        
        client.post(
            "/reviews",
            json=review_data,
            headers={"Authorization": f"Bearer {reviewer_token}"}
        )
        
        # Author views reviews
        response = client.get(
            f"/reviews/paper/{test_paper.id}",
            headers={"Authorization": f"Bearer {author_token}"}
        )
        assert response.status_code == 200
        reviews = response.json()
        
        # Verify reviewer identity is anonymized
        assert len(reviews) > 0
        for review in reviews:
            assert review["reviewer_identity"].startswith("Reviewer #")
            assert "reviewer_id" not in review or review.get("reviewer_id") is None
