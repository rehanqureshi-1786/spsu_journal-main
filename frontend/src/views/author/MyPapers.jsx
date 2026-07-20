import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import paperService from '../../services/paperService'
import SkeletonLoader from '../../components/SkeletonLoader'
import ErrorUI from '../../components/ErrorUI'
import styles from './MyPapers.module.css'

/**
 * MyPapers Component
 * List of author's papers with filtering and modern design
 * Requirements: 3.1, 3.6
 */

const MyPapers = () => {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadPapers()
  }, [searchQuery, statusFilter, dateFrom, dateTo, page])

  const loadPapers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await paperService.searchPapers({
        q: searchQuery || undefined,
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page: page,
        page_size: 20
      })
      setPapers(data.items)
      setTotal(data.total)
      setTotalPages(data.total_pages)
    } catch (err) {
      setError(err.detail || 'Failed to load papers')
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
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
      'under review': { label: 'Under Review', color: '#DBEAFE', textColor: '#1E40AF', icon: '●' },
      'accepted': { label: 'Accepted', color: '#D1FAE5', textColor: '#065F46', icon: '●' },
      'rejected': { label: 'Rejected', color: '#FEE2E2', textColor: '#991B1B', icon: '●' },
      'published': { label: 'Published', color: '#E0E7FF', textColor: '#3730A3', icon: '●' },
    }
    const normalizedStatus = status.toLowerCase()
    return statusMap[normalizedStatus] || { label: status, color: '#F3F4F6', textColor: '#374151', icon: '●' }
  }

  if (loading) {
    return (
      <div className={styles.container} style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
        {/* Header */}
        <div className={styles.header} style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
              My Papers
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              View and manage all your manuscript submissions
            </p>
          </div>
          <Link 
            to="/author/submit" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
          >
            <span style={{ fontSize: '1.25rem', lineHeight: '1' }}>+</span> Submit New Paper
          </Link>
        </div>

        {/* Filters Skeleton */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB', marginBottom: '1.5rem' }}>
          <div className={styles.filterGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <SkeletonLoader variant="text" width="60px" height="14px" />
              <div style={{ marginTop: '8px' }}>
                <SkeletonLoader variant="text" height="38px" />
              </div>
            </div>
            <div>
              <SkeletonLoader variant="text" width="100px" height="14px" />
              <div style={{ marginTop: '8px' }}>
                <SkeletonLoader variant="text" height="38px" />
              </div>
            </div>
          </div>
        </div>

        {/* Papers List Skeleton */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <SkeletonLoader variant="text" width="150px" height="20px" />
            <div style={{ marginTop: '8px' }}>
              <SkeletonLoader variant="text" width="250px" height="14px" />
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
      <div className={styles.header} style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
            My Papers
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            View and manage all your manuscript submissions
          </p>
        </div>
        <Link 
          to="/author/submit" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
        >
          <span style={{ fontSize: '1.25rem', lineHeight: '1' }}>+</span> Submit New Paper
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <ErrorUI 
          message={error} 
          onRetry={loadPapers}
          title="Failed to Load Papers"
        />
      )}

      {/* Filters */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search and Status Filters */}
          <div className={styles.filterGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label htmlFor="search" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Search
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, abstract, or keywords..."
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label htmlFor="status" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Filter by Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
                <option value="">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Initial Screening">Initial Screening</option>
                <option value="Reviewer Assigned">Reviewer Assigned</option>
                <option value="Under Review">Under Review</option>
                <option value="Revision Required">Revision Required</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Published">Published</option>
              </select>
            </div>
          </div>
          
          {/* Date Range Filters */}
          <div className={styles.dateFilters} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: '500' }}>From:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  padding: '0.625rem 1rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: '500' }}>To:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  padding: '0.625rem 1rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>
            <button
              onClick={handleClearFilters}
              style={{
                padding: '0.625rem 1rem',
                backgroundColor: 'white',
                color: '#6B7280',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Papers List */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
            Papers ({total})
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            All your manuscript submissions
          </p>
        </div>

        {papers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📄</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
              No Papers Found
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
              {total === 0
                ? 'Get started by submitting your first paper'
                : 'No results found. Try adjusting your filters.'}
            </p>
            {total === 0 && (
              <Link
                to="/author/submit"
                style={{
                  display: 'inline-block',
                  padding: '0.625rem 1.25rem',
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
                Submit Paper
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper} style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      TITLE
                    </th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      STATUS
                    </th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      KEYWORDS
                    </th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      SUBMITTED
                    </th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {papers.map((paper) => {
                    const statusBadge = getStatusBadge(paper.status)
                    
                    return (
                      <tr key={paper.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ maxWidth: '350px' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {paper.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {paper.abstract}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
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
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {paper.keywords.slice(0, 3).map((keyword, idx) => (
                              <span
                                key={idx}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                  backgroundColor: '#F3F4F6',
                                  color: '#374151'
                                }}
                              >
                                {keyword}
                              </span>
                            ))}
                            {paper.keywords.length > 3 && (
                              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                +{paper.keywords.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6B7280' }}>
                          {formatDate(paper.submitted_at)}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <Link
                            to={`/author/papers/${paper.id}`}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#D1FAE5',
                              color: '#10B981',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              textDecoration: 'none',
                              display: 'inline-block'
                            }}
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination} style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: page === 1 ? '#F3F4F6' : 'white',
                    color: page === 1 ? '#9CA3AF' : '#374151',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: page === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: page === totalPages ? '#F3F4F6' : 'white',
                    color: page === totalPages ? '#9CA3AF' : '#374151',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            )}
            
            {papers.length > 0 && (
              <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6B7280', textAlign: 'center' }}>
                Showing {papers.length} of {total} papers
              </div>
            )}
          </>
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

export default MyPapers
