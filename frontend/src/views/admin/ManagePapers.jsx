import { useState, useEffect } from 'react'
import adminService from '../../services/adminService'
import toastService from '../../services/toastService'
import SkeletonLoader from '../../components/SkeletonLoader'
import ErrorUI from '../../components/ErrorUI'
import styles from './ManagePapers.module.css'

const ManagePapers = () => {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [issues, setIssues] = useState([])
  const [selectedIssue, setSelectedIssue] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [selectedPapers, setSelectedPapers] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false)
  const [showBulkReviewerModal, setShowBulkReviewerModal] = useState(false)
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkReviewerId, setBulkReviewerId] = useState('')
  const [bulkDeadline, setBulkDeadline] = useState('')
  const [reviewers, setReviewers] = useState([])
  const [bulkActionResult, setBulkActionResult] = useState(null)
  const [showBulkResultModal, setShowBulkResultModal] = useState(false)

  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search term - only trigger API after 500ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    loadPapers()
    loadIssues()
    loadReviewers()
  }, [debouncedSearch, filterStatus, dateFrom, dateTo, page])

  const loadPapers = async () => {
    try {
      if (papers.length === 0) setLoading(true)
      const data = await adminService.searchPapers({
        q: debouncedSearch || undefined,
        status: filterStatus || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page: page,
        page_size: 20
      })
      setPapers(data.items)
      setTotal(data.total)
      setTotalPages(data.total_pages)
      // Clear selections when papers change
      setSelectedPapers([])
      setSelectAll(false)
    } catch (err) {
      setError(err.detail || 'Failed to load papers')
    } finally {
      setLoading(false)
    }
  }

  const loadIssues = async () => {
    try {
      const data = await adminService.getAllIssues()
      setIssues(data)
    } catch (err) {
      console.error('Failed to load issues:', err)
    }
  }

  const loadReviewers = async () => {
    try {
      const data = await adminService.getAllReviewers()
      setReviewers(data.reviewers || [])
    } catch (err) {
      console.error('Failed to load reviewers:', err)
    }
  }

  const handlePublishClick = (paper) => {
    setSelectedPaper(paper)
    setSelectedIssue('')
    setShowPublishModal(true)
  }

  const handlePublishPaper = async () => {
    if (!selectedIssue) {
      toastService.error('Please select an issue to publish to')
      return
    }

    try {
      await adminService.publishPaper({
        paper_id: selectedPaper.id,
        issue_id: selectedIssue
      })
      toastService.success('Paper published successfully!')
      setShowPublishModal(false)
      setSelectedPaper(null)
      setSelectedIssue('')
      await loadPapers()
      // Refresh issues to update paper counts
      await loadIssues()
    } catch (err) {
      console.error('Failed to publish:', err)
      toastService.error('Failed to publish: ' + (err.detail || 'Unknown error'))
    }
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setFilterStatus('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const handleSearch = () => {
    setPage(1)
    loadPapers()
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPapers([])
      setSelectAll(false)
    } else {
      setSelectedPapers(papers.map(p => p.id))
      setSelectAll(true)
    }
  }

  const handleSelectPaper = (paperId) => {
    if (selectedPapers.includes(paperId)) {
      setSelectedPapers(selectedPapers.filter(id => id !== paperId))
      setSelectAll(false)
    } else {
      const newSelected = [...selectedPapers, paperId]
      setSelectedPapers(newSelected)
      if (newSelected.length === papers.length) {
        setSelectAll(true)
      }
    }
  }

  const handleBulkStatusChange = async () => {
    if (selectedPapers.length === 0) {
      toastService.error('Please select at least one paper')
      return
    }

    if (!bulkStatus) {
      toastService.error('Please select a status')
      return
    }

    try {
      const result = await adminService.bulkAction({
        action: 'change_status',
        paper_ids: selectedPapers,
        new_status: bulkStatus
      })
      
      setBulkActionResult(result)
      setShowBulkStatusModal(false)
      setShowBulkResultModal(true)
      
      if (result.successful.length > 0) {
        toastService.success(`Successfully updated ${result.successful.length} paper(s)`)
        await loadPapers()
      }
      
      if (result.failed.length > 0) {
        toastService.warning(`${result.failed.length} paper(s) failed to update`)
      }
    } catch (err) {
      console.error('Bulk status change failed:', err)
      toastService.error('Bulk status change failed: ' + (err.detail || 'Unknown error'))
    }
  }

  const handleBulkReviewerAssignment = async () => {
    if (selectedPapers.length === 0) {
      toastService.error('Please select at least one paper')
      return
    }

    if (!bulkReviewerId) {
      toastService.error('Please select a reviewer')
      return
    }

    if (!bulkDeadline) {
      toastService.error('Please select a deadline')
      return
    }

    try {
      const result = await adminService.bulkAction({
        action: 'assign_reviewer',
        paper_ids: selectedPapers,
        reviewer_id: bulkReviewerId,
        deadline: bulkDeadline
      })
      
      setBulkActionResult(result)
      setShowBulkReviewerModal(false)
      setShowBulkResultModal(true)
      
      if (result.successful.length > 0) {
        toastService.success(`Successfully assigned reviewer to ${result.successful.length} paper(s)`)
        await loadPapers()
      }
      
      if (result.failed.length > 0) {
        toastService.warning(`${result.failed.length} paper(s) failed to assign`)
      }
    } catch (err) {
      console.error('Bulk reviewer assignment failed:', err)
      toastService.error('Bulk reviewer assignment failed: ' + (err.detail || 'Unknown error'))
    }
  }

  const closeBulkResultModal = () => {
    setShowBulkResultModal(false)
    setBulkActionResult(null)
    setSelectedPapers([])
    setSelectAll(false)
  }

  const handleExportCSV = async () => {
    try {
      setLoading(true)
      toastService.info('Preparing CSV export...')
      
      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) params.append('q', searchTerm)
      if (filterStatus) params.append('status', filterStatus)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      
      // Call export endpoint
      const response = await adminService.exportPapers(params.toString())
      
      // Create blob and download
      const blob = new Blob([response], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `papers_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toastService.success('Papers exported successfully!')
    } catch (err) {
      console.error('Export failed:', err)
      toastService.error('Failed to export papers: ' + (err.detail || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'submitted': { label: 'Submitted', color: '#FEF3C7', textColor: '#92400E' },
      'under review': { label: 'Under Review', color: '#DBEAFE', textColor: '#1E40AF' },
      'accepted': { label: 'Accepted', color: '#D1FAE5', textColor: '#065F46' },
      'rejected': { label: 'Rejected', color: '#FEE2E2', textColor: '#991B1B' },
      'published': { label: 'Published', color: '#E0E7FF', textColor: '#3730A3' },
    }
    const normalizedStatus = status.toLowerCase()
    return statusMap[normalizedStatus] || { label: status, color: '#F3F4F6', textColor: '#374151' }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      // Convert status to proper format (capitalize first letter, replace underscores with spaces)
      const formattedStatus = newStatus
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      await adminService.updatePaperStatus(selectedPaper.id, { status: formattedStatus })
      toastService.success('Paper status updated successfully!')
      setShowStatusModal(false)
      setSelectedPaper(null)
      await loadPapers()
    } catch (err) {
      console.error('Failed to update status:', err)
      toastService.error('Failed to update status: ' + (err.detail || 'Unknown error'))
    }
  }

  if (loading) {
    return (
      <div className={styles.container} style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
            Manage Manuscripts
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            Review and manage all submitted manuscripts
          </p>
        </div>

        {/* Filters Skeleton */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1', minWidth: '300px' }}>
              <SkeletonLoader variant="text" height="38px" />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <SkeletonLoader variant="text" width="80px" height="36px" />
              <SkeletonLoader variant="text" width="100px" height="36px" />
              <SkeletonLoader variant="text" width="120px" height="36px" />
              <SkeletonLoader variant="text" width="90px" height="36px" />
            </div>
          </div>
        </div>

        {/* Papers Table Skeleton */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
          <SkeletonLoader variant="table" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container} style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
            Manage Manuscripts
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            Review and manage all submitted manuscripts
          </p>
        </div>

        <ErrorUI 
          message={error} 
          onRetry={loadPapers}
          title="Failed to Load Manuscripts"
        />
      </div>
    )
  }

  return (
    <div className={styles.container} style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
          Manage Manuscripts
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
          Review and manage all submitted manuscripts
        </p>
      </div>

      {/* Filters */}
      <div className={styles.toolbar} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search and Status Filters */}
          <div className={styles.toolbarRow} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1', minWidth: '300px' }}>
              <input
                type="text"
                placeholder="Search by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '0.625rem 1rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Status</option>
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
          <div className={styles.toolbarRow} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
            <button
              onClick={handleExportCSV}
              disabled={loading}
              style={{
                padding: '0.625rem 1rem',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
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
      </div>

      {/* Papers Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
        <div className={styles.header} style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827' }}>
            Manuscripts ({total})
          </h2>
          {selectedPapers.length > 0 && (
            <div className={styles.bulkActions} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#e8f0f8',
              borderRadius: '8px',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1a5490' }}>
                {selectedPapers.length} selected
              </span>
              <button
                onClick={() => setShowBulkStatusModal(true)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#1a5490',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Change Status
              </button>
              <button
                onClick={() => setShowBulkReviewerModal(true)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Assign Reviewer
              </button>
              <button
                onClick={() => {
                  setSelectedPapers([])
                  setSelectAll(false)
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  color: '#6B7280',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {papers.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          cursor: 'pointer',
                          accentColor: '#1a5490'
                        }}
                      />
                    </th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>ID</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Title</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Author</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Submitted</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {papers.map((paper, index) => {
                  const statusBadge = getStatusBadge(paper.status)
                  const initials = (paper.author_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  const colors = ['#3B82F6', '#1a5490', '#10B981', '#F59E0B', '#EF4444']
                  const avatarColor = colors[index % colors.length]
                  const isSelected = selectedPapers.includes(paper.id)
                  
                  return (
                    <tr 
                      key={paper.id} 
                      style={{ 
                        borderBottom: '1px solid #F3F4F6',
                        backgroundColor: isSelected ? '#e8f0f8' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectPaper(paper.id)}
                          style={{ 
                            width: '16px', 
                            height: '16px', 
                            cursor: 'pointer',
                            accentColor: '#1a5490'
                          }}
                        />
                      </td>                      <td style={{ padding: '1rem', fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: '600', color: '#374151' }}>
                        #{paper.id}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ maxWidth: '350px' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', marginBottom: '0.25rem' }}>
                            {paper.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                            {paper.keywords || 'No keywords'}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
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
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6B7280' }}>
                        {new Date(paper.submitted_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
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
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {/* Show all buttons except Download only if paper is NOT published */}
                        {paper.status.toLowerCase() !== 'published' && (
                          <>
                            <button
                              onClick={() => window.location.href = `/admin/assign-reviewers?paper=${paper.id}`}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#10B981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                marginRight: '0.5rem'
                              }}
                            >
                              Assign Reviewers
                            </button>
                            {/* Show Publish button only if status is Accepted */}
                            {paper.status.toLowerCase() === 'accepted' && (
                              <button
                                onClick={() => handlePublishClick(paper)}
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: '#0f3d6e',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  marginRight: '0.5rem'
                                }}
                              >
                                📤 Publish
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedPaper(paper)
                                setShowStatusModal(true)
                              }}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#e8f0f8',
                                color: '#1a5490',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                marginRight: '0.5rem'
                              }}
                            >
                              Change Status
                            </button>
                          </>
                        )}
                        {/* Download button is always visible */}
                        <button
                          onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL ?? ''}/papers/${paper.id}/download`, '_blank')}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'white',
                            color: '#6B7280',
                            border: '1px solid #D1D5DB',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
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
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📄</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
              No Manuscripts Found
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              {searchTerm || filterStatus || dateFrom || dateTo ? 'No results found. Try adjusting your filters.' : 'No manuscripts have been submitted yet'}
            </p>
          </div>
        )}
      </div>

      {/* Status Change Modal */}
      {showStatusModal && selectedPaper && (
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
        onClick={() => setShowStatusModal(false)}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' }}>
              Change Status
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
              {selectedPaper.title}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['submitted', 'under_review', 'accepted', 'rejected', 'published'].map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: selectedPaper.status === status ? '#e8f0f8' : 'white',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    cursor: 'pointer',
                    textAlign: 'left',
                    textTransform: 'capitalize'
                  }}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowStatusModal(false)}
              style={{
                marginTop: '1.5rem',
                width: '100%',
                padding: '0.625rem',
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
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && selectedPaper && (
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
        onClick={() => setShowPublishModal(false)}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' }}>
              Publish Paper
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
              {selectedPaper.title}
            </p>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Select Issue *
              </label>
              <select
                value={selectedIssue}
                onChange={(e) => setSelectedIssue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              >
                <option value="">-- Select an issue --</option>
                {issues.map(issue => (
                  <option key={issue.id} value={issue.id}>
                    Volume {issue.volume?.volume_number || '?'}, Issue {issue.issue_number} - {new Date(issue.publication_date).toLocaleDateString()}
                  </option>
                ))}
              </select>
              {!selectedIssue && (
                <p style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.25rem' }}>
                  Please select an issue to publish to
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handlePublishPaper}
                style={{
                  flex: 1,
                  padding: '0.625rem',
                  backgroundColor: '#0f3d6e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Publish
              </button>
              <button
                onClick={() => setShowPublishModal(false)}
                style={{
                  flex: 1,
                  padding: '0.625rem',
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
            </div>
          </div>
        </div>
      )}

      {/* Bulk Status Change Modal */}
      {showBulkStatusModal && (
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
        onClick={() => setShowBulkStatusModal(false)}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' }}>
              Bulk Change Status
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
              Change status for {selectedPapers.length} selected paper(s)
            </p>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                New Status *
              </label>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              >
                <option value="">-- Select status --</option>
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

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleBulkStatusChange}
                style={{
                  flex: 1,
                  padding: '0.625rem',
                  backgroundColor: '#1a5490',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Update Status
              </button>
              <button
                onClick={() => setShowBulkStatusModal(false)}
                style={{
                  flex: 1,
                  padding: '0.625rem',
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
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reviewer Assignment Modal */}
      {showBulkReviewerModal && (
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
        onClick={() => setShowBulkReviewerModal(false)}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' }}>
              Bulk Assign Reviewer
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
              Assign reviewer to {selectedPapers.length} selected paper(s)
            </p>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Reviewer *
              </label>
              <select
                value={bulkReviewerId}
                onChange={(e) => setBulkReviewerId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              >
                <option value="">-- Select reviewer --</option>
                {reviewers.map(reviewer => (
                  <option key={reviewer.id} value={reviewer.id}>
                    {reviewer.first_name} {reviewer.last_name} - {reviewer.expertise}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Deadline *
              </label>
              <input
                type="date"
                value={bulkDeadline}
                onChange={(e) => setBulkDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleBulkReviewerAssignment}
                style={{
                  flex: 1,
                  padding: '0.625rem',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Assign Reviewer
              </button>
              <button
                onClick={() => setShowBulkReviewerModal(false)}
                style={{
                  flex: 1,
                  padding: '0.625rem',
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
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Result Modal */}
      {showBulkResultModal && bulkActionResult && (
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
        onClick={closeBulkResultModal}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' }}>
              Bulk Action Results
            </h2>
            
            {bulkActionResult.successful.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#10B981', marginBottom: '0.5rem' }}>
                  ✓ Successful ({bulkActionResult.successful.length})
                </h3>
                <div style={{ 
                  backgroundColor: '#D1FAE5', 
                  padding: '0.75rem', 
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#065F46'
                }}>
                  {bulkActionResult.successful.length} paper(s) updated successfully
                </div>
              </div>
            )}

            {bulkActionResult.failed.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#EF4444', marginBottom: '0.5rem' }}>
                  ✗ Failed ({bulkActionResult.failed.length})
                </h3>
                <div style={{ 
                  backgroundColor: '#FEE2E2', 
                  padding: '0.75rem', 
                  borderRadius: '6px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {bulkActionResult.failed.map((failure, index) => (
                    <div key={index} style={{ 
                      fontSize: '0.875rem',
                      color: '#991B1B',
                      marginBottom: '0.5rem',
                      paddingBottom: '0.5rem',
                      borderBottom: index < bulkActionResult.failed.length - 1 ? '1px solid #FCA5A5' : 'none'
                    }}>
                      <strong>Paper #{failure.paper_id}:</strong> {failure.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={closeBulkResultModal}
              style={{
                width: '100%',
                padding: '0.625rem',
                backgroundColor: '#1a5490',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default ManagePapers
