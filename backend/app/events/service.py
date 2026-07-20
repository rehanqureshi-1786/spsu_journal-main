"""
Event service layer for business logic.

This module provides the core business logic for event management,
including creating, retrieving, updating, and listing events.
"""
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List, Optional

from app.events.models import Event
from app.events.schemas import EventCreate, EventUpdate, EventResponse


class EventService:
    """
    Service class for event operations.
    
    Provides methods for:
    - Creating events
    - Retrieving events
    - Updating events
    - Listing all events
    """
    
    def __init__(self, db: Session):
        """
        Initialize the event service.
        
        Args:
            db: Database session
        """
        self.db = db
    
    def create_event(
        self,
        name: str,
        event_date: date,
        event_type: str,
        description: Optional[str],
        admin_id: str
    ) -> Event:
        """
        Create a new event.
        
        Args:
            name: Name of the event
            event_date: Date of the event
            event_type: Type of event (e.g., 'conference', 'workshop', 'webinar')
            description: Optional description of the event
            admin_id: ID of the admin creating the event
        
        Returns:
            Event: The created event object
        
        Raises:
            ValueError: If invalid data provided
        """
        # Validate required fields
        if not name or not name.strip():
            raise ValueError("Event name is required")
        
        if not event_type or not event_type.strip():
            raise ValueError("Event type is required")
        
        if not admin_id:
            raise ValueError("Admin ID is required")
        
        # Create event
        event = Event(
            name=name.strip(),
            event_date=event_date,
            event_type=event_type.strip(),
            description=description.strip() if description else None,
            created_by=admin_id
        )
        
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        
        return event
    
    def get_event(self, event_id: str) -> Optional[Event]:
        """
        Retrieve an event by ID.
        
        Args:
            event_id: ID of the event to retrieve
        
        Returns:
            Optional[Event]: The event if found, None otherwise
        """
        return self.db.query(Event).filter(Event.id == event_id).first()
    
    def get_all_events(self) -> List[Event]:
        """
        Retrieve all events.
        
        Returns:
            List[Event]: List of all events ordered by event date descending
        """
        return self.db.query(Event).order_by(Event.event_date.desc()).all()
    
    def update_event(
        self,
        event_id: str,
        updates: EventUpdate
    ) -> Event:
        """
        Update an existing event.
        
        Args:
            event_id: ID of the event to update
            updates: EventUpdate object containing fields to update
        
        Returns:
            Event: The updated event object
        
        Raises:
            ValueError: If event not found or invalid data
        """
        # Get existing event
        event = self.get_event(event_id)
        if not event:
            raise ValueError(f"Event with ID {event_id} not found")
        
        # Update fields if provided
        update_data = updates.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            if field == "name" and value:
                event.name = value.strip()
            elif field == "event_type" and value:
                event.event_type = value.strip()
            elif field == "description":
                event.description = value.strip() if value else None
            elif field == "event_date" and value:
                event.event_date = value
        
        self.db.commit()
        self.db.refresh(event)
        
        return event
