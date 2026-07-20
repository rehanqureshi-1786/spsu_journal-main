/**
 * Theme Configuration
 * 
 * Centralized design system for the Essence Journal System.
 * Defines colors, typography, spacing, shadows, animations, and breakpoints.
 * 
 * All components should use these values for consistency.
 */

const theme = {
  // Color Palette
  colors: {
    // Primary Colors - Blue theme for academic professionalism
    primary: {
      main: '#4a9eff',
      light: '#6bb0ff',
      dark: '#3a8eef',
      contrast: '#ffffff',
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#4a9eff',
      600: '#3a8eef',
      700: '#2563eb',
      800: '#1d4ed8',
      900: '#1e40af',
    },

    // Secondary Colors - Dark blue/navy for headers and emphasis
    secondary: {
      main: '#1a1a2e',
      light: '#2d2d44',
      dark: '#0f0f1a',
      contrast: '#ffffff',
      50: '#f8f9fa',
      100: '#e9ecef',
      200: '#dee2e6',
      300: '#ced4da',
      400: '#adb5bd',
      500: '#6c757d',
      600: '#495057',
      700: '#343a40',
      800: '#1a1a2e',
      900: '#0f0f1a',
    },

    // Accent Colors - Gold/yellow for highlights and CTAs
    accent: {
      main: '#ffd700',
      light: '#ffed4e',
      dark: '#e6c200',
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#ffd700',
      600: '#e6c200',
      700: '#ca8a04',
      800: '#a16207',
      900: '#78350f',
    },

    // Neutral/Gray Scale
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      white: '#ffffff',
      black: '#000000',
    },

    // Success Colors - Green for positive states
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },

    // Warning Colors - Orange/yellow for caution states
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },

    // Error Colors - Red for error states
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },

    // Info Colors - Blue for informational states
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },

    // Background Colors
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
      alt: '#f8f9fa',
      dark: '#1a1a2e',
    },

    // Text Colors
    text: {
      primary: '#1a1a2e',
      secondary: '#555555',
      disabled: '#9ca3af',
      hint: '#6b7280',
      light: '#ffffff',
    },

    // Border Colors
    border: {
      light: '#e5e7eb',
      main: '#d1d5db',
      dark: '#9ca3af',
    },
  },

  // Typography System
  typography: {
    // Font Families
    fontFamily: {
      primary: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
      secondary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace",
    },

    // Font Sizes
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
      '6xl': '3.75rem',   // 60px
      '7xl': '4.5rem',    // 72px
      '8xl': '6rem',      // 96px
    },

    // Font Weights
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },

    // Line Heights
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 1.8,
      extraLoose: 2,
    },

    // Letter Spacing
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // Spacing Scale (in rem, base 16px)
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    7: '1.75rem',   // 28px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
    40: '10rem',    // 160px
    48: '12rem',    // 192px
    56: '14rem',    // 224px
    64: '16rem',    // 256px
  },

  // Border Radius Values
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Shadow Values
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    
    // Colored shadows for emphasis
    primary: '0 4px 12px rgba(74, 158, 255, 0.3)',
    primaryLg: '0 8px 24px rgba(74, 158, 255, 0.4)',
    success: '0 4px 12px rgba(16, 185, 129, 0.3)',
    warning: '0 4px 12px rgba(245, 158, 11, 0.3)',
    error: '0 4px 12px rgba(239, 68, 68, 0.3)',
  },

  // Animation & Transition Values
  transitions: {
    // Duration
    duration: {
      fastest: '100ms',
      fast: '150ms',
      base: '200ms',
      slow: '300ms',
      slower: '400ms',
      slowest: '500ms',
    },

    // Timing Functions
    timing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
      easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
      easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
      easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      spring: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },

    // Common transition properties
    properties: {
      all: 'all',
      colors: 'background-color, border-color, color, fill, stroke',
      opacity: 'opacity',
      shadow: 'box-shadow',
      transform: 'transform',
    },
  },

  // Responsive Breakpoints
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
    ultraWide: '1536px',
  },

  // Z-Index Scale
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  // Container Max Widths
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1200px',
    '2xl': '1280px',
  },
};

// Helper functions for theme usage

/**
 * Get a color value from the theme
 * @param {string} path - Dot notation path to color (e.g., 'primary.main', 'neutral.500')
 * @returns {string} Color value
 */
export const getColor = (path) => {
  const keys = path.split('.');
  let value = theme.colors;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Color path "${path}" not found in theme`);
      return '#000000';
    }
  }
  
  return value;
};

/**
 * Get a spacing value from the theme
 * @param {number|string} value - Spacing scale value
 * @returns {string} Spacing value in rem
 */
export const getSpacing = (value) => {
  return theme.spacing[value] || `${value}rem`;
};

/**
 * Get a shadow value from the theme
 * @param {string} size - Shadow size (sm, base, md, lg, xl, 2xl)
 * @returns {string} Shadow CSS value
 */
export const getShadow = (size) => {
  return theme.shadows[size] || theme.shadows.base;
};

/**
 * Create a transition string
 * @param {string} property - CSS property to transition
 * @param {string} duration - Duration key from theme
 * @param {string} timing - Timing function key from theme
 * @returns {string} Transition CSS value
 */
export const createTransition = (
  property = 'all',
  duration = 'base',
  timing = 'easeInOut'
) => {
  const durationValue = theme.transitions.duration[duration] || duration;
  const timingValue = theme.transitions.timing[timing] || timing;
  return `${property} ${durationValue} ${timingValue}`;
};

/**
 * Generate media query for breakpoint
 * @param {string} breakpoint - Breakpoint key from theme
 * @returns {string} Media query string
 */
export const mediaQuery = (breakpoint) => {
  const value = theme.breakpoints[breakpoint];
  return `@media (min-width: ${value})`;
};

/**
 * Generate max-width media query for breakpoint
 * @param {string} breakpoint - Breakpoint key from theme
 * @returns {string} Media query string
 */
export const mediaQueryMax = (breakpoint) => {
  const value = theme.breakpoints[breakpoint];
  return `@media (max-width: ${value})`;
};

// Export theme as default
export default theme;
