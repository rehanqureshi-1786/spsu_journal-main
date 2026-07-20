import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '../Modal';
import Input from '../Input';
import Button from '../Button';
import ImageUploader from '../ImageUploader';
import slideshowService from '../../services/slideshowService';
import styles from './AddEditSlideModal.module.css';

/**
 * AddEditSlideModal Component
 * 
 * Modal for creating or editing slideshow slides with image upload,
 * caption, link, and active status.
 * 
 * @component
 */
const AddEditSlideModal = ({
  isOpen,
  onClose,
  slide = null,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    image_url: '',
    caption: '',
    link: '',
    is_active: true
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!slide;

  // Initialize form data when slide changes
  useEffect(() => {
    if (slide) {
      setFormData({
        image_url: slide.image_url || '',
        caption: slide.caption || '',
        link: slide.link || '',
        is_active: slide.is_active !== undefined ? slide.is_active : true
      });
    } else {
      setFormData({
        image_url: '',
        caption: '',
        link: '',
        is_active: true
      });
    }
    setError('');
  }, [slide, isOpen]);

  // Handle image upload
  const handleImageUpload = async (file) => {
    setUploading(true);
    setError('');
    
    try {
      const response = await slideshowService.uploadImage(file);
      setFormData(prev => ({
        ...prev,
        image_url: response.url || response.file_url
      }));
      return response.url || response.file_url;
    } catch (err) {
      setError(err.detail || 'Failed to upload image');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.image_url) {
      setError('Please upload an image');
      return;
    }

    setSaving(true);

    try {
      if (isEditMode) {
        await slideshowService.updateSlide(slide.id, formData);
      } else {
        await slideshowService.createSlide(formData);
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err.detail || `Failed to ${isEditMode ? 'update' : 'create'} slide`);
    } finally {
      setSaving(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!saving && !uploading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Edit Slide' : 'Add New Slide'}
      size="large"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Image Upload */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Slide Image <span className={styles.required}>*</span>
          </label>
          <ImageUploader
            onUpload={handleImageUpload}
            maxSize={5 * 1024 * 1024}
            acceptedFormats={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
            preview={true}
            multiple={false}
            disabled={uploading || saving}
          />
          {formData.image_url && (
            <div className={styles.currentImage}>
              <img src={formData.image_url} alt="Current slide" />
            </div>
          )}
        </div>

        {/* Caption */}
        <div className={styles.formGroup}>
          <Input
            label="Caption"
            name="caption"
            value={formData.caption}
            onChange={handleChange}
            placeholder="Enter slide caption (optional)"
            disabled={saving}
            fullWidth
          />
        </div>

        {/* Link URL */}
        <div className={styles.formGroup}>
          <Input
            label="Link URL"
            name="link"
            type="url"
            value={formData.link}
            onChange={handleChange}
            placeholder="https://example.com (optional)"
            helperText="URL to navigate to when slide is clicked"
            disabled={saving}
            fullWidth
          />
        </div>

        {/* Active Toggle */}
        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              disabled={saving}
              className={styles.checkbox}
            />
            <span>Active (display this slide)</span>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.actions}>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={saving || uploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={uploading || !formData.image_url}
          >
            {isEditMode ? 'Update Slide' : 'Create Slide'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

AddEditSlideModal.propTypes = {
  /** Whether the modal is open */
  isOpen: PropTypes.bool.isRequired,
  
  /** Function to call when modal should close */
  onClose: PropTypes.func.isRequired,
  
  /** Slide data for edit mode (null for create mode) */
  slide: PropTypes.shape({
    id: PropTypes.number.isRequired,
    image_url: PropTypes.string,
    caption: PropTypes.string,
    link: PropTypes.string,
    is_active: PropTypes.bool,
    order: PropTypes.number
  }),
  
  /** Function to call on successful save */
  onSuccess: PropTypes.func
};

export default AddEditSlideModal;
