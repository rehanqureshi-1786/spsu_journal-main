import React, { useState, useEffect } from 'react';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import DragDropList from '../../components/DragDropList';
import AddEditSlideModal from '../../components/AddEditSlideModal';
import ErrorUI from '../../components/ErrorUI';
import SkeletonLoader from '../../components/SkeletonLoader';
import slideshowService from '../../services/slideshowService';
import styles from './ManageSlideshow.module.css';

/**
 * ManageSlideshow Component
 * 
 * Admin page for managing homepage slideshow images.
 * Allows creating, editing, deleting, and reordering slides.
 */
const ManageSlideshow = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch slides on mount
  useEffect(() => {
    fetchSlides();
  }, []);

  // Fetch all slides
  const fetchSlides = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await slideshowService.getAllSlides();
      setSlides(data);
    } catch (err) {
      setError(err.detail || 'Failed to load slides');
    } finally {
      setLoading(false);
    }
  };

  // Handle add new slide
  const handleAdd = () => {
    setSelectedSlide(null);
    setModalOpen(true);
  };

  // Handle edit slide
  const handleEdit = (slide) => {
    setSelectedSlide(slide);
    setModalOpen(true);
  };

  // Handle delete slide
  const handleDelete = async (slideId) => {
    if (deleteConfirm !== slideId) {
      setDeleteConfirm(slideId);
      return;
    }

    try {
      await slideshowService.deleteSlide(slideId);
      await fetchSlides();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.detail || 'Failed to delete slide');
    }
  };

  // Handle reorder slides
  const handleReorder = async (reorderedSlides) => {
    // Optimistically update UI
    setSlides(reorderedSlides);

    try {
      await slideshowService.reorderSlides(reorderedSlides);
    } catch (err) {
      setError(err.detail || 'Failed to reorder slides');
      // Revert on error
      await fetchSlides();
    }
  };

  // Handle modal success
  const handleModalSuccess = () => {
    fetchSlides();
  };

  // Render slide item
  const renderSlide = (slide) => (
    <div className={styles.slideItem}>
      <div className={styles.slidePreview}>
        <img src={slide.image_url} alt={slide.caption || 'Slide'} loading="lazy" />
        {!slide.is_active && (
          <div className={styles.inactiveBadge}>Inactive</div>
        )}
      </div>
      
      <div className={styles.slideInfo}>
        <div className={styles.slideDetails}>
          <h4 className={styles.slideCaption}>
            {slide.caption || 'No caption'}
          </h4>
          {slide.link && (
            <p className={styles.slideLink}>
              <svg className={styles.linkIcon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
              {slide.link}
            </p>
          )}
          <p className={styles.slideOrder}>Order: {slide.order}</p>
        </div>

        <div className={styles.slideActions}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(slide)}
          >
            Edit
          </Button>
          <Button
            variant={deleteConfirm === slide.id ? 'danger' : 'outline'}
            size="sm"
            onClick={() => handleDelete(slide.id)}
          >
            {deleteConfirm === slide.id ? 'Confirm?' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Manage Slideshow</h1>
        </div>
        <SkeletonLoader count={3} height={120} />
      </div>
    );
  }

  if (error && slides.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Manage Slideshow</h1>
        </div>
        <ErrorUI
          message={error}
          onRetry={fetchSlides}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Manage Slideshow</h1>
          <p className={styles.subtitle}>
            Manage homepage slideshow images. Drag to reorder.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleAdd}
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          }
        >
          Add New Slide
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
        </div>
      )}

      {/* Slides List */}
      {slides.length === 0 ? (
        <Card>
          <div className={styles.emptyState}>
            <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3>No slides yet</h3>
            <p>Get started by adding your first slideshow image</p>
            <Button variant="primary" onClick={handleAdd}>
              Add First Slide
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <DragDropList
            items={slides}
            onReorder={handleReorder}
            renderItem={renderSlide}
            keyExtractor={(slide) => slide.id}
          />
        </Card>
      )}

      {/* Add/Edit Modal */}
      <AddEditSlideModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        slide={selectedSlide}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default ManageSlideshow;
