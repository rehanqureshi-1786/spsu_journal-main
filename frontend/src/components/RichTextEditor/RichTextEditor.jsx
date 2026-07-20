import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import styles from './RichTextEditor.module.css';

/**
 * RichTextEditor Component
 * 
 * A WYSIWYG rich text editor component with customizable toolbar and features.
 * Built on top of Quill editor with theme integration.
 * 
 * @component
 * @example
 * <RichTextEditor
 *   value={content}
 *   onChange={setContent}
 *   placeholder="Enter content..."
 * />
 */
const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  readOnly = false,
  toolbar = 'full',
  maxLength = null,
  showCharCount = false,
  className = '',
  ...props
}) => {
  // Define toolbar configurations
  const toolbarConfigs = {
    full: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
    basic: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
    minimal: [
      ['bold', 'italic'],
      ['link']
    ]
  };

  // Quill modules configuration
  const modules = useMemo(() => ({
    toolbar: Array.isArray(toolbar) ? toolbar : toolbarConfigs[toolbar] || toolbarConfigs.full,
    clipboard: {
      matchVisual: false
    }
  }), [toolbar]);

  // Quill formats
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'align',
    'link', 'image'
  ];

  // Handle change with max length validation
  const handleChange = (content, delta, source, editor) => {
    if (maxLength && editor.getLength() - 1 > maxLength) {
      return;
    }
    
    if (onChange) {
      onChange(content);
    }
  };

  // Calculate character count
  const getCharCount = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = value;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    return text.length;
  };

  const charCount = showCharCount ? getCharCount() : 0;

  // Build class names
  const containerClassNames = [
    styles.editorContainer,
    readOnly && styles['editorContainer--readonly'],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClassNames}>
      <ReactQuill
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        theme="snow"
        className={styles.editor}
        {...props}
      />
      
      {showCharCount && (
        <div className={styles.charCount}>
          {charCount}
          {maxLength && ` / ${maxLength}`} characters
        </div>
      )}
    </div>
  );
};

RichTextEditor.propTypes = {
  /** Editor content (HTML string) */
  value: PropTypes.string,
  
  /** Change handler - receives HTML content */
  onChange: PropTypes.func,
  
  /** Placeholder text */
  placeholder: PropTypes.string,
  
  /** Read-only mode */
  readOnly: PropTypes.bool,
  
  /** Toolbar configuration: 'full', 'basic', 'minimal', or custom array */
  toolbar: PropTypes.oneOfType([
    PropTypes.oneOf(['full', 'basic', 'minimal']),
    PropTypes.array
  ]),
  
  /** Maximum character length */
  maxLength: PropTypes.number,
  
  /** Show character count */
  showCharCount: PropTypes.bool,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default RichTextEditor;
