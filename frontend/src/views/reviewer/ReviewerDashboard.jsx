import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import reviewService from '../../services/reviewService'
import SkeletonLoader from '../../components/SkeletonLoader'
import ErrorUI from '../../components/ErrorUI'
import DeadlineIndicator from '../../components/DeadlineIndicator'
import styles from './ReviewerDashboard.module.css'

/**
 * ReviewerDashboard Component
 * Professional reviewer dashboard with modern design
 * Requirements: 8.1, 8.2, 8.3, 7.4, 7.5
 */

const ReviewerDashboard = () => {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      setError(err.detail || 'Failed to load assignments')
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

  const getStatusSummary = () => {
    const pending = assignments.filter(a => a.status === 'pending' || a.status === 'in_progress').length
    const completed = assignments.filter(a => a.status === 'completed').length
    const overdue = assignments.filter(a => 
      (a.status === 'pending' || a.status === 'in_progress') && isOverdue(a.deadline)
    ).length
    
    return { pending, completed, overdue, total: assignments.length }
  }

  const summary = getStatusSummary()

  if (loading) {
    return (
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Dashboard - Overview</h1>
          <p>Manage your review assignments and track deadlines</p>
        </div>

        {/* Metric Cards Skeleton */}
        <div className={styles.metricsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.metricCard}>
              <div style={{ marginBottom: '1rem' }}>
                <SkeletonLoader variant="text" width="120px" height="14px" />
              </div>
              <SkeletonLoader variant="text" width="80px" height="36px" />
              <div style={{ marginTop: '8px' }}>
                <SkeletonLoader variant="text" width="100px" height="12px" />
              </div>
            </div>
          ))}
        </div>

        {/* Assignments Table Skeleton */}
        <div className={styles.assignmentsSection}>
          <div style={{ marginBottom: '1.5rem' }}>
            <SkeletonLoader variant="text" width="200px" height="20px" />
          </div>
          <SkeletonLoader variant="table" />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Dashboard - Overview</h1>
        <p>Review assigned manuscripts and submit your evaluations</p>
      </div>

      {/* Error Message */}
      {error && (
        <ErrorUI 
          message={error} 
          onRetry={loadAssignments}
          title="Failed to Load Dashboard"
        />
      )}

      {/* Metric Cards */}
      <div className={styles.metricsGrid}>
        {/* Total Assignments */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Total Assignments</span>
            <span className={styles.metricIcon}>📋</span>
          </div>
          <div className={styles.metricValue}>{summary.total}</div>
          <div className={`${styles.metricSubtext} ${styles.primary}`}>All time</div>
        </div>

        {/* Pending Reviews */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Pending Reviews</span>
            <span className={styles.metricIcon}>⏳</span>
          </div>
          <div className={styles.metricValue}>{summary.pending}</div>
          <div className={`${styles.metricSubtext} ${styles.warning}`}>Action needed</div>
        </div>

        {/* Completed */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Completed</span>
            <span className={styles.metricIcon}>✅</span>
          </div>
          <div className={styles.metricValue}>{summary.completed}</div>
          <div className={`${styles.metricSubtext} ${styles.success}`}>Well done!</div>
        </div>

        {/* Overdue */}
        {summary.overdue > 0 && (
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>Overdue</span>
              <span className={styles.metricIcon}>⚠️</span>
            </div>
            <div className={styles.metricValue}>{summary.overdue}</div>
            <div className={`${styles.metricSubtext} ${styles.error}`}>Urgent attention</div>
          </div>
        )}
      </div>

      {/* Assignments Table */}
      <div className={styles.assignmentsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <h3>Review Assignments</h3>
            <p>Papers assigned for your review</p>
          </div>
          <Link to="/reviewer/assignments" className={styles.viewAllLink}>
            View All <span>→</span>
          </Link>
        </div>

        {assignments.length > 0 ? (
          <div className={styles.tableContainer}>
            <table className={styles.assignmentsTable}>
              <thead>
                <tr>
                  <th>PAPER TITLE</th>
                  <th>STATUS</th>
                  <th>ASSIGNED</th>
                  <th>DEADLINE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {assignments.slice(0, 5).map((assignment) => {
                  const statusBadge = getStatusBadge(assignment.status)
                  
                  return (
                    <tr key={assignment.id}>
                      <td data-label="Paper Title">
                        <div className={styles.paperInfo}>
                          <div className={styles.paperTitle}>
                            {assignment.paper_title || 'Untitled Paper'}
                          </div>
                          <div className={styles.paperFilename}>
                            {assignment.anonymized_filename}
                          </div>
                        </div>
                      </td>
                      <td data-label="Status">
                        <span
                          className={styles.statusBadge}
                          style={{
                            backgroundColor: statusBadge.color,
                            color: statusBadge.textColor
                          }}
                        >
                          <span className={styles.statusIcon}>{statusBadge.icon}</span>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td data-label="Assigned" className={styles.dateText}>
                        {formatDate(assignment.assigned_at)}
                      </td>
                      <td data-label="Deadline">
                        <DeadlineIndicator 
                          deadline={assignment.deadline} 
                          submittedAt={assignment.status === 'completed' ? assignment.submitted_at : null}
                        />
                      </td>
                      <td data-label="Action" style={{ textAlign: 'right' }}>
                        <Link
                          to={`/reviewer/review/${assignment.id}`}
                          className={styles.reviewButton}
                        >
                          {assignment.status === 'completed' ? 'View Review' : 'Review Now'}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h3 className={styles.emptyTitle}>No Assignments Yet</h3>
            <p className={styles.emptyText}>
              You don't have any review assignments at the moment
            </p>
          </div>
        )}
      </div>

      {/* Workload Overview */}
      {assignments.length > 0 && (
        <div className={styles.workloadGrid}>
          {/* Upcoming Deadlines */}
          <div className={styles.workloadCard}>
            <h3>Upcoming Deadlines</h3>
            <div className={styles.workloadList}>
              {assignments
                .filter(a => !isOverdue(a.deadline) && a.status !== 'completed')
                .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                .slice(0, 3)
                .map(assignment => (
                  <div key={assignment.id} className={styles.workloadItem}>
                    <span className={styles.workloadItemTitle}>
                      {assignment.paper_title || 'Untitled'}
                    </span>
                    <span className={styles.workloadItemBadge}>
                      {getDaysUntilDeadline(assignment.deadline)}d
                    </span>
                  </div>
                ))}
              {assignments.filter(a => !isOverdue(a.deadline) && a.status !== 'completed').length === 0 && (
                <p className={styles.workloadEmpty}>No upcoming deadlines</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className={styles.workloadCard}>
            <h3>Recent Activity</h3>
            <div className={styles.workloadList}>
              {assignments
                .sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at))
                .slice(0, 3)
                .map(assignment => {
                  const statusBadge = getStatusBadge(assignment.status)
                  return (
                    <div key={assignment.id} className={styles.workloadItem}>
                      <span className={styles.workloadItemTitle}>
                        {assignment.paper_title || 'Untitled'}
                      </span>
                      <span
                        className={styles.workloadItemStatus}
                        style={{
                          backgroundColor: statusBadge.color,
                          color: statusBadge.textColor
                        }}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewerDashboard
