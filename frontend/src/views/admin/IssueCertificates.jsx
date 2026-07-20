import { useState, useEffect } from 'react'
import eventService from '../../services/eventService'
import certificateService from '../../services/certificateService'
import adminService from '../../services/adminService'
import toastService from '../../services/toastService'
import styles from './IssueCertificates.module.css'

/**
 * IssueCertificates Component
 * Admin interface for issuing event certificates (individual and bulk)
 * and viewing all issued certificates with filters and search
 * Requirements: 3.2, 4.1, 4.2, 4.3, 7.1, 7.2, 7.3, 7.4, 7.5
 */

const IssueCertificates = () => {
  const [events, setEvents] = useState([])
  const [users, setUsers] = useState([])
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkSummary, setBulkSummary] = useState(null)
  
  // Filters
  const [filterType, setFilterType] = useState('')
  const [filterEvent, setFilterEvent] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  
  // Individual issuance form
  const [issueForm, setIssueForm] = useState({
    event_id: '',
    recipient_id: '',
    role: 'author'
  })
  
  // Bulk issuance form
  const [bulkForm, setBulkForm] = useState({
    event_id: '',
    recipients: []
  })
  const [selectedUsers, setSelectedUsers] = useState([])
  const [bulkRoleFilter, setBulkRoleFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [eventsData, usersData, certsData] = await Promise.all([
        eventService.getAllEvents(),
        adminService.getAllUsers(0, 1000),
        certificateService.getAllCertificates()
      ])
      setEvents(eventsData || [])
      setUsers(usersData.users || [])
      setCertificates(certsData || [])
    } catch (err) {
      console.error('Failed to load data:', err)
      toastService.error(err.detail || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadCertificates = async () => {
    try {
      const filters = {}
      if (filterType) filters.type = filterType
      if (filterEvent) filters.event_id = filterEvent
      if (filterDateFrom) filters.date_from = filterDateFrom
      if (filterDateTo) filters.date_to = filterDateTo
      
      const data = await certificateService.getAllCertificates(filters)
      setCertificates(data || [])
    } catch (err) {
      console.error('Failed to load certificates:', err)
      toastService.error(err.detail || 'Failed to load certificates')
    }
  }

  const handleIssueIndividual = async (e) => {
    e.preventDefault()
    try {
      await eventService.issueEventCertificate(
        issueForm.event_id,
        issueForm.recipient_id,
        issueForm.role
      )
      toastService.success('Certificate issued successfully!')
      setShowIssueModal(false)
      setIssueForm({ event_id: '', recipient_id: '', role: 'author' })
      await loadCertificates()
    } catch (err) {
      console.error('Failed to issue certificate:', err)
      toastService.error(err.detail || 'Failed to issue certificate')
    }
  }

  const handleBulkIssue = async (e) => {
    e.preventDefault()
    if (selectedUsers.length === 0) {
      toastService.error('Please select at least one recipient')
      return
    }

    try {
      const recipients = selectedUsers.map(userId => {
        const user = users.find(u => u.id === userId)
        return {
          recipient_id: userId,
          role: user?.role?.name === 'reviewer' ? 'reviewer' : 'author'
        }
      })

      const result = await eventService.bulkIssueEventCertificates(
        bulkForm.event_id,
        recipients
      )
      
      setBulkSummary(result)
      await loadCertificates()
    } catch (err) {
      console.error('Failed to bulk issue certificates:', err)
      toastService.error(err.detail || 'Failed to bulk issue certificates')
    }
  }

  const handleDownload = async (certificateId) => {
    try {
      const blob = await certificateService.downloadCertificate(certificateId)
      certificateService.downloadFile(blob, certificateId)
      toastService.success('Certificate downloaded successfully!')
    } catch (err) {
      console.error('Failed to download certificate:', err)
      toastService.error(err.detail || 'Failed to download certificate')
    }
  }

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const closeBulkModal = () => {
    setShowBulkModal(false)
    setBulkForm({ event_id: '', recipients: [] })
    setSelectedUsers([])
    setBulkSummary(null)
    setBulkRoleFilter('')
  }

  // Filter and search certificates
  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = searchTerm === '' || 
      cert.certificate_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.recipient_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const certificateTypeColors = {
    subscription: { bg: '#DBEAFE', text: '#1E40AF' },
    event: { bg: '#D1FAE5', text: '#065F46' }
  }

  const roleColors = {
    author: { bg: '#E0E7FF', text: '#3730A3' },
    reviewer: { bg: '#FEF3C7', text: '#92400E' }
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
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6B7280', marginTop: '1rem' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
      {/* Header */}
      <div className={styles.header} style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
          Issue Certificates
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
          Issue event certificates to participants and manage all certificates
        </p>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionButtons} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowIssueModal(true)}
          style={{
            padding: '0.625rem 1.25rem',
            backgroundColor: '#1a5490',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '1.25rem', lineHeight: '1' }}>+</span> Issue Individual Certificate
        </button>
        <button
          onClick={() => setShowBulkModal(true)}
          style={{
            padding: '0.625rem 1.25rem',
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '1.25rem', lineHeight: '1' }}>⚡</span> Bulk Issue Certificates
        </button>
      </div>

      {/* Filters and Search */}
      <div className={styles.filtersCard} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #E5E7EB' }}>
        <div className={styles.filtersGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.5rem' }}>
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); loadCertificates() }}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="">All Types</option>
              <option value="subscription">Subscription</option>
              <option value="event">Event</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.5rem' }}>
              Event
            </label>
            <select
              value={filterEvent}
              onChange={(e) => { setFilterEvent(e.target.value); loadCertificates() }}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.5rem' }}>
              Date From
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => { setFilterDateFrom(e.target.value); loadCertificates() }}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.5rem' }}>
              Date To
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => { setFilterDateTo(e.target.value); loadCertificates() }}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.5rem' }}>
            Search by Certificate ID or Recipient Name
          </label>
          <input
            type="text"
            placeholder="Search certificates..."
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
      </div>

      {/* Certificates Table */}
      <div className={styles.tableCard} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827' }}>
            All Certificates ({filteredCertificates.length})
          </h2>
        </div>

        {filteredCertificates.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Certificate ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Recipient</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Event/Role</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Issued Date</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Downloads</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertificates.map((cert) => {
                  const typeColor = certificateTypeColors[cert.certificate_type] || { bg: '#F3F4F6', text: '#374151' }
                  const roleColor = roleColors[cert.role] || { bg: '#F3F4F6', text: '#374151' }
                  
                  return (
                    <tr key={cert.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '1rem', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: '600', color: '#1a5490' }}>
                        {cert.certificate_id}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                        {cert.recipient_name}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: typeColor.bg,
                          color: typeColor.text,
                          textTransform: 'capitalize'
                        }}>
                          {cert.certificate_type}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {cert.certificate_type === 'event' ? (
                          <div>
                            <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem' }}>
                              {cert.event_name}
                            </div>
                            <span style={{
                              display: 'inline-flex',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              backgroundColor: roleColor.bg,
                              color: roleColor.text,
                              textTransform: 'capitalize'
                            }}>
                              {cert.role}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6B7280' }}>
                        {new Date(cert.issued_date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6B7280' }}>
                        {cert.download_count || 0}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDownload(cert.certificate_id)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#e8f0f8',
                            color: '#1a5490',
                            border: 'none',
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
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📜</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
              No Certificates Found
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              {searchTerm || filterType || filterEvent ? 'Try adjusting your filters' : 'Issue your first certificate to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Issue Individual Certificate Modal */}
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
          zIndex: 1000,
          padding: '1rem'
        }}
        onClick={() => setShowIssueModal(false)}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '1.5rem' }}>
              Issue Individual Certificate
            </h2>
            <form onSubmit={handleIssueIndividual}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Event *
                </label>
                <select
                  required
                  value={issueForm.event_id}
                  onChange={(e) => setIssueForm({ ...issueForm, event_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  <option value="">Select an event</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.name} - {new Date(event.event_date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Recipient *
                </label>
                <select
                  required
                  value={issueForm.recipient_id}
                  onChange={(e) => setIssueForm({ ...issueForm, recipient_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  <option value="">Select a recipient</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.email} ({user.role?.name || 'unknown'})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Role *
                </label>
                <select
                  required
                  value={issueForm.role}
                  onChange={(e) => setIssueForm({ ...issueForm, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  <option value="author">Author</option>
                  <option value="reviewer">Reviewer</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
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
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    backgroundColor: '#1a5490',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Issue Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Issue Certificates Modal */}
      {showBulkModal && (
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
          zIndex: 1000,
          padding: '1rem'
        }}
        onClick={closeBulkModal}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '1.5rem' }}>
              Bulk Issue Certificates
            </h2>
            
            {!bulkSummary ? (
              <form onSubmit={handleBulkIssue}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Event *
                  </label>
                  <select
                    required
                    value={bulkForm.event_id}
                    onChange={(e) => setBulkForm({ ...bulkForm, event_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  >
                    <option value="">Select an event</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.name} - {new Date(event.event_date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                      Select Recipients ({selectedUsers.length} selected)
                    </label>
                    <select
                      value={bulkRoleFilter}
                      onChange={(e) => setBulkRoleFilter(e.target.value)}
                      style={{
                        padding: '0.375rem 0.625rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        outline: 'none',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="">All Roles</option>
                      <option value="author">Authors Only</option>
                      <option value="reviewer">Reviewers Only</option>
                    </select>
                  </div>
                  <div style={{ 
                    border: '1px solid #D1D5DB', 
                    borderRadius: '8px', 
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    padding: '0.5rem'
                  }}>
                    {users
                      .filter(user => !bulkRoleFilter || user.role?.name === bulkRoleFilter)
                      .map(user => (
                      <div 
                        key={user.id}
                        onClick={() => toggleUserSelection(user.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor: selectedUsers.includes(user.id) ? '#e8f0f8' : 'transparent',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => {}}
                          style={{ cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                            {user.email}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                            Role: {user.role?.name || 'unknown'}
                          </div>
                        </div>
                      </div>
                    ))}
                    {users.filter(user => !bulkRoleFilter || user.role?.name === bulkRoleFilter).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280', fontSize: '0.875rem' }}>
                        No users found with the selected role filter
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={closeBulkModal}
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
                  <button
                    type="submit"
                    disabled={selectedUsers.length === 0}
                    style={{
                      flex: 1,
                      padding: '0.625rem',
                      backgroundColor: selectedUsers.length === 0 ? '#D1D5DB' : '#10B981',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: 'white',
                      cursor: selectedUsers.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Issue {selectedUsers.length} Certificate{selectedUsers.length !== 1 ? 's' : ''}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{ 
                  backgroundColor: bulkSummary.failures?.length > 0 ? '#FEF3C7' : '#D1FAE5', 
                  padding: '1.5rem', 
                  borderRadius: '8px',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' }}>
                    Issuance Summary
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                        Successful
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>
                        {bulkSummary.success_count || 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                        Failed
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#DC2626' }}>
                        {bulkSummary.failures?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>
                
                {bulkSummary.failures && bulkSummary.failures.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>
                      Failures:
                    </h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {bulkSummary.failures.map((failure, index) => (
                        <div key={index} style={{ 
                          padding: '0.75rem', 
                          backgroundColor: '#FEE2E2', 
                          borderRadius: '6px',
                          marginBottom: '0.5rem',
                          fontSize: '0.875rem',
                          color: '#991B1B'
                        }}>
                          Recipient ID {failure.recipient_id}: {failure.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={closeBulkModal}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    backgroundColor: '#1a5490',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            )}
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

export default IssueCertificates
