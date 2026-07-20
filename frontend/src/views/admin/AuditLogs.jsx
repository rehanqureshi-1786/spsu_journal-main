import { useState, useEffect } from 'react'
import auditService from '../../services/auditService'
import toastService from '../../services/toastService'
import styles from './AuditLogs.module.css'

const AuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadLogs()
  }, [page])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const data = await auditService.getAuditLogs(page, 50)
      setLogs(data.logs || [])
      setTotalPages(Math.ceil((data.total || 0) / 50))
    } catch (err) {
      setError(err.detail || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      setExporting(true)
      toastService.info('Preparing CSV export...')
      
      // Build filters object
      const filters = {}
      if (filterAction !== 'all') {
        filters.action = filterAction
      }
      
      // Call export endpoint
      const response = await auditService.exportAuditLogs(filters)
      
      // Create blob and download
      const blob = new Blob([response], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit_logs_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toastService.success('Audit logs exported successfully!')
    } catch (err) {
      console.error('Export failed:', err)
      toastService.error('Failed to export audit logs: ' + (err.detail || 'Unknown error'))
    } finally {
      setExporting(false)
    }
  }

  const getActionBadge = (action) => {
    const actionMap = {
      'CREATE': { color: '#D1FAE5', textColor: '#065F46' },
      'UPDATE': { color: '#DBEAFE', textColor: '#1E40AF' },
      'DELETE': { color: '#FEE2E2', textColor: '#991B1B' },
      'LOGIN': { color: '#E0E7FF', textColor: '#3730A3' },
      'LOGOUT': { color: '#F3F4F6', textColor: '#374151' },
    }
    return actionMap[action] || { color: '#F3F4F6', textColor: '#374151' }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource_type?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterAction === 'all' || log.action === filterAction
    return matchesSearch && matchesFilter
  })

  if (loading && page === 0) {
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
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6B7280', marginTop: '1rem' }}>Loading audit logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
      {/* Header */}
      <div className={styles.header} style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
          Audit Logs
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
          Track all system activities and user actions
        </p>
      </div>

      {/* Filters */}
      <div className={styles.filtersCard} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #E5E7EB' }}>
        <div className={styles.filtersRow} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className={styles.filtersInner} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', flex: '1' }}>
            <div className={styles.searchWrapper} style={{ flex: '1', minWidth: '300px' }}>
              <input
                type="text"
                placeholder="Search by user, action, or resource..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>
            <div className={styles.filterButtons} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['all', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'].map(action => (
                <button
                  key={action}
                  onClick={() => setFilterAction(action)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: filterAction === action ? '#1a5490' : 'white',
                    color: filterAction === action ? 'white' : '#6B7280',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {action === 'all' ? 'All' : action}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            style={{
              padding: '0.625rem 1rem',
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4.66667 6.66667L8 10L11.3333 6.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 10V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export to CSV
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className={styles.tableCard} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827' }}>
            Activity Log ({filteredLogs.length})
          </h2>
        </div>

        {filteredLogs.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Timestamp</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>User</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Action</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Resource</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const actionBadge = getActionBadge(log.action)
                    
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6B7280', fontFamily: 'monospace' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: '#1a5490',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              {(log.user_email || 'U')[0].toUpperCase()}
                            </div>
                            <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                              {log.user_email || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: actionBadge.color,
                            color: actionBadge.textColor
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                          <div>
                            <div style={{ fontWeight: '500' }}>{log.resource_type}</div>
                            {log.resource_id && (
                              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                ID: {log.resource_id}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6B7280', maxWidth: '300px' }}>
                          {log.details ? (
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                            </div>
                          ) : (
                            <span style={{ color: '#9CA3AF' }}>—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #E5E7EB' }}>
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: page === 0 ? '#F3F4F6' : 'white',
                    color: page === 0 ? '#9CA3AF' : '#374151',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: page === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: page >= totalPages - 1 ? '#F3F4F6' : 'white',
                    color: page >= totalPages - 1 ? '#9CA3AF' : '#374151',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
              No Logs Found
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              {searchTerm || filterAction !== 'all' ? 'Try adjusting your filters' : 'No activity logs yet'}
            </p>
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

export default AuditLogs
