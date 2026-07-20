import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ContactUs from './ContactUs';

describe('ContactUs Component', () => {
  it('renders the hero section with title and lead text', () => {
    render(<ContactUs />);
    
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
    expect(screen.getByText(/We're here to help/i)).toBeInTheDocument();
  });

  it('renders all contact information boxes', () => {
    render(<ContactUs />);
    
    // Check for contact box headings (using more specific text)
    expect(screen.getByText(/🏢 Editorial Office/i)).toBeInTheDocument();
    expect(screen.getByText(/📧 Email/i)).toBeInTheDocument();
    expect(screen.getByText(/📞 Phone/i)).toBeInTheDocument();
  });

  it('renders email addresses as links', () => {
    render(<ContactUs />);
    
    const emailLinks = screen.getAllByRole('link', { name: /spsu\.ac\.in/i });
    expect(emailLinks.length).toBeGreaterThan(0);
    
    // Check specific email links using getAllByRole
    const journalLinks = screen.getAllByRole('link', { name: 'journal@spsu.ac.in' });
    expect(journalLinks[0]).toHaveAttribute('href', 'mailto:journal@spsu.ac.in');
    
    const submissionsLinks = screen.getAllByRole('link', { name: 'submissions@spsu.ac.in' });
    expect(submissionsLinks[0]).toHaveAttribute('href', 'mailto:submissions@spsu.ac.in');
  });

  it('renders all audience sections (Authors, Reviewers, Readers)', () => {
    render(<ContactUs />);
    
    expect(screen.getByText('For Authors')).toBeInTheDocument();
    expect(screen.getByText('For Reviewers')).toBeInTheDocument();
    expect(screen.getByText('For Readers')).toBeInTheDocument();
  });

  it('renders feature items with checkmarks', () => {
    render(<ContactUs />);
    
    // Check for some feature items
    expect(screen.getByText(/Manuscript submission process/i)).toBeInTheDocument();
    expect(screen.getByText(/Reviewer registration/i)).toBeInTheDocument();
    expect(screen.getByText(/Accessing published articles/i)).toBeInTheDocument();
  });

  it('renders the response time info box', () => {
    render(<ContactUs />);
    
    expect(screen.getByText(/Response Time:/i)).toBeInTheDocument();
    expect(screen.getByText(/2-3 business days/i)).toBeInTheDocument();
  });

  it('renders the CTA section with external link', () => {
    render(<ContactUs />);
    
    expect(screen.getByText('Visit Our Campus')).toBeInTheDocument();
    
    const ctaLink = screen.getByRole('link', { name: /Visit SPSU Website/i });
    expect(ctaLink).toHaveAttribute('href', 'https://www.spsu.ac.in');
    expect(ctaLink).toHaveAttribute('target', '_blank');
    expect(ctaLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders phone numbers', () => {
    render(<ContactUs />);
    
    expect(screen.getByText('+91-294-2471700')).toBeInTheDocument();
    expect(screen.getByText('+91-294-2471701')).toBeInTheDocument();
  });

  it('renders office hours information', () => {
    render(<ContactUs />);
    
    expect(screen.getByText(/Office Hours:/i)).toBeInTheDocument();
    expect(screen.getByText(/Monday - Friday/i)).toBeInTheDocument();
    expect(screen.getByText(/9:00 AM - 5:00 PM \(IST\)/i)).toBeInTheDocument();
  });

  it('renders university address', () => {
    render(<ContactUs />);
    
    expect(screen.getByText(/Sir Padampat Singhania University/i)).toBeInTheDocument();
    expect(screen.getByText(/Bhatewar, Udaipur - 313601/i)).toBeInTheDocument();
    expect(screen.getByText(/Rajasthan, India/i)).toBeInTheDocument();
  });
});
