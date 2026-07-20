"""
Pydantic schemas for event management.
"""
from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional


class EventBase(BaseModel):
    """Base schema for event data."""
    name: str = Field(..., min_length=1, max_length=255)
    event_date: date
    event_type: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class EventCreate(EventBase):
    """Schema for creating a new event."""
    pass


class EventUpdate(BaseModel):
    """Schema for updating an event."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    event_date: Optional[date] = None
    event_type: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None


class EventResponse(EventBase):
    """Schema for event response."""
    id: str
    created_at: datetime
    created_by: str
    
    class Config:
        from_attributes = True
