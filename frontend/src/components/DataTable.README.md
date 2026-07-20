# DataTable Component

A modern, feature-rich table component for displaying tabular data with sorting, filtering, and responsive design.

## Features

✅ **Alternating Row Colors** - Improved readability with zebra striping  
✅ **Hover Row Highlighting** - Visual feedback on row hover  
✅ **Sticky Header** - Header stays visible when scrolling  
✅ **Mobile Card View** - Automatically transforms to card layout on mobile devices  
✅ **Loading Skeleton** - Animated loading state  
✅ **Empty State** - Friendly empty state with illustration  
✅ **Sorting** - Click column headers to sort data  
✅ **Filtering** - Search across all columns  
✅ **Clickable Rows** - Optional row click handler  
✅ **Keyboard Navigation** - Full keyboard accessibility  
✅ **Custom Rendering** - Support for custom cell rendering  

## Requirements

Implements requirements: 10.1, 10.2, 10.3, 10.4, 11.4

## Usage

### Basic Example

```jsx
import DataTable from './components/DataTable'

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' }
]

const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
]

function MyComponent() {
  return (
    <DataTable 
      columns={columns} 
      data={data} 
    />
  )
}
```

### With Row Click Handler

```jsx
<DataTable 
  columns={columns} 
  data={data}
  onRowClick={(row) => console.log('Clicked:', row)}
/>
```

### With Loading State

```jsx
<DataTable 
  columns={columns} 
  data={data}
  loading={isLoading}
/>
```

### With Custom Empty State

```jsx
<DataTable 
  columns={columns} 
  data={data}
  emptyTitle="No Results"
  emptyMessage="Try adjusting your search filters"
/>
```

### With Custom Rendering

```jsx
const columns = [
  { key: 'id', label: 'ID' },
  { 
    key: 'status', 
    label: 'Status',
    render: (row) => (
      <span className={row.status === 'active' ? 'badge-success' : 'badge-error'}>
        {row.status}
      </span>
    )
  }
]

<DataTable columns={columns} data={data} />
```

### With Custom Accessor

```jsx
const columns = [
  { key: 'id', label: 'ID' },
  { 
    key: 'fullName', 
    label: 'Full Name',
    accessor: (row) => `${row.firstName} ${row.lastName}`
  }
]

<DataTable columns={columns} data={data} />
```

### Disable Sorting on Specific Columns

```jsx
const columns = [
  { key: 'id', label: 'ID', sortable: false },
  { key: 'name', label: 'Name' } // sortable by default
]

<DataTable columns={columns} data={data} />
```

### Disable Mobile Card View

```jsx
<DataTable 
  columns={columns} 
  data={data}
  mobileCardView={false}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `Array<Column>` | **Required** | Column definitions |
| `data` | `Array<Object>` | **Required** | Data to display |
| `onRowClick` | `Function` | `null` | Callback when row is clicked |
| `emptyMessage` | `String` | `'No data available'` | Message shown when data is empty |
| `emptyTitle` | `String` | `'No Results Found'` | Title shown when data is empty |
| `className` | `String` | `''` | Additional CSS class for container |
| `mobileCardView` | `Boolean` | `true` | Enable mobile card view transformation |
| `loading` | `Boolean` | `false` | Show loading skeleton |

## Column Definition

Each column object can have the following properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `key` | `String` | **Required** | Unique identifier for the column |
| `label` | `String` | **Required** | Display label for the column header |
| `sortable` | `Boolean` | `true` | Whether the column is sortable |
| `render` | `Function` | `null` | Custom render function: `(row) => ReactNode` |
| `accessor` | `Function` | `null` | Custom accessor function: `(row) => value` |

## Styling

The component uses CSS Modules for styling. All styles are defined in `DataTable.module.css` and use theme variables from the global theme system.

### CSS Classes

- `.container` - Main container
- `.filterInput` - Search input
- `.tableWrapper` - Table wrapper with scroll
- `.table` - Table element
- `.tableHeader` - Sticky header
- `.tableRow` - Table row with alternating colors
- `.mobileCard` - Mobile card view
- `.loadingContainer` - Loading skeleton container
- `.emptyState` - Empty state container

### Customization

You can override styles by passing a custom `className`:

```jsx
<DataTable 
  columns={columns} 
  data={data}
  className="my-custom-table"
/>
```

Then in your CSS:

```css
.my-custom-table {
  /* Your custom styles */
}
```

## Responsive Behavior

- **Desktop (> 768px)**: Full table view with sticky header
- **Mobile (≤ 768px)**: Card view with stacked fields (if `mobileCardView` is enabled)

## Accessibility

The component follows accessibility best practices:

- ✅ Keyboard navigation support (Tab, Enter, Space)
- ✅ ARIA labels and roles
- ✅ Focus visible styles
- ✅ Screen reader friendly
- ✅ Semantic HTML
- ✅ Touch targets meet minimum size requirements (44x44px)

## Performance

- Uses `useMemo` for data processing to avoid unnecessary re-renders
- Efficient sorting and filtering algorithms
- Minimal re-renders with proper React optimization

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Examples

See `DataTable.example.jsx` for comprehensive usage examples.

## Testing

See `DataTable.test.jsx` for unit tests covering all features.

## Related Components

- `SkeletonLoader` - Used for loading states
- Theme system - Uses global theme variables

## Migration from Old Table

If you're migrating from inline HTML tables:

**Before:**
```jsx
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody>
    {data.map(row => (
      <tr key={row.id}>
        <td>{row.name}</td>
        <td>{row.email}</td>
      </tr>
    ))}
  </tbody>
</table>
```

**After:**
```jsx
<DataTable
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
  ]}
  data={data}
/>
```

## Future Enhancements

Potential future improvements:

- [ ] Pagination support
- [ ] Column resizing
- [ ] Column reordering
- [ ] Export to CSV/Excel
- [ ] Advanced filtering (per column)
- [ ] Row selection with checkboxes
- [ ] Expandable rows
- [ ] Virtual scrolling for large datasets
- [ ] Column visibility toggle
- [ ] Saved filter presets

## License

Part of The Essence Journal System
