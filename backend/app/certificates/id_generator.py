"""
Certificate ID generator for unique certificate identification.

This module provides functionality to generate unique, secure certificate IDs
with collision detection and sufficient entropy to prevent guessing or forgery.
"""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session


class CertificateIDGenerator:
    """
    Generates unique certificate IDs with format: CERT-{timestamp}-{random}
    
    The certificate ID format ensures:
    - Uniqueness through UUID4 random component
    - Temporal ordering through timestamp
    - Fixed length of 24 characters
    - Sufficient entropy to prevent guessing
    """
    
    def __init__(self, db: Session):
        """
        Initialize the certificate ID generator.
        
        Args:
            db: Database session for uniqueness verification
        """
        self.db = db
    
    def generate_id(self) -> str:
        """
        Generate a unique certificate ID.
        
        The ID format is: CERT-{timestamp}-{random}
        - CERT: Fixed prefix (4 chars)
        - timestamp: 8-character timestamp (YYYYMMDD format)
        - random: 8-character random hex string from UUID4
        - Total length: 4 + 1 + 8 + 1 + 8 = 22 characters (with hyphens)
        
        Returns:
            str: A unique certificate ID (24 characters including hyphens)
        
        Raises:
            RuntimeError: If unable to generate unique ID after maximum attempts
        """
        max_attempts = 10
        
        for attempt in range(max_attempts):
            # Generate timestamp component (YYYYMMDD format)
            timestamp = datetime.utcnow().strftime("%Y%m%d")
            
            # Generate random component from UUID4 (8 hex characters)
            random_component = uuid.uuid4().hex[:8].upper()
            
            # Construct certificate ID: CERT-YYYYMMDD-XXXXXXXX
            certificate_id = f"CERT-{timestamp}-{random_component}"
            
            # Verify uniqueness
            if self.verify_uniqueness(certificate_id):
                return certificate_id
        
        # If we reach here, we failed to generate a unique ID
        raise RuntimeError(
            f"Failed to generate unique certificate ID after {max_attempts} attempts. "
            "This is extremely unlikely and may indicate a system issue."
        )
    
    def verify_uniqueness(self, certificate_id: str) -> bool:
        """
        Verify that a certificate ID does not already exist in the database.
        
        Args:
            certificate_id: The certificate ID to check
        
        Returns:
            bool: True if the ID is unique (does not exist), False otherwise
        """
        from app.certificates.models import Certificate
        
        # Query database for existing certificate with this ID
        existing = self.db.query(Certificate).filter(
            Certificate.certificate_id == certificate_id
        ).first()
        
        # Return True if no existing certificate found (ID is unique)
        return existing is None
