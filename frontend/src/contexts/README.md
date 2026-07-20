# Theme Context

The ThemeContext provides a centralized theme system for the Essence Journal System frontend.

## Features

- **React Context**: Provides theme configuration to all components via React Context API
- **CSS Custom Properties**: Automatically injects theme values as CSS variables for use in stylesheets
- **Type-Safe Access**: Use the `useTheme` hook to access theme values in JavaScript
- **Consistent Styling**: Ensures all components use the same design tokens

## Usage

### In React Components (JavaScript)

```jsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const theme = useTheme();
  
  return (
    <div style={{
      color: theme.colors.primary.main,
      padding: theme.spacing[4],
      borderRadius: theme.borderRadius.md,
      boxShadow: theme.shadows.base
    }}>
      Styled with theme
    </div>
  );
}
```

### In CSS Files (CSS Custom Properties)

```css
.my-component {
  /* Colors */
  color: var(--color-primary-main);
  background-color: var(--color-bg-paper);
  border-color: var(--color-border-light);
  
  /* Spacing */
  padding: var(--spacing-4);
  margin: var(--spacing-2);
  
  /* Typography */
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  
  /* Border Radius */
  border-radius: var(--radius-md);
  
  /* Shadows */
  box-shadow: var(--shadow-base);
  
  /* Transitions */
  transition: all var(--transition-base) var(--timing-ease-in-out);
}

.my-component:hover {
  background-color: var(--color-primary-light);
  box-shadow: var(--shadow-md);
}
```

### In CSS Modules

```css
/* MyComponent.module.css */
.container {
  background-color: var(--color-bg-paper);
  padding: var(--spacing-6);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
}

.title {
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-4);
}

.button {
  background-color: var(--color-primary-main);
  color: var(--color-primary-contrast);
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--radius-base);
  transition: all var(--transition-fast) var(--timing-ease-in-out);
}

.button:hover {
  background-color: var(--color-primary-dark);
  box-shadow: var(--shadow-primary);
}
```

## Available Theme Values

### Colors
- Primary: `--color-primary-main`, `--color-primary-light`, `--color-primary-dark`, etc.
- Secondary: `--color-secondary-main`, `--color-secondary-light`, etc.
- Accent: `--color-accent-main`, `--color-accent-light`, etc.
- Neutral: `--color-neutral-50` through `--color-neutral-900`
- Success: `--color-success-main`, `--color-success-light`, etc.
- Warning: `--color-warning-main`, `--color-warning-light`, etc.
- Error: `--color-error-main`, `--color-error-light`, etc.
- Info: `--color-info-main`, `--color-info-light`, etc.
- Background: `--color-bg-default`, `--color-bg-paper`, `--color-bg-alt`
- Text: `--color-text-primary`, `--color-text-secondary`, etc.
- Border: `--color-border-light`, `--color-border-main`, `--color-border-dark`

### Typography
- Font Families: `--font-family-primary`, `--font-family-secondary`, `--font-family-mono`
- Font Sizes: `--font-size-xs` through `--font-size-8xl`
- Font Weights: `--font-weight-light` through `--font-weight-black`
- Line Heights: `--line-height-none` through `--line-height-extra-loose`
- Letter Spacing: `--letter-spacing-tighter` through `--letter-spacing-widest`

### Spacing
- `--spacing-0` through `--spacing-64` (0rem to 16rem)

### Border Radius
- `--radius-none`, `--radius-sm`, `--radius-base`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`, `--radius-3xl`, `--radius-full`

### Shadows
- `--shadow-none`, `--shadow-sm`, `--shadow-base`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-2xl`, `--shadow-inner`
- Colored shadows: `--shadow-primary`, `--shadow-primary-lg`, `--shadow-success`, `--shadow-warning`, `--shadow-error`

### Transitions
- Duration: `--transition-fastest` through `--transition-slowest`
- Timing: `--timing-linear`, `--timing-ease`, `--timing-ease-in-out`, etc.

### Z-Index
- `--z-index-hide`, `--z-index-base`, `--z-index-dropdown`, `--z-index-sticky`, `--z-index-fixed`, `--z-index-modal-backdrop`, `--z-index-modal`, `--z-index-popover`, `--z-index-tooltip`

### Containers
- `--container-sm`, `--container-md`, `--container-lg`, `--container-xl`, `--container-2xl`

### Breakpoints
- `--breakpoint-mobile`, `--breakpoint-tablet`, `--breakpoint-desktop`, `--breakpoint-wide`, `--breakpoint-ultra-wide`

## Implementation Details

The ThemeProvider component:
1. Wraps the entire application in App.jsx
2. Provides theme context via React Context API
3. Automatically injects CSS custom properties on mount
4. Converts camelCase theme keys to kebab-case CSS variable names
5. Handles nested objects (like color palettes) recursively

## Benefits

- **Consistency**: All components use the same design tokens
- **Maintainability**: Change theme values in one place
- **Flexibility**: Use theme values in both JavaScript and CSS
- **Performance**: CSS custom properties are native and fast
- **Developer Experience**: Autocomplete and type safety with useTheme hook
