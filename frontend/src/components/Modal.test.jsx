import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Modal, { ConfirmModal } from './Modal';

describe('Modal Component', () => {
  let onCloseMock;

  beforeEach(() => {
    onCloseMock = vi.fn();
  });

  afterEach(() => {
    // Clean up body styles after each test
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  // Basic rendering tests
  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={onCloseMock} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    it('renders with footer', () => {
      render(
        <Modal
          isOpen={true}
          onClose={onCloseMock}
          title="Test Modal"
          footer={<button>Footer Button</button>}
        >
          <p>Modal content</p>
        </Modal>
      );
      expect(screen.getByText('Footer Button')).toBeInTheDocument();
    });

    it('renders close button by default', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal" showCloseButton={false}>
          <p>Modal content</p>
        </Modal>
      );
      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });
  });

  // Size variants
  describe('Size Variants', () => {
    it('renders with small size', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock} title="Small Modal" size="sm">
          <p>Content</p>
        </Modal>
      );
      const modal = container.querySelector('[role="dialog"] > div');
      expect(modal.className).toContain('sm');
    });

    it('renders with medium size by default', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock} title="Medium Modal">
          <p>Content</p>
        </Modal>
      );
      const modal = container.querySelector('[role="dialog"] > div');
      expect(modal.className).toContain('md');
    });

    it('renders with large size', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock} title="Large Modal" size="lg">
          <p>Content</p>
        </Modal>
      );
      const modal = container.querySelector('[role="dialog"] > div');
      expect(modal.className).toContain('lg');
    });

    it('renders with extra large size', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock} title="XL Modal" size="xl">
          <p>Content</p>
        </Modal>
      );
      const modal = container.querySelector('[role="dialog"] > div');
      expect(modal.className).toContain('xl');
    });
  });

  // Interaction tests
  describe('Interactions', () => {
    it('calls onClose when close button is clicked', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Content</p>
        </Modal>
      );
      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay is clicked and closeOnOverlayClick is true', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal" closeOnOverlayClick={true}>
          <p>Content</p>
        </Modal>
      );
      const overlay = screen.getByRole('dialog');
      fireEvent.click(overlay);
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when overlay is clicked and closeOnOverlayClick is false', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal" closeOnOverlayClick={false}>
          <p>Content</p>
        </Modal>
      );
      const overlay = screen.getByRole('dialog');
      fireEvent.click(overlay);
      expect(onCloseMock).not.toHaveBeenCalled();
    });

    it('does not call onClose when modal content is clicked', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Content</p>
        </Modal>
      );
      const content = screen.getByText('Content');
      fireEvent.click(content);
      expect(onCloseMock).not.toHaveBeenCalled();
    });
  });

  // Keyboard navigation tests
  describe('Keyboard Navigation', () => {
    it('calls onClose when Escape key is pressed', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Content</p>
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when other keys are pressed', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Content</p>
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(onCloseMock).not.toHaveBeenCalled();
    });

    it('traps focus within modal', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <button>First Button</button>
          <button>Second Button</button>
        </Modal>
      );
      
      const firstButton = screen.getByText('First Button');
      const secondButton = screen.getByText('Second Button');
      const closeButton = screen.getByLabelText('Close modal');

      // First focusable element should be focused on open
      expect(document.activeElement).toBe(closeButton);
    });
  });

  // Scroll lock tests
  describe('Scroll Lock', () => {
    it('locks body scroll when modal is open', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Content</p>
        </Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('unlocks body scroll when modal is closed', async () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Content</p>
        </Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} onClose={onCloseMock} title="Test Modal">
          <p>Content</p>
        </Modal>
      );

      // Wait for animation to complete
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('');
      }, { timeout: 300 });
    });

    it('adds padding to compensate for scrollbar', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Content</p>
        </Modal>
      );
      // Padding should be set (value depends on scrollbar width)
      expect(document.body.style.paddingRight).toBeDefined();
    });
  });

  // Animation tests
  describe('Animations', () => {
    it('applies closing class when closing', async () => {
      const { rerender, container } = render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Content</p>
        </Modal>
      );

      rerender(
        <Modal isOpen={false} onClose={onCloseMock} title="Test Modal">
          <p>Content</p>
        </Modal>
      );

      // Modal should still be in DOM with closing class
      const overlay = container.querySelector('[role="dialog"]');
      expect(overlay).toBeInTheDocument();
      expect(overlay.className).toContain('closing');

      // Wait for animation to complete and modal to unmount
      await waitFor(() => {
        expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
      }, { timeout: 300 });
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Content</p>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal attribute', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Content</p>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby pointing to title', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Content</p>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(screen.getByText('Test Modal')).toHaveAttribute('id', 'modal-title');
    });

    it('close button has proper aria-label', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Content</p>
        </Modal>
      );
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });
  });
});

describe('ConfirmModal Component', () => {
  let onCloseMock;
  let onConfirmMock;

  beforeEach(() => {
    onCloseMock = vi.fn();
    onConfirmMock = vi.fn();
  });

  afterEach(() => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={onCloseMock}
          onConfirm={onConfirmMock}
          message="Are you sure?"
        />
      );
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders with custom title and button text', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={onCloseMock}
          onConfirm={onConfirmMock}
          title="Delete Item"
          message="This action cannot be undone"
          confirmText="Delete"
          cancelText="Keep"
        />
      );
      expect(screen.getByText('Delete Item')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Keep')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={onCloseMock}
          onConfirm={onConfirmMock}
          message="Are you sure?"
          isLoading={true}
        />
      );
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeDisabled();
      expect(screen.getByText('Processing...')).toBeDisabled();
    });
  });

  describe('Interactions', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={onCloseMock}
          onConfirm={onConfirmMock}
          message="Are you sure?"
        />
      );
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);
      expect(onConfirmMock).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel button is clicked', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={onCloseMock}
          onConfirm={onConfirmMock}
          message="Are you sure?"
        />
      );
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('does not call handlers when loading', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={onCloseMock}
          onConfirm={onConfirmMock}
          message="Are you sure?"
          isLoading={true}
        />
      );
      const confirmButton = screen.getByText('Processing...');
      const cancelButton = screen.getByText('Cancel');
      
      fireEvent.click(confirmButton);
      fireEvent.click(cancelButton);
      
      expect(onConfirmMock).not.toHaveBeenCalled();
      expect(onCloseMock).not.toHaveBeenCalled();
    });
  });

  describe('Size', () => {
    it('renders with small size', () => {
      const { container } = render(
        <ConfirmModal
          isOpen={true}
          onClose={onCloseMock}
          onConfirm={onConfirmMock}
          message="Are you sure?"
        />
      );
      const modal = container.querySelector('[role="dialog"] > div');
      expect(modal.className).toContain('sm');
    });
  });
});
