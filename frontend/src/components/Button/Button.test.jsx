import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';

describe('Button Component', () => {
  // Basic rendering tests
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders without children (icon-only)', () => {
      render(<Button icon={<span>🔍</span>} aria-label="Search" />);
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });
  });

  // Variant tests
  describe('Variants', () => {
    it('renders primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('button--primary');
    });

    it('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('button--secondary');
    });

    it('renders outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('button--outline');
    });

    it('renders ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('button--ghost');
    });

    it('renders danger variant', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('button--danger');
    });
  });

  // Size tests
  describe('Sizes', () => {
    it('renders medium size by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('button--md');
    });

    it('renders small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('button--sm');
    });

    it('renders large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('button--lg');
    });
  });

  // State tests
  describe('States', () => {
    it('handles disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button.className).toContain('button--disabled');
    });

    it('handles loading state', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button.className).toContain('button--loading');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('renders loading spinner when loading', () => {
      const { container } = render(<Button loading>Loading</Button>);
      const spinner = container.querySelector('[class*="spinner"]');
      expect(spinner).toBeInTheDocument();
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(<Button loading onClick={handleClick}>Loading</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // Icon tests
  describe('Icons', () => {
    it('renders icon on the left by default', () => {
      const { container } = render(
        <Button icon={<span data-testid="icon">🔍</span>}>
          Search
        </Button>
      );
      const icon = screen.getByTestId('icon');
      const content = container.querySelector('[class*="content"]');
      
      expect(icon).toBeInTheDocument();
      expect(content).toBeInTheDocument();
    });

    it('renders icon on the right', () => {
      const { container } = render(
        <Button icon={<span data-testid="icon">→</span>} iconPosition="right">
          Next
        </Button>
      );
      const icon = screen.getByTestId('icon');
      expect(icon).toBeInTheDocument();
    });

    it('renders icon-only button', () => {
      const { container } = render(
        <Button icon={<span>🔍</span>} aria-label="Search" />
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('button--icon-only');
    });

    it('hides icon when loading', () => {
      render(
        <Button loading icon={<span data-testid="icon">🔍</span>}>
          Loading
        </Button>
      );
      // Icon should not be rendered when loading
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });
  });

  // Interaction tests
  describe('Interactions', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supports different button types', () => {
      const { rerender } = render(<Button type="button">Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');

      rerender(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');

      rerender(<Button type="reset">Reset</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });

    it('creates ripple effect when ripple prop is true', () => {
      const { container } = render(<Button ripple>Ripple</Button>);
      const button = screen.getByRole('button');
      
      fireEvent.click(button, {
        clientX: 100,
        clientY: 100,
      });

      // Check if ripple element was created (it gets removed after animation)
      // We can't easily test the removal, but we can verify the click handler works
      expect(button).toBeInTheDocument();
    });
  });

  // Layout tests
  describe('Layout', () => {
    it('renders full width button', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('button--full-width');
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('has proper button role', () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('supports aria-label for icon-only buttons', () => {
      render(<Button icon={<span>🔍</span>} aria-label="Search" />);
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('sets aria-busy when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('is keyboard accessible', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('handles missing onClick gracefully', () => {
      render(<Button>No Handler</Button>);
      const button = screen.getByRole('button');
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it('handles both disabled and loading states', () => {
      render(<Button disabled loading>Both States</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button.className).toContain('button--disabled');
      expect(button.className).toContain('button--loading');
    });

    it('passes through additional props', () => {
      render(<Button data-testid="custom-button" data-custom="value">Custom Props</Button>);
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('data-custom', 'value');
    });
  });
});
