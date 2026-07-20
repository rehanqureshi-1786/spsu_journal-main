"""
Tests for event management endpoints.

This module tests the event API endpoints including:
- Creating events
- Retrieving all events
- Getting event details
- Updating events

All endpoints require admin authentication.
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

from app.main import app
from app.core.security import hash_password
from app.users.models import User, Role
from app.events.models import Event
from tests.conftest import TestingSessionLocal


client = TestClient(app)


@pytest.fixture
def test_roles():
    """Create test roles."""
    db = TestingSessionLocal()
    
    admin_role = Role(name="admin", permissions={})
    author_role = Role(name="author", permissions={})
    
    db.add_all([admin_role, author_role])
    db.commit()
    
    roles = {
        "admin": admin_role.id,
        "author": author_role.id
    }
    
    db.close()
    return roles


@pytest.fixture
def test_admin(test_roles):
    """Create a test admin user."""
    db = TestingSessionLocal()
    
    user = User(
        email="admin@test.com",
        password_hash=hash_password("admin123"),
        role_id=test_roles["admin"],
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    result = {
        "user_id": user.id,
        "email": user.email,
        "password": "admin123"
    }
    
    db.close()
    return result


@pytest.fixture
def test_author(test_roles):
    """Create a test author user."""
    db = TestingSessionLocal()
    
    user = User(
        email="author@test.com",
        password_hash=hash_password("password123"),
        role_id=test_roles["author"],
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    result = {
        "user_id": user.id,
        "email": user.email,
        "password": "password123"
    }
    
    db.close()
    return result


@pytest.fixture
def admin_token(test_admin):
    """Get admin authentication token."""
    response = client.post(
        "/auth/login",
        json={
            "email": test_admin["email"],
            "password": test_admin["password"]
        }
    )
    assert response.status_code == 200
    return response.cookies.get("access_token")


@pytest.fixture
def author_token(test_author):
    """Get author authentication token."""
    response = client.post(
        "/auth/login",
        json={
            "email": test_author["email"],
            "password": test_author["password"]
        }
    )
    assert response.status_code == 200
    return response.cookies.get("access_token")


@pytest.fixture
def test_event(test_admin):
    """Create a test event."""
    db = TestingSessionLocal()
    
    event = Event(
        name="Test Conference 2024",
        event_date=datetime.now() + timedelta(days=30),
        event_type="conference",
        description="A test conference event",
        created_by=test_admin["user_id"]
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    result = {
        "id": event.id,
        "name": event.name,
        "event_date": event.event_date,
        "event_type": event.event_type,
        "description": event.description
    }
    
    db.close()
    return result


class TestCreateEvent:
    """Tests for POST /events endpoint."""
    
    def test_create_event_success(self, admin_token):
        """Test successful event creation by admin."""
        event_data = {
            "name": "Annual Conference 2024",
            "event_date": (datetime.now() + timedelta(days=60)).isoformat(),
            "event_type": "conference",
            "description": "Annual journal conference"
        }
        
        response = client.post(
            "/events",
            json=event_data,
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == event_data["name"]
        assert data["event_type"] == event_data["event_type"]
        assert data["description"] == event_data["description"]
        assert "id" in data
        assert "created_at" in data
        assert "created_by" in data
    
    def test_create_event_without_description(self, admin_token):
        """Test creating event without optional description."""
        event_data = {
            "name": "Workshop 2024",
            "event_date": (datetime.now() + timedelta(days=45)).isoformat(),
            "event_type": "workshop"
        }
        
        response = client.post(
            "/events",
            json=event_data,
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == event_data["name"]
        assert data["event_type"] == event_data["event_type"]
        assert data["description"] is None
    
    def test_create_event_missing_required_fields(self, admin_token):
        """Test event creation with missing required fields."""
        event_data = {
            "name": "Incomplete Event"
            # Missing event_date and event_type
        }
        
        response = client.post(
            "/events",
            json=event_data,
            cookies={"access_token": admin_token}
        )
        
        # FastAPI returns 422 for Pydantic validation errors, but if the request
        # gets through to our service layer, it returns 400
        assert response.status_code in [400, 422]
    
    def test_create_event_empty_name(self, admin_token):
        """Test event creation with empty name."""
        event_data = {
            "name": "",
            "event_date": (datetime.now() + timedelta(days=30)).isoformat(),
            "event_type": "conference"
        }
        
        response = client.post(
            "/events",
            json=event_data,
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 400
        response_data = response.json()
        # Check if error message contains "name" (could be in detail or error.message)
        error_text = str(response_data).lower()
        assert "name" in error_text
    
    def test_create_event_unauthorized(self):
        """Test event creation without authentication."""
        event_data = {
            "name": "Unauthorized Event",
            "event_date": (datetime.now() + timedelta(days=30)).isoformat(),
            "event_type": "conference"
        }
        
        response = client.post("/events", json=event_data)
        
        assert response.status_code == 401
    
    def test_create_event_non_admin(self, author_token):
        """Test event creation by non-admin user."""
        event_data = {
            "name": "Author Event",
            "event_date": (datetime.now() + timedelta(days=30)).isoformat(),
            "event_type": "workshop"
        }
        
        response = client.post(
            "/events",
            json=event_data,
            cookies={"access_token": author_token}
        )
        
        assert response.status_code == 403


class TestGetAllEvents:
    """Tests for GET /events endpoint."""
    
    def test_get_all_events_success(self, admin_token, test_event):
        """Test retrieving all events as admin."""
        response = client.get(
            "/events",
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Check that our test event is in the list
        event_ids = [event["id"] for event in data]
        assert test_event["id"] in event_ids
    
    def test_get_all_events_empty(self, admin_token):
        """Test retrieving events when none exist."""
        # Clear all events
        db = TestingSessionLocal()
        db.query(Event).delete()
        db.commit()
        db.close()
        
        response = client.get(
            "/events",
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_get_all_events_unauthorized(self):
        """Test retrieving events without authentication."""
        response = client.get("/events")
        
        assert response.status_code == 401
    
    def test_get_all_events_non_admin(self, author_token):
        """Test retrieving events as non-admin user."""
        response = client.get(
            "/events",
            cookies={"access_token": author_token}
        )
        
        assert response.status_code == 403


class TestGetEventDetails:
    """Tests for GET /events/{event_id} endpoint."""
    
    def test_get_event_details_success(self, admin_token, test_event):
        """Test retrieving event details by ID."""
        response = client.get(
            f"/events/{test_event['id']}",
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_event["id"]
        assert data["name"] == test_event["name"]
        assert data["event_type"] == test_event["event_type"]
        assert data["description"] == test_event["description"]
    
    def test_get_event_details_not_found(self, admin_token):
        """Test retrieving non-existent event."""
        response = client.get(
            "/events/nonexistent-id",
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_get_event_details_unauthorized(self, test_event):
        """Test retrieving event details without authentication."""
        response = client.get(f"/events/{test_event['id']}")
        
        assert response.status_code == 401
    
    def test_get_event_details_non_admin(self, author_token, test_event):
        """Test retrieving event details as non-admin user."""
        response = client.get(
            f"/events/{test_event['id']}",
            cookies={"access_token": author_token}
        )
        
        assert response.status_code == 403


class TestUpdateEvent:
    """Tests for PUT /events/{event_id} endpoint."""
    
    def test_update_event_all_fields(self, admin_token, test_event):
        """Test updating all event fields."""
        update_data = {
            "name": "Updated Conference 2024",
            "event_date": (datetime.now() + timedelta(days=90)).isoformat(),
            "event_type": "workshop",
            "description": "Updated description"
        }
        
        response = client.put(
            f"/events/{test_event['id']}",
            json=update_data,
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_event["id"]
        assert data["name"] == update_data["name"]
        assert data["event_type"] == update_data["event_type"]
        assert data["description"] == update_data["description"]
    
    def test_update_event_partial(self, admin_token, test_event):
        """Test updating only some event fields."""
        update_data = {
            "name": "Partially Updated Event"
        }
        
        response = client.put(
            f"/events/{test_event['id']}",
            json=update_data,
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        # Other fields should remain unchanged
        assert data["event_type"] == test_event["event_type"]
    
    def test_update_event_not_found(self, admin_token):
        """Test updating non-existent event."""
        update_data = {
            "name": "Updated Name"
        }
        
        response = client.put(
            "/events/nonexistent-id",
            json=update_data,
            cookies={"access_token": admin_token}
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_update_event_empty_name(self, admin_token, test_event):
        """Test updating event with empty name."""
        update_data = {
            "name": ""
        }
        
        response = client.put(
            f"/events/{test_event['id']}",
            json=update_data,
            cookies={"access_token": admin_token}
        )
        
        # FastAPI returns 422 for Pydantic validation errors, but if the request
        # gets through to our service layer, it returns 400
        assert response.status_code in [400, 422]
    
    def test_update_event_unauthorized(self, test_event):
        """Test updating event without authentication."""
        update_data = {
            "name": "Unauthorized Update"
        }
        
        response = client.put(
            f"/events/{test_event['id']}",
            json=update_data
        )
        
        assert response.status_code == 401
    
    def test_update_event_non_admin(self, author_token, test_event):
        """Test updating event as non-admin user."""
        update_data = {
            "name": "Author Update"
        }
        
        response = client.put(
            f"/events/{test_event['id']}",
            json=update_data,
            cookies={"access_token": author_token}
        )
        
        assert response.status_code == 403
