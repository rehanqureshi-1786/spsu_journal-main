import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './DragDropList.module.css';

/**
 * DragDropList Component
 * 
 * A drag-and-drop list component for reordering items.
 * Supports mouse and touch interactions with visual feedback.
 * 
 * @component
 * @example
 * <DragDropList
 *   items={items}
 *   onReorder={handleReorder}
 *   renderItem={(item) => <div>{item.name}</div>}
 * />
 */
const DragDropList = ({
  items = [],
  onReorder,
  renderItem,
  keyExtractor = (item, index) => item.id || index,
  disabled = false,
  className = '',
  ...props
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);

  // Handle drag start
  const handleDragStart = (e, index) => {
    if (disabled) return;
    
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
    
    // Add dragging class after a small delay to avoid flickering
    setTimeout(() => {
      e.target.classList.add(styles['item--dragging']);
    }, 0);
  };

  // Handle drag over
  const handleDragOver = (e, index) => {
    if (disabled) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  // Handle drag enter
  const handleDragEnter = (e, index) => {
    if (disabled) return;
    
    e.preventDefault();
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  // Handle drag leave
  const handleDragLeave = (e) => {
    if (disabled) return;
    
    e.preventDefault();
    setDragOverIndex(null);
  };

  // Handle drop
  const handleDrop = (e, dropIndex) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex !== null && dropIndex !== draggedIndex) {
      const newItems = [...items];
      const draggedItem = newItems[draggedIndex];
      
      // Remove dragged item
      newItems.splice(draggedIndex, 1);
      
      // Insert at new position
      newItems.splice(dropIndex, 0, draggedItem);
      
      if (onReorder) {
        onReorder(newItems);
      }
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    e.target.classList.remove(styles['item--dragging']);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Touch event handlers for mobile support
  const handleTouchStart = (e, index) => {
    if (disabled) return;
    
    setDraggedIndex(index);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e, index) => {
    if (disabled || draggedIndex === null) return;
    
    e.preventDefault();
    const touchY = e.touches[0].clientY;
    const deltaY = touchY - touchStartY;
    
    // Determine which item we're over based on touch position
    const items = document.querySelectorAll(`.${styles.item}`);
    let newDragOverIndex = draggedIndex;
    
    items.forEach((item, idx) => {
      const rect = item.getBoundingClientRect();
      if (touchY >= rect.top && touchY <= rect.bottom) {
        newDragOverIndex = idx;
      }
    });
    
    if (newDragOverIndex !== draggedIndex) {
      setDragOverIndex(newDragOverIndex);
    }
  };

  const handleTouchEnd = (e, index) => {
    if (disabled || draggedIndex === null) return;
    
    if (dragOverIndex !== null && dragOverIndex !== draggedIndex) {
      const newItems = [...items];
      const draggedItem = newItems[draggedIndex];
      
      // Remove dragged item
      newItems.splice(draggedIndex, 1);
      
      // Insert at new position
      newItems.splice(dragOverIndex, 0, draggedItem);
      
      if (onReorder) {
        onReorder(newItems);
      }
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    setTouchStartY(null);
  };

  // Build class names
  const containerClassNames = [
    styles.list,
    disabled && styles['list--disabled'],
    className
  ].filter(Boolean).join(' ');

  const getItemClassNames = (index) => {
    return [
      styles.item,
      draggedIndex === index && styles['item--dragged'],
      dragOverIndex === index && styles['item--drag-over'],
      disabled && styles['item--disabled']
    ].filter(Boolean).join(' ');
  };

  return (
    <div className={containerClassNames} {...props}>
      {items.map((item, index) => (
        <div
          key={keyExtractor(item, index)}
          className={getItemClassNames(index)}
          draggable={!disabled}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          onTouchStart={(e) => handleTouchStart(e, index)}
          onTouchMove={(e) => handleTouchMove(e, index)}
          onTouchEnd={(e) => handleTouchEnd(e, index)}
        >
          {/* Drag handle */}
          <div className={styles.dragHandle} aria-label="Drag to reorder">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z" />
            </svg>
          </div>

          {/* Item content */}
          <div className={styles.itemContent}>
            {renderItem(item, index)}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className={styles.emptyState}>
          <p>No items to display</p>
        </div>
      )}
    </div>
  );
};

DragDropList.propTypes = {
  /** Array of items to display */
  items: PropTypes.array.isRequired,
  
  /** Callback when items are reordered - receives new array */
  onReorder: PropTypes.func,
  
  /** Function to render each item - receives (item, index) */
  renderItem: PropTypes.func.isRequired,
  
  /** Function to extract unique key - receives (item, index) */
  keyExtractor: PropTypes.func,
  
  /** Disabled state */
  disabled: PropTypes.bool,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default DragDropList;
