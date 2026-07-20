# Input Component

Modern, accessible input components with floating labels, error states, helper text, and icon support.

## Components

### Input

A versatile input component that supports various types and features.

#### Features

- ✨ Floating labels that animate on focus
- 🎨 Multiple size variants (sm, md, lg)
- 🔍 Prefix and suffix icon support
- ⚠️ Error state with validation messages
- 💡 Helper text for additional context
- ♿ Fully accessible with ARIA attributes
- 🎯 Focus states with theme colors
- 📱 Mobile-responsive with proper touch targets
- 🌙 Dark mode support (future enhancement)

#### Basic Usage

```jsx
import { Input } from './components/Input';

function MyForm() {
  const [email, setEmail] = useState('');

  return (
    <Input
      label="Email Address"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
      fullWidth
    />
  );
}
```

#### With Icons

```jsx
<Input
  label="Search"
  type="search"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  prefixIcon="🔍"
  placeholder="Search..."
  fullWidth
/>
```

#### With Error State

```jsx
<Input
  label="Email"
  type="email"
  value={email}
  onChange={handleEmailChange}
  error="Please enter a valid email address"
  required
  fullWidth
/>
```

#### With Helper Text

```jsx
<Input
  label="Password"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  helperText="Must be at least 8 characters"
  required
  fullWidth
/>
```

#### Size Variants

```jsx
<Input label="Small" size="sm" />
<Input label="Medium" size="md" /> {/* Default */}
<Input label="Large" size="lg" />
```

### Textarea

A textarea component with the same features as Input, plus auto-resize and character count.

#### Features

- All Input features
- 📏 Auto-resize based on content
- 🔢 Character count with max length
- 📝 Multi-line text support

#### Basic Usage

```jsx
import { Textarea } from './components/Input';

function MyForm() {
  const [description, setDescription] = useState('');

  return (
    <Textarea
      label="Description"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      rows={4}
      fullWidth
    />
  );
}
```

#### With Character Count

```jsx
<Textarea
  label="Bio"
  value={bio}
  onChange={(e) => setBio(e.target.value)}
  maxLength={200}
  helperText="Tell us about yourself"
  rows={4}
  fullWidth
/>
```

#### Auto-resize

```jsx
<Textarea
  label="Comments"
  value={comments}
  onChange={(e) => setComments(e.target.value)}
  autoResize
  rows={3}
  fullWidth
/>
```

## Props

### Input Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | - | Input label text |
| `type` | string | 'text' | Input type (text, email, password, number, tel, url, search) |
| `value` | string \| number | '' | Input value |
| `placeholder` | string | '' | Placeholder text |
| `disabled` | boolean | false | Disabled state |
| `readOnly` | boolean | false | Read-only state |
| `required` | boolean | false | Required field indicator |
| `error` | string | '' | Error message to display |
| `helperText` | string | '' | Helper text below input |
| `prefixIcon` | node | null | Icon element before input |
| `suffixIcon` | node | null | Icon element after input |
| `fullWidth` | boolean | false | Full width input |
| `size` | string | 'md' | Size variant (sm, md, lg) |
| `id` | string | auto | Input ID |
| `name` | string | - | Input name |
| `autoComplete` | string | - | Autocomplete attribute |
| `onChange` | function | - | Change handler |
| `onFocus` | function | - | Focus handler |
| `onBlur` | function | - | Blur handler |
| `className` | string | '' | Additional CSS classes |

### Textarea Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| All Input props except `type`, `prefixIcon`, `suffixIcon` | - | - | - |
| `rows` | number | 3 | Number of visible rows |
| `maxLength` | number | - | Maximum character length |
| `autoResize` | boolean | false | Auto-resize based on content |

## Styling

The component uses CSS Modules for scoped styling and relies on theme variables for consistency.

### Theme Variables Used

- Colors: `--color-primary-*`, `--color-error-*`, `--color-neutral-*`
- Typography: `--font-family-primary`, `--font-size-*`, `--font-weight-*`
- Spacing: `--spacing-*`
- Border Radius: `--radius-*`
- Transitions: `--transition-fast`, `--timing-ease-in-out`

### Custom Styling

You can add custom styles using the `className` prop:

```jsx
<Input
  label="Custom Styled"
  className="my-custom-input"
  fullWidth
/>
```

## Accessibility

The Input component follows accessibility best practices:

- ✅ Proper label association with `htmlFor` and `id`
- ✅ ARIA attributes (`aria-invalid`, `aria-describedby`)
- ✅ Error messages announced to screen readers with `role="alert"`
- ✅ Required field indicator with `aria-label`
- ✅ Focus visible styles for keyboard navigation
- ✅ Sufficient color contrast (WCAG AA compliant)
- ✅ Touch targets at least 44x44px on mobile
- ✅ Support for high contrast mode
- ✅ Support for reduced motion preferences

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Examples

See `InputExample.jsx` for comprehensive examples of all features and use cases.

## Integration with Existing Forms

To integrate with existing forms, simply replace native input elements:

### Before

```jsx
<div className="form-group">
  <label htmlFor="email">Email</label>
  <input
    type="email"
    id="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</div>
```

### After

```jsx
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  fullWidth
/>
```

## Requirements Validation

This component validates the following requirements:

- **5.2**: Modern input field styling with clear borders, focus states, and labels
- **7.3**: Clear visual feedback for form validation errors
- **9.1**: Clear labels, borders, and focus states for form inputs
- **9.2**: Error messages displayed with appropriate styling

## Testing

The component includes:

- Unit tests for all variants and states
- Accessibility tests
- Keyboard navigation tests
- Error state tests
- Integration tests with forms

Run tests with:

```bash
npm test Input.test.jsx
```

## Future Enhancements

- [ ] Dark mode theme support
- [ ] Input masking for formatted inputs (phone, credit card, etc.)
- [ ] Autocomplete dropdown integration
- [ ] Password strength indicator
- [ ] File input variant
- [ ] Date/time picker integration
- [ ] Multi-select input
