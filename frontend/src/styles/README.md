# Theme System Documentation

## Overview

The Essence Journal System uses a centralized theme configuration to ensure visual consistency across all components. The theme system provides:

- **Comprehensive color palette** with primary, secondary, accent, neutral, success, warning, error, and info colors
- **Typography system** with font families, sizes, weights, and line heights
- **Spacing scale** for consistent margins, padding, and gaps
- **Border radius values** for rounded corners
- **Shadow values** for depth and elevation
- **Animation durations and timing functions** for smooth transitions
- **Responsive breakpoints** for mobile, tablet, and desktop layouts

## Files

### `theme.js`
JavaScript/React theme configuration object with helper functions. Use this in React components.

### `theme.css`
CSS custom properties (CSS variables) for use in CSS files and CSS modules.

### `global.css`
Global styles including CSS reset, normalize, base typography, utility classes, and accessibility features. This file imports `theme.css` and should be imported in your application's main entry point.

## Usage

### Setup

The global styles are automatically imported in `main.jsx`:

```javascript
import './styles/global.css'
import './index.css'
```

The `global.css` file provides:
- Modern CSS reset and normalize
- Base typography styles using theme variables
- Utility classes for common patterns
- Responsive utilities
- Accessibility features
- Print styles

### In React Components (JavaScript)

```javascript
import theme, { getColor, getSpacing, createTransition } from '../config/theme';

// Access theme values directly
const primaryColor = theme.colors.primary.main; // '#4a9eff'
const spacing = theme.spacing[4]; // '1rem'

// Use helper functions
const textColor = getColor('text.primary'); // '#1a1a2e'
const padding = getSpacing(4); // '1rem'
const transition = createTransition('all', 'base', 'easeInOut'); // 'all 200ms ease-in-out'

// Inline styles
<div style={{
  color: getColor('primary.main'),
  padding: getSpacing(4),
  borderRadius: theme.borderRadius.lg,
  boxShadow: theme.shadows.md,
  transition: createTransition('all', 'fast', 'spring')
}}>
  Content
</div>
```

### In CSS Files

```css
/* Import theme variables */
@import './theme.css';

/* Use CSS custom properties */
.my-component {
  color: var(--color-primary-main);
  background-color: var(--color-bg-paper);
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base) var(--timing-ease-in-out);
}

.my-component:hover {
  background-color: var(--color-primary-50);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* Use utility classes */
.my-button {
  /* Apply transition utility */
  @extend .transition-all;
}
```

### In CSS Modules

```css
/* MyComponent.module.css */
.container {
  background-color: var(--color-bg-paper);
  padding: var(--spacing-6);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-base);
}

.title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
  margin-bottom: var(--spacing-4);
}

.button {
  background-color: var(--color-primary-main);
  color: var(--color-primary-contrast);
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-fast) var(--timing-spring);
}

.button:hover {
  background-color: var(--color-primary-dark);
  box-shadow: var(--shadow-primary);
  transform: translateY(-2px);
}
```

## Utility Classes

The `global.css` file provides utility classes for common styling patterns:

### Text Utilities
```jsx
<h1 className="text-4xl font-bold text-primary">Large Bold Title</h1>
<p className="text-base text-secondary">Regular paragraph text</p>
<span className="text-sm font-medium">Small medium text</span>
```

### Spacing Utilities
```jsx
<div className="m-4 p-6">Margin 4, Padding 6</div>
<div className="mt-8 mb-4">Top margin 8, Bottom margin 4</div>
```

### Layout Utilities
```jsx
<div className="flex items-center justify-between gap-4">
  <span>Left</span>
  <span>Right</span>
</div>
```

### Border & Shadow Utilities
```jsx
<div className="rounded-lg shadow-md">Card with rounded corners and shadow</div>
```

### Responsive Utilities
```jsx
<div className="hidden md:block lg:flex">
  {/* Hidden on mobile, block on tablet, flex on desktop */}
</div>
```

### Accessibility Utilities
```jsx
<span className="sr-only">Screen reader only text</span>
<a href="#main" className="skip-to-main">Skip to main content</a>
```

## Color System

### Primary Colors (Blue)
Used for primary actions, links, and brand elements.
- `primary.main`: #4a9eff
- `primary.light`: #6bb0ff
- `primary.dark`: #3a8eef
- Shades: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900

### Secondary Colors (Dark Navy)
Used for headers, text, and emphasis.
- `secondary.main`: #1a1a2e
- `secondary.light`: #2d2d44
- `secondary.dark`: #0f0f1a

### Accent Colors (Gold/Yellow)
Used for highlights, CTAs, and special emphasis.
- `accent.main`: #ffd700
- `accent.light`: #ffed4e
- `accent.dark`: #e6c200

### Semantic Colors
- **Success** (Green): #10b981 - Positive states, confirmations
- **Warning** (Orange): #f59e0b - Caution states, alerts
- **Error** (Red): #ef4444 - Error states, destructive actions
- **Info** (Blue): #3b82f6 - Informational messages

### Neutral Colors
Gray scale from 50 (lightest) to 900 (darkest) for backgrounds, borders, and text.

## Typography

### Font Families
- **Primary**: System font stack (default)
- **Secondary**: Inter with fallbacks
- **Mono**: Monospace for code

### Font Sizes
- `xs`: 0.75rem (12px)
- `sm`: 0.875rem (14px)
- `base`: 1rem (16px)
- `lg`: 1.125rem (18px)
- `xl`: 1.25rem (20px)
- `2xl` through `8xl`: Larger sizes for headings

### Font Weights
- `light`: 300
- `normal`: 400
- `medium`: 500
- `semibold`: 600
- `bold`: 700
- `extrabold`: 800
- `black`: 900

### Line Heights
- `tight`: 1.25 - For headings
- `normal`: 1.5 - For body text
- `relaxed`: 1.625 - For comfortable reading
- `loose`: 1.8 - For maximum readability

## Spacing Scale

Based on 4px increments (0.25rem):
- `1`: 0.25rem (4px)
- `2`: 0.5rem (8px)
- `3`: 0.75rem (12px)
- `4`: 1rem (16px)
- `6`: 1.5rem (24px)
- `8`: 2rem (32px)
- And larger values up to `64`: 16rem (256px)

## Shadows

### Standard Shadows
- `sm`: Subtle shadow for slight elevation
- `base`: Default shadow for cards
- `md`: Medium shadow for dropdowns
- `lg`: Large shadow for modals
- `xl`: Extra large shadow for emphasis
- `2xl`: Maximum shadow for floating elements

### Colored Shadows
- `primary`: Blue shadow for primary elements
- `success`: Green shadow for success states
- `warning`: Orange shadow for warnings
- `error`: Red shadow for errors

## Transitions

### Duration
- `fastest`: 100ms - Instant feedback
- `fast`: 150ms - Quick interactions
- `base`: 200ms - Standard transitions
- `slow`: 300ms - Emphasized changes
- `slower`: 400ms - Deliberate animations
- `slowest`: 500ms - Maximum duration

### Timing Functions
- `linear`: Constant speed
- `ease`: Default easing
- `easeIn`: Accelerating
- `easeOut`: Decelerating
- `easeInOut`: Smooth start and end
- `spring`: Modern, bouncy feel

### Best Practices
- Use `fast` (150ms) for hover states
- Use `base` (200ms) for most transitions
- Use `slow` (300ms) for page transitions
- Never exceed 300ms for interactive elements (per requirements)

## Responsive Breakpoints

```css
/* Mobile First Approach */
.component {
  /* Mobile styles (default) */
  padding: var(--spacing-4);
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    padding: var(--spacing-6);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    padding: var(--spacing-8);
  }
}
```

Breakpoints:
- `mobile`: 480px
- `tablet`: 768px
- `desktop`: 1024px
- `wide`: 1280px
- `ultraWide`: 1536px

## Helper Functions

### `getColor(path)`
Get a color value using dot notation.
```javascript
getColor('primary.main') // '#4a9eff'
getColor('neutral.500') // '#6b7280'
```

### `getSpacing(value)`
Get a spacing value.
```javascript
getSpacing(4) // '1rem'
getSpacing(8) // '2rem'
```

### `getShadow(size)`
Get a shadow value.
```javascript
getShadow('md') // '0 4px 6px -1px rgba(0, 0, 0, 0.1)...'
```

### `createTransition(property, duration, timing)`
Create a transition string.
```javascript
createTransition('all', 'base', 'easeInOut') // 'all 200ms ease-in-out'
createTransition('transform', 'fast', 'spring') // 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)'
```

### `mediaQuery(breakpoint)`
Generate a min-width media query.
```javascript
mediaQuery('tablet') // '@media (min-width: 768px)'
```

### `mediaQueryMax(breakpoint)`
Generate a max-width media query.
```javascript
mediaQueryMax('mobile') // '@media (max-width: 480px)'
```

## Examples

### Button Component
```css
.button {
  /* Colors */
  background-color: var(--color-primary-main);
  color: var(--color-primary-contrast);
  
  /* Spacing */
  padding: var(--spacing-3) var(--spacing-6);
  
  /* Typography */
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  
  /* Border */
  border-radius: var(--radius-lg);
  border: none;
  
  /* Shadow */
  box-shadow: var(--shadow-sm);
  
  /* Transition */
  transition: all var(--transition-fast) var(--timing-spring);
  
  cursor: pointer;
}

.button:hover {
  background-color: var(--color-primary-dark);
  box-shadow: var(--shadow-primary);
  transform: translateY(-2px);
}

.button:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}
```

### Card Component
```css
.card {
  background-color: var(--color-bg-paper);
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-base);
  transition: all var(--transition-base) var(--timing-ease-in-out);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.cardTitle {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-4);
  line-height: var(--line-height-tight);
}

.cardContent {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}
```

### Input Component
```css
.input {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background-color: var(--color-bg-paper);
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  transition: border-color var(--transition-fast) var(--timing-ease-in-out);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}

.input:disabled {
  background-color: var(--color-neutral-100);
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

.inputError {
  border-color: var(--color-error-main);
}

.inputError:focus {
  box-shadow: 0 0 0 3px var(--color-error-50);
}
```

## Best Practices

1. **Always use theme values** instead of hardcoded colors, sizes, or spacing
2. **Use semantic color names** (success, warning, error) for appropriate states
3. **Keep transitions between 150-300ms** for optimal perceived performance
4. **Use the spacing scale** for consistent margins and padding
5. **Apply shadows consistently** based on elevation hierarchy
6. **Use responsive breakpoints** for mobile-first design
7. **Leverage utility classes** for common patterns
8. **Test color contrast** to ensure accessibility (WCAG AA minimum)

## Migration Guide

When updating existing components to use the theme:

1. Replace hardcoded colors with theme colors
2. Replace hardcoded spacing with theme spacing
3. Replace hardcoded font sizes with theme typography
4. Add transitions using theme durations (150-300ms)
5. Use theme shadows instead of custom shadows
6. Apply responsive breakpoints consistently

Example migration:
```css
/* Before */
.button {
  background-color: #4a9eff;
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
}

/* After */
.button {
  background-color: var(--color-primary-main);
  padding: var(--spacing-3) var(--spacing-6);
  font-size: var(--font-size-base);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base) var(--timing-ease-in-out);
}
```

## Support

For questions or issues with the theme system, refer to the design document or contact the development team.
