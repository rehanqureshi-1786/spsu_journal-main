import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import reviewService from '../../services/reviewService'
import SkeletonLoader from '../../components/SkeletonLoader'
import ErrorUI from '../../components/ErrorUI'
import DeadlineIndicator, { calculateDeadlineStatus } from '../../components/DeadlineIndicator'
import styles from './AssignedPapers.module.css'

/**
 * AssignedPapers Component
 * List of papers assigned to the reviewer with modern design
 * Requirements: 5.1, 5.6
 */

const AssignedPapers = () => {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [decisionDialog, setDecisionDialog] = useState({ open: false, assignment: null })
  const [decidingId, setDecidingId] = useState(null)
  const [acceptedIds, setAcceptedIds] = useState(new Set())

  const handleAccept = (assignmentId) => {
    setAcceptedIds(prev => new Set([...prev, assignmentId]))
  }

  const handleDecline = async (assignment) => {
    if (!confirm(`Are you sure you want to reject reviewing "${assignment.paper_title || 'this paper'}"? Admin will be notified to reassign.`)) return
    try {
      setDecidingId(assignment.id)
      await reviewService.declineAssignment(assignment.id)
      alert('Assignment declined. Admin has been notified to reassign the paper.')
      loadAssignments()
    } catch (err) {
      alert(err.detail || 'Failed to decline assignment')
    } finally {
      setDecidingId(null)
    }
  }

  useEffect(() => {
    loadAssignments()
  }, [])

  const loadAssignments = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reviewService.getAssignedPapers()
      setAssignments(data || [])
    } catch (err) {
      setError(err.detail || 'Failed to load assigned papers')
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

  const getDaysUntilDeadline = (deadline) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'Pending', color: '#FEF3C7', textColor: '#92400E', icon: '●' },
      'in_progress': { label: 'In Progress', color: '#DBEAFE', textColor: '#1E40AF', icon: '●' },
      'completed': { label: 'Completed', color: '#D1FAE5', textColor: '#065F46', icon: '●' },
    }
    return statusMap[status] || { label: status, color: '#F3F4F6', textColor: '#374151', icon: '●' }
  }

  const getFilteredAssignments = () => {
    let filtered
    switch (filter) {
      case 'pending':
        filtered = assignments.filter(a => a.status === 'pending' || a.status === 'in_progress')
        break
      case 'completed':
        filtered = assignments.filter(a => a.status === 'completed')
        break
      default:
        filtered = assignments
    }
    
    // Sort by urgency: overdue first, then by days remaining (ascending)
    return filtered.sort((a, b) => {
      const statusA = calculateDeadlineStatus(a.deadline, a.status === 'completed' ? a.submitted_at : null)
      const statusB = calculateDeadlineStatus(b.deadline, b.status === 'completed' ? b.submitted_at : null)
      
      // Completed reviews go to the end
      if (statusA.status === 'completed' && statusB.status !== 'completed') return 1
      if (statusA.status !== 'completed' && statusB.status === 'completed') return -1
      if (statusA.status === 'completed' && statusB.status === 'completed') return 0
      
      // Overdue reviews come first
      if (statusA.status === 'overdue' && statusB.status !== 'overdue') return -1
      if (statusA.status !== 'overdue' && statusB.status === 'overdue') return 1
      
      // Sort by days remaining (ascending - most urgent first)
      if (statusA.daysRemaining !== null && statusB.daysRemaining !== null) {
        return statusA.daysRemaining - statusB.daysRemaining
      }
      
      return 0
    })
  }

  const filteredAssignments = getFilteredAssignments()
  const pendingCount = assignments.filter(a => a.status === 'pending' || a.status === 'in_progress').length
  const completedCount = assignments.filter(a => a.status === 'completed').length

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
            Assigned Papers
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            View and manage your review assignments
          </p>
        </div>

        {/* Filter Tabs Skeleton */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <SkeletonLoader variant="text" width="80px" height="36px" />
            <SkeletonLoader variant="text" width="100px" height="36px" />
            <SkeletonLoader variant="text" width="110px" height="36px" />
          </div>
        </div>

        {/* Papers List Skeleton */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <SkeletonLoader variant="text" width="200px" height="20px" />
            <div style={{ marginTop: '8px' }}>
              <SkeletonLoader variant="text" width="300px" height="14px" />
            </div>
          </div>
          <SkeletonLoader variant="table" />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
          Assigned Papers
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
          View and manage your review assignments
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <ErrorUI 
          message={error} 
          onRetry={loadAssignments}
          title="Failed to Load Assigned Papers"
        />
      )}

      {/* Filter Tabs */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB', marginBottom: '1.5rem' }}>
        <div className={styles.filterTabs} style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #F3F4F6' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: filter === 'all' ? '2px solid #1a5490' : '2px solid transparent',
              marginBottom: '-2px',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: filter === 'all' ? '#1a5490' : '#6B7280',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            All ({assignments.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: filter === 'pending' ? '2px solid #1a5490' : '2px solid transparent',
              marginBottom: '-2px',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: filter === 'pending' ? '#1a5490' : '#6B7280',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: filter === 'completed' ? '2px solid #1a5490' : '2px solid transparent',
              marginBottom: '-2px',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: filter === 'completed' ? '#1a5490' : '#6B7280',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* Papers List */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
        {filteredAssignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
              No Papers Found
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              {filter === 'all' 
                ? "You don't have any review assignments at the moment"
                : `No ${filter} assignments found`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredAssignments.map((assignment) => {
              const statusBadge = getStatusBadge(assignment.status)
              const overdueStatus = isOverdue(assignment.deadline) && assignment.status !== 'completed'
              const daysLeft = getDaysUntilDeadline(assignment.deadline)
              
              return (
                <div 
                  key={assignment.id} 
                  style={{ 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '8px', 
                    padding: '1.5rem',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
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
                  <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <Link
                        to={`/reviewer/review/${assignment.id}`}
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: '#1a5490',
                          textDecoration: 'none',
                          display: 'block',
                          marginBottom: '0.5rem'
                        }}
                      >
                        {assignment.paper_title || 'Untitled Paper'}
                      </Link>
                      <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                        File: {assignment.anonymized_filename}
                      </p>
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: statusBadge.color,
                      color: statusBadge.textColor
                    }}>
                      <span style={{ fontSize: '0.5rem' }}>{statusBadge.icon}</span>
                      {statusBadge.label}
                    </span>
                  </div>

                  <div className={styles.assignmentMeta} style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Assigned: {formatDate(assignment.assigned_at)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Deadline:</span>
                      <DeadlineIndicator 
                        deadline={assignment.deadline} 
                        submittedAt={assignment.status === 'completed' ? assignment.submitted_at : null}
                      />
                    </div>
                  </div>

                  <div className={styles.assignmentActions}>
                  {/* Completed - show View Review */}
                  {assignment.status === 'completed' && (
                  <Link
                    to={`/reviewer/review/${assignment.id}`}
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
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      marginRight: '0.75rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0f3d6e'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a5490'}
                  >
                    View Review →
                  </Link>
                  )}

                  {/* Pending & not yet accepted - show Accept / Reject */}
                  {assignment.status !== 'completed' && !acceptedIds.has(assignment.id) && (
                  <>
                    <button
                      onClick={() => handleAccept(assignment.id)}
                      style={{
                        display: 'inline-block',
                        padding: '0.625rem 1.25rem',
                        backgroundColor: '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        marginRight: '0.75rem'
                      }}
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={() => handleDecline(assignment)}
                      disabled={decidingId === assignment.id}
                      style={{
                        display: 'inline-block',
                        padding: '0.625rem 1.25rem',
                        backgroundColor: '#EF4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: decidingId === assignment.id ? 'not-allowed' : 'pointer',
                        opacity: decidingId === assignment.id ? 0.6 : 1,
                        transition: 'all 0.2s'
                      }}
                    >
                      {decidingId === assignment.id ? 'Declining...' : '✕ Reject'}
                    </button>
                  </>
                  )}

                  {/* Accepted - show Review Now + Download */}
                  {assignment.status !== 'completed' && acceptedIds.has(assignment.id) && (
                  <>
                    <Link
                      to={`/reviewer/review/${assignment.id}`}
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
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        marginRight: '0.75rem'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0f3d6e'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a5490'}
                    >
                      Review Now →
                    </Link>
                    <button
                      onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL ?? ''}/papers/${assignment.paper_id}/download`, '_blank')}
                      style={{
                        display: 'inline-block',
                        padding: '0.625rem 1.25rem',
                        backgroundColor: 'white',
                        color: '#1a5490',
                        border: '1px solid #1a5490',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Download Paper
                    </button>
                  </>
                  )}
                  </div>
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

export default AssignedPapers
