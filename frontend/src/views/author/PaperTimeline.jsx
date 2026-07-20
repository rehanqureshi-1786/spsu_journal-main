import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import paperService from '../../services/paperService'
import TimelineView from '../../components/TimelineView'
import styles from './PaperTimeline.module.css'

/**
 * PaperTimeline Component
 * Visual timeline of paper status changes
 * Requirements: 6.1
 */

const PaperTimeline = () => {
  const { paperId } = useParams()
  const navigate = useNavigate()
  const [timeline, setTimeline] = useState(null)
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
      
      // Load both paper details and timeline
      const [paperData, timelineData] = await Promise.all([
        paperService.getPaper(paperId),
        paperService.getPaperTimeline(paperId),
      ])
      
      setPaper(paperData)
      setTimeline(timelineData)
    } catch (err) {
      setError(err.detail || 'Failed to load timeline')
    } finally {
      setLoading(false)
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
          <p style={{ color: '#6B7280', fontSize: '1rem' }}>Loading Timeline...</p>
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
            Paper Timeline
          </h1>
          {paper && (
            <p style={{ fontSize: '0.875rem', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {paper.title}
            </p>
          )}
        </div>

        {/* Timeline Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', marginBottom: '1.5rem' }}>
            Status History
          </h2>
          {timeline && timeline.timeline && timeline.timeline.length > 0 ? (
            <TimelineView events={timeline.timeline} />
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📅</div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                No Timeline Events Yet
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                Timeline events will appear here as your paper progresses through the review process
              </p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div style={{ 
          backgroundColor: '#D1FAE5', 
          border: '1px solid #A7F3D0', 
          borderRadius: '12px', 
          padding: '1.25rem'
        }}>
          <div className={styles.infoBox} style={{ display: 'flex', gap: '1rem' }}>
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
                About the Timeline
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#047857', lineHeight: '1.5' }}>
                This timeline shows all status changes for your paper. Each entry includes the status, 
                timestamp, and any notes from the editorial team.
              </p>
            </div>
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

export default PaperTimeline
