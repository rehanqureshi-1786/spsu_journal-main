import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import authService from '../../services/authService';

// Mock the authService
vi.mock('../../services/authService', () => ({
  default: {
    login: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
  };

  it('renders login form with modern components', () => {
    renderLoginPage();

    // Check for title and subtitle
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText(/Sign in to access your journal dashboard/)).toBeInTheDocument();

    // Check for form inputs using accessible queries
    expect(screen.getByRole('textbox', { name: /Email Address/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();

    // Check for buttons
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login with University ID/i })).toBeInTheDocument();

    // Check for links
    expect(screen.getByText(/Forgot Password/i)).toBeInTheDocument();
    expect(screen.getByText(/Request Access/i)).toBeInTheDocument();
  });

  it('handles form input changes', () => {
    renderLoginPage();

    const emailInput = screen.getByRole('textbox', { name: /Email Address/i });
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(emailInput, { target: { value: 'test@spsu.edu' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@spsu.edu');
    expect(passwordInput.value).toBe('password123');
  });

  it('toggles password visibility', () => {
    renderLoginPage();

    const passwordInput = screen.getByPlaceholderText('••••••••');
    // The toggle button is inside the Input component's suffixIcon
    const toggleButton = screen.getByLabelText(/Show password/i);

    // Initially password should be hidden
    expect(passwordInput.type).toBe('password');

    // Click to show password
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    // Click to hide password again
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('handles remember me checkbox', () => {
    renderLoginPage();

    const rememberMeCheckbox = screen.getByRole('checkbox', { name: /Remember me/i });

    expect(rememberMeCheckbox.checked).toBe(false);

    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox.checked).toBe(true);
  });

  it('submits form with valid credentials', async () => {
    const mockUser = {
      user: {
        id: 1,
        email: 'test@spsu.edu',
        role: { name: 'author' },
      },
    };

    authService.login.mockResolvedValue(mockUser);

    renderLoginPage();

    const emailInput = screen.getByRole('textbox', { name: /Email Address/i });
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'test@spsu.edu' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('test@spsu.edu', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/author/dashboard');
    });
  });

  it('displays error message on login failure', async () => {
    authService.login.mockRejectedValue({ detail: 'Invalid credentials' });

    renderLoginPage();

    const emailInput = screen.getByRole('textbox', { name: /Email Address/i });
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'test@spsu.edu' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    authService.login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderLoginPage();

    const emailInput = screen.getByRole('textbox', { name: /Email Address/i });
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'test@spsu.edu' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Button should show loading state
    expect(submitButton).toHaveAttribute('aria-busy', 'true');
  });

  it('displays session timeout message from URL params', () => {
    // Mock window.location.search
    delete window.location;
    window.location = { search: '?reason=timeout' };

    renderLoginPage();

    expect(screen.getByText(/Your session expired due to inactivity/i)).toBeInTheDocument();
  });

  it('displays signup success message from URL params', () => {
    delete window.location;
    window.location = { search: '?signup=success' };

    renderLoginPage();

    expect(screen.getByText(/Account created successfully/i)).toBeInTheDocument();
  });

  it('navigates to correct dashboard based on user role', async () => {
    const roles = [
      { name: 'admin', path: '/admin/dashboard' },
      { name: 'reviewer', path: '/reviewer/dashboard' },
      { name: 'author', path: '/author/dashboard' },
    ];

    for (const role of roles) {
      vi.clearAllMocks();
      
      authService.login.mockResolvedValue({
        user: {
          id: 1,
          email: 'test@spsu.edu',
          role: { name: role.name },
        },
      });

      const { unmount } = render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      const emailInput = screen.getByRole('textbox', { name: /Email Address/i });
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      fireEvent.change(emailInput, { target: { value: 'test@spsu.edu' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(role.path);
      });

      unmount();
    }
  });

  it('uses modern Input component with proper props', () => {
    renderLoginPage();

    const emailInput = screen.getByRole('textbox', { name: /Email Address/i });
    const passwordInput = screen.getByPlaceholderText('••••••••');

    // Check that inputs have required attribute
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();

    // Check autocomplete attributes
    expect(emailInput).toHaveAttribute('autocomplete', 'email');
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
  });

  it('uses modern Button component with proper variants', () => {
    renderLoginPage();

    const signInButton = screen.getByRole('button', { name: /Sign In/i });
    const ssoButton = screen.getByRole('button', { name: /Login with University ID/i });

    // Both buttons should be present
    expect(signInButton).toBeInTheDocument();
    expect(ssoButton).toBeInTheDocument();
  });
});
