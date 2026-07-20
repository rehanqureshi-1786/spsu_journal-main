"""
Unit tests for certificate validation functions.

Tests cover all validation functions with specific examples and edge cases.
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.certificates.validators import (
    ValidationError,
    validate_recipient_name,
    validate_date,
    validate_event_exists,
    validate_certificate_data,
    validate_role,
    validate_bulk_recipients,
)
from app.events.models import Event


class TestValidateRecipientName:
    """Test cases for recipient name validation."""
    
    def test_valid_simple_name(self):
        """Test validation passes for simple valid name."""
        validate_recipient_name("John Doe")
        # No exception means success
    
    def test_valid_name_with_hyphen(self):
        """Test validation passes for name with hyphen."""
        validate_recipient_name("Mary-Jane Smith")
    
    def test_valid_name_with_apostrophe(self):
        """Test validation passes for name with apostrophe."""
        validate_recipient_name("O'Brien")
    
    def test_valid_name_with_period(self):
        """Test validation passes for name with period."""
        validate_recipient_name("Dr. Smith")
    
    def test_valid_name_with_accents(self):
        """Test validation passes for name with accented characters."""
        validate_recipient_name("José García")
    
    def test_valid_name_minimum_length(self):
        """Test validation passes for 2-character name (minimum)."""
        validate_recipient_name("Li")
    
    def test_valid_name_maximum_length(self):
        """Test validation passes for 100-character name (maximum)."""
        long_name = "A" * 100
        validate_recipient_name(long_name)
    
    def test_invalid_name_too_short(self):
        """Test validation fails for name shorter than 2 characters."""
        with pytest.raises(ValidationError) as exc_info:
            validate_recipient_name("A")
        assert exc_info.value.field == "recipient_name"
        assert "at least 2 characters" in exc_info.value.message
    
    def test_invalid_name_too_long(self):
        """Test validation fails for name longer than 100 characters."""
        long_name = "A" * 101
        with pytest.raises(ValidationError) as exc_info:
            validate_recipient_name(long_name)
        assert exc_info.value.field == "recipient_name"
        assert "not exceed 100 characters" in exc_info.value.message
    
    def test_invalid_name_empty_string(self):
        """Test validation fails for empty string."""
        with pytest.raises(ValidationError) as exc_info:
            validate_recipient_name("")
        assert exc_info.value.field == "recipient_name"
    
    def test_invalid_name_whitespace_only(self):
        """Test validation fails for whitespace-only string."""
        with pytest.raises(ValidationError) as exc_info:
            validate_recipient_name("   ")
        assert exc_info.value.field == "recipient_name"
    
    def test_invalid_name_none(self):
        """Test validation fails for None value."""
        with pytest.raises(ValidationError) as exc_info:
            validate_recipient_name(None)
        assert exc_info.value.field == "recipient_name"
    
    def test_invalid_name_with_numbers(self):
        """Test validation fails for name with special characters."""
        with pytest.raises(ValidationError) as exc_info:
            validate_recipient_name("John@Doe")
        assert exc_info.value.field == "recipient_name"
        assert "invalid characters" in exc_info.value.message
    
    def test_invalid_name_with_special_chars(self):
        """Test validation fails for name with invalid special characters."""
        with pytest.raises(ValidationError) as exc_info:
            validate_recipient_name("John#Doe")
        assert exc_info.value.field == "recipient_name"


class TestValidateDate:
    """Test cases for date validation."""
    
    def test_valid_past_date(self):
        """Test validation passes for past date."""
        past_date = datetime.utcnow() - timedelta(days=30)
        validate_date(past_date)
    
    def test_valid_current_date(self):
        """Test validation passes for current date."""
        current_date = datetime.utcnow()
        validate_date(current_date)
    
    def test_valid_very_old_date(self):
        """Test validation passes for very old date."""
        old_date = datetime(2000, 1, 1)
        validate_date(old_date)
    
    def test_invalid_future_date(self):
        """Test validation fails for future date."""
        future_date = datetime.utcnow() + timedelta(days=1)
        with pytest.raises(ValidationError) as exc_info:
            validate_date(future_date)
        assert exc_info.value.field == "date"
        assert "cannot be in the future" in exc_info.value.message
    
    def test_invalid_none_date(self):
        """Test validation fails for None value."""
        with pytest.raises(ValidationError) as exc_info:
            validate_date(None)
        assert exc_info.value.field == "date"
        assert "required" in exc_info.value.message
    
    def test_invalid_string_date(self):
        """Test validation fails for string instead of datetime."""
        with pytest.raises(ValidationError) as exc_info:
            validate_date("2024-01-01")
        assert exc_info.value.field == "date"
        assert "valid datetime object" in exc_info.value.message
    
    def test_custom_field_name(self):
        """Test validation uses custom field name in error."""
        future_date = datetime.utcnow() + timedelta(days=1)
        with pytest.raises(ValidationError) as exc_info:
            validate_date(future_date, "subscription_date")
        assert exc_info.value.field == "subscription_date"


class TestValidateEventExists:
    """Test cases for event existence validation."""
    
    def test_valid_existing_event(self, db: Session):
        """Test validation passes for existing event."""
        # Create test event
        event = Event(
            name="Test Conference",
            event_date=datetime.utcnow(),
            event_type="conference",
            created_by="admin123"
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        
        # Validate event exists
        result = validate_event_exists(event.id, db)
        assert result.id == event.id
        assert result.name == "Test Conference"
    
    def test_invalid_nonexistent_event(self, db: Session):
        """Test validation fails for non-existent event."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        with pytest.raises(ValidationError) as exc_info:
            validate_event_exists(fake_id, db)
        assert exc_info.value.field == "event_id"
        assert "does not exist" in exc_info.value.message
    
    def test_invalid_empty_event_id(self, db: Session):
        """Test validation fails for empty event ID."""
        with pytest.raises(ValidationError) as exc_info:
            validate_event_exists("", db)
        assert exc_info.value.field == "event_id"
        assert "required" in exc_info.value.message
    
    def test_invalid_none_event_id(self, db: Session):
        """Test validation fails for None event ID."""
        with pytest.raises(ValidationError) as exc_info:
            validate_event_exists(None, db)
        assert exc_info.value.field == "event_id"


class TestValidateCertificateData:
    """Test cases for certificate data validation."""
    
    def test_valid_subscription_certificate_data(self):
        """Test validation passes for valid subscription certificate data."""
        data = {
            "certificate_type": "subscription",
            "recipient_id": "user123",
            "recipient_name": "John Doe",
            "subscription_date": datetime.utcnow()
        }
        validate_certificate_data(data)
    
    def test_valid_event_certificate_data(self):
        """Test validation passes for valid event certificate data."""
        data = {
            "certificate_type": "event",
            "recipient_id": "user123",
            "recipient_name": "John Doe",
            "event_id": "event123",
            "event_name": "Test Conference",
            "event_date": datetime.utcnow(),
            "role": "author"
        }
        validate_certificate_data(data)
    
    def test_invalid_missing_certificate_type(self):
        """Test validation fails when certificate_type is missing."""
        data = {
            "recipient_id": "user123",
            "recipient_name": "John Doe"
        }
        with pytest.raises(ValidationError) as exc_info:
            validate_certificate_data(data)
        assert exc_info.value.field == "certificate_type"
    
    def test_invalid_certificate_type(self):
        """Test validation fails for invalid certificate type."""
        data = {
            "certificate_type": "invalid",
            "recipient_id": "user123",
            "recipient_name": "John Doe"
        }
        with pytest.raises(ValidationError) as exc_info:
            validate_certificate_data(data)
        assert exc_info.value.field == "certificate_type"
        assert "must be 'subscription' or 'event'" in exc_info.value.message
    
    def test_invalid_missing_recipient_id(self):
        """Test validation fails when recipient_id is missing."""
        data = {
            "certificate_type": "subscription",
            "recipient_name": "John Doe",
            "subscription_date": datetime.utcnow()
        }
        with pytest.raises(ValidationError) as exc_info:
            validate_certificate_data(data)
        assert exc_info.value.field == "recipient_id"
    
    def test_invalid_missing_recipient_name(self):
        """Test validation fails when recipient_name is missing."""
        data = {
            "certificate_type": "subscription",
            "recipient_id": "user123",
            "subscription_date": datetime.utcnow()
        }
        with pytest.raises(ValidationError) as exc_info:
            validate_certificate_data(data)
        assert exc_info.value.field == "recipient_name"
    
    def test_invalid_subscription_missing_date(self):
        """Test validation fails when subscription_date is missing for subscription certificate."""
        data = {
            "certificate_type": "subscription",
            "recipient_id": "user123",
            "recipient_name": "John Doe"
        }
        with pytest.raises(ValidationError) as exc_info:
            validate_certificate_data(data)
        assert exc_info.value.field == "subscription_date"
    
    def test_invalid_event_missing_event_id(self):
        """Test validation fails when event_id is missing for event certificate."""
        data = {
            "certificate_type": "event",
            "recipient_id": "user123",
            "recipient_name": "John Doe",
            "event_name": "Test Conference",
            "event_date": datetime.utcnow(),
            "role": "author"
        }
        with pytest.raises(ValidationError) as exc_info:
            validate_certificate_data(data)
        assert exc_info.value.field == "event_id"
    
    def test_invalid_event_missing_role(self):
        """Test validation fails when role is missing for event certificate."""
        data = {
            "certificate_type": "event",
            "recipient_id": "user123",
            "recipient_name": "John Doe",
            "event_id": "event123",
            "event_name": "Test Conference",
            "event_date": datetime.utcnow()
        }
        with pytest.raises(ValidationError) as exc_info:
            validate_certificate_data(data)
        assert exc_info.value.field == "role"
    
    def test_invalid_none_data(self):
        """Test validation fails for None data."""
        with pytest.raises(ValidationError) as exc_info:
            validate_certificate_data(None)
        assert exc_info.value.field == "certificate_data"
    
    def test_invalid_empty_dict(self):
        """Test validation fails for empty dictionary."""
        with pytest.raises(ValidationError) as exc_info:
            validate_certificate_data({})
        assert exc_info.value.field == "certificate_data"
        assert "cannot be empty" in exc_info.value.message


class TestValidateRole:
    """Test cases for role validation."""
    
    def test_valid_author_role(self):
        """Test validation passes for 'author' role."""
        validate_role("author")
    
    def test_valid_reviewer_role(self):
        """Test validation passes for 'reviewer' role."""
        validate_role("reviewer")
    
    def test_valid_author_role_uppercase(self):
        """Test validation passes for 'AUTHOR' role (case insensitive)."""
        validate_role("AUTHOR")
    
    def test_valid_reviewer_role_mixed_case(self):
        """Test validation passes for 'Reviewer' role (case insensitive)."""
        validate_role("Reviewer")
    
    def test_valid_role_with_whitespace(self):
        """Test validation passes for role with surrounding whitespace."""
        validate_role("  author  ")
    
    def test_invalid_role(self):
        """Test validation fails for invalid role."""
        with pytest.raises(ValidationError) as exc_info:
            validate_role("editor")
        assert exc_info.value.field == "role"
        assert "must be either 'author' or 'reviewer'" in exc_info.value.message
    
    def test_invalid_empty_role(self):
        """Test validation fails for empty role."""
        with pytest.raises(ValidationError) as exc_info:
            validate_role("")
        assert exc_info.value.field == "role"
    
    def test_invalid_none_role(self):
        """Test validation fails for None role."""
        with pytest.raises(ValidationError) as exc_info:
            validate_role(None)
        assert exc_info.value.field == "role"
    
    def test_invalid_numeric_role(self):
        """Test validation fails for numeric role."""
        with pytest.raises(ValidationError) as exc_info:
            validate_role(123)
        assert exc_info.value.field == "role"


class TestValidateBulkRecipients:
    """Test cases for bulk recipients validation."""
    
    def test_valid_single_recipient(self):
        """Test validation passes for single recipient."""
        recipients = [
            {"recipient_id": "user123", "role": "author"}
        ]
        validate_bulk_recipients(recipients)
    
    def test_valid_multiple_recipients(self):
        """Test validation passes for multiple recipients."""
        recipients = [
            {"recipient_id": "user123", "role": "author"},
            {"recipient_id": "user456", "role": "reviewer"},
            {"recipient_id": "user789", "role": "author"}
        ]
        validate_bulk_recipients(recipients)
    
    def test_invalid_empty_list(self):
        """Test validation fails for empty recipients list."""
        with pytest.raises(ValidationError) as exc_info:
            validate_bulk_recipients([])
        assert exc_info.value.field == "recipients"
        assert "cannot be empty" in exc_info.value.message
    
    def test_invalid_none_list(self):
        """Test validation fails for None recipients list."""
        with pytest.raises(ValidationError) as exc_info:
            validate_bulk_recipients(None)
        assert exc_info.value.field == "recipients"
    
    def test_invalid_not_list(self):
        """Test validation fails when recipients is not a list."""
        with pytest.raises(ValidationError) as exc_info:
            validate_bulk_recipients({"recipient_id": "user123"})
        assert exc_info.value.field == "recipients"
    
    def test_invalid_recipient_not_dict(self):
        """Test validation fails when recipient is not a dictionary."""
        recipients = [
            "user123"
        ]
        with pytest.raises(ValidationError) as exc_info:
            validate_bulk_recipients(recipients)
        assert exc_info.value.field == "recipients"
        assert "must be a dictionary" in exc_info.value.message
    
    def test_invalid_missing_recipient_id(self):
        """Test validation fails when recipient_id is missing."""
        recipients = [
            {"role": "author"}
        ]
        with pytest.raises(ValidationError) as exc_info:
            validate_bulk_recipients(recipients)
        assert exc_info.value.field == "recipients"
        assert "missing recipient_id" in exc_info.value.message
    
    def test_invalid_missing_role(self):
        """Test validation fails when role is missing."""
        recipients = [
            {"recipient_id": "user123"}
        ]
        with pytest.raises(ValidationError) as exc_info:
            validate_bulk_recipients(recipients)
        assert exc_info.value.field == "recipients"
        assert "missing role" in exc_info.value.message
    
    def test_invalid_role_in_recipient(self):
        """Test validation fails when recipient has invalid role."""
        recipients = [
            {"recipient_id": "user123", "role": "invalid"}
        ]
        with pytest.raises(ValidationError) as exc_info:
            validate_bulk_recipients(recipients)
        assert exc_info.value.field == "recipients"
        assert "must be either 'author' or 'reviewer'" in exc_info.value.message
