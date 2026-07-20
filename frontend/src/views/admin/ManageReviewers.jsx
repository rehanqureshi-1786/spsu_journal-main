import { useState, useEffect } from 'react'
import adminService from '../../services/adminService'
import toastService from '../../services/toastService'
import ConfirmDialog from '../../components/ConfirmDialog'
import styles from './ManageReviewers.module.css'

const ManageReviewers = () => {
  const [reviewers, setReviewers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [reviewerToDelete, setReviewerToDelete] = useState(null)
  const [newReviewer, setNewReviewer] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    expertise: [],
    affiliation: ''
  })

  useEffect(() => {
    loadReviewers()
  }, [])

  const loadReviewers = async () => {
    try {
      setLoading(true)
      const data = await adminService.getAllReviewers(0, 1000)
      // Transform reviewers to include full name
      const transformedReviewers = (data.reviewers || []).map(reviewer => ({
        ...reviewer,
        name: `${reviewer.first_name || ''} ${reviewer.last_name || ''}`.trim() || 'Unknown',
        expertise: Array.isArray(reviewer.expertise) ? reviewer.expertise.join(', ') : reviewer.expertise || ''
      }))
      setReviewers(transformedReviewers)
    } catch (err) {
      setError(err.detail || 'Failed to load reviewers')
    } finally {
      setLoading(false)
    }
  }

  const handleAddReviewer = async (e) => {
    e.preventDefault()
    try {
      // Transform expertise string to array
      const reviewerData = {
        ...newReviewer,
        expertise: newReviewer.expertise.split(',').map(e => e.trim()).filter(e => e)
      }
      await adminService.createReviewer(reviewerData)
      toastService.success('Reviewer created successfully!')
      setShowAddModal(false)
      setNewReviewer({ first_name: '', last_name: '', email: '', password: '', expertise: [], affiliation: '' })
      await loadReviewers()
    } catch (err) {
      console.error('Failed to create reviewer:', err)
      toastService.error(err.detail || 'Failed to create reviewer')
    }
  }

  const handleDeleteReviewer = async (reviewerId) => {
    setReviewerToDelete(reviewerId)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteReviewer = async () => {
    try {
      await adminService.deleteReviewer(reviewerToDelete)
      toastService.success('Reviewer deleted successfully!')
      await loadReviewers()
    } catch (err) {
      console.error('Failed to delete reviewer:', err)
      toastService.error('Failed to delete reviewer')
    } finally {
      setShowDeleteConfirm(false)
      setReviewerToDelete(null)
    }
  }

  const filteredReviewers = reviewers.filter(reviewer =>
    reviewer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reviewer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reviewer.expertise?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <p style={{ color: '#6B7280', marginTop: '1rem' }}>Loading reviewers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
      {/* Header */}
      <div className={styles.header} style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
            Manage Reviewers
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            Manage peer reviewers and their expertise areas
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
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
          <span style={{ fontSize: '1.25rem', lineHeight: '1' }}>+</span> Add Reviewer
        </button>
      </div>

      {/* Search */}
      <div className={styles.searchSection} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #E5E7EB' }}>
        <input
          type="text"
          placeholder="Search by name, email, or expertise..."
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

      {/* Reviewers Grid */}
      <div className={styles.reviewersGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {filteredReviewers.length > 0 ? (
          filteredReviewers.map((reviewer, index) => {
            const colors = ['#3B82F6', '#1a5490', '#10B981', '#F59E0B', '#EF4444', '#06B6D4']
            const avatarColor = colors[index % colors.length]
            const initials = (reviewer.name || 'R').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            
            return (
              <div key={reviewer.id} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #E5E7EB',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
                      {reviewer.name}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                      {reviewer.email}
                    </p>
                    {reviewer.affiliation && (
                      <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                        {reviewer.affiliation}
                      </p>
                    )}
                  </div>
                </div>

                {reviewer.expertise && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                      Expertise
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {reviewer.expertise.split(',').map((exp, idx) => (
                        <span key={idx} style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#e8f0f8',
                          color: '#1a5490',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {exp.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #F3F4F6' }}>
                  <button
                    onClick={() => handleDeleteReviewer(reviewer.id)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      backgroundColor: '#FEE2E2',
                      color: '#991B1B',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      backgroundColor: '#e8f0f8',
                      color: '#1a5490',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
              No Reviewers Found
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              {searchTerm ? 'Try adjusting your search' : 'Add reviewers to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Add Reviewer Modal */}
      {showAddModal && (
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
        onClick={() => setShowAddModal(false)}
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
              Add New Reviewer
            </h2>
            <form onSubmit={handleAddReviewer}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={newReviewer.first_name}
                  onChange={(e) => setNewReviewer({ ...newReviewer, first_name: e.target.value })}
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
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={newReviewer.last_name}
                  onChange={(e) => setNewReviewer({ ...newReviewer, last_name: e.target.value })}
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
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={newReviewer.email}
                  onChange={(e) => setNewReviewer({ ...newReviewer, email: e.target.value })}
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
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={newReviewer.password}
                  onChange={(e) => setNewReviewer({ ...newReviewer, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Expertise (comma-separated)
                </label>
                <input
                  type="text"
                  value={newReviewer.expertise}
                  onChange={(e) => setNewReviewer({ ...newReviewer, expertise: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  placeholder="e.g., Machine Learning, AI, NLP"
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Affiliation
                </label>
                <input
                  type="text"
                  value={newReviewer.affiliation}
                  onChange={(e) => setNewReviewer({ ...newReviewer, affiliation: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  placeholder="e.g., MIT, Stanford University"
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  Add Reviewer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Reviewer"
        message="Are you sure you want to delete this reviewer? This action cannot be undone and will permanently remove the reviewer from the system."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteReviewer}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setReviewerToDelete(null)
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

export default ManageReviewers
