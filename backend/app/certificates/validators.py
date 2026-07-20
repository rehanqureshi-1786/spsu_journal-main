"""
Input validation functions for certificate generation system.

This module provides validation functions for certificate data to ensure
data integrity and compliance with requirements before certificate generation.
"""
import re
from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.events.models import Event
from app.middleware.error_handler import CertificateValidationError as ValidationError


def validate_recipient_name(name: str) -> None:
    """
    Validate recipient name for certificate generation.
    
    Requirements:
    - Name must be between 2 and 100 characters
    - Name must contain only valid characters (letters, spaces, hyphens, apostrophes, periods)
    
    Args:
        name: Recipient name to validate
    
    Raises:
        ValidationError: If name is invalid
    
    Validates: Requirements 12.2
    """
    if not name or not isinstance(name, str):
        raise ValidationError("recipient_name", "Name is required and must be a string")
    
    # Strip whitespace for length check
    name_stripped = name.strip()
    
    # Check length
    if len(name_stripped) < 2:
        raise ValidationError("recipient_name", "Name must be at least 2 characters long")
    
    if len(name_stripped) > 100:
        raise ValidationError("recipient_name", "Name must not exceed 100 characters")
    
    # Check for valid characters (letters, spaces, hyphens, apostrophes, periods, accented characters)
    # Allow Unicode letters, spaces, hyphens, apostrophes, and periods
    valid_name_pattern = r"^[\w\s\-'.]+$"
    if not re.match(valid_name_pattern, name_stripped, re.UNICODE):
        raise ValidationError(
            "recipient_name",
            "Name contains invalid characters. Only letters, spaces, hyphens, apostrophes, and periods are allowed"
        )


def validate_date(date: datetime, field_name: str = "date") -> None:
    """
    Validate date for certificate generation.
    
    Requirements:
    - Date must be a valid datetime object
    - Date must not be in the future
    
    Args:
        date: Date to validate
        field_name: Name of the field being validated (for error messages)
    
    Raises:
        ValidationError: If date is invalid
    
    Validates: Requirements 12.3
    """
    if not date:
        raise ValidationError(field_name, "Date is required")
    
    if not isinstance(date, datetime):
        raise ValidationError(field_name, "Date must be a valid datetime object")
    
    # Check if date is in the future
    now = datetime.utcnow()
    if date > now:
        raise ValidationError(field_name, "Date cannot be in the future")


def validate_event_exists(event_id: str, db: Session) -> Event:
    """
    Validate that an event exists in the database.
    
    Requirements:
    - Event ID must reference an existing event
    
    Args:
        event_id: ID of the event to validate
        db: Database session
    
    Returns:
        Event: The event object if found
    
    Raises:
        ValidationError: If event does not exist
    
    Validates: Requirements 12.4
    """
    if not event_id:
        raise ValidationError("event_id", "Event ID is required")
    
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        raise ValidationError("event_id", f"Event with ID {event_id} does not exist")
    
    return event


def validate_certificate_data(data: Dict) -> None:
    """
    Validate that all required fields are present in certificate data.
    
    Requirements:
    - All required fields must be present and non-empty
    - Field requirements vary by certificate type
    
    Args:
        data: Dictionary containing certificate data
    
    Raises:
        ValidationError: If required fields are missing or empty
    
    Validates: Requirements 12.1
    """
    if not isinstance(data, dict):
        raise ValidationError("certificate_data", "Certificate data is required and must be a dictionary")
    
    if not data:
        raise ValidationError("certificate_data", "Certificate data cannot be empty")
    
    # Check certificate type
    certificate_type = data.get("certificate_type")
    if not certificate_type:
        raise ValidationError("certificate_type", "Certificate type is required")
    
    if certificate_type not in ["subscription", "event"]:
        raise ValidationError("certificate_type", "Certificate type must be 'subscription' or 'event'")
    
    # Common required fields
    required_common_fields = ["recipient_id", "recipient_name"]
    
    for field in required_common_fields:
        if field not in data or not data[field]:
            raise ValidationError(field, f"{field.replace('_', ' ').title()} is required")
    
    # Type-specific required fields
    if certificate_type == "subscription":
        if "subscription_date" not in data or not data["subscription_date"]:
            raise ValidationError("subscription_date", "Subscription date is required for subscription certificates")
    
    elif certificate_type == "event":
        required_event_fields = ["event_id", "event_name", "event_date", "role"]
        
        for field in required_event_fields:
            if field not in data or not data[field]:
                raise ValidationError(field, f"{field.replace('_', ' ').title()} is required for event certificates")


def validate_role(role: str) -> None:
    """
    Validate role for event certificates.
    
    Requirements:
    - Role must be either 'author' or 'reviewer'
    
    Args:
        role: Role to validate
    
    Raises:
        ValidationError: If role is invalid
    
    Validates: Requirements 12.5
    """
    if not role or not isinstance(role, str):
        raise ValidationError("role", "Role is required and must be a string")
    
    role_lower = role.lower().strip()
    
    if role_lower not in ["author", "reviewer"]:
        raise ValidationError("role", "Role must be either 'author' or 'reviewer'")


def validate_bulk_recipients(recipients: List[Dict]) -> None:
    """
    Validate a list of recipients for bulk certificate generation.
    
    Requirements:
    - Recipients list must not be empty
    - Each recipient must have required fields
    
    Args:
        recipients: List of recipient dictionaries
    
    Raises:
        ValidationError: If recipients list is invalid
    """
    if not isinstance(recipients, list):
        raise ValidationError("recipients", "Recipients list is required and must be a list")
    
    if len(recipients) == 0:
        raise ValidationError("recipients", "Recipients list cannot be empty")
    
    for idx, recipient in enumerate(recipients):
        if not isinstance(recipient, dict):
            raise ValidationError("recipients", f"Recipient at index {idx} must be a dictionary")
        
        if "recipient_id" not in recipient or not recipient["recipient_id"]:
            raise ValidationError("recipients", f"Recipient at index {idx} is missing recipient_id")
        
        if "role" not in recipient or not recipient["role"]:
            raise ValidationError("recipients", f"Recipient at index {idx} is missing role")
        
        # Validate role for each recipient
        try:
            validate_role(recipient["role"])
        except ValidationError as e:
            raise ValidationError("recipients", f"Recipient at index {idx}: {e.message}")
