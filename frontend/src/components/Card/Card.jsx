import React from 'react';
import PropTypes from 'prop-types';
import styles from './Card.module.css';

/**
 * Card Component
 * 
 * A modern, flexible card component with multiple variants and optional sections.
 * Supports header, body, and footer sections with consistent padding and spacing.
 * 
 * @component
 * @example
 * <Card variant="elevated" header={<h3>Title</h3>}>
 *   Card content goes here
 * </Card>
 */
const Card = ({
  children,
  variant = 'default',
  header = null,
  footer = null,
  hoverable = false,
  className = '',
  onClick,
  ...props
}) => {
  // Build class names
  const classNames = [
    styles.card,
    styles[`card--${variant}`],
    hoverable && styles['card--hoverable'],
    onClick && styles['card--clickable'],
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      } : undefined}
      {...props}
    >
      {header && (
        <div className={styles.card__header}>
          {header}
        </div>
      )}
      
      <div className={styles.card__body}>
        {children}
      </div>
      
      {footer && (
        <div className={styles.card__footer}>
          {footer}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  /** Card content */
  children: PropTypes.node.isRequired,
  
  /** Card variant style */
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined']),
  
  /** Optional header content */
  header: PropTypes.node,
  
  /** Optional footer content */
  footer: PropTypes.node,
  
  /** Enable hover effect */
  hoverable: PropTypes.bool,
  
  /** Additional CSS classes */
  className: PropTypes.string,
  
  /** Click handler (makes card interactive) */
  onClick: PropTypes.func,
};

export default Card;
