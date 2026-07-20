import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import paperService from '../../services/paperService'
import toastService from '../../services/toastService'
import FileUpload from '../../components/FileUpload'
import styles from './SubmitPaper.module.css'

/**
 * SubmitPaper Component
 * Paper submission form with file upload and modern design
 * Requirements: 3.2
 */

const SubmitPaper = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    keywords: '',
    file: null,
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitError, setSubmitError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }))
    }
  }

  const handleFileSelect = (file) => {
    setFormData((prev) => ({
      ...prev,
      file,
    }))
    if (errors.file) {
      setErrors((prev) => ({
        ...prev,
        file: null,
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.abstract.trim()) {
      newErrors.abstract = 'Abstract is required'
    }

    if (!formData.keywords.trim()) {
      newErrors.keywords = 'Keywords are required'
    }

    if (!formData.file) {
      newErrors.file = 'PDF file is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) {
      return
    }

    try {
      setSubmitting(true)
      setUploadProgress(0)

      const keywordsArray = formData.keywords
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0)

      const submissionData = {
        title: formData.title.trim(),
        abstract: formData.abstract.trim(),
        keywords: keywordsArray,
        file: formData.file,
      }

      const result = await paperService.submitPaper(submissionData, (progress) => {
        setUploadProgress(progress)
      })
      toastService.success('Paper submitted successfully!')
      navigate(`/author/papers/${result.id}`)
    } catch (err) {
      const errorMsg = err.detail || 'Failed to submit paper. Please try again.'
      setSubmitError(errorMsg)
      toastService.error(errorMsg)
    } finally {
      setSubmitting(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className={styles.container} style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
            Submit New Paper
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            Submit your manuscript for peer review
          </p>
        </div>

        {/* Form */}
        <div className={styles.formCard} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #E5E7EB' }}>
          <form onSubmit={handleSubmit}>
            {submitError && (
              <div style={{ 
                backgroundColor: '#FEE2E2', 
                border: '1px solid #FCA5A5', 
                borderRadius: '8px', 
                padding: '1rem', 
                marginBottom: '1.5rem',
                color: '#B91C1C'
              }}>
                {submitError}
              </div>
            )}

            {/* Title */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="title" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Title <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: errors.title ? '1px solid #FCA5A5' : '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
                placeholder="Enter paper title"
                disabled={submitting}
              />
              {errors.title && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#DC2626' }}>{errors.title}</p>
              )}
            </div>

            {/* Abstract */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="abstract" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Abstract <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <textarea
                id="abstract"
                name="abstract"
                rows={6}
                value={formData.abstract}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: errors.abstract ? '1px solid #FCA5A5' : '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                placeholder="Enter paper abstract"
                disabled={submitting}
              />
              {errors.abstract && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#DC2626' }}>{errors.abstract}</p>
              )}
            </div>

            {/* Keywords */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="keywords" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Keywords <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                id="keywords"
                name="keywords"
                value={formData.keywords}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: errors.keywords ? '1px solid #FCA5A5' : '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
                placeholder="Enter keywords separated by commas"
                disabled={submitting}
              />
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6B7280' }}>
                Separate multiple keywords with commas (e.g., machine learning, AI, neural networks)
              </p>
              {errors.keywords && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#DC2626' }}>{errors.keywords}</p>
              )}
            </div>

            {/* File Upload */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Manuscript File <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <FileUpload
                onFileSelect={handleFileSelect}
                accept=".pdf"
                maxSize={10485760}
                disabled={submitting}
              />
              {errors.file && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#DC2626' }}>{errors.file}</p>
              )}
            </div>

            {/* Actions */}
            <div className={styles.formActions} style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
              <button
                type="button"
                onClick={() => navigate('/author/dashboard')}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  cursor: 'pointer'
                }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1
                }}
                disabled={submitting}
              >
                {submitting ? `Uploading... ${uploadProgress}%` : 'Submit Paper'}
              </button>
            </div>
            
            {/* Upload Progress Bar */}
            {submitting && uploadProgress > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ width: '100%', backgroundColor: '#E5E7EB', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${uploadProgress}%`,
                      backgroundColor: '#10B981',
                      height: '100%',
                      transition: 'width 0.3s ease'
                    }}
                  ></div>
                </div>
                <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6B7280', textAlign: 'right' }}>
                  Uploading manuscript... {uploadProgress}%
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default SubmitPaper
