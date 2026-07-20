# Button Component

A modern, accessible button component with multiple variants, sizes, and states. Built with React and CSS Modules, following the design system theme.

## Features

- ✅ **5 Variants**: Primary, Secondary, Outline, Ghost, Danger
- ✅ **3 Sizes**: Small (sm), Medium (md), Large (lg)
- ✅ **Multiple States**: Default, Hover, Active, Disabled, Loading
- ✅ **Icon Support**: Left, right, or icon-only buttons
- ✅ **Smooth Transitions**: 150-300ms transitions for optimal UX
- ✅ **Optional Ripple Effect**: Material Design-inspired click feedback
- ✅ **Fully Accessible**: ARIA attributes, keyboard navigation, focus states
- ✅ **Responsive**: Mobile-optimized with proper touch targets (44x44px minimum)
- ✅ **Theme Integration**: Uses CSS custom properties from the design system

## Installation

The Button component is located in `frontend/src/components/Button/`.

```javascript
import Button from '@/components/Button';
```

## Basic Usage

```jsx
import Button from '@/components/Button';

function MyComponent() {
  return (
    <Button onClick={() => console.log('Clicked!')}>
      Click Me
    </Button>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `node` | - | Button content (text, elements) |
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Button style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `disabled` | `boolean` | `false` | Disabled state |
| `loading` | `boolean` | `false` | Loading state (shows spinner) |
| `fullWidth` | `boolean` | `false` | Full width button |
| `icon` | `node` | `null` | Icon element |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon position |
| `ripple` | `boolean` | `false` | Enable ripple effect on click |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Button type attribute |
| `onClick` | `function` | - | Click handler |
| `className` | `string` | `''` | Additional CSS classes |

## Variants

### Primary (Default)
Used for primary actions. Blue background with white text.

```jsx
<Button variant="primary">Primary Action</Button>
```

### Secondary
Used for secondary actions. Dark background with white text.

```jsx
<Button variant="secondary">Secondary Action</Button>
```

### Outline
Used for less prominent actions. Transparent background with blue border.

```jsx
<Button variant="outline">Outline Action</Button>
```

### Ghost
Used for subtle actions. Transparent background, no border.

```jsx
<Button variant="ghost">Ghost Action</Button>
```

### Danger
Used for destructive actions. Red background with white text.

```jsx
<Button variant="danger">Delete</Button>
```

## Sizes

### Small
Compact button for tight spaces.

```jsx
<Button size="sm">Small Button</Button>
```

### Medium (Default)
Standard button size for most use cases.

```jsx
<Button size="md">Medium Button</Button>
```

### Large
Prominent button for important actions.

```jsx
<Button size="lg">Large Button</Button>
```

## States

### Disabled
Prevents interaction and reduces opacity.

```jsx
<Button disabled>Disabled Button</Button>
```

### Loading
Shows a spinner and prevents interaction.

```jsx
<Button loading>Loading...</Button>
```

## Icons

### Icon with Text (Left)
```jsx
<Button icon={<SearchIcon />}>
  Search
</Button>
```

### Icon with Text (Right)
```jsx
<Button icon={<ArrowIcon />} iconPosition="right">
  Next
</Button>
```

### Icon Only
```jsx
<Button icon={<SettingsIcon />} aria-label="Settings" />
```

**Note**: Always provide an `aria-label` for icon-only buttons for accessibility.

## Advanced Features

### Ripple Effect
Enable Material Design-inspired ripple effect on click.

```jsx
<Button ripple>Click for Ripple</Button>
```

### Full Width
Make button span the full width of its container.

```jsx
<Button fullWidth>Full Width Button</Button>
```

### Button Types
Specify the HTML button type attribute.

```jsx
<Button type="submit">Submit Form</Button>
<Button type="reset">Reset Form</Button>
```

## Examples

### Form Actions
```jsx
<div style={{ display: 'flex', gap: '1rem' }}>
  <Button variant="outline" onClick={handleCancel}>
    Cancel
  </Button>
  <Button variant="primary" type="submit">
    Save Changes
  </Button>
</div>
```

### Confirmation Dialog
```jsx
<div style={{ display: 'flex', gap: '1rem' }}>
  <Button variant="ghost" onClick={handleCancel}>
    No, Cancel
  </Button>
  <Button variant="danger" onClick={handleConfirm}>
    Yes, Delete
  </Button>
</div>
```

### Loading State
```jsx
function SubmitButton() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitForm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button loading={loading} onClick={handleSubmit}>
      {loading ? 'Submitting...' : 'Submit'}
    </Button>
  );
}
```

### Navigation with Icons
```jsx
<div style={{ display: 'flex', gap: '1rem' }}>
  <Button 
    variant="outline" 
    icon={<BackIcon />}
    onClick={handleBack}
  >
    Back
  </Button>
  <Button 
    variant="primary" 
    icon={<NextIcon />}
    iconPosition="right"
    onClick={handleNext}
  >
    Continue
  </Button>
</div>
```

## Accessibility

The Button component follows WCAG 2.1 Level AA guidelines:

- ✅ **Keyboard Navigation**: Fully accessible via keyboard (Tab, Enter, Space)
- ✅ **Focus Indicators**: Clear focus outline for keyboard users
- ✅ **ARIA Attributes**: Proper `aria-busy` for loading state
- ✅ **Touch Targets**: Minimum 44x44px on mobile devices
- ✅ **Color Contrast**: Meets WCAG AA standards (4.5:1 minimum)
- ✅ **Screen Readers**: Semantic HTML with proper labels
- ✅ **Reduced Motion**: Respects `prefers-reduced-motion` setting

### Best Practices

1. **Always provide text or aria-label**: Icon-only buttons must have `aria-label`
2. **Use semantic button types**: Use `type="submit"` for form submissions
3. **Provide feedback**: Use loading state for async operations
4. **Choose appropriate variants**: Use danger variant for destructive actions
5. **Consider context**: Use ghost/outline for less important actions

## Styling

The Button component uses CSS Modules and theme variables. To customize:

### Using Theme Variables
All colors, spacing, and transitions use CSS custom properties from the theme:

```css
/* Example: Custom button variant */
.custom-button {
  background-color: var(--color-accent-main);
  color: var(--color-accent-contrast);
  padding: var(--spacing-3) var(--spacing-5);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast) var(--timing-ease-in-out);
}
```

### Extending Styles
Pass additional classes via the `className` prop:

```jsx
<Button className="my-custom-class">Custom Styled</Button>
```

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Performance

- **Lightweight**: Minimal CSS, no external dependencies
- **Optimized Animations**: Uses CSS transforms for smooth 60fps animations
- **Lazy Ripple**: Ripple effect only created when enabled
- **No Re-renders**: Pure component, only re-renders when props change

## Testing

See `Button.test.jsx` for comprehensive test coverage including:
- Rendering tests
- Variant tests
- Size tests
- State tests
- Icon tests
- Interaction tests
- Accessibility tests

## Related Components

- **Input**: Form input component with similar styling
- **Card**: Container component with consistent design
- **Modal**: Dialog component using buttons for actions

## Requirements Validation

This component validates the following requirements from the Frontend UI Modernization spec:

- **Requirement 5.1**: Modern button styling with variants and states
- **Requirement 6.1**: Smooth transitions on state changes
- **Requirement 6.3**: Immediate visual feedback on hover
- **Requirement 7.1**: Visual feedback through state changes

## Changelog

### Version 1.0.0 (Initial Release)
- ✅ 5 variants (primary, secondary, outline, ghost, danger)
- ✅ 3 sizes (sm, md, lg)
- ✅ Multiple states (hover, active, disabled, loading)
- ✅ Icon support (left, right, icon-only)
- ✅ Smooth transitions (150-300ms)
- ✅ Optional ripple effect
- ✅ Full accessibility support
- ✅ Responsive design
- ✅ Theme integration
