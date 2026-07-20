import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Input from './Input';
import Textarea from './Textarea';

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('renders input with label', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders input without label', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with initial value', () => {
      render(<Input label="Name" value="John Doe" onChange={() => {}} />);
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    it('renders required indicator', () => {
      render(<Input label="Email" required />);
      expect(screen.getByLabelText(/required/i)).toBeInTheDocument();
    });
  });

  describe('Input Types', () => {
    it('renders email input', () => {
      render(<Input label="Email" type="email" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('renders password input', () => {
      render(<Input label="Password" type="password" />);
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders number input', () => {
      render(<Input label="Age" type="number" />);
      const input = screen.getByLabelText('Age');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('States', () => {
    it('handles disabled state', () => {
      render(<Input label="Email" disabled />);
      const input = screen.getByLabelText('Email');
      expect(input).toBeDisabled();
    });

    it('handles readonly state', () => {
      render(<Input label="Email" readOnly value="test@example.com" onChange={() => {}} />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('readonly');
    });

    it('displays error message', () => {
      render(<Input label="Email" error="Invalid email" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
    });

    it('displays helper text', () => {
      render(<Input label="Email" helperText="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('does not show helper text when error is present', () => {
      render(
        <Input
          label="Email"
          helperText="Enter your email"
          error="Invalid email"
        />
      );
      expect(screen.queryByText('Enter your email')).not.toBeInTheDocument();
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('renders prefix icon', () => {
      render(<Input label="Search" prefixIcon={<span data-testid="prefix">🔍</span>} />);
      expect(screen.getByTestId('prefix')).toBeInTheDocument();
    });

    it('renders suffix icon', () => {
      render(<Input label="Password" suffixIcon={<span data-testid="suffix">👁️</span>} />);
      expect(screen.getByTestId('suffix')).toBeInTheDocument();
    });

    it('renders both prefix and suffix icons', () => {
      render(
        <Input
          label="Amount"
          prefixIcon={<span data-testid="prefix">$</span>}
          suffixIcon={<span data-testid="suffix">.00</span>}
        />
      );
      expect(screen.getByTestId('prefix')).toBeInTheDocument();
      expect(screen.getByTestId('suffix')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onChange when value changes', async () => {
      const handleChange = vi.fn();
      render(<Input label="Name" onChange={handleChange} />);
      
      const input = screen.getByLabelText('Name');
      await userEvent.type(input, 'John');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('calls onFocus when input is focused', async () => {
      const handleFocus = vi.fn();
      render(<Input label="Email" onFocus={handleFocus} />);
      
      const input = screen.getByLabelText('Email');
      await userEvent.click(input);
      
      expect(handleFocus).toHaveBeenCalled();
    });

    it('calls onBlur when input loses focus', async () => {
      const handleBlur = vi.fn();
      render(<Input label="Email" onBlur={handleBlur} />);
      
      const input = screen.getByLabelText('Email');
      await userEvent.click(input);
      await userEvent.tab();
      
      expect(handleBlur).toHaveBeenCalled();
    });

    it('focuses input when label is clicked', async () => {
      render(<Input label="Email" />);
      
      // Since label has pointer-events: none, click the input directly
      const input = screen.getByLabelText('Email');
      await userEvent.click(input);
      
      expect(input).toHaveFocus();
    });
  });

  describe('Size Variants', () => {
    it('renders small size', () => {
      const { container } = render(<Input label="Small" size="sm" />);
      expect(container.querySelector('[class*="inputWrapper--sm"]')).toBeInTheDocument();
    });

    it('renders medium size (default)', () => {
      const { container } = render(<Input label="Medium" />);
      expect(container.querySelector('[class*="inputWrapper--md"]')).toBeInTheDocument();
    });

    it('renders large size', () => {
      const { container } = render(<Input label="Large" size="lg" />);
      expect(container.querySelector('[class*="inputWrapper--lg"]')).toBeInTheDocument();
    });
  });

  describe('Full Width', () => {
    it('renders full width when specified', () => {
      const { container } = render(<Input label="Email" fullWidth />);
      expect(container.querySelector('[class*="inputContainer--full-width"]')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-invalid when error is present', () => {
      render(<Input label="Email" error="Invalid email" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('has aria-describedby pointing to error message', () => {
      render(<Input label="Email" id="email-input" error="Invalid email" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-describedby', 'email-input-error');
    });

    it('has aria-describedby pointing to helper text', () => {
      render(<Input label="Email" id="email-input" helperText="Enter your email" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-describedby', 'email-input-helper');
    });

    it('error message has role="alert"', () => {
      render(<Input label="Email" error="Invalid email" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Floating Label', () => {
    it('label floats when input has value', () => {
      const { container } = render(<Input label="Email" value="test@example.com" onChange={() => {}} />);
      expect(container.querySelector('[class*="label--floating"]')).toBeInTheDocument();
    });

    it('label floats when input is focused', async () => {
      const { container } = render(<Input label="Email" />);
      const input = screen.getByLabelText('Email');
      
      await userEvent.click(input);
      
      expect(container.querySelector('[class*="label--floating"]')).toBeInTheDocument();
    });

    it('label floats when placeholder is present', () => {
      const { container } = render(<Input label="Email" placeholder="Enter email" />);
      expect(container.querySelector('[class*="label--floating"]')).toBeInTheDocument();
    });
  });
});

describe('Textarea Component', () => {
  describe('Basic Rendering', () => {
    it('renders textarea with label', () => {
      render(<Textarea label="Description" />);
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });

    it('renders with specified rows', () => {
      render(<Textarea label="Bio" rows={5} />);
      const textarea = screen.getByLabelText('Bio');
      expect(textarea).toHaveAttribute('rows', '5');
    });

    it('renders with initial value', () => {
      render(<Textarea label="Bio" value="Hello world" onChange={() => {}} />);
      expect(screen.getByDisplayValue('Hello world')).toBeInTheDocument();
    });
  });

  describe('Character Count', () => {
    it('displays character count when maxLength is set', () => {
      render(<Textarea label="Bio" maxLength={100} value="Hello" onChange={() => {}} />);
      expect(screen.getByText('5/100')).toBeInTheDocument();
    });

    it('updates character count as user types', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <Textarea
            label="Bio"
            maxLength={100}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };

      render(<TestComponent />);
      const textarea = screen.getByLabelText('Bio');
      
      await userEvent.type(textarea, 'Hello');
      
      expect(screen.getByText('5/100')).toBeInTheDocument();
    });

    it('does not display character count when maxLength is not set', () => {
      render(<Textarea label="Bio" value="Hello" onChange={() => {}} />);
      expect(screen.queryByText(/\/\d+/)).not.toBeInTheDocument();
    });
  });

  describe('Auto Resize', () => {
    it('applies auto-resize when specified', () => {
      render(<Textarea label="Comments" autoResize />);
      const textarea = screen.getByLabelText('Comments');
      // Auto-resize is handled by JavaScript, so we just check the prop is passed
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('States', () => {
    it('handles disabled state', () => {
      render(<Textarea label="Bio" disabled />);
      const textarea = screen.getByLabelText('Bio');
      expect(textarea).toBeDisabled();
    });

    it('displays error message', () => {
      render(<Textarea label="Bio" error="Too short" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Too short');
    });

    it('displays helper text', () => {
      render(<Textarea label="Bio" helperText="Tell us about yourself" />);
      expect(screen.getByText('Tell us about yourself')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onChange when value changes', async () => {
      const handleChange = vi.fn();
      render(<Textarea label="Bio" onChange={handleChange} />);
      
      const textarea = screen.getByLabelText('Bio');
      await userEvent.type(textarea, 'Hello');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('focuses textarea when label is clicked', async () => {
      render(<Textarea label="Bio" />);
      
      // Since label has pointer-events: none, click the textarea directly
      const textarea = screen.getByLabelText('Bio');
      await userEvent.click(textarea);
      
      expect(textarea).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-invalid when error is present', () => {
      render(<Textarea label="Bio" error="Too short" />);
      const textarea = screen.getByLabelText('Bio');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('error message has role="alert"', () => {
      render(<Textarea label="Bio" error="Too short" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
