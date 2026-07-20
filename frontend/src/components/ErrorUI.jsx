import React from 'react';

/**
 * ErrorUI Component
 * 
 * A reusable error display component that shows error messages
 * with an optional retry button. Used to replace skeleton loaders
 * when data loading fails.
 * 
 * @param {Object} props
 * @param {string} props.message - The error message to display
 * @param {Function} [props.onRetry] - Optional callback function for retry button
 * @param {string} [props.title] - Optional error title (defaults to "Error Loading Data")
 */
const ErrorUI = ({ message, onRetry, title = 'Error Loading Data' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem',
      minHeight: '300px',
      backgroundColor: '#FEF2F2',
      border: '1px solid #FCA5A5',
      borderRadius: '12px',
      textAlign: 'center'
    }}>
      {/* Error Icon */}
      <div style={{
        fontSize: '3rem',
        marginBottom: '1rem',
        color: '#DC2626'
      }}>
        ⚠️
      </div>

      {/* Error Title */}
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#991B1B',
        marginBottom: '0.5rem'
      }}>
        {title}
      </h3>

      {/* Error Message */}
      <p style={{
        fontSize: '0.875rem',
        color: '#B91C1C',
        marginBottom: onRetry ? '1.5rem' : '0',
        maxWidth: '500px'
      }}>
        {message || 'An unexpected error occurred. Please try again.'}
      </p>

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '0.625rem 1.25rem',
            backgroundColor: '#DC2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B91C1C'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
        >
          <span>🔄</span> Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorUI;
