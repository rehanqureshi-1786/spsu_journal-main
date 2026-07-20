import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import adminService from '../../services/adminService'
import toastService from '../../services/toastService'
import styles from './AssignReviewers.module.css'

const AssignReviewers = () => {
  const [searchParams] = useSearchParams()
  const [papers, setPapers] = useState([])
  const [reviewers, setReviewers] = useState([])
  const [reviewersWorkload, setReviewersWorkload] = useState({}) // Map of reviewer_id to workload data
  const [loading, setLoading] = useState(true)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [selectedReviewers, setSelectedReviewers] = useState([])
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignedReviewers, setAssignedReviewers] = useState([]) // Track already assigned reviewers

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Check if paper ID is in URL params
    const paperIdFromUrl = searchParams.get('paper')
    if (paperIdFromUrl && papers.length > 0) {
      const paper = papers.find(p => p.id === paperIdFromUrl)
      if (paper) {
        setSelectedPaper(paper)
        setShowAssignModal(true)
      }
    }
  }, [searchParams, papers])

  const loadData = async () => {
    try {
      setLoading(true)
      const [papersData, reviewersData, workloadData] = await Promise.all([
        adminService.getAllPapers(),
        adminService.getAllReviewers(0, 1000),
        adminService.getReviewersWorkload()
      ])
      setPapers(papersData.filter(p => p.status === 'Submitted' || p.status === 'Under Review' || p.status === 'Reviewer Assigned'))
      
      // Create workload map for quick lookup
      const workloadMap = {}
      workloadData.forEach(w => {
        workloadMap[w.reviewer_id] = {
          assigned_count: w.assigned_count,
          pending_count: w.pending_count
        }
      })
      setReviewersWorkload(workloadMap)
      
      // Sort reviewers by workload (least busy first)
      const sortedReviewers = (reviewersData.reviewers || []).sort((a, b) => {
        const aWorkload = workloadMap[a.id]?.pending_count || 0
        const bWorkload = workloadMap[b.id]?.pending_count || 0
        return aWorkload - bWorkload
      })
      
      setReviewers(sortedReviewers)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignReviewers = async () => {
    if (!selectedPaper || selectedReviewers.length === 0) return
    
    try {
      await adminService.assignReviewers(selectedPaper.id, selectedReviewers)
      toastService.success('Reviewers assigned successfully!')
      
      // Update workload counts immediately in UI
      const updatedWorkload = { ...reviewersWorkload }
      selectedReviewers.forEach(reviewerId => {
        if (updatedWorkload[reviewerId]) {
          updatedWorkload[reviewerId].assigned_count += 1
          updatedWorkload[reviewerId].pending_count += 1
        } else {
          updatedWorkload[reviewerId] = { assigned_count: 1, pending_count: 1 }
        }
      })
      setReviewersWorkload(updatedWorkload)
      
      // Re-sort reviewers by workload
      const sortedReviewers = [...reviewers].sort((a, b) => {
        const aWorkload = updatedWorkload[a.id]?.pending_count || 0
        const bWorkload = updatedWorkload[b.id]?.pending_count || 0
        return aWorkload - bWorkload
      })
      setReviewers(sortedReviewers)
      
      setShowAssignModal(false)
      setSelectedPaper(null)
      setSelectedReviewers([])
      setAssignedReviewers([])
      
      // Reload data to ensure consistency
      await loadData()
    } catch (err) {
      console.error('Failed to assign reviewers:', err)
      
      // Handle specific error messages
      let errorMessage = 'Failed to assign reviewers'
      
      if (err.detail) {
        if (err.detail.includes('already assigned')) {
          errorMessage = 'One or more reviewers are already assigned to this paper. Please select different reviewers.'
        } else {
          errorMessage = err.detail
        }
      }
      
      toastService.error(errorMessage)
    }
  }

  const toggleReviewer = (reviewerId) => {
    // Check if reviewer is already assigned
    if (assignedReviewers.includes(reviewerId)) {
      toastService.warning('This reviewer is already assigned to this paper')
      return
    }
    
    setSelectedReviewers(prev =>
      prev.includes(reviewerId)
        ? prev.filter(id => id !== reviewerId)
        : [...prev, reviewerId]
    )
  }

  const loadPaperReviewers = async (paperId) => {
    try {
      const reviews = await adminService.getPaperReviews(paperId)
      const reviewerIds = reviews.reviews?.map(r => r.reviewer_id) || []
      setAssignedReviewers(reviewerIds)
    } catch (err) {
      console.error('Failed to load paper reviewers:', err)
      setAssignedReviewers([])
    }
  }

  const openAssignModal = async (paper) => {
    setSelectedPaper(paper)
    setShowAssignModal(true)
    await loadPaperReviewers(paper.id)
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
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
          Assign Reviewers
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
          Assign peer reviewers to submitted manuscripts
        </p>
      </div>

      {/* Papers Grid */}
      <div className={styles.papersGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {papers.length > 0 ? (
          papers.map((paper, index) => {
            const colors = ['#3B82F6', '#1a5490', '#10B981', '#F59E0B', '#EF4444']
            const avatarColor = colors[index % colors.length]
            const initials = (paper.author_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            
            return (
              <div key={paper.id} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {paper.title}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                      by {paper.author_name || 'Unknown'}
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid #F3F4F6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>
                      Status
                    </span>
                    <span style={{
                      padding: '0.25rem 0.625rem',
                      backgroundColor: paper.status === 'submitted' ? '#FEF3C7' : '#DBEAFE',
                      color: paper.status === 'submitted' ? '#92400E' : '#1E40AF',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {paper.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>
                      Submitted
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#374151' }}>
                      {new Date(paper.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {paper.keywords && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                      Keywords
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                      {paper.keywords}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => openAssignModal(paper)}
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
                  Assign Reviewers
                </button>
              </div>
            )
          })
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
              All Papers Assigned
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              No papers waiting for reviewer assignment
            </p>
          </div>
        )}
      </div>

      {/* Assign Reviewers Modal */}
      {showAssignModal && selectedPaper && (
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
          padding: '2rem'
        }}
        onClick={() => {
          setShowAssignModal(false)
          setAssignedReviewers([])
        }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
              Assign Reviewers
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
              {selectedPaper.title}
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                Select Reviewers ({selectedReviewers.length} selected)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                {reviewers.map((reviewer, index) => {
                  const colors = ['#3B82F6', '#1a5490', '#10B981', '#F59E0B', '#EF4444', '#06B6D4']
                  const avatarColor = colors[index % colors.length]
                  const fullName = `${reviewer.first_name || ''} ${reviewer.last_name || ''}`.trim() || 'Reviewer'
                  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  const isSelected = selectedReviewers.includes(reviewer.id)
                  const isAlreadyAssigned = assignedReviewers.includes(reviewer.id)
                  
                  // Get workload data
                  const workload = reviewersWorkload[reviewer.id] || { assigned_count: 0, pending_count: 0 }
                  const isOverloaded = workload.pending_count > 5
                  
                  return (
                    <div
                      key={reviewer.id}
                      onClick={() => toggleReviewer(reviewer.id)}
                      style={{
                        padding: '1rem',
                        backgroundColor: isAlreadyAssigned ? '#F3F4F6' : (isSelected ? '#e8f0f8' : '#F9FAFB'),
                        border: `2px solid ${isAlreadyAssigned ? '#9CA3AF' : (isSelected ? '#1a5490' : (isOverloaded ? '#F59E0B' : '#E5E7EB'))}`,
                        borderRadius: '8px',
                        cursor: isAlreadyAssigned ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: isAlreadyAssigned ? 0.6 : 1
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: avatarColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', marginBottom: '0.125rem' }}>
                            {fullName}
                            {isAlreadyAssigned && (
                              <span style={{ 
                                marginLeft: '0.5rem', 
                                fontSize: '0.75rem', 
                                fontWeight: '600',
                                color: '#6B7280',
                                backgroundColor: '#E5E7EB',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '4px'
                              }}>
                                Already Assigned
                              </span>
                            )}
                            {isOverloaded && !isAlreadyAssigned && (
                              <span style={{ 
                                marginLeft: '0.5rem', 
                                fontSize: '0.75rem', 
                                fontWeight: '600',
                                color: '#92400E',
                                backgroundColor: '#FEF3C7',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '4px'
                              }}>
                                ⚠ High Workload
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                            {reviewer.email}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                            {workload.assigned_count} assigned • {workload.pending_count} pending
                          </div>
                          {reviewer.expertise && Array.isArray(reviewer.expertise) && reviewer.expertise.length > 0 && (
                            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                              {reviewer.expertise.join(', ')}
                            </div>
                          )}
                        </div>
                        {isSelected && !isAlreadyAssigned && (
                          <div style={{ color: '#1a5490', fontSize: '1.25rem' }}>✓</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedReviewers([])
                  setAssignedReviewers([])
                }}
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
                onClick={handleAssignReviewers}
                disabled={selectedReviewers.length === 0}
                style={{
                  flex: 1,
                  padding: '0.625rem',
                  backgroundColor: selectedReviewers.length === 0 ? '#D1D5DB' : '#1a5490',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'white',
                  cursor: selectedReviewers.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Assign {selectedReviewers.length} Reviewer{selectedReviewers.length !== 1 ? 's' : ''}
              </button>
            </div>
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

export default AssignReviewers
