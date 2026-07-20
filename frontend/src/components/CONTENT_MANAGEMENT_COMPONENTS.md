# Content Management Components

This document describes the three reusable UI components created for the content management system.

## Components Overview

### 1. RichTextEditor

A WYSIWYG rich text editor built on React Quill with full theme integration.

**Location:** `frontend/src/components/RichTextEditor/`

**Features:**
- Customizable toolbar (full, basic, minimal, or custom)
- Character/word count tracking
- Max length validation
- Image insertion support
- Theme-integrated styling
- Read-only mode

**Usage:**
```jsx
import RichTextEditor from '../components/RichTextEditor';

function MyComponent() {
  const [content, setContent] = useState('');

  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      placeholder="Enter content..."
      toolbar="full"
      showCharCount={true}
      maxLength={5000}
    />
  );
}
```

**Props:**
- `value` (string): Editor content (HTML string)
- `onChange` (function): Change handler - receives HTML content
- `placeholder` (string): Placeholder text
- `readOnly` (boolean): Read-only mode
- `toolbar` (string|array): Toolbar configuration: 'full', 'basic', 'minimal', or custom array
- `maxLength` (number): Maximum character length
- `showCharCount` (boolean): Show character count
- `className` (string): Additional CSS classes

### 2. ImageUploader

A drag-and-drop image uploader with preview, validation, and progress tracking.

**Location:** `frontend/src/components/ImageUploader/`

**Features:**
- Drag-and-drop and click-to-browse functionality
- Image preview before upload
- Upload progress tracking
- File type and size validation
- Multiple file support
- Error handling with clear messages
- Touch device support

**Usage:**
```jsx
import ImageUploader from '../components/ImageUploader';

function MyComponent() {
  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    return data.url;
  };

  return (
    <ImageUploader
      onUpload={handleUpload}
      maxSize={5 * 1024 * 1024} // 5MB
      acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
      preview={true}
      multiple={false}
    />
  );
}
```

**Props:**
- `onUpload` (function): Upload handler - receives File object, should return Promise
- `maxSize` (number): Maximum file size in bytes (default: 5MB)
- `acceptedFormats` (array): Accepted file formats (MIME types)
- `multiple` (boolean): Allow multiple file uploads
- `preview` (boolean): Show image preview
- `disabled` (boolean): Disabled state
- `className` (string): Additional CSS classes

### 3. DragDropList

A drag-and-drop list component for reordering items with mouse and touch support.

**Location:** `frontend/src/components/DragDropList/`

**Features:**
- Drag-and-drop reordering
- Visual feedback during drag operations
- Touch device support for mobile
- Keyboard accessibility
- Smooth animations
- Empty state handling

**Usage:**
```jsx
import DragDropList from '../components/DragDropList';

function MyComponent() {
  const [items, setItems] = useState([
    { id: 1, name: 'Item 1', order: 1 },
    { id: 2, name: 'Item 2', order: 2 },
    { id: 3, name: 'Item 3', order: 3 },
  ]);

  const handleReorder = (newItems) => {
    setItems(newItems);
    // Update order in backend
  };

  return (
    <DragDropList
      items={items}
      onReorder={handleReorder}
      renderItem={(item) => (
        <div>
          <h4>{item.name}</h4>
          <p>Order: {item.order}</p>
        </div>
      )}
      keyExtractor={(item) => item.id}
    />
  );
}
```

**Props:**
- `items` (array): Array of items to display (required)
- `onReorder` (function): Callback when items are reordered - receives new array
- `renderItem` (function): Function to render each item - receives (item, index) (required)
- `keyExtractor` (function): Function to extract unique key - receives (item, index)
- `disabled` (boolean): Disabled state
- `className` (string): Additional CSS classes

## Theme Integration

All three components are fully integrated with the design system and use CSS custom properties from the theme:

**Colors:**
- `--color-primary-*` for primary actions and highlights
- `--color-neutral-*` for backgrounds, borders, and text
- `--color-error-*` for error states
- `--color-success-*` for success states

**Typography:**
- `--font-family-primary` for text
- `--font-size-*` for consistent sizing
- `--font-weight-*` for emphasis
- `--line-height-*` for readability

**Spacing:**
- `--spacing-*` for consistent padding, margins, and gaps

**Other:**
- `--border-radius-*` for rounded corners
- `--shadow-*` for depth and elevation
- `--transition-*` for smooth animations

## Dependencies

The RichTextEditor component requires the `react-quill` package:

```json
{
  "dependencies": {
    "react-quill": "^2.0.0"
  }
}
```

This has been added to `frontend/package.json` and installed.

## Accessibility

All components follow accessibility best practices:

- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- Touch target sizing (minimum 44x44px on mobile)
- Color contrast compliance

## Responsive Design

All components are fully responsive and adapt to different screen sizes:

- Mobile (< 768px): Optimized layouts, larger touch targets
- Tablet (768px - 1024px): Balanced layouts
- Desktop (> 1024px): Full-featured layouts

## Browser Compatibility

Components are tested and compatible with:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Next Steps

These components will be used in the following admin interfaces:

1. **ManageSlideshow** - Uses ImageUploader and DragDropList
2. **ManagePageContent** - Uses RichTextEditor
3. **ManageSiteConfig** - Uses ImageUploader
4. **ManageAnnouncements** - Uses RichTextEditor

See tasks 12-17 in the frontend UI modernization spec for implementation details.
