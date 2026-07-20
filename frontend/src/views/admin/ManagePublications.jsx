import { useState, useEffect } from 'react'
import adminService from '../../services/adminService'
import toastService from '../../services/toastService'
import ConfirmDialog from '../../components/ConfirmDialog'
import styles from './ManagePublications.module.css'

const ManagePublications = () => {
  const [volumes, setVolumes] = useState([])
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showVolumeModal, setShowVolumeModal] = useState(false)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [issueToPublish, setIssueToPublish] = useState(null)
  const [newVolume, setNewVolume] = useState({ volume_number: '', year: new Date().getFullYear() })
  const [newIssue, setNewIssue] = useState({ 
    volume_id: '', 
    issue_number: '', 
    title: '',
    publication_date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  })

  useEffect(() => {
    loadPublications()
  }, [])

  const loadPublications = async () => {
    try {
      setLoading(true)
      const [volumesData, issuesData] = await Promise.all([
        adminService.getAllVolumes(),
        adminService.getAllIssues()
      ])
      setVolumes(volumesData)
      setIssues(issuesData)
    } catch (err) {
      setError(err.detail || 'Failed to load publications')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVolume = async (e) => {
    e.preventDefault()
    try {
      await adminService.createVolume(newVolume)
      toastService.success('Volume created successfully!')
      setShowVolumeModal(false)
      setNewVolume({ volume_number: '', year: new Date().getFullYear() })
      await loadPublications()
    } catch (err) {
      console.error('Failed to create volume:', err)
      toastService.error('Failed to create volume')
    }
  }

  const handleCreateIssue = async (e) => {
    e.preventDefault()
    try {
      await adminService.createIssue(newIssue)
      toastService.success('Issue created successfully!')
      setShowIssueModal(false)
      setNewIssue({ 
        volume_id: '', 
        issue_number: '', 
        title: '',
        publication_date: new Date().toISOString().split('T')[0]
      })
      await loadPublications()
    } catch (err) {
      console.error('Failed to create issue:', err)
      toastService.error('Failed to create issue: ' + (err.detail || 'Unknown error'))
    }
  }

  const handlePublishIssue = async (issueId) => {
    setIssueToPublish(issueId)
    setShowPublishConfirm(true)
  }

  const confirmPublishIssue = async () => {
    try {
      // Get all accepted papers that aren't published yet
      const allPapers = await adminService.getAllPapers()
      const acceptedPapers = (Array.isArray(allPapers) ? allPapers : []).filter(p => p.status === 'Accepted')

      if (acceptedPapers.length === 0) {
        toastService.error('No accepted papers available to publish. Papers must be in "Accepted" status first.')
        return
      }

      let successCount = 0
      for (const paper of acceptedPapers) {
        try {
          await adminService.publishPaper({
            paper_id: paper.id,
            issue_id: issueToPublish
          })
          successCount++
        } catch {
          // Paper may already be published or have other issues — skip
        }
      }

      if (successCount > 0) {
        toastService.success(`Published ${successCount} paper(s) to issue!`)
      } else {
        toastService.error('No papers could be published. They may already be published.')
      }

      await loadPublications()
    } catch (err) {
      console.error('Failed to publish:', err)
      toastService.error('Failed to publish: ' + (err.detail || 'Unknown error'))
    } finally {
      setShowPublishConfirm(false)
      setIssueToPublish(null)
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
            borderTopColor: '#1a5490', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6B7280', marginTop: '1rem' }}>Loading publications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
      {/* Header */}
      <div className={styles.header} style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
          Manage Publications
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
          Manage journal volumes and issues
        </p>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionButtons} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => setShowVolumeModal(true)}
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
          <span style={{ fontSize: '1.25rem', lineHeight: '1' }}>+</span> New Volume
        </button>
        <button
          onClick={() => setShowIssueModal(true)}
          style={{
            padding: '0.625rem 1.25rem',
            backgroundColor: 'white',
            color: '#1a5490',
            border: '1px solid #1a5490',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '1.25rem', lineHeight: '1' }}>+</span> New Issue
        </button>
      </div>

      {/* Volumes and Issues */}
      <div className={styles.volumeGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {volumes.map((volume) => {
          const volumeIssues = issues.filter(issue => issue.volume_id === volume.id)
          
          return (
            <div key={volume.id} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #F3F4F6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
                      Volume {volume.volume_number}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                      Year {volume.year}
                    </p>
                  </div>
                  <span style={{
                    padding: '0.375rem 0.75rem',
                    backgroundColor: '#e8f0f8',
                    color: '#1a5490',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {volumeIssues.length} Issues
                  </span>
                </div>
              </div>

              {volumeIssues.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {volumeIssues.map((issue) => (
                    <div key={issue.id} style={{
                      padding: '1rem',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
                            Issue {issue.issue_number}
                          </div>
                          {issue.title && (
                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                              {issue.title}
                            </div>
                          )}
                        </div>
                        <span style={{
                          padding: '0.25rem 0.625rem',
                          backgroundColor: issue.paper_count > 0 ? '#D1FAE5' : '#FEF3C7',
                          color: issue.paper_count > 0 ? '#065F46' : '#92400E',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}>
                          {issue.paper_count > 0 ? `${issue.paper_count} Paper(s)` : 'Empty'}
                        </span>
                      </div>
                      <button
                        onClick={() => handlePublishIssue(issue.id)}
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.375rem 0.75rem',
                          backgroundColor: '#1a5490',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        Publish Accepted Papers to Issue
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9CA3AF', fontSize: '0.875rem' }}>
                  No issues yet
                </div>
              )}
            </div>
          )
        })}

        {volumes.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
              No Volumes Yet
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
              Create your first volume to get started
            </p>
            <button
              onClick={() => setShowVolumeModal(true)}
              style={{
                padding: '0.625rem 1.25rem',
                backgroundColor: '#1a5490',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Create Volume
            </button>
          </div>
        )}
      </div>

      {/* Create Volume Modal */}
      {showVolumeModal && (
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
        onClick={() => setShowVolumeModal(false)}
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '1.5rem' }}>
              Create New Volume
            </h2>
            <form onSubmit={handleCreateVolume}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Volume Number
                </label>
                <input
                  type="number"
                  required
                  value={newVolume.volume_number}
                  onChange={(e) => setNewVolume({ ...newVolume, volume_number: e.target.value })}
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
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Year
                </label>
                <input
                  type="number"
                  required
                  value={newVolume.year}
                  onChange={(e) => setNewVolume({ ...newVolume, year: e.target.value })}
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
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowVolumeModal(false)}
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
                  Create Volume
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Issue Modal */}
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
            width: '90%'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '1.5rem' }}>
              Create New Issue
            </h2>
            <form onSubmit={handleCreateIssue}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Volume
                </label>
                <select
                  required
                  value={newIssue.volume_id}
                  onChange={(e) => setNewIssue({ ...newIssue, volume_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  <option value="">Select Volume</option>
                  {volumes.map(vol => (
                    <option key={vol.id} value={vol.id}>
                      Volume {vol.volume_number} ({vol.year})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Issue Number
                </label>
                <input
                  type="number"
                  required
                  value={newIssue.issue_number}
                  onChange={(e) => setNewIssue({ ...newIssue, issue_number: e.target.value })}
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
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Publication Date
                </label>
                <input
                  type="date"
                  required
                  value={newIssue.publication_date}
                  onChange={(e) => setNewIssue({ ...newIssue, publication_date: e.target.value })}
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
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={newIssue.title}
                  onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
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
                  Create Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publish Issue Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showPublishConfirm}
        title="Publish Issue"
        message="Are you sure you want to publish this issue? Once published, the issue will be visible to the public and cannot be easily unpublished."
        confirmText="Publish"
        cancelText="Cancel"
        variant="warning"
        onConfirm={confirmPublishIssue}
        onCancel={() => {
          setShowPublishConfirm(false)
          setIssueToPublish(null)
        }}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default ManagePublications
