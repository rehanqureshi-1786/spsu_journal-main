# Input Component Integration Guide

This guide helps you integrate the new Input component into existing forms throughout the application.

## Quick Start

### 1. Import the Component

```jsx
import { Input, Textarea } from '../../components/Input';
```

### 2. Replace Native Inputs

Replace native `<input>` elements with the `<Input>` component:

**Before:**
```jsx
<div className="form-group">
  <label htmlFor="email">Email Address</label>
  <input
    type="email"
    id="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    required
  />
</div>
```

**After:**
```jsx
<Input
  label="Email Address"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
  fullWidth
/>
```

## Common Patterns

### Login/Signup Forms

```jsx
// Email input with icon
<Input
  label="Email Address"
  type="email"
  name="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  prefixIcon="📧"
  error={emailError}
  required
  fullWidth
/>

// Password input with toggle visibility
<Input
  label="Password"
  type={showPassword ? 'text' : 'password'}
  name="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  prefixIcon="🔒"
  suffixIcon={
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
    >
      {showPassword ? '👁️' : '👁️‍🗨️'}
    </button>
  }
  helperText="Must be at least 8 characters"
  required
  fullWidth
/>
```

### Search Inputs

```jsx
<Input
  label="Search"
  type="search"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  prefixIcon="🔍"
  placeholder="Search papers, authors..."
  fullWidth
/>
```

### Form Validation

```jsx
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState('');

const handleEmailChange = (e) => {
  const value = e.target.value;
  setEmail(value);
  
  // Validate email
  if (value && !value.includes('@')) {
    setEmailError('Please enter a valid email address');
  } else {
    setEmailError('');
  }
};

return (
  <Input
    label="Email"
    type="email"
    value={email}
    onChange={handleEmailChange}
    error={emailError}
    required
    fullWidth
  />
);
```

### Textarea for Long Text

```jsx
<Textarea
  label="Abstract"
  value={abstract}
  onChange={(e) => setAbstract(e.target.value)}
  rows={6}
  maxLength={500}
  helperText="Provide a brief abstract of your paper"
  required
  fullWidth
/>
```

## Page-Specific Integration

### LoginPage.jsx

Replace the existing input structure:

```jsx
// Old structure
<div className="form-group">
  <label htmlFor="email">Email Address</label>
  <div className="input-with-icon">
    <span className="input-icon">📧</span>
    <input
      type="email"
      id="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="yourname@spsu.edu"
      required
    />
  </div>
</div>

// New structure
<Input
  label="Email Address"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  prefixIcon="📧"
  placeholder="yourname@spsu.edu"
  required
  fullWidth
/>
```

### SignupPage.jsx

```jsx
<Input
  label="Full Name"
  type="text"
  value={fullName}
  onChange={(e) => setFullName(e.target.value)}
  required
  fullWidth
/>

<Input
  label="Email Address"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  prefixIcon="📧"
  error={emailError}
  helperText="Use your institutional email"
  required
  fullWidth
/>

<Input
  label="Affiliation"
  type="text"
  value={affiliation}
  onChange={(e) => setAffiliation(e.target.value)}
  helperText="Your university or organization"
  required
  fullWidth
/>
```

### ContactUs.jsx

```jsx
<Input
  label="Name"
  type="text"
  value={name}
  onChange={(e) => setName(e.target.value)}
  required
  fullWidth
/>

<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  prefixIcon="📧"
  required
  fullWidth
/>

<Input
  label="Subject"
  type="text"
  value={subject}
  onChange={(e) => setSubject(e.target.value)}
  required
  fullWidth
/>

<Textarea
  label="Message"
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  rows={6}
  maxLength={1000}
  helperText="Please provide details about your inquiry"
  required
  fullWidth
/>
```

### SubmitPaper.jsx

```jsx
<Input
  label="Paper Title"
  type="text"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  error={titleError}
  required
  fullWidth
/>

<Textarea
  label="Abstract"
  value={abstract}
  onChange={(e) => setAbstract(e.target.value)}
  rows={6}
  maxLength={500}
  helperText="Provide a brief abstract (max 500 characters)"
  error={abstractError}
  required
  fullWidth
/>

<Input
  label="Keywords"
  type="text"
  value={keywords}
  onChange={(e) => setKeywords(e.target.value)}
  helperText="Separate keywords with commas"
  fullWidth
/>
```

### Admin Forms

```jsx
// Create/Edit User
<Input
  label="Username"
  type="text"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  error={usernameError}
  required
  fullWidth
/>

<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  prefixIcon="📧"
  error={emailError}
  required
  fullWidth
/>

// Create/Edit Publication
<Input
  label="Publication Name"
  type="text"
  value={name}
  onChange={(e) => setName(e.target.value)}
  required
  fullWidth
/>

<Textarea
  label="Description"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  rows={4}
  fullWidth
/>
```

## Styling Considerations

### Remove Old CSS

After migrating to the Input component, you can remove old input-related CSS:

```css
/* Can be removed */
.form-group { }
.input-with-icon { }
.input-icon { }
.password-toggle { }
```

### Keep Form Layout CSS

Keep CSS for form layout and structure:

```css
/* Keep these */
.auth-form { }
.form-row { }
.form-actions { }
```

## Error Handling Pattern

Implement consistent error handling across forms:

```jsx
const [formData, setFormData] = useState({
  email: '',
  password: '',
  name: ''
});

const [errors, setErrors] = useState({});

const validateField = (name, value) => {
  let error = '';
  
  switch (name) {
    case 'email':
      if (!value.includes('@')) {
        error = 'Please enter a valid email';
      }
      break;
    case 'password':
      if (value.length < 8) {
        error = 'Password must be at least 8 characters';
      }
      break;
    case 'name':
      if (value.length < 2) {
        error = 'Name must be at least 2 characters';
      }
      break;
  }
  
  return error;
};

const handleChange = (e) => {
  const { name, value } = e.target;
  
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
  
  // Validate on change
  const error = validateField(name, value);
  setErrors(prev => ({
    ...prev,
    [name]: error
  }));
};

return (
  <form>
    <Input
      label="Email"
      type="email"
      name="email"
      value={formData.email}
      onChange={handleChange}
      error={errors.email}
      required
      fullWidth
    />
    
    <Input
      label="Password"
      type="password"
      name="password"
      value={formData.password}
      onChange={handleChange}
      error={errors.password}
      required
      fullWidth
    />
    
    <Input
      label="Name"
      type="text"
      name="name"
      value={formData.name}
      onChange={handleChange}
      error={errors.name}
      required
      fullWidth
    />
  </form>
);
```

## Migration Checklist

- [ ] Import Input/Textarea components
- [ ] Replace native input elements
- [ ] Add `fullWidth` prop for consistent sizing
- [ ] Move icons to `prefixIcon`/`suffixIcon` props
- [ ] Move validation messages to `error` prop
- [ ] Move helper text to `helperText` prop
- [ ] Update event handlers (they remain the same)
- [ ] Remove old input wrapper divs
- [ ] Test form submission
- [ ] Test validation
- [ ] Test keyboard navigation
- [ ] Test on mobile devices
- [ ] Remove unused CSS

## Testing After Integration

1. **Visual Testing**: Verify inputs look correct in all states
2. **Functional Testing**: Test form submission and validation
3. **Accessibility Testing**: Test keyboard navigation and screen readers
4. **Mobile Testing**: Verify touch targets and responsive behavior
5. **Browser Testing**: Test in Chrome, Firefox, Safari, and Edge

## Common Issues and Solutions

### Issue: Label not floating

**Solution**: Ensure you're passing the `label` prop and either `value`, `placeholder`, or the input is focused.

### Issue: Icons not aligned

**Solution**: Use the `prefixIcon` and `suffixIcon` props instead of custom wrappers.

### Issue: Error messages not showing

**Solution**: Pass error message to the `error` prop, not as a separate element.

### Issue: Full width not working

**Solution**: Add the `fullWidth` prop to the Input component.

### Issue: Validation not working

**Solution**: Ensure you're updating both the value and error states in your onChange handler.

## Support

For questions or issues with the Input component:

1. Check the README.md for component documentation
2. Review InputExample.jsx for usage examples
3. Check the test file (Input.test.jsx) for expected behavior
4. Consult the design spec for requirements

## Next Steps

After integrating the Input component:

1. Update all forms throughout the application
2. Remove old input-related CSS
3. Run the full test suite
4. Conduct accessibility audit
5. Test on multiple devices and browsers
6. Update any documentation that references old input patterns
