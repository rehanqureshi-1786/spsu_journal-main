"""
Event API endpoints.

This module provides REST API endpoints for event management including:
- Creating events
- Retrieving all events
- Getting event details
- Updating events

All endpoints require admin authentication.

Requirements: 3.1
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.dependencies import require_role
from app.users.models import User
from app.events.service import EventService
from app.events.schemas import EventCreate, EventUpdate, EventResponse


router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Create a new event (admin only).
    
    This endpoint allows admins to create journal events such as conferences,
    workshops, or webinars. Events can later be used to issue certificates to
    participants.
    
    Requirements: 3.1
    
    Args:
        event_data: Event creation data including name, date, type, and description
        current_user: Authenticated admin user
        db: Database session
    
    Returns:
        EventResponse: The created event with all details
    
    Raises:
        HTTPException: 400 if validation fails, 500 if creation fails
    """
    service = EventService(db)
    
    try:
        event = service.create_event(
            name=event_data.name,
            event_date=event_data.event_date,
            event_type=event_data.event_type,
            description=event_data.description,
            admin_id=current_user.id
        )
        
        return EventResponse.model_validate(event)
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create event: {str(e)}"
        )


@router.get("", response_model=List[EventResponse])
async def get_all_events(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Get all events (admin only).
    
    This endpoint returns all events in the system, ordered by event date
    in descending order (most recent first).
    
    Requirements: 3.1
    
    Args:
        current_user: Authenticated admin user
        db: Database session
    
    Returns:
        List[EventResponse]: List of all events
    """
    service = EventService(db)
    
    events = service.get_all_events()
    
    return [EventResponse.model_validate(event) for event in events]


@router.get("/{event_id}", response_model=EventResponse)
async def get_event_details(
    event_id: str,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Get event details by ID (admin only).
    
    This endpoint retrieves detailed information about a specific event.
    
    Requirements: 3.1
    
    Args:
        event_id: ID of the event to retrieve
        current_user: Authenticated admin user
        db: Database session
    
    Returns:
        EventResponse: The event details
    
    Raises:
        HTTPException: 404 if event not found
    """
    service = EventService(db)
    
    event = service.get_event(event_id)
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found"
        )
    
    return EventResponse.model_validate(event)


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    event_data: EventUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Update an existing event (admin only).
    
    This endpoint allows admins to update event details such as name, date,
    type, or description. Only provided fields will be updated.
    
    Requirements: 3.1
    
    Args:
        event_id: ID of the event to update
        event_data: Event update data with optional fields
        current_user: Authenticated admin user
        db: Database session
    
    Returns:
        EventResponse: The updated event
    
    Raises:
        HTTPException: 400 if validation fails, 404 if event not found, 500 if update fails
    """
    service = EventService(db)
    
    try:
        event = service.update_event(event_id, event_data)
        
        return EventResponse.model_validate(event)
    
    except ValueError as e:
        # Check if it's a "not found" error
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        # Otherwise it's a validation error
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update event: {str(e)}"
        )
