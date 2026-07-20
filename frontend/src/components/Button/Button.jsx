import React from 'react';
import PropTypes from 'prop-types';
import styles from './Button.module.css';

/**
 * Button Component
 * 
 * A modern, accessible button component with multiple variants, sizes, and states.
 * Supports icons, loading states, and smooth transitions.
 * 
 * @component
 * @example
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click Me
 * </Button>
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  ripple = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) => {
  const buttonRef = React.useRef(null);

  // Build class names
  const classNames = [
    styles.button,
    styles[`button--${variant}`],
    styles[`button--${size}`],
    disabled && styles['button--disabled'],
    loading && styles['button--loading'],
    fullWidth && styles['button--full-width'],
    icon && !children && styles['button--icon-only'],
    className
  ].filter(Boolean).join(' ');

  // Handle ripple effect
  const handleRipple = (e) => {
    if (!ripple || disabled || loading) return;

    const button = buttonRef.current;
    const rippleElement = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    rippleElement.style.width = rippleElement.style.height = `${size}px`;
    rippleElement.style.left = `${x}px`;
    rippleElement.style.top = `${y}px`;
    rippleElement.classList.add(styles.ripple);

    button.appendChild(rippleElement);

    setTimeout(() => {
      rippleElement.remove();
    }, 600);
  };

  // Handle click
  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }

    handleRipple(e);

    if (onClick) {
      onClick(e);
    }
  };

  // Loading spinner
  const LoadingSpinner = () => (
    <span className={styles.spinner} aria-hidden="true">
      <span className={styles.spinnerCircle}></span>
    </span>
  );

  return (
    <button
      ref={buttonRef}
      type={type}
      className={classNames}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-busy={loading}
      {...props}
    >
      {loading && <LoadingSpinner />}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      
      {children && (
        <span className={styles.content}>
          {children}
        </span>
      )}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  );
};

Button.propTypes = {
  /** Button content */
  children: PropTypes.node,
  
  /** Button variant style */
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'danger']),
  
  /** Button size */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  
  /** Disabled state */
  disabled: PropTypes.bool,
  
  /** Loading state */
  loading: PropTypes.bool,
  
  /** Full width button */
  fullWidth: PropTypes.bool,
  
  /** Icon element */
  icon: PropTypes.node,
  
  /** Icon position */
  iconPosition: PropTypes.oneOf(['left', 'right']),
  
  /** Enable ripple effect */
  ripple: PropTypes.bool,
  
  /** Button type */
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  
  /** Click handler */
  onClick: PropTypes.func,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default Button;
