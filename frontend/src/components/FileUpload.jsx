import React, { useState, useRef } from 'react'

/**
 * FileUpload Component
 * Enhanced drag-and-drop file upload component with progress tracking and multi-file support
 * Requirements: 14.1-14.6, 20.1-20.3
 */

const FileUpload = ({ 
  onFileSelect, 
  onUpload,
  accept = '.pdf,.doc,.docx', 
  maxSize = 10485760, // 10MB default
  disabled = false,
  multiple = false,
  showProgress = false
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState([]) // Array of file objects with progress
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const validateFile = (file) => {
    // Check file type
    const acceptedTypes = accept.split(',').map(t => t.trim().toLowerCase())
    const fileExt = '.' + file.name.split('.').pop().toLowerCase()
    
    if (!acceptedTypes.includes(fileExt)) {
      return `Invalid file type. Accepted types: ${accept}`
    }

    // Check file size (validate before upload as per Requirement 14.6, 20.1)
    if (maxSize && file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2)
      return `File size must be less than ${maxSizeMB}MB`
    }

    return null
  }

  const handleFiles = (fileList) => {
    setError(null)
    const newFiles = []
    const errors = []

    // Convert FileList to array
    const fileArray = Array.from(fileList)
    
    // Validate each file
    for (const file of fileArray) {
      const validationError = validateFile(file)
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`)
      } else {
        newFiles.push({
          file,
          progress: 0,
          status: 'pending', // pending, uploading, success, error
          error: null
        })
      }
    }

    if (errors.length > 0) {
      setError(errors.join('; '))
      return
    }

    if (!multiple && newFiles.length > 1) {
      setError('Only one file can be uploaded at a time')
      return
    }

    setFiles(multiple ? [...files, ...newFiles] : newFiles)
    
    // Call legacy onFileSelect for backward compatibility
    if (onFileSelect) {
      onFileSelect(multiple ? newFiles.map(f => f.file) : newFiles[0]?.file || null)
    }

    // If onUpload is provided and showProgress is true, start upload
    if (onUpload && showProgress) {
      newFiles.forEach((fileObj, index) => {
        uploadFile(fileObj, multiple ? files.length + index : 0)
      })
    }
  }

  const uploadFile = async (fileObj, index) => {
    if (!onUpload) return

    // Update status to uploading
    updateFileStatus(index, { status: 'uploading', progress: 0 })

    try {
      // Create XMLHttpRequest for progress tracking
      await onUpload(fileObj.file, (progress) => {
        updateFileStatus(index, { progress })
      })

      // Update status to success
      updateFileStatus(index, { status: 'success', progress: 100 })
    } catch (err) {
      // Update status to error
      updateFileStatus(index, { 
        status: 'error', 
        error: err.message || 'Upload failed' 
      })
    }
  }

  const updateFileStatus = (index, updates) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles]
      if (newFiles[index]) {
        newFiles[index] = { ...newFiles[index], ...updates }
      }
      return newFiles
    })
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (disabled) return

    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleButtonClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  const handleRemove = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
    setError(null)
    
    // Update onFileSelect for backward compatibility
    if (onFileSelect) {
      const remainingFiles = files.filter((_, i) => i !== index)
      onFileSelect(multiple ? remainingFiles.map(f => f.file) : null)
    }
    
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const getStatusIcon = (status) => {
    const iconStyle = { width: '20px', height: '20px', flexShrink: 0 }
    
    switch (status) {
      case 'success':
        return (
          <svg style={{ ...iconStyle, color: '#10B981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'error':
        return (
          <svg style={{ ...iconStyle, color: '#EF4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'uploading':
        return (
          <svg style={{ ...iconStyle, color: '#3B82F6' }} fill="none" viewBox="0 0 24 24">
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 12 12"
              to="360 12 12"
              dur="1s"
              repeatCount="indefinite"
            />
          </svg>
        )
      default:
        return (
          <svg style={{ ...iconStyle, color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          position: 'relative',
          border: dragActive ? '2px dashed #3B82F6' : error ? '2px dashed #FCA5A5' : '2px dashed #D1D5DB',
          borderRadius: '8px',
          padding: '1.5rem',
          backgroundColor: dragActive ? '#EFF6FF' : error ? '#FEE2E2' : '#F9FAFB',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s'
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        onMouseEnter={(e) => !disabled && !dragActive && !error && (e.currentTarget.style.borderColor = '#9CA3AF')}
        onMouseLeave={(e) => !disabled && !dragActive && !error && (e.currentTarget.style.borderColor = '#D1D5DB')}
      >
        <input
          ref={inputRef}
          type="file"
          style={{ display: 'none' }}
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          multiple={multiple}
        />

        <div style={{ textAlign: 'center' }}>
          {files.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {files.map((fileObj, index) => (
                <div key={index} style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  padding: '0.75rem', 
                  border: '1px solid #E5E7EB' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      <div style={{ flexShrink: 0 }}>
                        {getStatusIcon(fileObj.status)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: '500', 
                          color: '#374151', 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {fileObj.file.name}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          {(fileObj.file.size / 1024).toFixed(2)} KB
                        </p>
                        {fileObj.error && (
                          <p style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '0.25rem' }}>
                            {fileObj.error}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(index)
                      }}
                      style={{
                        fontSize: '0.875rem',
                        color: '#DC2626',
                        background: 'none',
                        border: 'none',
                        cursor: disabled || fileObj.status === 'uploading' ? 'not-allowed' : 'pointer',
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.5rem'
                      }}
                      disabled={disabled || fileObj.status === 'uploading'}
                      onMouseEnter={(e) => !disabled && fileObj.status !== 'uploading' && (e.currentTarget.style.color = '#991B1B')}
                      onMouseLeave={(e) => !disabled && fileObj.status !== 'uploading' && (e.currentTarget.style.color = '#DC2626')}
                    >
                      Remove
                    </button>
                  </div>
                  
                  {/* Progress bar for uploading files */}
                  {showProgress && fileObj.status === 'uploading' && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ 
                        width: '100%', 
                        backgroundColor: '#E5E7EB', 
                        borderRadius: '9999px', 
                        height: '8px',
                        overflow: 'hidden'
                      }}>
                        <div
                          style={{
                            width: `${fileObj.progress}%`,
                            backgroundColor: '#3B82F6',
                            height: '100%',
                            transition: 'width 0.3s ease',
                            borderRadius: '9999px'
                          }}
                        ></div>
                      </div>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: '#6B7280', 
                        marginTop: '0.25rem', 
                        textAlign: 'right' 
                      }}>
                        {fileObj.progress}%
                      </p>
                    </div>
                  )}
                </div>
              ))}
              
              {multiple && (
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: '#6B7280', 
                  paddingTop: '0.5rem', 
                  borderTop: '1px solid #E5E7EB' 
                }}>
                  <span style={{ fontWeight: '500', color: '#3B82F6' }}>
                    Click to add more files
                  </span>{' '}
                  or drag and drop
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <svg
                style={{ width: '48px', height: '48px', color: '#9CA3AF', margin: '0 auto' }}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                <span style={{ fontWeight: '500', color: '#3B82F6' }}>
                  Click to upload
                </span>{' '}
                or drag and drop
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                {accept.toUpperCase()} up to {(maxSize / (1024 * 1024)).toFixed(0)}MB
                {multiple && ' (multiple files supported)'}
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#DC2626' }}>{error}</p>
      )}
    </div>
  )
}

export default FileUpload
