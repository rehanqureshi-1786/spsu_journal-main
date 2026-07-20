import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import paperService from '../../services/paperService'
import toastService from '../../services/toastService'
import styles from './PaperDetail.module.css'

/**
 * PaperDetail Component
 * Paper details with timeline and reviews - modern design
 * Requirements: 3.6, 6.1, 6.3
 */

const PaperDetail = () => {
  const { paperId } = useParams()
  const navigate = useNavigate()
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadPaper()
  }, [paperId])

  const loadPaper = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await paperService.getPaper(paperId)
      setPaper(data)
    } catch (err) {
      setError(err.detail || 'Failed to load paper')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const blob = await paperService.downloadPaper(paperId)
      paperService.downloadFile(blob, paper.original_filename || 'paper.pdf')
      toastService.success('Paper downloaded successfully!')
    } catch (err) {
      toastService.error(err.detail || 'Failed to download paper')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'submitted': { label: 'Submitted', color: '#FEF3C7', textColor: '#92400E' },
      'under_review': { label: 'Under Review', color: '#DBEAFE', textColor: '#1E40AF' },
      'accepted': { label: 'Accepted', color: '#D1FAE5', textColor: '#065F46' },
      'rejected': { label: 'Rejected', color: '#FEE2E2', textColor: '#991B1B' },
      'published': { label: 'Published', color: '#E0E7FF', textColor: '#3730A3' },
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
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
            onClick={() => navigate('/author/papers')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#6B7280',
              cursor: 'pointer'
            }}
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Papers
          </button>
        </div>
      </div>
    )
  }

  const canUploadRevision = paper.status === 'Revision Required'
  const statusBadge = getStatusBadge(paper.status)

  return (
    <div className={styles.container} style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/author/papers')}
          style={{
            display: 'inline-flex',
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
            e.currentTarget.style.borderColor = '#10B981'
            e.currentTarget.style.color = '#10B981'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#E5E7EB'
            e.currentTarget.style.color = '#6B7280'
          }}
        >
          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Papers
        </button>

        {/* Paper Header */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #E5E7EB', marginBottom: '1.5rem' }}>
          <div className={styles.paperHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' }}>
                {paper.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                  Submitted: {formatDate(paper.submitted_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              onClick={handleDownload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1rem',
                backgroundColor: 'white',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Manuscript
            </button>
            <Link
              to={`/author/papers/${paperId}/timeline`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1rem',
                backgroundColor: 'white',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View Timeline
            </Link>
            <Link
              to={`/author/papers/${paperId}/reviews`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1rem',
                backgroundColor: 'white',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Reviews
            </Link>
            {canUploadRevision && (
              <Link
                to={`/author/papers/${paperId}/revise`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1rem',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Revision
              </Link>
            )}
          </div>

          {/* Abstract */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', marginBottom: '0.75rem' }}>
              Abstract
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {paper.abstract}
            </p>
          </div>

          {/* Keywords */}
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', marginBottom: '0.75rem' }}>
              Keywords
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {paper.keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.5rem 0.875rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    backgroundColor: '#D1FAE5',
                    color: '#065F46'
                  }}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Revision Required Notice */}
        {canUploadRevision && (
          <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ flexShrink: 0 }}>
                <svg style={{ width: '20px', height: '20px', color: '#F59E0B' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#92400E', marginBottom: '0.25rem' }}>
                  Revision Required
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#92400E' }}>
                  Your paper requires revisions. Please review the feedback and upload a revised version.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' }}>
            Submission Details
          </h2>
          <div className={styles.metadataGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Paper ID
              </div>
              <div style={{ fontSize: '0.875rem', color: '#111827', fontFamily: 'monospace', fontWeight: '500' }}>
                {paper.id}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Status
              </div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '600',
                backgroundColor: statusBadge.color,
                color: statusBadge.textColor
              }}>
                {statusBadge.label}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Submitted
              </div>
              <div style={{ fontSize: '0.875rem', color: '#111827' }}>
                {formatDate(paper.submitted_at)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Last Updated
              </div>
              <div style={{ fontSize: '0.875rem', color: '#111827' }}>
                {formatDate(paper.updated_at)}
              </div>
            </div>
            {paper.original_filename && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Original Filename
                </div>
                <div style={{ fontSize: '0.875rem', color: '#111827' }}>
                  {paper.original_filename}
                </div>
              </div>
            )}
          </div>
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

export default PaperDetail
