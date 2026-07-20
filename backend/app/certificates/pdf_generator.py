"""
PDF certificate generator for subscription and event certificates.

This module provides functionality to generate professional PDF certificates
with SPSU branding, proper layout, and formatting using ReportLab library.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph, Frame
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.utils import ImageReader
from datetime import datetime
from typing import Dict, Any
import io
import os
from pathlib import Path


class PDFGenerator:
    """
    Generates PDF certificates with professional templates and SPSU branding.
    
    Features:
    - A4 page size (210mm x 297mm)
    - Professional fonts and layout
    - SPSU branding and logo
    - File size optimization (under 2MB)
    """
    
    def __init__(self):
        """Initialize the PDF generator with default settings."""
        self.page_width, self.page_height = A4
        self.margin = 1 * inch
        
    def generate_subscription_certificate(self, data: Dict[str, Any]) -> bytes:
        """
        Generate a subscription certificate PDF.
        
        Args:
            data: Dictionary containing:
                - recipient_name: str - Name of the subscriber
                - subscription_date: datetime - Date of subscription
                - certificate_id: str - Unique certificate identifier
                - issued_date: datetime - Date certificate was issued
        
        Returns:
            bytes: PDF file content as bytes
        """
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        
        # Draw certificate border
        self._draw_border(c)
        
        # Draw SPSU logo and branding
        role = data.get('role', 'subscriber')
        if role == 'reviewer':
            title = "REVIEWER JOINING CERTIFICATE"
        else:
            title = "SUBSCRIPTION CERTIFICATE"
        self._draw_header(c, title)
        
        # Draw certificate content
        y_position = self.page_height - 3.5 * inch
        
        # Certificate body text
        c.setFont("Helvetica", 14)
        c.drawCentredString(self.page_width / 2, y_position, "This is to certify that")
        
        y_position -= 0.8 * inch
        c.setFont("Helvetica-Bold", 24)
        c.drawCentredString(self.page_width / 2, y_position, data['recipient_name'])
        
        y_position -= 0.8 * inch
        c.setFont("Helvetica", 14)
        if role == 'reviewer':
            c.drawCentredString(self.page_width / 2, y_position, "has joined as a Reviewer for")
        else:
            c.drawCentredString(self.page_width / 2, y_position, "has successfully subscribed to")
        
        y_position -= 0.6 * inch
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(self.page_width / 2, y_position, "The Essence - SPSU Journal")
        
        if role == 'reviewer':
            y_position -= 0.6 * inch
            c.setFont("Helvetica-Bold", 14)
            c.drawCentredString(self.page_width / 2, y_position, "--- as Reviewer ---")
        
        y_position -= 0.8 * inch
        c.setFont("Helvetica", 12)
        subscription_date_str = data['subscription_date'].strftime("%B %d, %Y")
        date_label = "Joining Date" if role == 'reviewer' else "Subscription Date"
        c.drawCentredString(self.page_width / 2, y_position, f"{date_label}: {subscription_date_str}")
        
        # Draw footer with certificate ID and issue date
        self._draw_footer(c, data['certificate_id'], data['issued_date'])
        
        # Finalize PDF
        c.showPage()
        c.save()
        
        buffer.seek(0)
        return buffer.getvalue()
    
    def generate_event_certificate(self, data: Dict[str, Any]) -> bytes:
        """
        Generate an event certificate PDF.
        
        Args:
            data: Dictionary containing:
                - recipient_name: str - Name of the participant
                - event_name: str - Name of the event
                - event_date: datetime - Date of the event
                - role: str - Role in event ('author' or 'reviewer')
                - certificate_id: str - Unique certificate identifier
                - issued_date: datetime - Date certificate was issued
        
        Returns:
            bytes: PDF file content as bytes
        """
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        
        # Draw certificate border
        self._draw_border(c)
        
        # Draw SPSU logo and branding
        self._draw_header(c, "CERTIFICATE OF PARTICIPATION")
        
        # Draw certificate content
        y_position = self.page_height - 3.5 * inch
        
        # Certificate body text
        c.setFont("Helvetica", 14)
        c.drawCentredString(self.page_width / 2, y_position, "This is to certify that")
        
        y_position -= 0.8 * inch
        c.setFont("Helvetica-Bold", 24)
        c.drawCentredString(self.page_width / 2, y_position, data['recipient_name'])
        
        y_position -= 0.8 * inch
        c.setFont("Helvetica", 14)
        role_text = "an Author" if data['role'] == 'author' else "a Reviewer"
        c.drawCentredString(self.page_width / 2, y_position, f"has participated as {role_text} in")
        
        y_position -= 0.6 * inch
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(self.page_width / 2, y_position, data['event_name'])
        
        y_position -= 0.6 * inch
        c.setFont("Helvetica", 12)
        c.drawCentredString(self.page_width / 2, y_position, "organized by")
        
        y_position -= 0.5 * inch
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(self.page_width / 2, y_position, "The Essence - SPSU Journal")
        
        y_position -= 0.7 * inch
        c.setFont("Helvetica", 12)
        event_date_str = data['event_date'].strftime("%B %d, %Y")
        c.drawCentredString(self.page_width / 2, y_position, f"Event Date: {event_date_str}")
        
        # Draw footer with certificate ID and issue date
        self._draw_footer(c, data['certificate_id'], data['issued_date'])
        
        # Finalize PDF
        c.showPage()
        c.save()
        
        buffer.seek(0)
        return buffer.getvalue()
    
    def _draw_border(self, c: canvas.Canvas):
        """
        Draw decorative border around the certificate.
        
        Args:
            c: ReportLab canvas object
        """
        # Outer border (thick)
        c.setStrokeColor(colors.HexColor("#1a5490"))  # SPSU blue
        c.setLineWidth(3)
        c.rect(
            self.margin - 0.2 * inch,
            self.margin - 0.2 * inch,
            self.page_width - 2 * self.margin + 0.4 * inch,
            self.page_height - 2 * self.margin + 0.4 * inch
        )
        
        # Inner border (thin)
        c.setLineWidth(1)
        c.rect(
            self.margin,
            self.margin,
            self.page_width - 2 * self.margin,
            self.page_height - 2 * self.margin
        )
    
    def _draw_header(self, c: canvas.Canvas, title: str):
        """
        Draw certificate header with SPSU branding and logo.
        
        Args:
            c: ReportLab canvas object
            title: Certificate title text
        """
        logo_x = self.page_width / 2
        logo_y = self.page_height - 1.5 * inch
        logo_size = 0.8 * inch  # Size for the logo (width and height)
        
        # Try to load actual SPSU logo
        logo_path = Path(__file__).parent.parent.parent / "assets" / "spsu_logo.png"
        
        if logo_path.exists():
            # Draw actual SPSU logo
            try:
                img = ImageReader(str(logo_path))
                # Center the logo
                c.drawImage(
                    img,
                    logo_x - logo_size / 2,  # Center horizontally
                    logo_y - logo_size / 2,  # Center vertically
                    width=logo_size,
                    height=logo_size,
                    preserveAspectRatio=True,
                    mask='auto'
                )
            except Exception:
                # If image loading fails, fall back to placeholder
                self._draw_placeholder_logo(c, logo_x, logo_y)
        else:
            # Draw placeholder logo
            self._draw_placeholder_logo(c, logo_x, logo_y)
        
        # Draw institution name
        c.setFillColor(colors.HexColor("#1a5490"))
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(self.page_width / 2, self.page_height - 2.2 * inch, 
                           "Sir Padampat Singhania University")
        
        # Draw certificate title
        c.setFillColor(colors.HexColor("#d4af37"))  # Gold color
        c.setFont("Helvetica-Bold", 20)
        c.drawCentredString(self.page_width / 2, self.page_height - 2.7 * inch, title)
        
        # Draw decorative line
        c.setStrokeColor(colors.HexColor("#d4af37"))
        c.setLineWidth(2)
        line_start = self.page_width / 2 - 2 * inch
        line_end = self.page_width / 2 + 2 * inch
        c.line(line_start, self.page_height - 2.9 * inch, 
               line_end, self.page_height - 2.9 * inch)
    
    def _draw_placeholder_logo(self, c: canvas.Canvas, logo_x: float, logo_y: float):
        """
        Draw placeholder logo when actual logo is not available.
        
        Args:
            c: ReportLab canvas object
            logo_x: X coordinate for logo center
            logo_y: Y coordinate for logo center
        """
        logo_radius = 0.4 * inch
        
        c.setFillColor(colors.HexColor("#1a5490"))  # SPSU blue
        c.circle(logo_x, logo_y, logo_radius, fill=1)
        
        # Draw "SPSU" text in logo
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(logo_x, logo_y - 6, "SPSU")
    
    def _draw_footer(self, c: canvas.Canvas, certificate_id: str, issued_date: datetime):
        """
        Draw certificate footer with ID and issue date.
        
        Args:
            c: ReportLab canvas object
            certificate_id: Unique certificate identifier
            issued_date: Date certificate was issued
        """
        footer_y = self.margin + 0.8 * inch
        
        # Draw certificate ID
        c.setFillColor(colors.black)
        c.setFont("Helvetica", 10)
        c.drawString(self.margin + 0.3 * inch, footer_y, f"Certificate ID: {certificate_id}")
        
        # Draw issue date
        issued_date_str = issued_date.strftime("%B %d, %Y")
        c.drawRightString(self.page_width - self.margin - 0.3 * inch, footer_y, 
                         f"Issued: {issued_date_str}")
        
        # Draw verification URL
        c.setFont("Helvetica", 9)
        c.setFillColor(colors.HexColor("#666666"))
        c.drawCentredString(self.page_width / 2, footer_y - 0.3 * inch,
                           "Verify this certificate at: https://spsu-journal.edu/verify")
