"""
Unit tests for certificate ID generator.

Tests the CertificateIDGenerator class for:
- ID format and length
- Uniqueness verification
- Collision detection and regeneration
- Entropy and security
"""
import pytest
import re
from datetime import datetime
from app.certificates.id_generator import CertificateIDGenerator
from app.certificates.models import Certificate


class TestCertificateIDGenerator:
    """Test suite for CertificateIDGenerator."""
    
    def test_generate_id_format(self, db):
        """Test that generated IDs follow the correct format."""
        generator = CertificateIDGenerator(db)
        cert_id = generator.generate_id()
        
        # Check format: CERT-YYYYMMDD-XXXXXXXX
        pattern = r'^CERT-\d{8}-[A-F0-9]{8}$'
        assert re.match(pattern, cert_id), f"ID {cert_id} does not match expected format"
    
    def test_generate_id_length(self, db):
        """Test that generated IDs are 22 characters long."""
        generator = CertificateIDGenerator(db)
        cert_id = generator.generate_id()
        
        # CERT-YYYYMMDD-XXXXXXXX = 4 + 1 + 8 + 1 + 8 = 22 characters
        assert len(cert_id) == 22, f"ID length is {len(cert_id)}, expected 22"
    
    def test_generate_id_contains_current_date(self, db):
        """Test that generated IDs contain the current date."""
        generator = CertificateIDGenerator(db)
        cert_id = generator.generate_id()
        
        # Extract date component
        date_part = cert_id.split('-')[1]
        current_date = datetime.utcnow().strftime("%Y%m%d")
        
        assert date_part == current_date, f"Date part {date_part} does not match current date {current_date}"
    
    def test_generate_id_uniqueness(self, db):
        """Test that multiple generated IDs are unique."""
        generator = CertificateIDGenerator(db)
        
        # Generate 100 IDs
        ids = [generator.generate_id() for _ in range(100)]
        
        # Check all IDs are unique
        assert len(ids) == len(set(ids)), "Generated IDs are not unique"
    
    def test_verify_uniqueness_with_empty_database(self, db):
        """Test uniqueness verification with no existing certificates."""
        generator = CertificateIDGenerator(db)
        
        # Any ID should be unique in empty database
        assert generator.verify_uniqueness("CERT-20240115-ABCD1234") is True
    
    def test_verify_uniqueness_with_existing_certificate(self, db):
        """Test uniqueness verification detects existing certificate IDs."""
        generator = CertificateIDGenerator(db)
        
        # Create a certificate with a specific ID
        existing_id = "CERT-20240115-ABCD1234"
        cert = Certificate(
            certificate_id=existing_id,
            certificate_type="subscription",
            recipient_id="user123",
            recipient_name="Test User",
            issued_date=datetime.utcnow()
        )
        db.add(cert)
        db.commit()
        
        # Verify that the existing ID is not unique
        assert generator.verify_uniqueness(existing_id) is False
        
        # Verify that a different ID is still unique
        assert generator.verify_uniqueness("CERT-20240115-EFGH5678") is True
    
    def test_generate_id_with_collision(self, db):
        """Test that ID generation handles collisions by regenerating."""
        generator = CertificateIDGenerator(db)
        
        # Generate and store first ID
        first_id = generator.generate_id()
        cert = Certificate(
            certificate_id=first_id,
            certificate_type="subscription",
            recipient_id="user123",
            recipient_name="Test User",
            issued_date=datetime.utcnow()
        )
        db.add(cert)
        db.commit()
        
        # Generate another ID - should be different
        second_id = generator.generate_id()
        
        assert first_id != second_id, "Generated ID should be different from existing one"
        assert generator.verify_uniqueness(second_id) is True
    
    def test_generate_id_entropy(self, db):
        """Test that generated IDs have sufficient entropy (random component varies)."""
        generator = CertificateIDGenerator(db)
        
        # Generate multiple IDs
        ids = [generator.generate_id() for _ in range(10)]
        
        # Extract random components (last 8 characters)
        random_parts = [cert_id.split('-')[2] for cert_id in ids]
        
        # All random parts should be different (extremely high probability)
        assert len(random_parts) == len(set(random_parts)), "Random components should vary"
    
    def test_generate_id_uppercase_hex(self, db):
        """Test that random component uses uppercase hexadecimal."""
        generator = CertificateIDGenerator(db)
        cert_id = generator.generate_id()
        
        # Extract random component
        random_part = cert_id.split('-')[2]
        
        # Check all characters are uppercase hex
        assert all(c in '0123456789ABCDEF' for c in random_part), \
            f"Random part {random_part} contains non-uppercase-hex characters"
    
    def test_generate_id_multiple_certificates(self, db):
        """Test generating IDs for multiple certificates in sequence."""
        generator = CertificateIDGenerator(db)
        
        # Generate and store 50 certificates
        for i in range(50):
            cert_id = generator.generate_id()
            cert = Certificate(
                certificate_id=cert_id,
                certificate_type="subscription",
                recipient_id=f"user{i}",
                recipient_name=f"Test User {i}",
                issued_date=datetime.utcnow()
            )
            db.add(cert)
            db.commit()
        
        # Verify all certificates have unique IDs
        all_certs = db.query(Certificate).all()
        all_ids = [cert.certificate_id for cert in all_certs]
        
        assert len(all_ids) == 50
        assert len(all_ids) == len(set(all_ids)), "All certificate IDs should be unique"
    
    def test_generate_id_prefix(self, db):
        """Test that all generated IDs start with 'CERT-' prefix."""
        generator = CertificateIDGenerator(db)
        
        for _ in range(10):
            cert_id = generator.generate_id()
            assert cert_id.startswith('CERT-'), f"ID {cert_id} does not start with 'CERT-'"
    
    def test_generate_id_components_count(self, db):
        """Test that generated IDs have exactly 3 components separated by hyphens."""
        generator = CertificateIDGenerator(db)
        cert_id = generator.generate_id()
        
        components = cert_id.split('-')
        assert len(components) == 3, f"ID should have 3 components, got {len(components)}"
        assert components[0] == 'CERT'
        assert len(components[1]) == 8  # Date: YYYYMMDD
        assert len(components[2]) == 8  # Random: 8 hex chars
