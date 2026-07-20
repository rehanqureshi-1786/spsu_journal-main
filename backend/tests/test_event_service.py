"""
Unit tests for event service layer.
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.events.service import EventService
from app.events.models import Event
from app.events.schemas import EventUpdate
from app.users.models import User, Role


class TestEventService:
    """Test suite for EventService."""
    
    def test_create_event(self, db: Session, test_admin):
        """Test creating an event."""
        service = EventService(db)
        event_date = datetime.utcnow() + timedelta(days=30)
        
        event = service.create_event(
            name="Test Conference 2024",
            event_date=event_date,
            event_type="conference",
            description="A test conference for testing",
            admin_id=test_admin.id
        )
        
        assert event is not None
        assert event.name == "Test Conference 2024"
        assert event.event_date == event_date
        assert event.event_type == "conference"
        assert event.description == "A test conference for testing"
        assert event.created_by == test_admin.id
        assert event.id is not None
    
    def test_create_event_strips_whitespace(self, db: Session, test_admin):
        """Test that event creation strips whitespace from fields."""
        service = EventService(db)
        event_date = datetime.utcnow() + timedelta(days=30)
        
        event = service.create_event(
            name="  Test Conference  ",
            event_date=event_date,
            event_type="  workshop  ",
            description="  Test description  ",
            admin_id=test_admin.id
        )
        
        assert event.name == "Test Conference"
        assert event.event_type == "workshop"
        assert event.description == "Test description"
    
    def test_create_event_with_no_description(self, db: Session, test_admin):
        """Test creating an event without a description."""
        service = EventService(db)
        event_date = datetime.utcnow() + timedelta(days=30)
        
        event = service.create_event(
            name="Test Conference",
            event_date=event_date,
            event_type="conference",
            description=None,
            admin_id=test_admin.id
        )
        
        assert event.description is None
    
    def test_create_event_missing_name(self, db: Session, test_admin):
        """Test that creating an event without a name raises ValueError."""
        service = EventService(db)
        event_date = datetime.utcnow() + timedelta(days=30)
        
        with pytest.raises(ValueError, match="Event name is required"):
            service.create_event(
                name="",
                event_date=event_date,
                event_type="conference",
                description="Test",
                admin_id=test_admin.id
            )
    
    def test_create_event_missing_event_type(self, db: Session, test_admin):
        """Test that creating an event without an event type raises ValueError."""
        service = EventService(db)
        event_date = datetime.utcnow() + timedelta(days=30)
        
        with pytest.raises(ValueError, match="Event type is required"):
            service.create_event(
                name="Test Conference",
                event_date=event_date,
                event_type="",
                description="Test",
                admin_id=test_admin.id
            )
    
    def test_create_event_missing_admin_id(self, db: Session):
        """Test that creating an event without an admin ID raises ValueError."""
        service = EventService(db)
        event_date = datetime.utcnow() + timedelta(days=30)
        
        with pytest.raises(ValueError, match="Admin ID is required"):
            service.create_event(
                name="Test Conference",
                event_date=event_date,
                event_type="conference",
                description="Test",
                admin_id=None
            )
    
    def test_get_event(self, db: Session, test_event):
        """Test retrieving an event by ID."""
        service = EventService(db)
        
        event = service.get_event(test_event.id)
        
        assert event is not None
        assert event.id == test_event.id
        assert event.name == test_event.name
    
    def test_get_event_not_found(self, db: Session):
        """Test retrieving a non-existent event returns None."""
        service = EventService(db)
        
        event = service.get_event("non-existent-id")
        
        assert event is None
    
    def test_get_all_events(self, db: Session, test_admin):
        """Test retrieving all events."""
        service = EventService(db)
        
        # Create multiple events
        event1 = service.create_event(
            name="Conference 2024",
            event_date=datetime.utcnow() + timedelta(days=30),
            event_type="conference",
            description="Conference",
            admin_id=test_admin.id
        )
        
        event2 = service.create_event(
            name="Workshop 2024",
            event_date=datetime.utcnow() + timedelta(days=60),
            event_type="workshop",
            description="Workshop",
            admin_id=test_admin.id
        )
        
        events = service.get_all_events()
        
        assert len(events) == 2
        # Should be ordered by event_date descending
        assert events[0].id == event2.id
        assert events[1].id == event1.id
    
    def test_get_all_events_empty(self, db: Session):
        """Test retrieving all events when none exist."""
        service = EventService(db)
        
        events = service.get_all_events()
        
        assert events == []
    
    def test_update_event_name(self, db: Session, test_event):
        """Test updating an event's name."""
        service = EventService(db)
        
        updates = EventUpdate(name="Updated Conference Name")
        updated_event = service.update_event(test_event.id, updates)
        
        assert updated_event.name == "Updated Conference Name"
        assert updated_event.event_type == test_event.event_type
        assert updated_event.event_date == test_event.event_date
    
    def test_update_event_date(self, db: Session, test_event):
        """Test updating an event's date."""
        service = EventService(db)
        new_date = datetime.utcnow() + timedelta(days=90)
        
        updates = EventUpdate(event_date=new_date)
        updated_event = service.update_event(test_event.id, updates)
        
        assert updated_event.event_date == new_date
        assert updated_event.name == test_event.name
    
    def test_update_event_type(self, db: Session, test_event):
        """Test updating an event's type."""
        service = EventService(db)
        
        updates = EventUpdate(event_type="webinar")
        updated_event = service.update_event(test_event.id, updates)
        
        assert updated_event.event_type == "webinar"
    
    def test_update_event_description(self, db: Session, test_event):
        """Test updating an event's description."""
        service = EventService(db)
        
        updates = EventUpdate(description="Updated description")
        updated_event = service.update_event(test_event.id, updates)
        
        assert updated_event.description == "Updated description"
    
    def test_update_event_multiple_fields(self, db: Session, test_event):
        """Test updating multiple fields at once."""
        service = EventService(db)
        new_date = datetime.utcnow() + timedelta(days=90)
        
        updates = EventUpdate(
            name="New Name",
            event_date=new_date,
            event_type="seminar",
            description="New description"
        )
        updated_event = service.update_event(test_event.id, updates)
        
        assert updated_event.name == "New Name"
        assert updated_event.event_date == new_date
        assert updated_event.event_type == "seminar"
        assert updated_event.description == "New description"
    
    def test_update_event_not_found(self, db: Session):
        """Test updating a non-existent event raises ValueError."""
        service = EventService(db)
        
        updates = EventUpdate(name="New Name")
        
        with pytest.raises(ValueError, match="Event with ID .* not found"):
            service.update_event("non-existent-id", updates)
    
    def test_update_event_strips_whitespace(self, db: Session, test_event):
        """Test that event updates strip whitespace."""
        service = EventService(db)
        
        updates = EventUpdate(
            name="  New Name  ",
            event_type="  webinar  ",
            description="  New description  "
        )
        updated_event = service.update_event(test_event.id, updates)
        
        assert updated_event.name == "New Name"
        assert updated_event.event_type == "webinar"
        assert updated_event.description == "New description"
    
    def test_update_event_no_changes(self, db: Session, test_event):
        """Test updating an event with no changes."""
        service = EventService(db)
        
        updates = EventUpdate()
        updated_event = service.update_event(test_event.id, updates)
        
        # Should return the event unchanged
        assert updated_event.name == test_event.name
        assert updated_event.event_type == test_event.event_type
        assert updated_event.event_date == test_event.event_date
        assert updated_event.description == test_event.description


# Fixtures for testing
@pytest.fixture
def test_admin(db: Session):
    """Create a test admin user."""
    role = db.query(Role).filter(Role.name == "admin").first()
    if not role:
        role = Role(name="admin", permissions={})
        db.add(role)
        db.commit()
    
    admin = User(
        email="admin@example.com",
        password_hash="hashed_password",
        role_id=role.id,
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@pytest.fixture
def test_event(db: Session, test_admin):
    """Create a test event."""
    event = Event(
        name="Test Conference 2024",
        event_date=datetime.utcnow() - timedelta(days=30),
        event_type="conference",
        description="A test conference",
        created_by=test_admin.id
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
