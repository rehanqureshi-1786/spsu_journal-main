import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import paperService from '../../services/paperService'
import toastService from '../../services/toastService'
import styles from './ViewReviews.module.css'

/**
 * ViewReviews Component
 * Anonymized reviewer feedback for authors
 * Requirements: 6.3
 */

const ViewReviews = () => {
  const { paperId } = useParams()
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [paperId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load both paper details and reviews
      const [paperData, reviewsData] = await Promise.all([
        paperService.getPaper(paperId),
        paperService.getPaperReviews(paperId),
      ])
      
      setPaper(paperData)
      setReviews(reviewsData.reviews || reviewsData || [])
    } catch (err) {
      setError(err.detail || 'Failed to load reviews')
    } finally {
      setLoading(false)
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

  const getRecommendationBadge = (recommendation) => {
    const badges = {
      accept: { bg: '#D1FAE5', color: '#065F46', icon: '✓' },
      minor_revision: { bg: '#FEF3C7', color: '#92400E', icon: '⚠' },
      major_revision: { bg: '#FED7AA', color: '#9A3412', icon: '⚠' },
      reject: { bg: '#FEE2E2', color: '#991B1B', icon: '✕' },
    }
    return badges[recommendation] || { bg: '#F3F4F6', color: '#374151', icon: '●' }
  }

  const formatRecommendation = (recommendation) => {
    return recommendation
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
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
          <p style={{ color: '#6B7280', fontSize: '1rem' }}>Loading Reviews...</p>
        </div>
      </div>
    )
  }

  if (error) {
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
            {error}
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
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
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
            Reviews
          </h1>
          {paper && (
            <p style={{ fontSize: '0.875rem', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {paper.title}
            </p>
          )}
        </div>

        {/* Anonymization Notice */}
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
                Blind Peer Review
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#047857', lineHeight: '1.5' }}>
                Reviewer identities are anonymized to ensure unbiased feedback. 
                Reviews are shown as "Reviewer #1", "Reviewer #2", etc.
              </p>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
              No Reviews Yet
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              Reviews will appear here once reviewers submit their feedback.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {reviews.map((review) => {
              const badge = getRecommendationBadge(review.recommendation)
              
              return (
                <div key={review.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                  {/* Review Header */}
                  <div className={styles.reviewHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
                        {review.reviewer_identity}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                        Submitted: {formatDate(review.submitted_at)}
                      </p>
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      backgroundColor: badge.bg,
                      color: badge.color
                    }}>
                      <span style={{ fontSize: '0.875rem' }}>{badge.icon}</span>
                      {formatRecommendation(review.recommendation)}
                    </span>
                  </div>

                  {/* Review Comments */}
                  {review.comments_for_author && (
                    <div style={{ marginTop: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>
                        Comments for Author
                      </h4>
                      <div style={{ backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '1rem', border: '1px solid #E5E7EB' }}>
                        <p style={{ fontSize: '0.875rem', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                          {review.comments_for_author}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Review File */}
                  {review.review_file && (
                    <div style={{ marginTop: '1.25rem' }}>
                      <button
                        onClick={() => {
                          // TODO: Implement review file download
                          toastService.info('Review file download not yet implemented')
                        }}
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
                          style={{ width: '16px', height: '16px' }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Download Review Document
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Summary */}
        {reviews.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB', marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', marginBottom: '1.25rem' }}>
              Review Summary
            </h3>
            <div className={styles.summaryGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', marginBottom: '0.5rem' }}>
                  Total Reviews
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#111827' }}>
                  {reviews.length}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', marginBottom: '0.5rem' }}>
                  Recommendations
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {Object.entries(
                    reviews.reduce((acc, review) => {
                      acc[review.recommendation] = (acc[review.recommendation] || 0) + 1
                      return acc
                    }, {})
                  ).map(([rec, count]) => (
                    <div key={rec} style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                      {formatRecommendation(rec)}: {count}
                    </div>
                  ))}
                </div>
              </div>
            </div>
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

export default ViewReviews
