import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './Input.module.css';

/**
 * Input Component
 * 
 * A modern, accessible input component with floating labels, error states,
 * helper text, and icon support.
 * 
 * @component
 * @example
 * <Input
 *   label="Email"
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   error="Invalid email address"
 * />
 */
const Input = ({
  label,
  type = 'text',
  value = '',
  placeholder = '',
  disabled = false,
  readOnly = false,
  required = false,
  error = '',
  helperText = '',
  prefixIcon = null,
  suffixIcon = null,
  fullWidth = false,
  size = 'md',
  id,
  name,
  autoComplete,
  onChange,
  onFocus,
  onBlur,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const inputId = id || `input-${name || Math.random().toString(36).substr(2, 9)}`;

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
    styles[`inputWrapper--${size}`],
    isFocused && styles['inputWrapper--focused'],
    error && styles['inputWrapper--error'],
    disabled && styles['inputWrapper--disabled'],
    prefixIcon && styles['inputWrapper--with-prefix'],
    suffixIcon && styles['inputWrapper--with-suffix']
  ].filter(Boolean).join(' ');

  const inputClassNames = [
    styles.input,
    prefixIcon && styles['input--with-prefix'],
    suffixIcon && styles['input--with-suffix']
  ].filter(Boolean).join(' ');

  const labelClassNames = [
    styles.label,
    shouldFloat && styles['label--floating'],
    error && styles['label--error'],
    disabled && styles['label--disabled']
  ].filter(Boolean).join(' ');

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
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={containerClassNames}>
      <div className={wrapperClassNames}>
        {/* Prefix Icon */}
        {prefixIcon && (
          <span className={styles.prefixIcon} aria-hidden="true">
            {prefixIcon}
          </span>
        )}

        {/* Input Field */}
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          autoComplete={autoComplete}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={inputClassNames}
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

        {/* Suffix Icon */}
        {suffixIcon && (
          <span className={styles.suffixIcon} aria-hidden="true">
            {suffixIcon}
          </span>
        )}
      </div>

      {/* Helper Text */}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className={styles.helperText}>
          {helperText}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <p id={`${inputId}-error`} className={styles.errorText} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

Input.propTypes = {
  /** Input label */
  label: PropTypes.string,
  
  /** Input type */
  type: PropTypes.oneOf(['text', 'email', 'password', 'number', 'tel', 'url', 'search']),
  
  /** Input value */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  
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
  
  /** Prefix icon element */
  prefixIcon: PropTypes.node,
  
  /** Suffix icon element */
  suffixIcon: PropTypes.node,
  
  /** Full width input */
  fullWidth: PropTypes.bool,
  
  /** Input size */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  
  /** Input ID */
  id: PropTypes.string,
  
  /** Input name */
  name: PropTypes.string,
  
  /** Autocomplete attribute */
  autoComplete: PropTypes.string,
  
  /** Change handler */
  onChange: PropTypes.func,
  
  /** Focus handler */
  onFocus: PropTypes.func,
  
  /** Blur handler */
  onBlur: PropTypes.func,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default Input;
