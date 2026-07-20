import React from 'react';
import './SkeletonLoader.css';

/**
 * SkeletonLoader Component
 * 
 * A reusable skeleton loader component that displays placeholder content
 * while data is being fetched. Supports multiple variants and includes
 * a shimmer animation effect.
 * 
 * @param {Object} props
 * @param {string} props.variant - The type of skeleton: 'text', 'card', 'table', 'circle'
 * @param {string} [props.width] - Custom width (e.g., '100%', '200px')
 * @param {string} [props.height] - Custom height (e.g., '20px', '100px')
 * @param {number} [props.count=1] - Number of skeleton items to render
 */
const SkeletonLoader = ({ variant = 'text', width, height, count = 1 }) => {
  const getSkeletonClass = () => {
    const baseClass = 'skeleton';
    const variantClass = `skeleton-${variant}`;
    return `${baseClass} ${variantClass}`;
  };

  const getSkeletonStyle = () => {
    const style = {};
    if (width) style.width = width;
    if (height) style.height = height;
    return style;
  };

  const renderSkeleton = () => {
    switch (variant) {
      case 'text':
        return (
          <div className={getSkeletonClass()} style={getSkeletonStyle()} />
        );
      
      case 'card':
        return (
          <div className="skeleton-card-wrapper" style={getSkeletonStyle()}>
            <div className="skeleton skeleton-card-image" />
            <div className="skeleton-card-content">
              <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: '8px' }} />
              <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: '8px' }} />
              <div className="skeleton skeleton-text" style={{ width: '90%' }} />
            </div>
          </div>
        );
      
      case 'table':
        return (
          <div className="skeleton-table-wrapper" style={getSkeletonStyle()}>
            {/* Table header */}
            <div className="skeleton-table-row skeleton-table-header">
              <div className="skeleton skeleton-text" style={{ width: '20%' }} />
              <div className="skeleton skeleton-text" style={{ width: '30%' }} />
              <div className="skeleton skeleton-text" style={{ width: '25%' }} />
              <div className="skeleton skeleton-text" style={{ width: '25%' }} />
            </div>
            {/* Table rows */}
            {[...Array(5)].map((_, index) => (
              <div key={index} className="skeleton-table-row">
                <div className="skeleton skeleton-text" style={{ width: '20%' }} />
                <div className="skeleton skeleton-text" style={{ width: '30%' }} />
                <div className="skeleton skeleton-text" style={{ width: '25%' }} />
                <div className="skeleton skeleton-text" style={{ width: '25%' }} />
              </div>
            ))}
          </div>
        );
      
      case 'circle':
        return (
          <div className={getSkeletonClass()} style={getSkeletonStyle()} />
        );
      
      default:
        return (
          <div className={getSkeletonClass()} style={getSkeletonStyle()} />
        );
    }
  };

  // Render multiple skeletons if count > 1
  if (count > 1) {
    return (
      <div className="skeleton-group">
        {[...Array(count)].map((_, index) => (
          <div key={index} className="skeleton-item">
            {renderSkeleton()}
          </div>
        ))}
      </div>
    );
  }

  return renderSkeleton();
};

export default SkeletonLoader;
