import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import reviewService from '../../services/reviewService'
import toastService from '../../services/toastService'
import styles from './ReviewPaper.module.css'

/**
 * ReviewPaper Component
 * View anonymized paper and submit review form with modern design
 * Requirements: 5.1, 5.3
 */

const ReviewPaper = () => {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  
  const [assignment, setAssignment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  
  const [formData, setFormData] = useState({
    recommendation: '',
    comments_for_author: '',
    comments_for_editor: '',
    review_file: null
  })

  useEffect(() => {
    loadAssignment()
  }, [assignmentId])

  const loadAssignment = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reviewService.getAssignment(assignmentId)
      setAssignment(data)
    } catch (err) {
      setError(err.detail || 'Failed to load assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadManuscript = async () => {
    if (!assignment) return
    
    try {
      setDownloading(true)
      const blob = await reviewService.downloadAnonymizedManuscript(assignment.paper_id)
      reviewService.downloadFile(blob, assignment.anonymized_filename)
      toastService.success('Manuscript downloaded successfully!')
    } catch (err) {
      const errorMsg = err.detail || 'Failed to download manuscript'
      setError(errorMsg)
      toastService.error(errorMsg)
    } finally {
      setDownloading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setFormData(prev => ({
      ...prev,
      review_file: file
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.recommendation) {
      const errorMsg = 'Please select a recommendation'
      setError(errorMsg)
      toastService.error(errorMsg)
      return
    }
    
    if (!formData.comments_for_author.trim()) {
      const errorMsg = 'Please provide comments for the author'
      setError(errorMsg)
      toastService.error(errorMsg)
      return
    }
    
    if (!formData.comments_for_editor.trim()) {
      const errorMsg = 'Please provide comments for the editor'
      setError(errorMsg)
      toastService.error(errorMsg)
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      
      await reviewService.submitReview({
        assignment_id: assignmentId,
        ...formData
      })
      
      toastService.success('Review submitted successfully!')
      navigate('/reviewer/dashboard', { 
        state: { message: 'Review submitted successfully!' }
      })
    } catch (err) {
      const errorMsg = err.detail || 'Failed to submit review'
      setError(errorMsg)
      toastService.error(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isOverdue = (deadline) => {
    return new Date(deadline) < new Date()
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'Pending', color: '#FEF3C7', textColor: '#92400E' },
      'in_progress': { label: 'In Progress', color: '#DBEAFE', textColor: '#1E40AF' },
      'completed': { label: 'Completed', color: '#D1FAE5', textColor: '#065F46' },
    }
    return statusMap[status] || { label: status, color: '#F3F4F6', textColor: '#374151' }
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
            borderTopColor: '#1a5490', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}></div>
          <p style={{ color: '#6B7280', fontSize: '1rem' }}>Loading Assignment...</p>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' }}>
            Assignment Not Found
          </h2>
          <button
            onClick={() => navigate('/reviewer/dashboard')}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: '#1a5490',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const isCompleted = assignment.status === 'completed'
  const statusBadge = getStatusBadge(assignment.status)
  const overdueStatus = isOverdue(assignment.deadline) && !isCompleted

  return (
    <div className={styles.container} style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/reviewer/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#6B7280',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#1a5490'
            e.currentTarget.style.color = '#1a5490'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#E5E7EB'
            e.currentTarget.style.color = '#6B7280'
          }}
        >
          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
            Review Paper
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            Evaluate the manuscript and provide your recommendation
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            backgroundColor: '#FEE2E2', 
            border: '1px solid #FCA5A5', 
            borderRadius: '8px', 
            padding: '1rem', 
            marginBottom: '1.5rem',
            color: '#B91C1C'
          }}>
            {error}
          </div>
        )}

        {/* Assignment Info Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB', marginBottom: '1.5rem' }}>
          <div className={styles.detailsHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
                Assignment Details
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                Paper information and deadline
              </p>
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.5rem 0.875rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              backgroundColor: statusBadge.color,
              color: statusBadge.textColor
            }}>
              {statusBadge.label}
            </span>
          </div>

          <div className={styles.detailsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Paper Title
              </div>
              <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>
                {assignment.paper_title || 'Untitled'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Anonymized Filename
              </div>
              <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>
                {assignment.anonymized_filename}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Assigned Date
              </div>
              <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>
                {formatDate(assignment.assigned_at)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Deadline
              </div>
              <div style={{ fontSize: '0.875rem', color: overdueStatus ? '#DC2626' : '#111827', fontWeight: overdueStatus ? '700' : '500' }}>
                {formatDateTime(assignment.deadline)}
                {overdueStatus && (
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#DC2626', fontWeight: '700', marginTop: '0.25rem' }}>
                    ⚠️ OVERDUE
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadManuscript}
            disabled={downloading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              backgroundColor: '#1a5490',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: downloading ? 'not-allowed' : 'pointer',
              opacity: downloading ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => !downloading && (e.currentTarget.style.backgroundColor = '#0f3d6e')}
            onMouseLeave={(e) => !downloading && (e.currentTarget.style.backgroundColor = '#1a5490')}
          >
            <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {downloading ? 'Downloading...' : 'Download Manuscript'}
          </button>
        </div>

        {/* Review Form or Completed Message */}
        {!isCompleted ? (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
                Submit Review
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                Provide your evaluation and recommendation
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Recommendation */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Recommendation <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  name="recommendation"
                  value={formData.recommendation}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select a recommendation</option>
                  <option value="accept">✓ Accept</option>
                  <option value="minor_revision">⚡ Minor Revision</option>
                  <option value="major_revision">⚠️ Major Revision</option>
                  <option value="reject">✕ Reject</option>
                </select>
              </div>

              {/* Comments for Author */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Comments for Author <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  name="comments_for_author"
                  value={formData.comments_for_author}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  placeholder="Provide constructive feedback for the author..."
                />
                <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.5rem' }}>
                  These comments will be visible to the author (anonymously)
                </p>
              </div>

              {/* Comments for Editor */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Comments for Editor <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  name="comments_for_editor"
                  value={formData.comments_for_editor}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  placeholder="Provide confidential comments for the editor..."
                />
                <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.5rem' }}>
                  These comments are confidential and will only be visible to the editor
                </p>
              </div>

              {/* Review File Upload */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Review Document (Optional)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.5rem' }}>
                  Upload a PDF document with detailed review comments (optional)
                </p>
                {formData.review_file && (
                  <p style={{ fontSize: '0.875rem', color: '#1a5490', marginTop: '0.5rem', fontWeight: '500' }}>
                    Selected: {formData.review_file.name}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className={styles.formActions} style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
                <button
                  type="button"
                  onClick={() => navigate('/reviewer/dashboard')}
                  style={{
                    padding: '0.625rem 1.25rem',
                    backgroundColor: 'white',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.625rem 1.25rem',
                    backgroundColor: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '3rem', border: '1px solid #E5E7EB', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
              Review Completed
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
              You have already submitted your review for this paper
            </p>
            <button
              onClick={() => navigate('/reviewer/dashboard')}
              style={{
                padding: '0.625rem 1.25rem',
                backgroundColor: '#1a5490',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default ReviewPaper
