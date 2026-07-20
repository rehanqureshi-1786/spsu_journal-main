# Card Component

A modern, flexible card component with multiple variants and optional sections. Supports header, body, and footer sections with consistent padding and spacing.

## Features

- **Multiple Variants**: Default, elevated, and outlined styles
- **Optional Sections**: Header and footer sections with distinct styling
- **Hover Effects**: Optional hover animations for interactive cards
- **Clickable**: Support for onClick handlers with keyboard accessibility
- **Responsive**: Adapts padding and spacing for mobile devices
- **Accessible**: Proper ARIA attributes and keyboard navigation
- **Theme Integration**: Uses design system tokens for consistency

## Installation

The Card component is part of the shared components library. Import it directly:

```jsx
import Card from '@/components/Card/Card';
```

## Basic Usage

```jsx
import Card from '@/components/Card/Card';

function MyComponent() {
  return (
    <Card>
      <h3>Card Title</h3>
      <p>Card content goes here.</p>
    </Card>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `node` | **required** | Card body content |
| `variant` | `'default' \| 'elevated' \| 'outlined'` | `'default'` | Visual style variant |
| `header` | `node` | `null` | Optional header content |
| `footer` | `node` | `null` | Optional footer content |
| `hoverable` | `boolean` | `false` | Enable hover effect |
| `onClick` | `function` | `undefined` | Click handler (makes card interactive) |
| `className` | `string` | `''` | Additional CSS classes |

## Variants

### Default
Subtle border with light shadow - good for general content.

```jsx
<Card variant="default">
  <p>Default card with subtle styling</p>
</Card>
```

### Elevated
Prominent shadow for emphasis - great for important content.

```jsx
<Card variant="elevated">
  <p>Elevated card with prominent shadow</p>
</Card>
```

### Outlined
Border without shadow - clean look for minimal designs.

```jsx
<Card variant="outlined">
  <p>Outlined card with border only</p>
</Card>
```

## With Header and Footer

```jsx
<Card
  variant="elevated"
  header={<h3>Card Title</h3>}
  footer={
    <div>
      <button>Cancel</button>
      <button>Save</button>
    </div>
  }
>
  <p>Card body content</p>
</Card>
```

## Hoverable Cards

Add hover effects for visual feedback:

```jsx
<Card variant="elevated" hoverable>
  <p>Hover over me to see the effect</p>
</Card>
```

## Interactive/Clickable Cards

Make cards clickable with proper accessibility:

```jsx
<Card 
  variant="default" 
  hoverable
  onClick={() => console.log('Card clicked')}
>
  <h3>Clickable Card</h3>
  <p>Click me or press Enter/Space</p>
</Card>
```

## Real-world Examples

### Statistics Card

```jsx
<Card variant="default" hoverable>
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <div>
      <p>Total Papers</p>
      <h2>1,234</h2>
    </div>
    <div>📄</div>
  </div>
  <p>↑ 12% from last month</p>
</Card>
```

### User Profile Card

```jsx
<Card
  variant="elevated"
  header={
    <div>
      <img src="avatar.jpg" alt="User" />
      <h4>John Doe</h4>
    </div>
  }
  footer={
    <button>View Profile</button>
  }
>
  <div>
    <p>42 Papers</p>
    <p>18 Reviews</p>
  </div>
</Card>
```

### Article Card

```jsx
<Card variant="outlined" hoverable onClick={handleArticleClick}>
  <span className="badge">Computer Science</span>
  <h3>Article Title</h3>
  <p>Article description...</p>
  <div>
    <span>Author Name</span>
    <span>Published Date</span>
  </div>
</Card>
```

## Styling

The Card component uses CSS Modules for styling. You can customize it by:

1. **Using the className prop**: Add custom classes for specific styling
2. **Overriding CSS variables**: Modify theme variables in your global styles
3. **Extending the component**: Create a wrapper component with additional styles

### Custom Styling Example

```jsx
<Card className="my-custom-card">
  <p>Custom styled card</p>
</Card>
```

```css
.my-custom-card {
  background: linear-gradient(to right, #667eea, #764ba2);
  color: white;
}
```

## Accessibility

The Card component follows accessibility best practices:

- **Keyboard Navigation**: Clickable cards are keyboard accessible (Enter/Space)
- **ARIA Attributes**: Proper `role="button"` and `tabIndex` for interactive cards
- **Focus Visible**: Clear focus indicators for keyboard navigation
- **Reduced Motion**: Respects `prefers-reduced-motion` for animations
- **High Contrast**: Supports high contrast mode with increased border widths

## Responsive Design

The Card component is fully responsive:

- **Desktop**: Full padding and spacing
- **Tablet (≤768px)**: Reduced padding
- **Mobile (≤480px)**: Minimal padding for small screens

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Related Components

- **Button**: For actions within card footers
- **Modal**: For full-screen card-like overlays
- **DataTable**: For tabular data in card format

## Testing

The Card component includes comprehensive tests:

```bash
npm test Card.test.jsx
```

Tests cover:
- Basic rendering
- All variants
- Header and footer sections
- Hover effects
- Click interactions
- Keyboard accessibility
- Custom className handling

## Migration from Inline Styles

If you're currently using inline card styles, here's how to migrate:

**Before:**
```jsx
<div style={{
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '1.5rem',
  border: '1px solid #E5E7EB',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
}}>
  <h3>Title</h3>
  <p>Content</p>
</div>
```

**After:**
```jsx
<Card variant="default">
  <h3>Title</h3>
  <p>Content</p>
</Card>
```

## Performance

The Card component is optimized for performance:

- **Minimal re-renders**: Uses React best practices
- **CSS Modules**: Scoped styles with minimal overhead
- **No external dependencies**: Pure React implementation
- **Small bundle size**: ~2KB gzipped

## Contributing

When contributing to the Card component:

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure accessibility compliance
5. Test on all supported browsers

## License

Part of the Essence Journal System frontend component library.
