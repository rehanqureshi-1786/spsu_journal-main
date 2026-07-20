# Button Component Integration Guide

This guide shows how to integrate the new Button component into existing pages of The Essence Journal System.

## Quick Start

### 1. Import the Button Component

```javascript
import Button from '@/components/Button';
```

### 2. Replace Existing Button Elements

#### Before (Inline Styles)
```jsx
<button
  onClick={handleSubmit}
  style={{
    padding: '0.75rem 1.5rem',
    backgroundColor: '#4a9eff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }}
>
  Submit Paper
</button>
```

#### After (Button Component)
```jsx
<Button variant="primary" onClick={handleSubmit}>
  Submit Paper
</Button>
```

## Common Patterns in The Essence System

### 1. Form Submit Buttons

**Location**: `SubmitPaper.jsx`, `LoginPage.jsx`, `SignupPage.jsx`

```jsx
// Before
<button type="submit" className="btn-auth-primary" disabled={loading}>
  {loading ? 'Creating Account...' : 'Create Account'}
</button>

// After
<Button 
  type="submit" 
  variant="primary" 
  loading={loading}
  fullWidth
>
  {loading ? 'Creating Account...' : 'Create Account'}
</Button>
```

### 2. Cancel/Back Buttons

**Location**: `PaperDetail.jsx`, `ReviewPaper.jsx`, `UploadRevision.jsx`

```jsx
// Before
<button
  onClick={() => navigate('/author/dashboard')}
  style={{
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    color: '#4a9eff',
    border: '1px solid #4a9eff',
    borderRadius: '6px',
    cursor: 'pointer'
  }}
>
  ← Back
</button>

// After
<Button 
  variant="outline" 
  icon={<span>←</span>}
  onClick={() => navigate('/author/dashboard')}
>
  Back
</Button>
```

### 3. Danger/Delete Buttons

**Location**: `ManageUsers.jsx`, `ManagePapers.jsx`, `ManageReviewers.jsx`

```jsx
// Before
<button
  onClick={() => handleDelete(user.id)}
  style={{
    padding: '0.5rem 1rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }}
>
  Delete
</button>

// After
<Button 
  variant="danger" 
  size="sm"
  icon={<span>🗑️</span>}
  onClick={() => handleDelete(user.id)}
>
  Delete
</Button>
```

### 4. Download Buttons

**Location**: `PaperDetail.jsx`, `ReviewPaper.jsx`, `MyCertificates.jsx`

```jsx
// Before
<button
  onClick={handleDownload}
  style={{
    padding: '0.75rem 1.5rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }}
  disabled={downloading}
>
  {downloading ? 'Downloading...' : 'Download PDF'}
</button>

// After
<Button 
  variant="primary"
  icon={<span>📥</span>}
  loading={downloading}
  onClick={handleDownload}
>
  {downloading ? 'Downloading...' : 'Download PDF'}
</Button>
```

### 5. Filter/Tab Buttons

**Location**: `AssignedPapers.jsx`, `MyPapers.jsx`, `EditorialBoard.jsx`

```jsx
// Before
<button
  onClick={() => setFilter('all')}
  style={{
    padding: '0.75rem 1.5rem',
    backgroundColor: filter === 'all' ? '#4a9eff' : 'transparent',
    color: filter === 'all' ? 'white' : '#4a9eff',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer'
  }}
>
  All ({assignments.length})
</button>

// After
<Button 
  variant={filter === 'all' ? 'primary' : 'ghost'}
  onClick={() => setFilter('all')}
>
  All ({assignments.length})
</Button>
```

### 6. Icon-Only Buttons

**Location**: Various admin pages, modals

```jsx
// Before
<button
  onClick={handleClose}
  style={{
    padding: '0.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.5rem'
  }}
>
  ✕
</button>

// After
<Button 
  variant="ghost"
  size="sm"
  icon={<span>✕</span>}
  aria-label="Close"
  onClick={handleClose}
/>
```

### 7. Pagination Buttons

**Location**: `MyPapers.jsx`, `IssuesAndVolumes.jsx`

```jsx
// Before
<button
  onClick={() => setPage(page - 1)}
  disabled={page === 1}
  style={{
    padding: '0.5rem 1rem',
    backgroundColor: page === 1 ? '#e5e7eb' : '#4a9eff',
    color: page === 1 ? '#9ca3af' : 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: page === 1 ? 'not-allowed' : 'pointer'
  }}
>
  Previous
</button>

// After
<Button 
  variant="outline"
  size="sm"
  disabled={page === 1}
  onClick={() => setPage(page - 1)}
>
  Previous
</Button>
```

## Migration Checklist

When replacing existing buttons with the Button component:

- [ ] Import the Button component
- [ ] Replace `<button>` with `<Button>`
- [ ] Choose appropriate variant (primary, secondary, outline, ghost, danger)
- [ ] Choose appropriate size (sm, md, lg)
- [ ] Add icons if applicable
- [ ] Use `loading` prop instead of conditional rendering for loading states
- [ ] Use `disabled` prop for disabled states
- [ ] Add `aria-label` for icon-only buttons
- [ ] Remove inline styles
- [ ] Test keyboard navigation
- [ ] Test on mobile devices

## Benefits of Migration

1. **Consistency**: All buttons follow the same design system
2. **Accessibility**: Built-in ARIA attributes and keyboard navigation
3. **Maintainability**: Centralized styling, easier to update
4. **Performance**: Optimized animations and transitions
5. **Responsive**: Mobile-optimized with proper touch targets
6. **Loading States**: Built-in loading spinner
7. **Icons**: Easy icon integration
8. **Theme Integration**: Automatically uses theme colors

## Gradual Migration Strategy

You don't need to replace all buttons at once. Migrate gradually:

1. **Phase 1**: New features use Button component
2. **Phase 2**: Replace buttons in forms and modals
3. **Phase 3**: Replace buttons in dashboards
4. **Phase 4**: Replace buttons in public pages
5. **Phase 5**: Replace remaining buttons

## Troubleshooting

### Button doesn't look right
- Ensure theme CSS is imported in your app
- Check that CSS modules are configured in Vite
- Verify the Button.module.css file is in the same directory

### Icons not displaying
- Ensure icon is a valid React element
- For icon-only buttons, don't pass children
- Add `aria-label` for accessibility

### Ripple effect not working
- Set `ripple={true}` prop
- Ensure button is not disabled or loading
- Check browser console for errors

### Button not responding to clicks
- Check if button is disabled or loading
- Verify onClick handler is passed correctly
- Check browser console for errors

## Examples by Page Type

### Public Pages (Login, Signup)
```jsx
<Button variant="primary" type="submit" fullWidth loading={loading}>
  Sign In
</Button>
<Button variant="outline" fullWidth>
  Sign Up
</Button>
```

### Author Dashboard
```jsx
<Button variant="primary" icon={<span>📝</span>}>
  Submit New Paper
</Button>
<Button variant="outline" icon={<span>📄</span>}>
  View My Papers
</Button>
```

### Admin Pages
```jsx
<Button variant="primary" size="sm" onClick={handleAdd}>
  Add User
</Button>
<Button variant="danger" size="sm" onClick={handleDelete}>
  Delete
</Button>
<Button variant="ghost" size="sm" onClick={handleEdit}>
  Edit
</Button>
```

### Modals/Dialogs
```jsx
<Button variant="ghost" onClick={handleCancel}>
  Cancel
</Button>
<Button variant="primary" onClick={handleConfirm}>
  Confirm
</Button>
```

## Need Help?

Refer to the main README.md for complete API documentation and examples.
