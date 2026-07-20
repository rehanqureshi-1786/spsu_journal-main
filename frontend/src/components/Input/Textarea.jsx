import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './Input.module.css';

/**
 * Textarea Component
 * 
 * A modern, accessible textarea component with floating labels, error states,
 * helper text, and auto-resize support.
 * 
 * @component
 * @example
 * <Textarea
 *   label="Description"
 *   value={description}
 *   onChange={(e) => setDescription(e.target.value)}
 *   rows={4}
 * />
 */
const Textarea = ({
  label,
  value = '',
  placeholder = '',
  disabled = false,
  readOnly = false,
  required = false,
  error = '',
  helperText = '',
  fullWidth = false,
  rows = 3,
  maxLength,
  autoResize = false,
  id,
  name,
  onChange,
  onFocus,
  onBlur,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const inputId = id || `textarea-${name || Math.random().toString(36).substr(2, 9)}`;

  // Determine if label should float
  const shouldFloat = isFocused || value || placeholder;

  // Build class names
  const containerClassNames = [
    styles.inputContainer,
    fullWidth && styles['inputContainer--full-width'],
    className
  ].filter(Boolean).join(' ');

  const wrapperClassNames = [
    styles.inputWrapper,
    styles['inputWrapper--md'],
    styles.textareaWrapper,
    isFocused && styles['inputWrapper--focused'],
    error && styles['inputWrapper--error'],
    disabled && styles['inputWrapper--disabled']
  ].filter(Boolean).join(' ');

  const textareaClassNames = [
    styles.input,
    styles.textarea
  ].filter(Boolean).join(' ');

  const labelClassNames = [
    styles.label,
    styles.textareaLabel,
    shouldFloat && styles['label--floating'],
    error && styles['label--error'],
    disabled && styles['label--disabled']
  ].filter(Boolean).join(' ');

  // Handle auto-resize
  const handleAutoResize = () => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Handle change
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
    handleAutoResize();
  };

  // Handle focus
  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  // Handle blur
  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  // Handle label click
  const handleLabelClick = () => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  };

  // Character count
  const characterCount = value ? value.length : 0;
  const showCharacterCount = maxLength && maxLength > 0;

  return (
    <div className={containerClassNames}>
      <div className={wrapperClassNames}>
        {/* Textarea Field */}
        <textarea
          ref={textareaRef}
          id={inputId}
          name={name}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          rows={rows}
          maxLength={maxLength}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={textareaClassNames}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />

        {/* Floating Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={labelClassNames}
            onClick={handleLabelClick}
          >
            {label}
            {required && <span className={styles.required} aria-label="required">*</span>}
          </label>
        )}
      </div>

      {/* Helper Text and Character Count */}
      <div className={styles.textareaFooter}>
        {helperText && !error && (
          <p id={`${inputId}-helper`} className={styles.helperText}>
            {helperText}
          </p>
        )}
        
        {showCharacterCount && (
          <p className={styles.characterCount}>
            {characterCount}/{maxLength}
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p id={`${inputId}-error`} className={styles.errorText} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

Textarea.propTypes = {
  /** Textarea label */
  label: PropTypes.string,
  
  /** Textarea value */
  value: PropTypes.string,
  
  /** Placeholder text */
  placeholder: PropTypes.string,
  
  /** Disabled state */
  disabled: PropTypes.bool,
  
  /** Read-only state */
  readOnly: PropTypes.bool,
  
  /** Required field */
  required: PropTypes.bool,
  
  /** Error message */
  error: PropTypes.string,
  
  /** Helper text */
  helperText: PropTypes.string,
  
  /** Full width textarea */
  fullWidth: PropTypes.bool,
  
  /** Number of rows */
  rows: PropTypes.number,
  
  /** Maximum character length */
  maxLength: PropTypes.number,
  
  /** Auto-resize based on content */
  autoResize: PropTypes.bool,
  
  /** Textarea ID */
  id: PropTypes.string,
  
  /** Textarea name */
  name: PropTypes.string,
  
  /** Change handler */
  onChange: PropTypes.func,
  
  /** Focus handler */
  onFocus: PropTypes.func,
  
  /** Blur handler */
  onBlur: PropTypes.func,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default Textarea;
