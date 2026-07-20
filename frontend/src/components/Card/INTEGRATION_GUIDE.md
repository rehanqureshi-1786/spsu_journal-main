# Card Component Integration Guide

This guide helps you integrate the Card component into existing pages and components in the Essence Journal System.

## Quick Start

1. Import the Card component
2. Replace existing card-like divs with the Card component
3. Choose appropriate variant
4. Add header/footer if needed

## Common Integration Patterns

### Pattern 1: Dashboard Statistics Cards

**Before:**
```jsx
<div style={{ 
  backgroundColor: 'white', 
  borderRadius: '12px', 
  padding: '1.5rem', 
  border: '1px solid #E5E7EB' 
}}>
  <h3>Total Papers</h3>
  <p>1,234</p>
</div>
```

**After:**
```jsx
import Card from '@/components/Card/Card';

<Card variant="default" hoverable>
  <h3>Total Papers</h3>
  <p>1,234</p>
</Card>
```

### Pattern 2: Content Cards with Headers

**Before:**
```jsx
<div className="content-card">
  <div className="card-header">
    <h3>Paper Details</h3>
  </div>
  <div className="card-body">
    <p>Paper content...</p>
  </div>
</div>
```

**After:**
```jsx
<Card 
  variant="elevated"
  header={<h3>Paper Details</h3>}
>
  <p>Paper content...</p>
</Card>
```

### Pattern 3: Action Cards with Footers

**Before:**
```jsx
<div className="action-card">
  <div className="card-content">
    <h3>Review Paper</h3>
    <p>Paper title and details...</p>
  </div>
  <div className="card-actions">
    <button>Accept</button>
    <button>Reject</button>
  </div>
</div>
```

**After:**
```jsx
<Card
  variant="outlined"
  footer={
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
      <Button variant="primary">Accept</Button>
      <Button variant="danger">Reject</Button>
    </div>
  }
>
  <h3>Review Paper</h3>
  <p>Paper title and details...</p>
</Card>
```

## Page-Specific Integration

### Author Dashboard

Replace inline styled cards with Card component:

```jsx
// Statistics cards
<div className="stats-grid">
  <Card variant="default" hoverable>
    <div className="stat-content">
      <p className="stat-label">Total Papers</p>
      <p className="stat-value">{stats.totalPapers}</p>
    </div>
  </Card>
  
  <Card variant="default" hoverable>
    <div className="stat-content">
      <p className="stat-label">Under Review</p>
      <p className="stat-value">{stats.underReview}</p>
    </div>
  </Card>
</div>
```

### Reviewer Dashboard

Use elevated cards for assignment cards:

```jsx
<Card 
  variant="elevated"
  header={
    <div className="assignment-header">
      <h3>{paper.title}</h3>
      <span className="deadline">Due: {paper.deadline}</span>
    </div>
  }
  footer={
    <Button variant="primary" onClick={() => navigate(`/review/${paper.id}`)}>
      Start Review
    </Button>
  }
>
  <p>{paper.abstract}</p>
  <div className="paper-meta">
    <span>Authors: {paper.authors}</span>
    <span>Submitted: {paper.submittedDate}</span>
  </div>
</Card>
```

### Admin Dashboard

Use outlined cards for admin sections:

```jsx
<Card 
  variant="outlined"
  header={<h3>Recent Activity</h3>}
  hoverable
  onClick={() => navigate('/admin/audit-logs')}
>
  <ul className="activity-list">
    {activities.map(activity => (
      <li key={activity.id}>{activity.description}</li>
    ))}
  </ul>
</Card>
```

### Public Pages (HomePage, AboutUs, etc.)

Use cards for content sections:

```jsx
// Feature highlights
<div className="features-grid">
  <Card variant="default" hoverable>
    <div className="feature-icon">📄</div>
    <h3>Submit Papers</h3>
    <p>Easy online submission process</p>
  </Card>
  
  <Card variant="default" hoverable>
    <div className="feature-icon">👥</div>
    <h3>Peer Review</h3>
    <p>Rigorous peer review process</p>
  </Card>
</div>
```

## Replacing Existing Card Classes

### Find and Replace Strategy

1. **Search for inline card styles:**
   ```
   style={{ backgroundColor: 'white', borderRadius:
   ```

2. **Search for card class names:**
   ```
   className="content-card"
   className="stat-card"
   className="paper-card"
   ```

3. **Replace with Card component:**
   - Determine appropriate variant
   - Extract header/footer if present
   - Add hoverable if interactive
   - Add onClick if clickable

### Common Class Mappings

| Old Class | New Component |
|-----------|---------------|
| `.content-card` | `<Card variant="default">` |
| `.stat-card` | `<Card variant="default" hoverable>` |
| `.paper-card` | `<Card variant="elevated">` |
| `.action-card` | `<Card variant="outlined">` |
| `.highlight-card` | `<Card variant="elevated" hoverable>` |

## Styling Considerations

### Maintaining Existing Layouts

If you have grid layouts for cards:

```jsx
// Keep your existing grid styles
<div className="cards-grid">
  <Card variant="default">Content 1</Card>
  <Card variant="default">Content 2</Card>
  <Card variant="default">Content 3</Card>
</div>
```

```css
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}
```

### Custom Card Styling

For page-specific card styling:

```jsx
<Card className="dashboard-stat-card" variant="default">
  <p>Custom styled card</p>
</Card>
```

```css
.dashboard-stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.dashboard-stat-card h3 {
  color: white;
}
```

## Migration Checklist

- [ ] Identify all card-like elements in your component
- [ ] Choose appropriate Card variant for each
- [ ] Extract header content if present
- [ ] Extract footer content if present
- [ ] Add hoverable prop for interactive cards
- [ ] Add onClick for clickable cards
- [ ] Test responsive behavior on mobile
- [ ] Verify accessibility (keyboard navigation)
- [ ] Remove old card CSS classes
- [ ] Update tests if needed

## Testing After Integration

1. **Visual Testing:**
   - Check all card variants render correctly
   - Verify hover effects work
   - Test on different screen sizes

2. **Interaction Testing:**
   - Test click handlers
   - Verify keyboard navigation (Tab, Enter, Space)
   - Check focus indicators

3. **Accessibility Testing:**
   - Run axe or similar tool
   - Test with screen reader
   - Verify ARIA attributes

## Common Issues and Solutions

### Issue: Cards not responsive on mobile

**Solution:** Ensure parent container has proper responsive styles:

```css
@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
}
```

### Issue: Custom styles not applying

**Solution:** Use className prop and ensure specificity:

```jsx
<Card className="my-custom-card">
  Content
</Card>
```

```css
.my-custom-card {
  /* Your custom styles */
}
```

### Issue: Header/footer not showing

**Solution:** Ensure you're passing valid React nodes:

```jsx
// ✅ Correct
<Card header={<h3>Title</h3>}>

// ❌ Incorrect
<Card header="Title">
```

### Issue: Click handler not working

**Solution:** Ensure onClick is passed directly to Card:

```jsx
// ✅ Correct
<Card onClick={handleClick}>

// ❌ Incorrect
<div onClick={handleClick}>
  <Card>
</div>
```

## Performance Considerations

- Card component is lightweight (~2KB)
- Use `hoverable` only when needed
- Avoid deeply nested cards
- Use React.memo for lists of cards if needed:

```jsx
const MemoizedCard = React.memo(Card);

{papers.map(paper => (
  <MemoizedCard key={paper.id} variant="default">
    {paper.title}
  </MemoizedCard>
))}
```

## Best Practices

1. **Choose the right variant:**
   - `default`: General content
   - `elevated`: Important/featured content
   - `outlined`: Minimal/secondary content

2. **Use hoverable wisely:**
   - Add for interactive cards
   - Don't add for static content

3. **Keep headers concise:**
   - Use for titles and metadata
   - Don't overload with content

4. **Use footers for actions:**
   - Perfect for buttons
   - Good for metadata

5. **Maintain consistency:**
   - Use same variant for similar content
   - Keep spacing consistent

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review CardExample.jsx for usage examples
- Run tests: `npm test Card.test.jsx`
- Contact the frontend team

## Next Steps

After integrating the Card component:

1. Remove old card CSS classes
2. Update component documentation
3. Add Card to your component library docs
4. Share integration patterns with team
5. Consider creating custom Card variants for specific use cases
