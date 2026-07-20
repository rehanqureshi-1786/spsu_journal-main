import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import adminService from '../../services/adminService'
import api from '../../config/api'
import SkeletonLoader from '../../components/SkeletonLoader'
import ErrorUI from '../../components/ErrorUI'
import styles from './AdminDashboard.module.css'

/**
 * AdminDashboard Component
 * Professional editorial management dashboard
 */

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReviewers: 0,
    totalPapers: 0,
    papersByStatus: {},
    totalVolumes: 0,
    totalIssues: 0
  })
  const [advancedStats, setAdvancedStats] = useState(null)
  const [dateRange, setDateRange] = useState({
    date_from: '',
    date_to: ''
  })
  const [recentPapers, setRecentPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [issueForm, setIssueForm] = useState({
    volume: '',
    issue: '',
    year: new Date().getFullYear(),
    title: ''
  })
  const [chartData, setChartData] = useState([])
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const [reviewerWorkload, setReviewerWorkload] = useState([])

  useEffect(() => {
    loadDashboardData()
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count')
      ])
      setNotifications(notifRes.data)
      setUnreadCount(countRes.data.count)
    } catch (e) { /* ignore */ }
  }

  const markAsRead = async (id) => {
    await api.post(`/notifications/${id}/read`)
    loadNotifications()
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [usersData, reviewersData, papers, volumes, issues, statistics] = await Promise.all([
        adminService.getAllUsers(0, 1000),
        adminService.getAllReviewers(0, 1000),
        adminService.getAllPapers(),
        adminService.getAllVolumes(),
        adminService.getAllIssues(),
        adminService.getDashboardStatistics(dateRange.date_from || dateRange.date_to ? dateRange : {})
      ])

      const papersByStatus = papers.reduce((acc, paper) => {
        // Normalize status to match our keys
        const normalizedStatus = paper.status?.toLowerCase().replace(/\s+/g, '_') || 'unknown'
        acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1
        return acc
      }, {})

      setStats({
        totalUsers: usersData.total || 0,
        totalReviewers: reviewersData.total || 0,
        totalPapers: papers.length,
        papersByStatus,
        totalVolumes: volumes.length,
        totalIssues: issues.length
      })

      setAdvancedStats(statistics)
      setRecentPapers(papers.slice(0, 10))
      
      // Generate chart data from statistics if available, otherwise use papers
      if (statistics && statistics.submissions_by_month && statistics.submissions_by_month.length > 0) {
        generateChartDataFromStatistics(statistics.submissions_by_month)
      } else {
        generateChartData(papers)
      }
      
      // Calculate reviewer workload
      await calculateReviewerWorkload(papers)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError(err.detail || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const calculateReviewerWorkload = async (papers) => {
    try {
      // Get all review assignments
      const reviewerMap = new Map()
      
      // Fetch reviews for all papers to count active assignments
      for (const paper of papers) {
        try {
          const reviews = await adminService.getPaperReviews(paper.id)
          if (reviews && reviews.reviews) {
            reviews.reviews.forEach(review => {
              if (review.reviewer_id) {
                const current = reviewerMap.get(review.reviewer_id) || {
                  reviewer_id: review.reviewer_id,
                  reviewer_name: review.reviewer_name || 'Unknown Reviewer',
                  active: 0
                }
                // Count only pending and in_progress reviews
                if (review.status === 'pending' || review.status === 'in_progress') {
                  current.active++
                }
                reviewerMap.set(review.reviewer_id, current)
              }
            })
          }
        } catch (err) {
          // Skip papers without reviews
          continue
        }
      }
      
      // Convert to array and sort by active count
      const workload = Array.from(reviewerMap.values())
        .sort((a, b) => b.active - a.active)
        .slice(0, 4) // Top 4 reviewers
      
      setReviewerWorkload(workload)
    } catch (err) {
      console.error('Failed to calculate reviewer workload:', err)
      setReviewerWorkload([])
    }
  }

  const generateChartData = (papers) => {
    // Group papers by month for the last 6 months
    const now = new Date()
    const months = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        month: monthNames[date.getMonth()],
        year: date.getFullYear(),
        count: 0,
        date: date
      })
    }
    
    // Count papers per month
    papers.forEach(paper => {
      const paperDate = new Date(paper.submitted_at)
      const monthIndex = months.findIndex(m => 
        m.date.getMonth() === paperDate.getMonth() && 
        m.date.getFullYear() === paperDate.getFullYear()
      )
      if (monthIndex !== -1) {
        months[monthIndex].count++
      }
    })
    
    setChartData(months)
  }

  const generateChartDataFromStatistics = (submissionsByMonth) => {
    // Convert statistics data to chart format
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    const chartData = submissionsByMonth.map(item => {
      const [year, month] = item.month.split('-')
      const monthIndex = parseInt(month) - 1
      return {
        month: monthNames[monthIndex],
        year: parseInt(year),
        count: item.count,
        date: new Date(parseInt(year), monthIndex, 1)
      }
    })
    
    setChartData(chartData)
  }

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const applyDateFilter = () => {
    loadDashboardData()
  }

  const clearDateFilter = () => {
    setDateRange({
      date_from: '',
      date_to: ''
    })
    // Reload with no date filter
    setTimeout(() => loadDashboardData(), 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status) => {
    // Normalize status to lowercase for comparison
    const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '_') || ''
    
    const statusMap = {
      'submitted': { label: 'Pending Assign', color: '#FEF3C7', textColor: '#92400E', icon: '●' },
      'initial_screening': { label: 'Screening', color: '#FDE68A', textColor: '#78350F', icon: '●' },
      'reviewer_assigned': { label: 'Assigned', color: '#BFDBFE', textColor: '#1E3A8A', icon: '●' },
      'under_review': { label: 'In Review', color: '#DBEAFE', textColor: '#1E40AF', icon: '●' },
      'revision_required': { label: 'Revision', color: '#FED7AA', textColor: '#9A3412', icon: '●' },
      'accepted': { label: 'Accepted', color: '#D1FAE5', textColor: '#065F46', icon: '●' },
      'rejected': { label: 'Rejected', color: '#FEE2E2', textColor: '#991B1B', icon: '●' },
      'published': { label: 'Published', color: '#E0E7FF', textColor: '#3730A3', icon: '●' },
    }
    return statusMap[normalizedStatus] || { label: status, color: '#F3F4F6', textColor: '#374151', icon: '●' }
  }

  const handleCreateIssue = async (e) => {
    e.preventDefault()
    try {
      // Here you would call your API to create the issue
      console.log('Creating issue:', issueForm)
      // await adminService.createIssue(issueForm)
      setShowIssueModal(false)
      setIssueForm({ volume: '', issue: '', year: new Date().getFullYear(), title: '' })
      // Reload data
      await loadDashboardData()
    } catch (err) {
      console.error('Failed to create issue:', err)
    }
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
            Editorial Dashboard
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            Manage journal operations and monitor submission workflow
          </p>
        </div>

        {/* Metric Cards Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
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

        {/* Charts and Tables Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
            <SkeletonLoader variant="text" width="180px" height="20px" />
            <div style={{ marginTop: '1.5rem' }}>
              <SkeletonLoader variant="card" height="250px" />
            </div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
            <SkeletonLoader variant="text" width="180px" height="20px" />
            <div style={{ marginTop: '1.5rem' }}>
              <SkeletonLoader variant="card" height="250px" />
            </div>
          </div>
        </div>

        {/* Recent Papers Skeleton */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
          <SkeletonLoader variant="text" width="200px" height="20px" />
          <div style={{ marginTop: '1.5rem' }}>
            <SkeletonLoader variant="table" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
            Editorial Dashboard
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            Manage journal operations and monitor submission workflow
          </p>
        </div>

        <ErrorUI 
          message={error} 
          onRetry={loadDashboardData}
          title="Error Loading Dashboard"
        />
      </div>
    )
  }

  const newSubmissions = stats.papersByStatus['submitted'] || 0
  const inReview = stats.papersByStatus['under_review'] || 0
  const pendingAction = newSubmissions // Papers that need reviewer assignment
  const reviewerAssigned = stats.papersByStatus['reviewer_assigned'] || 0

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>
            Dashboard - Overview
          </h1>
          <p>
            Monitor and manage your journal's editorial workflow
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search manuscripts, authors..."
              className={styles.searchInput}
            />
            <svg 
              className={styles.searchIcon}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button className={styles.newIssueButton}
          onClick={() => setShowIssueModal(true)}
          >
            <span style={{ fontSize: '1.25rem', lineHeight: '1' }}>+</span> New Issue
          </button>
          <div style={{ position: 'relative' }}>
          <button className={styles.notificationButton} onClick={() => setShowNotifications(!showNotifications)}>
            <span style={{ fontSize: '1.25rem' }}>🔔</span>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                backgroundColor: '#EF4444', color: 'white', borderRadius: '50%',
                width: '20px', height: '20px', fontSize: '0.7rem', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{unreadCount}</span>
            )}
          </button>
          {showNotifications && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
              width: '380px', maxHeight: '400px', overflowY: 'auto',
              backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E5E7EB',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)', zIndex: 1050
            }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB', fontWeight: '700', fontSize: '0.95rem', color: '#111827' }}>
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>No notifications</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} onClick={() => markAsRead(n.id)} style={{
                    padding: '0.75rem 1rem', borderBottom: '1px solid #F3F4F6', cursor: 'pointer',
                    backgroundColor: n.is_read ? 'white' : '#FEF3C7',
                    transition: 'background 0.2s'
                  }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', color: n.type === 'warning' ? '#DC2626' : '#111827', marginBottom: '0.25rem' }}>
                      {n.type === 'warning' ? '⚠️ ' : ''}{n.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280', lineHeight: '1.4' }}>{n.message}</div>
                    <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                      {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className={styles.metricsGrid}>
        {/* New Submissions */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>New Submissions</span>
            <span className={styles.metricIcon}>📥</span>
          </div>
          <div className={styles.metricValue}>
            {newSubmissions}
          </div>
          <div className={styles.metricSubtext} style={{ color: newSubmissions > 0 ? '#10B981' : '#6B7280' }}>
            {newSubmissions > 0 ? 'Needs assignment' : 'No new submissions'}
          </div>
        </div>

        {/* Pending Assignment */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Reviewer Assigned</span>
            <span className={styles.metricIcon}>⚡</span>
          </div>
          <div className={styles.metricValue}>
            {reviewerAssigned}
          </div>
          <div className={styles.metricSubtext} style={{ color: reviewerAssigned > 0 ? '#3B82F6' : '#6B7280' }}>
            {reviewerAssigned > 0 ? 'Waiting for review' : 'None assigned'}
          </div>
        </div>

        {/* In Peer Review */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>In Peer Review</span>
            <span className={styles.metricIcon}>⭕</span>
          </div>
          <div className={styles.metricValue}>
            {inReview}
          </div>
          <div className={styles.metricSubtext} style={{ color: '#6B7280' }}>
            {inReview > 0 ? 'Active reviews' : 'No active reviews'}
          </div>
        </div>

        {/* Total Papers */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Total Papers</span>
            <span className={styles.metricIcon}>📊</span>
          </div>
          <div className={styles.metricValue}>
            {stats.totalPapers}
          </div>
          <div className={styles.metricSubtext} style={{ color: '#6B7280' }}>
            All submissions
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Submission Trends */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>
              <div className={styles.chartTitleText}>
                <h3>
                  Submission Trends
                </h3>
                <p>
                  Monthly volume over the last 6 months
                </p>
              </div>
              <div className={styles.chartLegend}>
                <span className={styles.legendDot}></span>
                <span className={styles.legendLabel}>Submissions</span>
              </div>
            </div>
          </div>
          <div className={styles.chartContainer}>
            {chartData.length > 0 ? (
              <>
                <svg width="100%" height="100%" viewBox="0 0 600 250" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#1a5490" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#1a5490" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  <line x1="0" y1="50" x2="600" y2="50" stroke="#F3F4F6" strokeWidth="1"/>
                  <line x1="0" y1="100" x2="600" y2="100" stroke="#F3F4F6" strokeWidth="1"/>
                  <line x1="0" y1="150" x2="600" y2="150" stroke="#F3F4F6" strokeWidth="1"/>
                  <line x1="0" y1="200" x2="600" y2="200" stroke="#F3F4F6" strokeWidth="1"/>
                  
                  {/* Calculate max value for scaling */}
                  {(() => {
                    const maxCount = Math.max(...chartData.map(d => d.count), 1)
                    const points = chartData.map((d, i) => {
                      const x = (i / (chartData.length - 1)) * 600
                      const y = 200 - (d.count / maxCount) * 150
                      return { x, y, count: d.count, month: d.month }
                    })
                    
                    // Create path for area
                    const areaPath = `M 0 200 ${points.map(p => `L ${p.x} ${p.y}`).join(' ')} L 600 200 Z`
                    // Create path for line
                    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
                    
                    return (
                      <>
                        {/* Area */}
                        <path d={areaPath} fill="url(#chartGradient)" />
                        {/* Line */}
                        <path
                          d={linePath}
                          fill="none"
                          stroke="#1a5490"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Points with hover */}
                        {points.map((point, idx) => (
                          <g key={idx}>
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r={hoveredPoint === idx ? "6" : "4"}
                              fill="#1a5490"
                              style={{ 
                                cursor: 'pointer',
                                transition: 'r 0.2s ease'
                              }}
                              onMouseEnter={() => setHoveredPoint(idx)}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                            {/* Hover tooltip */}
                            {hoveredPoint === idx && (
                              <>
                                <rect
                                  x={point.x - 35}
                                  y={point.y - 45}
                                  width="70"
                                  height="35"
                                  fill="white"
                                  stroke="#E5E7EB"
                                  strokeWidth="1"
                                  rx="6"
                                  style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                                />
                                <text
                                  x={point.x}
                                  y={point.y - 30}
                                  textAnchor="middle"
                                  style={{ fontSize: '12px', fontWeight: '600', fill: '#111827' }}
                                >
                                  {point.count} papers
                                </text>
                                <text
                                  x={point.x}
                                  y={point.y - 16}
                                  textAnchor="middle"
                                  style={{ fontSize: '10px', fill: '#6B7280' }}
                                >
                                  {point.month}
                                </text>
                              </>
                            )}
                          </g>
                        ))}
                      </>
                    )
                  })()}
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: '#9CA3AF' }}>
                  {chartData.map((d, i) => (
                    <span key={i}>{d.month}</span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF' }}>
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Reviewer Workload */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
              Reviewer Workload
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              Top active reviewers
            </p>
          </div>
          <div className={styles.workloadList}>
            {reviewerWorkload.length > 0 ? (
              reviewerWorkload.map((reviewer, idx) => {
                const colors = ['#1a5490', '#1a5490', '#10B981', '#F59E0B']
                const maxActive = Math.max(...reviewerWorkload.map(r => r.active), 1)
                const percentage = (reviewer.active / maxActive) * 100
                
                return (
                  <div key={reviewer.reviewer_id} className={styles.workloadItem}>
                    <div className={styles.workloadHeader}>
                      <span className={styles.workloadName}>
                        {reviewer.reviewer_name}
                      </span>
                      <span className={styles.workloadCount}>
                        {reviewer.active} Active
                      </span>
                    </div>
                    <div className={styles.workloadBar}>
                      <div 
                        className={styles.workloadProgress}
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: colors[idx % colors.length]
                        }}
                      ></div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9CA3AF' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                <p style={{ fontSize: '0.875rem' }}>No active reviewers</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Statistics Section */}
      {advancedStats && (
        <div className={styles.statsSection}>
          <div className={styles.statsHeader}>
            <div className={styles.sectionTitle}>
              <h3>
                Advanced Statistics
              </h3>
              <p>
                {dateRange.date_from || dateRange.date_to 
                  ? `Custom date range: ${dateRange.date_from || 'Start'} to ${dateRange.date_to || 'Today'}`
                  : 'Current year statistics'}
              </p>
            </div>
            <div className={styles.dateFilters}>
              <input
                type="date"
                value={dateRange.date_from}
                onChange={(e) => handleDateRangeChange('date_from', e.target.value)}
                className={styles.dateInput}
                placeholder="From"
              />
              <span className={styles.dateFilterSeparator}>to</span>
              <input
                type="date"
                value={dateRange.date_to}
                onChange={(e) => handleDateRangeChange('date_to', e.target.value)}
                className={styles.dateInput}
                placeholder="To"
              />
              <button
                onClick={applyDateFilter}
                className={styles.applyButton}
              >
                Apply
              </button>
              {(dateRange.date_from || dateRange.date_to) && (
                <button
                  onClick={clearDateFilter}
                  className={styles.clearButton}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Statistics Grid */}
          <div className={styles.statsGrid}>
            {/* Acceptance Rate */}
            <div className={styles.statCard}>
              <div className={styles.statCardHeader}>
                <span style={{ fontSize: '1.5rem' }}>✅</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Acceptance Rate</span>
              </div>
              <div className={styles.statCardValue}>
                {advancedStats.acceptance_rate}%
              </div>
              <div className={styles.statCardLabel}>
                Papers accepted vs total submissions
              </div>
            </div>

            {/* Average Review Time */}
            <div className={styles.statCard}>
              <div className={styles.statCardHeader}>
                <span style={{ fontSize: '1.5rem' }}>⏱️</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Average Review Time</span>
              </div>
              <div className={styles.statCardValue}>
                {advancedStats.average_review_time} days
              </div>
              <div className={styles.statCardLabel}>
                From submission to first review
              </div>
            </div>
          </div>

          {/* Papers by Status Chart */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
              Papers by Status
            </h4>
            <div className={styles.statsStatusGrid}>
              {Object.entries(advancedStats.papers_by_status).map(([status, count]) => {
                const statusColors = {
                  submitted: '#FEF3C7',
                  under_review: '#DBEAFE',
                  revision_requested: '#FED7AA',
                  accepted: '#D1FAE5',
                  rejected: '#FEE2E2',
                  published: '#E0E7FF'
                }
                const statusLabels = {
                  submitted: 'Submitted',
                  under_review: 'Under Review',
                  revision_requested: 'Revision',
                  accepted: 'Accepted',
                  rejected: 'Rejected',
                  published: 'Published'
                }
                return (
                  <div 
                    key={status}
                    className={styles.statsStatusCard}
                    style={{ backgroundColor: statusColors[status] || '#F3F4F6' }}
                  >
                    <div className={styles.statsStatusValue}>
                      {count}
                    </div>
                    <div className={styles.statsStatusLabel}>
                      {statusLabels[status] || status}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Manuscripts Table */}
      <div className={styles.papersSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <h3>
              Manuscripts Needing Attention
            </h3>
            <p>
              Recent submissions requiring action
            </p>
          </div>
          <Link 
            to="/admin/papers" 
            className={styles.viewAllLink}
          >
            View All <span>→</span>
          </Link>
        </div>

        {recentPapers.length > 0 ? (
          <div className={styles.tableContainer}>
            <table className={styles.papersTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>TITLE</th>
                  <th>AUTHOR</th>
                  <th>SUBMITTED</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {recentPapers.map((paper, index) => {
                  const statusBadge = getStatusBadge(paper.status)
                  const initials = (paper.author_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  const colors = ['#3B82F6', '#1a5490', '#10B981', '#F59E0B', '#EF4444']
                  const avatarColor = colors[index % colors.length]
                  
                  return (
                    <tr key={paper.id}>
                      <td data-label="ID">
                        <span style={{ fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: '600', color: '#374151' }}>
                          #MS-{String(index + 2049).padStart(4, '0')}
                        </span>
                      </td>
                      <td data-label="Title">
                        <div style={{ maxWidth: '350px' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {paper.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                            Physics • Review v1
                          </div>
                        </div>
                      </td>
                      <td data-label="Author">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: avatarColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {initials}
                          </div>
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                            {paper.author_name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td data-label="Submitted" style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                        {formatDate(paper.submitted_at)}
                      </td>
                      <td data-label="Status">
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
                      </td>
                      <td data-label="Action" style={{ textAlign: 'right' }}>
                        <button style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#e8f0f8',
                          color: '#1a5490',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}>
                          Assign Editor
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <h3 className={styles.emptyTitle}>
              No Manuscripts Yet
            </h3>
            <p className={styles.emptyText}>
              Submissions will appear here once authors start submitting
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* New Issue Modal */}
      {showIssueModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={() => setShowIssueModal(false)}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                Create New Issue
              </h2>
              <button 
                onClick={() => setShowIssueModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateIssue}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Volume Number
                </label>
                <input
                  type="number"
                  required
                  value={issueForm.volume}
                  onChange={(e) => setIssueForm({ ...issueForm, volume: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  placeholder="e.g., 1"
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Issue Number
                </label>
                <input
                  type="number"
                  required
                  value={issueForm.issue}
                  onChange={(e) => setIssueForm({ ...issueForm, issue: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  placeholder="e.g., 1"
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Year
                </label>
                <input
                  type="number"
                  required
                  value={issueForm.year}
                  onChange={(e) => setIssueForm({ ...issueForm, year: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  placeholder="e.g., 2024"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  placeholder="e.g., Special Edition on AI"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
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
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.625rem 1.25rem',
                    backgroundColor: '#1a5490',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Create Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
