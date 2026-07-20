import { render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';
import theme from '../config/theme';

/**
 * Test component that uses the theme context
 */
const TestComponent = () => {
  const themeContext = useTheme();
  return (
    <div>
      <div data-testid="primary-color">{themeContext.colors.primary.main}</div>
      <div data-testid="spacing-4">{themeContext.spacing[4]}</div>
      <div data-testid="font-size-base">{themeContext.typography.fontSize.base}</div>
    </div>
  );
};

describe('ThemeContext', () => {
  describe('ThemeProvider', () => {
    it('should provide theme context to child components', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Verify theme values are accessible
      expect(screen.getByTestId('primary-color')).toHaveTextContent(theme.colors.primary.main);
      expect(screen.getByTestId('spacing-4')).toHaveTextContent(theme.spacing[4]);
      expect(screen.getByTestId('font-size-base')).toHaveTextContent(theme.typography.fontSize.base);
    });

    it('should inject CSS custom properties into document root', () => {
      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      const root = document.documentElement;

      // Verify color variables are injected
      expect(root.style.getPropertyValue('--color-primary-main')).toBe(theme.colors.primary.main);
      expect(root.style.getPropertyValue('--color-secondary-main')).toBe(theme.colors.secondary.main);

      // Verify spacing variables are injected
      expect(root.style.getPropertyValue('--spacing-4')).toBe(theme.spacing[4]);
      expect(root.style.getPropertyValue('--spacing-8')).toBe(theme.spacing[8]);

      // Verify typography variables are injected
      expect(root.style.getPropertyValue('--font-size-base')).toBe(theme.typography.fontSize.base);
      expect(root.style.getPropertyValue('--font-weight-bold')).toBe(String(theme.typography.fontWeight.bold));

      // Verify border radius variables are injected
      expect(root.style.getPropertyValue('--radius-base')).toBe(theme.borderRadius.base);
      expect(root.style.getPropertyValue('--radius-lg')).toBe(theme.borderRadius.lg);

      // Verify shadow variables are injected
      expect(root.style.getPropertyValue('--shadow-base')).toBe(theme.shadows.base);
      expect(root.style.getPropertyValue('--shadow-md')).toBe(theme.shadows.md);

      // Verify transition variables are injected
      expect(root.style.getPropertyValue('--transition-base')).toBe(theme.transitions.duration.base);
      expect(root.style.getPropertyValue('--timing-ease-in-out')).toBe(theme.transitions.timing.easeInOut);
    });

    it('should handle nested color objects correctly', () => {
      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      const root = document.documentElement;

      // Verify nested color values are injected with correct naming
      expect(root.style.getPropertyValue('--color-primary-light')).toBe(theme.colors.primary.light);
      expect(root.style.getPropertyValue('--color-primary-dark')).toBe(theme.colors.primary.dark);
      expect(root.style.getPropertyValue('--color-neutral-50')).toBe(theme.colors.neutral[50]);
      expect(root.style.getPropertyValue('--color-neutral-900')).toBe(theme.colors.neutral[900]);
    });
  });

  describe('useTheme hook', () => {
    it('should return theme even when used outside ThemeProvider (due to default value)', () => {
      const TestComponentWithoutProvider = () => {
        const themeContext = useTheme();
        expect(themeContext).toBe(theme);
        return <div>Test</div>;
      };

      render(<TestComponentWithoutProvider />);
    });

    it('should return theme object when used within ThemeProvider', () => {
      const TestComponentWithTheme = () => {
        const themeContext = useTheme();
        expect(themeContext).toBe(theme);
        return <div>Test</div>;
      };

      render(
        <ThemeProvider>
          <TestComponentWithTheme />
        </ThemeProvider>
      );
    });
  });
});
