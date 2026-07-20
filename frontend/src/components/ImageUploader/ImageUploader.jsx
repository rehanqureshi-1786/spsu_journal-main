import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './ImageUploader.module.css';

/**
 * ImageUploader Component
 * 
 * A drag-and-drop image uploader with preview, validation, and progress tracking.
 * Supports single and multiple file uploads with size and format validation.
 * 
 * @component
 * @example
 * <ImageUploader
 *   onUpload={handleUpload}
 *   maxSize={5 * 1024 * 1024}
 *   acceptedFormats={['image/jpeg', 'image/png']}
 * />
 */
const ImageUploader = ({
  onUpload,
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  multiple = false,
  preview = true,
  disabled = false,
  className = '',
  ...props
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Validate file
  const validateFile = (file) => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      const formats = acceptedFormats.map(f => f.split('/')[1]).join(', ');
      return `Invalid file type. Accepted formats: ${formats}`;
    }

    // Check file size
    if (file.size > maxSize) {
      const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `File size exceeds ${sizeMB}MB limit`;
    }

    return null;
  };

  // Generate preview for image file
  const generatePreview = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          file,
          url: reader.result,
          name: file.name,
          size: file.size
        });
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection
  const handleFiles = async (selectedFiles) => {
    setError('');
    const fileArray = Array.from(selectedFiles);

    // Validate files
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Generate previews
    if (preview) {
      const previewPromises = fileArray.map(generatePreview);
      const newPreviews = await Promise.all(previewPromises);
      
      if (multiple) {
        setPreviews([...previews, ...newPreviews]);
        setFiles([...files, ...fileArray]);
      } else {
        setPreviews(newPreviews);
        setFiles(fileArray);
      }
    } else {
      if (multiple) {
        setFiles([...files, ...fileArray]);
      } else {
        setFiles(fileArray);
      }
    }

    // Auto-upload if onUpload is provided
    if (onUpload) {
      await handleUpload(fileArray);
    }
  };

  // Handle upload
  const handleUpload = async (filesToUpload) => {
    if (!onUpload || uploading) return;

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        await onUpload(filesToUpload[i]);
        setProgress(((i + 1) / filesToUpload.length) * 100);
      }
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || uploading) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
  };

  // Handle click to browse
  const handleClick = () => {
    if (!disabled && !uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Remove preview
  const handleRemovePreview = (index) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    const newFiles = files.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    setFiles(newFiles);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Build class names
  const containerClassNames = [
    styles.uploader,
    isDragging && styles['uploader--dragging'],
    disabled && styles['uploader--disabled'],
    uploading && styles['uploader--uploading'],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClassNames} {...props}>
      {/* Drop zone */}
      <div
        className={styles.dropzone}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label="Upload image"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          multiple={multiple}
          onChange={handleFileInputChange}
          disabled={disabled || uploading}
          className={styles.fileInput}
          aria-hidden="true"
        />

        <div className={styles.dropzoneContent}>
          <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
          <p className={styles.dropzoneText}>
            {isDragging ? (
              <span>Drop files here</span>
            ) : (
              <>
                <span className={styles.dropzoneTextPrimary}>
                  Click to upload
                </span>
                {' or drag and drop'}
              </>
            )}
          </p>
          
          <p className={styles.dropzoneHint}>
            {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}
            {' '}(max {(maxSize / (1024 * 1024)).toFixed(1)}MB)
          </p>
        </div>
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={styles.progressText}>
            Uploading... {Math.round(progress)}%
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className={styles.error} role="alert">
          <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Preview grid */}
      {preview && previews.length > 0 && (
        <div className={styles.previewGrid}>
          {previews.map((item, index) => (
            <div key={index} className={styles.previewItem}>
              <img 
                src={item.url} 
                alt={item.name}
                className={styles.previewImage}
              />
              <div className={styles.previewOverlay}>
                <p className={styles.previewName}>{item.name}</p>
                <p className={styles.previewSize}>{formatFileSize(item.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePreview(index);
                }}
                className={styles.removeButton}
                aria-label={`Remove ${item.name}`}
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

ImageUploader.propTypes = {
  /** Upload handler - receives File object, should return Promise */
  onUpload: PropTypes.func,
  
  /** Maximum file size in bytes */
  maxSize: PropTypes.number,
  
  /** Accepted file formats (MIME types) */
  acceptedFormats: PropTypes.arrayOf(PropTypes.string),
  
  /** Allow multiple file uploads */
  multiple: PropTypes.bool,
  
  /** Show image preview */
  preview: PropTypes.bool,
  
  /** Disabled state */
  disabled: PropTypes.bool,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default ImageUploader;
