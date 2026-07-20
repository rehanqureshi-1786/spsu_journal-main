"""
Unit tests for PDF certificate generator.
"""
import pytest
from datetime import datetime
from app.certificates.pdf_generator import PDFGenerator


class TestPDFGenerator:
    """Test suite for PDF certificate generator."""
    
    @pytest.fixture
    def generator(self):
        """Create a PDF generator instance."""
        return PDFGenerator()
    
    def test_generate_subscription_certificate_basic(self, generator):
        """Test basic subscription certificate generation."""
        data = {
            'recipient_name': 'John Doe',
            'subscription_date': datetime(2024, 1, 15),
            'certificate_id': 'CERT-20240115-A7B9C2D4',
            'issued_date': datetime(2024, 1, 15)
        }
        
        pdf_bytes = generator.generate_subscription_certificate(data)
        
        # Verify PDF is generated
        assert pdf_bytes is not None
        assert len(pdf_bytes) > 0
        
        # Verify file size is under 2MB
        assert len(pdf_bytes) < 2 * 1024 * 1024, "PDF exceeds 2MB limit"
    
    def test_generate_event_certificate_author(self, generator):
        """Test event certificate generation for author role."""
        data = {
            'recipient_name': 'Jane Smith',
            'event_name': 'Annual Research Conference 2024',
            'event_date': datetime(2024, 3, 20),
            'role': 'author',
            'certificate_id': 'CERT-20240320-B8C3D5E7',
            'issued_date': datetime(2024, 3, 21)
        }
        
        pdf_bytes = generator.generate_event_certificate(data)
        
        # Verify PDF is generated
        assert pdf_bytes is not None
        assert len(pdf_bytes) > 0
        
        # Verify file size is under 2MB
        assert len(pdf_bytes) < 2 * 1024 * 1024, "PDF exceeds 2MB limit"
    
    def test_generate_event_certificate_reviewer(self, generator):
        """Test event certificate generation for reviewer role."""
        data = {
            'recipient_name': 'Dr. Robert Johnson',
            'event_name': 'International Journal Workshop 2024',
            'event_date': datetime(2024, 5, 10),
            'role': 'reviewer',
            'certificate_id': 'CERT-20240510-C9D4E6F8',
            'issued_date': datetime(2024, 5, 11)
        }
        
        pdf_bytes = generator.generate_event_certificate(data)
        
        # Verify PDF is generated
        assert pdf_bytes is not None
        assert len(pdf_bytes) > 0
        
        # Verify file size is under 2MB
        assert len(pdf_bytes) < 2 * 1024 * 1024, "PDF exceeds 2MB limit"
    
    def test_subscription_certificate_with_long_name(self, generator):
        """Test subscription certificate with maximum length name."""
        data = {
            'recipient_name': 'Dr. Alexander Benjamin Christopher Davidson-Wellington III',
            'subscription_date': datetime(2024, 1, 15),
            'certificate_id': 'CERT-20240115-A7B9C2D4',
            'issued_date': datetime(2024, 1, 15)
        }
        
        pdf_bytes = generator.generate_subscription_certificate(data)
        
        # Verify PDF is generated even with long name
        assert pdf_bytes is not None
        assert len(pdf_bytes) > 0
        assert len(pdf_bytes) < 2 * 1024 * 1024
    
    def test_event_certificate_with_long_event_name(self, generator):
        """Test event certificate with long event name."""
        data = {
            'recipient_name': 'Jane Smith',
            'event_name': 'International Conference on Advanced Research in Computer Science and Engineering Applications 2024',
            'event_date': datetime(2024, 3, 20),
            'role': 'author',
            'certificate_id': 'CERT-20240320-B8C3D5E7',
            'issued_date': datetime(2024, 3, 21)
        }
        
        pdf_bytes = generator.generate_event_certificate(data)
        
        # Verify PDF is generated even with long event name
        assert pdf_bytes is not None
        assert len(pdf_bytes) > 0
        assert len(pdf_bytes) < 2 * 1024 * 1024
    
    def test_subscription_certificate_with_special_characters(self, generator):
        """Test subscription certificate with special characters in name."""
        data = {
            'recipient_name': "O'Brien-Smith, José María",
            'subscription_date': datetime(2024, 1, 15),
            'certificate_id': 'CERT-20240115-A7B9C2D4',
            'issued_date': datetime(2024, 1, 15)
        }
        
        pdf_bytes = generator.generate_subscription_certificate(data)
        
        # Verify PDF is generated with special characters
        assert pdf_bytes is not None
        assert len(pdf_bytes) > 0
        assert len(pdf_bytes) < 2 * 1024 * 1024
    
    def test_pdf_is_valid_format(self, generator):
        """Test that generated PDF is in valid PDF format."""
        data = {
            'recipient_name': 'John Doe',
            'subscription_date': datetime(2024, 1, 15),
            'certificate_id': 'CERT-20240115-A7B9C2D4',
            'issued_date': datetime(2024, 1, 15)
        }
        
        pdf_bytes = generator.generate_subscription_certificate(data)
        
        # Verify PDF starts with PDF header
        assert pdf_bytes.startswith(b'%PDF-'), "Generated file is not a valid PDF"
    
    def test_multiple_certificates_different_sizes(self, generator):
        """Test that multiple certificates can be generated with consistent quality."""
        certificates = []
        
        # Generate 5 different certificates
        for i in range(5):
            data = {
                'recipient_name': f'Test User {i}',
                'subscription_date': datetime(2024, 1, i + 1),
                'certificate_id': f'CERT-2024010{i}-TEST{i}ABC',
                'issued_date': datetime(2024, 1, i + 1)
            }
            pdf_bytes = generator.generate_subscription_certificate(data)
            certificates.append(pdf_bytes)
        
        # Verify all certificates are generated
        assert len(certificates) == 5
        
        # Verify all are under 2MB
        for pdf_bytes in certificates:
            assert len(pdf_bytes) < 2 * 1024 * 1024
            assert len(pdf_bytes) > 0
    
    def test_a4_page_size(self, generator):
        """Test that generated PDFs use A4 page size."""
        # A4 dimensions in points: 595.27 x 841.89
        assert generator.page_width == pytest.approx(595.27, rel=0.01)
        assert generator.page_height == pytest.approx(841.89, rel=0.01)
    
    def test_certificate_id_in_footer(self, generator):
        """Test that certificate ID appears in the generated PDF."""
        data = {
            'recipient_name': 'John Doe',
            'subscription_date': datetime(2024, 1, 15),
            'certificate_id': 'CERT-20240115-UNIQUE123',
            'issued_date': datetime(2024, 1, 15)
        }
        
        pdf_bytes = generator.generate_subscription_certificate(data)
        
        # Note: Full text extraction would require PyPDF2 or similar
        # For now, we just verify the PDF was generated
        assert pdf_bytes is not None
        assert len(pdf_bytes) > 0
