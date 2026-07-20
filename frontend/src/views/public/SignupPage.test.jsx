import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SignupPage from './SignupPage';
import authorService from '../../services/authorService';

// Mock the services
vi.mock('../../services/authorService');

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSignupPage = () => {
    return render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    );
  };

  // Helper to fill step 1 fields and advance to step 2
  const fillStep1AndContinue = () => {
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByLabelText(/Affiliation/i), { target: { value: 'Test University' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
  };

  it('renders signup form step 1 with profile fields', () => {
    renderSignupPage();

    expect(screen.getByText('Create Your Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Affiliation/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ORCID iD/i)).toBeInTheDocument();
  });

  it('renders step 2 with password fields after completing step 1', () => {
    renderSignupPage();
    fillStep1AndContinue();

    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
  });

  it('displays validation error when passwords do not match', async () => {
    renderSignupPage();
    fillStep1AndContinue();

    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password456' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('displays validation error when password is too short', async () => {
    renderSignupPage();
    fillStep1AndContinue();

    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'pass' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'pass' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });
  });

  it('submits form successfully with valid data', async () => {
    authorService.signup.mockResolvedValue({ success: true });

    renderSignupPage();
    fillStep1AndContinue();

    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(authorService.signup).toHaveBeenCalledWith({
        email: 'john@test.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
        affiliation: 'Test University',
        orcid: ''
      });
      expect(mockNavigate).toHaveBeenCalledWith('/login?signup=success&certificate=generated');
    });
  });

  it('displays error message on signup failure', async () => {
    authorService.signup.mockRejectedValue({ detail: 'Email already exists' });

    renderSignupPage();
    fillStep1AndContinue();

    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    renderSignupPage();
    fillStep1AndContinue();

    const passwordInput = screen.getByLabelText(/^Password/i);
    
    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Find the password toggle button by its text content
    const toggleButton = screen.getAllByText('👁️‍🗨️')[0].closest('button');
    
    // Click toggle button
    fireEvent.click(toggleButton);

    // Password should now be visible
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('shows loading state during submission', async () => {
    authorService.signup.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderSignupPage();
    fillStep1AndContinue();

    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    // Should show loading text
    expect(screen.getByText('Creating Account...')).toBeInTheDocument();
  });

  it('renders branding section with quote', () => {
    renderSignupPage();

    expect(screen.getByText(/The important thing is not to stop questioning/i)).toBeInTheDocument();
    expect(screen.getByText(/Albert Einstein/i)).toBeInTheDocument();
    expect(screen.getByText('JOIN THE RESEARCH COMMUNITY')).toBeInTheDocument();
  });

  it('has link to login page', () => {
    renderSignupPage();

    const loginLink = screen.getByRole('link', { name: /Sign In/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
