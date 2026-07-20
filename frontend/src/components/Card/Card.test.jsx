import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Card from './Card';

describe('Card Component', () => {
  // Basic rendering tests
  describe('Rendering', () => {
    it('renders children content', () => {
      render(<Card>Test Content</Card>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders with header when provided', () => {
      render(
        <Card header={<h3>Card Header</h3>}>
          Content
        </Card>
      );
      expect(screen.getByText('Card Header')).toBeInTheDocument();
    });

    it('renders with footer when provided', () => {
      render(
        <Card footer={<p>Card Footer</p>}>
          Content
        </Card>
      );
      expect(screen.getByText('Card Footer')).toBeInTheDocument();
    });

    it('renders with both header and footer', () => {
      render(
        <Card 
          header={<h3>Header</h3>}
          footer={<p>Footer</p>}
        >
          Body Content
        </Card>
      );
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Body Content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });

  // Variant tests
  describe('Variants', () => {
    it('applies default variant by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card.className).toContain('card--default');
    });

    it('applies elevated variant', () => {
      const { container } = render(<Card variant="elevated">Content</Card>);
      const card = container.firstChild;
      expect(card.className).toContain('card--elevated');
    });

    it('applies outlined variant', () => {
      const { container } = render(<Card variant="outlined">Content</Card>);
      const card = container.firstChild;
      expect(card.className).toContain('card--outlined');
    });
  });

  // Hoverable tests
  describe('Hoverable', () => {
    it('applies hoverable class when hoverable prop is true', () => {
      const { container } = render(<Card hoverable>Content</Card>);
      const card = container.firstChild;
      expect(card.className).toContain('card--hoverable');
    });

    it('does not apply hoverable class by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card.className).not.toContain('card--hoverable');
    });
  });

  // Interactive/Clickable tests
  describe('Interactive', () => {
    it('calls onClick when card is clicked', () => {
      const handleClick = vi.fn();
      const { container } = render(<Card onClick={handleClick}>Content</Card>);
      
      const card = container.firstChild;
      fireEvent.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies clickable class when onClick is provided', () => {
      const handleClick = vi.fn();
      const { container } = render(<Card onClick={handleClick}>Content</Card>);
      const card = container.firstChild;
      expect(card.className).toContain('card--clickable');
    });

    it('has button role when onClick is provided', () => {
      const handleClick = vi.fn();
      const { container } = render(<Card onClick={handleClick}>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveAttribute('role', 'button');
    });

    it('is keyboard accessible with Enter key', () => {
      const handleClick = vi.fn();
      const { container } = render(<Card onClick={handleClick}>Content</Card>);
      const card = container.firstChild;
      
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is keyboard accessible with Space key', () => {
      const handleClick = vi.fn();
      const { container } = render(<Card onClick={handleClick}>Content</Card>);
      const card = container.firstChild;
      
      fireEvent.keyDown(card, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not trigger onClick for other keys', () => {
      const handleClick = vi.fn();
      const { container } = render(<Card onClick={handleClick}>Content</Card>);
      const card = container.firstChild;
      
      fireEvent.keyDown(card, { key: 'a' });
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // Custom className tests
  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });

    it('preserves base classes when custom className is provided', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild;
      expect(card.className).toContain('card');
      expect(card).toHaveClass('custom-class');
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('renders with empty header', () => {
      render(<Card header={null}>Content</Card>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders with empty footer', () => {
      render(<Card footer={null}>Content</Card>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('handles multiple children', () => {
      render(
        <Card>
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </Card>
      );
      expect(screen.getByText('First paragraph')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph')).toBeInTheDocument();
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('has tabIndex when clickable', () => {
      const handleClick = vi.fn();
      const { container } = render(<Card onClick={handleClick}>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('does not have tabIndex when not clickable', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).not.toHaveAttribute('tabIndex');
    });

    it('does not have button role when not clickable', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).not.toHaveAttribute('role');
    });
  });
});
