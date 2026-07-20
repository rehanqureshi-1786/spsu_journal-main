import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import paperService from '../../services/paperService'
import toastService from '../../services/toastService'
import FileUpload from '../../components/FileUpload'
import styles from './UploadRevision.module.css'

/**
 * UploadRevision Component
 * Upload revised version of a paper
 * Requirements: 6.5
 */

const UploadRevision = () => {
  const { paperId } = useParams()
  const navigate = useNavigate()
  const [paper, setPaper] = useState(null)
  const [file, setFile] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    loadPaper()
  }, [paperId])

  const loadPaper = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await paperService.getPaper(paperId)
      setPaper(data)
      
      // Check if revision is allowed
      if (data.status !== 'Revision Required') {
        setError('This paper does not require revision at this time.')
      }
    } catch (err) {
      setError(err.detail || 'Failed to load paper')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile)
    setSubmitError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)

    if (!file) {
      const errorMsg = 'Please select a PDF file to upload'
      setSubmitError(errorMsg)
      toastService.error(errorMsg)
      return
    }

    try {
      setSubmitting(true)
      setUploadProgress(0)
      await paperService.uploadRevision(paperId, file, notes.trim() || null, (progress) => {
        setUploadProgress(progress)
      })
      
      toastService.success('Revision uploaded successfully!')
      // Navigate back to paper detail
      navigate(`/author/papers/${paperId}`)
    } catch (err) {
      const errorMsg = err.detail || 'Failed to upload revision. Please try again.'
      setSubmitError(errorMsg)
      toastService.error(errorMsg)
    } finally {
      setSubmitting(false)
      setUploadProgress(0)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '500px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            display: 'inline-block', 
            width: '48px', 
            height: '48px', 
            border: '4px solid #E5E7EB', 
            borderTopColor: '#10B981', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}></div>
          <p style={{ color: '#6B7280', fontSize: '1rem' }}>Loading Paper...</p>
        </div>
      </div>
    )
  }

  if (error || !paper) {
    return (
      <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ 
            backgroundColor: '#FEE2E2', 
            border: '1px solid #FCA5A5', 
            borderRadius: '8px', 
            padding: '1rem', 
            marginBottom: '1.5rem',
            color: '#B91C1C'
          }}>
            {error || 'Paper not found'}
          </div>
          <button
            onClick={() => navigate(`/author/papers/${paperId}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: '#10B981',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#059669'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#10B981'}
          >
            ← Back to Paper Details
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '768px', margin: '0 auto' }}>
        {/* Back Button */}
        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={() => navigate(`/author/papers/${paperId}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: '#10B981',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#059669'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#10B981'}
          >
            <svg
              style={{ width: '20px', height: '20px' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Paper Details
          </button>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
            Upload Revision
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {paper.title}
          </p>
        </div>

        {/* Info Notice */}
        <div style={{ 
          backgroundColor: '#D1FAE5', 
          border: '1px solid #A7F3D0', 
          borderRadius: '12px', 
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flexShrink: 0 }}>
              <svg
                style={{ width: '24px', height: '24px', color: '#10B981' }}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#065F46', marginBottom: '0.5rem' }}>
                Before You Upload
              </h3>
              <ul style={{ fontSize: '0.875rem', color: '#047857', lineHeight: '1.6', paddingLeft: '1.25rem', margin: 0 }}>
                <li>Review all feedback from reviewers carefully</li>
                <li>Address all requested changes in your revision</li>
                <li>Ensure your file is in PDF format</li>
                <li>Include revision notes to help reviewers identify changes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className={styles.formCard} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
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

            {/* File Upload */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Revised Manuscript <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <FileUpload
                onFileSelect={handleFileSelect}
                accept=".pdf"
                maxSize={10485760}
                disabled={submitting}
              />
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6B7280' }}>
                Upload the revised version of your manuscript addressing all reviewer feedback.
              </p>
            </div>

            {/* Revision Notes */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="notes" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Revision Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#111827',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: '1.5'
                }}
                placeholder="Describe the changes you made in this revision..."
                disabled={submitting}
              />
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6B7280' }}>
                Provide a summary of changes to help reviewers evaluate your revision.
              </p>
            </div>

            {/* Actions */}
            <div className={styles.formActions} style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
              <button
                type="button"
                onClick={() => navigate(`/author/papers/${paperId}`)}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
                disabled={submitting}
                onMouseEnter={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                onMouseLeave={(e) => !submitting && (e.currentTarget.style.backgroundColor = 'white')}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: !file || submitting ? '#9CA3AF' : '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: !file || submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                disabled={submitting || !file}
                onMouseEnter={(e) => !submitting && file && (e.currentTarget.style.backgroundColor = '#059669')}
                onMouseLeave={(e) => !submitting && file && (e.currentTarget.style.backgroundColor = '#10B981')}
              >
                {submitting ? `Uploading... ${uploadProgress}%` : 'Upload Revision'}
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
                  Uploading revision... {uploadProgress}%
                </p>
              </div>
            )}
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default UploadRevision
