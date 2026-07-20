import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import paperService from '../../services/paperService'
import SkeletonLoader from '../../components/SkeletonLoader'
import ErrorUI from '../../components/ErrorUI'
import styles from './AuthorDashboard.module.css'

/**
 * AuthorDashboard Component
 * Professional author dashboard with modern design
 * Requirements: 8.1, 8.2, 8.3, 7.4, 7.5
 */

const AuthorDashboard = () => {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadPapers()
  }, [])

  const loadPapers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await paperService.getPapers()
      setPapers(data.papers || data || [])
    } catch (err) {
      setError(err.detail || 'Failed to load papers')
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

  const getStatusBadge = (status) => {
    const statusMap = {
      'submitted': { label: 'Submitted', color: '#FEF3C7', textColor: '#92400E', icon: '●' },
      'under_review': { label: 'Under Review', color: '#DBEAFE', textColor: '#1E40AF', icon: '●' },
      'accepted': { label: 'Accepted', color: '#D1FAE5', textColor: '#065F46', icon: '●' },
      'rejected': { label: 'Rejected', color: '#FEE2E2', textColor: '#991B1B', icon: '●' },
      'published': { label: 'Published', color: '#E0E7FF', textColor: '#3730A3', icon: '●' },
    }
    return statusMap[status] || { label: status, color: '#F3F4F6', textColor: '#374151', icon: '●' }
  }

  const getStatusSummary = () => {
    const summary = {
      total: papers.length,
      submitted: 0,
      under_review: 0,
      accepted: 0,
      rejected: 0
    }
    papers.forEach((paper) => {
      if (paper.status === 'submitted') summary.submitted++
      else if (paper.status === 'under_review') summary.under_review++
      else if (paper.status === 'accepted') summary.accepted++
      else if (paper.status === 'rejected') summary.rejected++
    })
    return summary
  }

  const summary = getStatusSummary()

  if (loading) {
    return (
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>Dashboard - Overview</h1>
            <p>Manage your manuscript submissions and track their progress</p>
          </div>
          <Link to="/author/submit" className={styles.submitButton}>
            <span className={styles.submitIcon}>+</span> Submit New Paper
          </Link>
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

        {/* Papers Table Skeleton */}
        <div className={styles.papersSection}>
          <div style={{ marginBottom: '1.5rem' }}>
            <SkeletonLoader variant="text" width="150px" height="20px" />
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
        <div className={styles.headerContent}>
          <h1>Dashboard - Overview</h1>
          <p>Manage your manuscript submissions and track their progress</p>
        </div>
        <Link to="/author/submit" className={styles.submitButton}>
          <span className={styles.submitIcon}>+</span> Submit New Paper
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <ErrorUI 
          message={error} 
          onRetry={loadPapers}
          title="Failed to Load Dashboard"
        />
      )}

      {/* Metric Cards */}
      <div className={styles.metricsGrid}>
        {/* Total Submissions */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Total Submissions</span>
            <span className={styles.metricIcon}>📄</span>
          </div>
          <div className={styles.metricValue}>{summary.total}</div>
          <div className={`${styles.metricSubtext} ${styles.success}`}>All time</div>
        </div>

        {/* Under Review */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Under Review</span>
            <span className={styles.metricIcon}>📝</span>
          </div>
          <div className={styles.metricValue}>{summary.under_review}</div>
          <div className={`${styles.metricSubtext} ${styles.info}`}>In progress</div>
        </div>

        {/* Accepted */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Accepted</span>
            <span className={styles.metricIcon}>✅</span>
          </div>
          <div className={styles.metricValue}>{summary.accepted}</div>
          <div className={`${styles.metricSubtext} ${styles.success}`}>Congratulations!</div>
        </div>

        {/* Submitted */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Awaiting Review</span>
            <span className={styles.metricIcon}>⏳</span>
          </div>
          <div className={styles.metricValue}>{summary.submitted}</div>
          <div className={`${styles.metricSubtext} ${styles.warning}`}>Pending assignment</div>
        </div>
      </div>

      {/* Papers Table */}
      <div className={styles.papersSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <h3>Recent Submissions</h3>
            <p>Your latest manuscript submissions</p>
          </div>
          <Link to="/author/papers" className={styles.viewAllLink}>
            View All <span>→</span>
          </Link>
        </div>

        {papers.length > 0 ? (
          <div className={styles.tableContainer}>
            <table className={styles.papersTable}>
              <thead>
                <tr>
                  <th>TITLE</th>
                  <th>STATUS</th>
                  <th>SUBMITTED</th>
                  <th>UPDATED</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {papers.slice(0, 5).map((paper) => {
                  const statusBadge = getStatusBadge(paper.status)
                  
                  return (
                    <tr key={paper.id}>
                      <td data-label="Title">
                        <div className={styles.paperInfo}>
                          <div className={styles.paperTitle}>{paper.title}</div>
                          <div className={styles.paperAbstract}>{paper.abstract}</div>
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
                      <td data-label="Submitted" className={styles.dateText}>
                        {formatDate(paper.submitted_at)}
                      </td>
                      <td data-label="Updated" className={styles.dateText}>
                        {formatDate(paper.updated_at)}
                      </td>
                      <td data-label="Action" style={{ textAlign: 'right' }}>
                        <Link to={`/author/papers/${paper.id}`} className={styles.viewButton}>
                          View Details
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
            <div className={styles.emptyIcon}>📄</div>
            <h3 className={styles.emptyTitle}>No Submissions Yet</h3>
            <p className={styles.emptyText}>Get started by submitting your first paper</p>
            <Link to="/author/submit" className={styles.emptyButton}>
              Submit Paper
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthorDashboard
