import { createContext, useContext, useEffect } from 'react';
import theme from '../config/theme';

/**
 * ThemeContext
 * 
 * Provides theme configuration to all components in the application.
 * Injects CSS custom properties for theme values into the document root.
 */

const ThemeContext = createContext(theme);

/**
 * Custom hook to access theme context
 * @returns {Object} Theme configuration object
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * ThemeProvider Component
 * 
 * Wraps the application and provides theme context to all child components.
 * Automatically injects CSS custom properties for all theme values.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    // Inject CSS custom properties into document root
    injectThemeVariables();
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Injects theme values as CSS custom properties into the document root
 * This allows theme values to be used in CSS files via var(--property-name)
 */
const injectThemeVariables = () => {
  const root = document.documentElement;

  // Inject color variables
  injectColorVariables(root, theme.colors);

  // Inject typography variables
  injectTypographyVariables(root, theme.typography);

  // Inject spacing variables
  injectSpacingVariables(root, theme.spacing);

  // Inject border radius variables
  injectBorderRadiusVariables(root, theme.borderRadius);

  // Inject shadow variables
  injectShadowVariables(root, theme.shadows);

  // Inject transition variables
  injectTransitionVariables(root, theme.transitions);

  // Inject z-index variables
  injectZIndexVariables(root, theme.zIndex);

  // Inject container variables
  injectContainerVariables(root, theme.container);

  // Inject breakpoint variables
  injectBreakpointVariables(root, theme.breakpoints);
};

/**
 * Recursively inject color variables
 */
const injectColorVariables = (root, colors, prefix = 'color') => {
  Object.entries(colors).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      // Recursively handle nested color objects
      injectColorVariables(root, value, `${prefix}-${kebabCase(key)}`);
    } else {
      // Set CSS custom property
      root.style.setProperty(`--${prefix}-${kebabCase(key)}`, value);
    }
  });
};

/**
 * Inject typography variables
 */
const injectTypographyVariables = (root, typography) => {
  // Font families
  Object.entries(typography.fontFamily).forEach(([key, value]) => {
    root.style.setProperty(`--font-family-${kebabCase(key)}`, value);
  });

  // Font sizes
  Object.entries(typography.fontSize).forEach(([key, value]) => {
    root.style.setProperty(`--font-size-${kebabCase(key)}`, value);
  });

  // Font weights
  Object.entries(typography.fontWeight).forEach(([key, value]) => {
    root.style.setProperty(`--font-weight-${kebabCase(key)}`, value);
  });

  // Line heights
  Object.entries(typography.lineHeight).forEach(([key, value]) => {
    root.style.setProperty(`--line-height-${kebabCase(key)}`, value);
  });

  // Letter spacing
  Object.entries(typography.letterSpacing).forEach(([key, value]) => {
    root.style.setProperty(`--letter-spacing-${kebabCase(key)}`, value);
  });
};

/**
 * Inject spacing variables
 */
const injectSpacingVariables = (root, spacing) => {
  Object.entries(spacing).forEach(([key, value]) => {
    root.style.setProperty(`--spacing-${key}`, value);
  });
};

/**
 * Inject border radius variables
 */
const injectBorderRadiusVariables = (root, borderRadius) => {
  Object.entries(borderRadius).forEach(([key, value]) => {
    root.style.setProperty(`--radius-${kebabCase(key)}`, value);
  });
};

/**
 * Inject shadow variables
 */
const injectShadowVariables = (root, shadows) => {
  Object.entries(shadows).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${kebabCase(key)}`, value);
  });
};

/**
 * Inject transition variables
 */
const injectTransitionVariables = (root, transitions) => {
  // Duration
  Object.entries(transitions.duration).forEach(([key, value]) => {
    root.style.setProperty(`--transition-${kebabCase(key)}`, value);
  });

  // Timing functions
  Object.entries(transitions.timing).forEach(([key, value]) => {
    root.style.setProperty(`--timing-${kebabCase(key)}`, value);
  });
};

/**
 * Inject z-index variables
 */
const injectZIndexVariables = (root, zIndex) => {
  Object.entries(zIndex).forEach(([key, value]) => {
    root.style.setProperty(`--z-index-${kebabCase(key)}`, value);
  });
};

/**
 * Inject container variables
 */
const injectContainerVariables = (root, container) => {
  Object.entries(container).forEach(([key, value]) => {
    root.style.setProperty(`--container-${kebabCase(key)}`, value);
  });
};

/**
 * Inject breakpoint variables
 */
const injectBreakpointVariables = (root, breakpoints) => {
  Object.entries(breakpoints).forEach(([key, value]) => {
    root.style.setProperty(`--breakpoint-${kebabCase(key)}`, value);
  });
};

/**
 * Convert camelCase or PascalCase to kebab-case
 * @param {string} str - String to convert
 * @returns {string} Kebab-cased string
 */
const kebabCase = (str) => {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
    .toLowerCase();
};

export default ThemeContext;
