import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import reviewService from '../../services/reviewService'
import styles from './MyReviews.module.css'

/**
 * MyReviews Component
 * History of completed reviews with modern design
 * Requirements: 5.1, 5.3
 */

const MyReviews = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reviewService.getMyReviews()
      setReviews(data || [])
    } catch (err) {
      setError(err.detail || 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getRecommendationBadge = (recommendation) => {
    const badges = {
      accept: { label: 'Accept', color: '#D1FAE5', textColor: '#065F46', icon: '✓' },
      minor_revision: { label: 'Minor Revision', color: '#FEF3C7', textColor: '#92400E', icon: '⚡' },
      major_revision: { label: 'Major Revision', color: '#FED7AA', textColor: '#9A3412', icon: '⚠️' },
      reject: { label: 'Reject', color: '#FEE2E2', textColor: '#991B1B', icon: '✕' },
    }
    
    return badges[recommendation] || { label: recommendation, color: '#F3F4F6', textColor: '#374151', icon: '●' }
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
          <p style={{ color: '#6B7280', fontSize: '1rem' }}>Loading Reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
          My Reviews
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
          History of your completed review submissions
        </p>
      </div>

      {/* Stats Card */}
      <div className={styles.statsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: '500' }}>Total Reviews</span>
            <span style={{ fontSize: '1.5rem' }}>📝</span>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
            {reviews.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: '600' }}>
            Completed submissions
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: '500' }}>Accepted Papers</span>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
            {reviews.filter(r => r.recommendation === 'accept').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: '600' }}>
            Recommended for publication
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: '500' }}>Revisions Requested</span>
            <span style={{ fontSize: '1.5rem' }}>🔄</span>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
            {reviews.filter(r => r.recommendation === 'minor_revision' || r.recommendation === 'major_revision').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: '600' }}>
            Needs improvement
          </div>
        </div>
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

      {/* Reviews List */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
            Completed Reviews
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            All your submitted review evaluations
          </p>
        </div>

        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
              No Completed Reviews
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
              You haven't completed any reviews yet
            </p>
            <Link
              to="/reviewer/dashboard"
              style={{
                display: 'inline-block',
                padding: '0.625rem 1.25rem',
                backgroundColor: '#1a5490',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              View Assignments
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map((review) => {
              const recommendationBadge = getRecommendationBadge(review.recommendation)
              
              return (
                <div 
                  key={review.id} 
                  style={{ 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '8px', 
                    padding: '1.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    e.currentTarget.style.borderColor = '#1a5490'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.borderColor = '#E5E7EB'
                  }}
                >
                  <div className={styles.reviewHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                        {review.paper_title || 'Untitled Paper'}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.75rem' }}>
                        File: {review.anonymized_filename}
                      </p>
                    </div>
                    {review.recommendation && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.5rem 0.875rem',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        backgroundColor: recommendationBadge.color,
                        color: recommendationBadge.textColor
                      }}>
                        <span>{recommendationBadge.icon}</span>
                        {recommendationBadge.label}
                      </span>
                    )}
                  </div>

                  <div className={styles.reviewMeta} style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Assigned: {formatDate(review.assigned_at)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Deadline: {formatDate(review.deadline)}</span>
                    </div>
                  </div>

                  <Link
                    to={`/reviewer/review/${review.id}`}
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#1a5490',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    View Details <span>→</span>
                  </Link>
                </div>
              )
            })}
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

export default MyReviews
