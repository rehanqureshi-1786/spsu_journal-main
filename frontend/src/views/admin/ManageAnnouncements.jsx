import { useState, useEffect } from 'react'
import announcementService from '../../services/announcementService'
import AddEditAnnouncementModal from '../../components/AddEditAnnouncementModal'
import styles from './ManageAnnouncements.module.css'

/**
 * ManageAnnouncements Component
 * Admin page for managing announcement banners
 * Requirements: 18.1, 18.2, 18.3
 */

const ManageAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await announcementService.getAllAnnouncements()
      setAnnouncements(data)
    } catch (err) {
      setError(err?.detail || 'Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingAnnouncement(null)
    setModalOpen(true)
  }

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement)
    setModalOpen(true)
  }

  const handleSave = async (data) => {
    if (editingAnnouncement) {
      await announcementService.updateAnnouncement(editingAnnouncement.id, data)
    } else {
      await announcementService.createAnnouncement(data)
    }
    fetchAnnouncements()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return
    try {
      await announcementService.deleteAnnouncement(id)
      fetchAnnouncements()
    } catch (err) {
      setError(err?.detail || 'Failed to delete announcement')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const isActive = (ann) => {
    if (!ann.is_active) return false
    const now = new Date()
    const start = new Date(ann.start_date)
    const end = ann.end_date ? new Date(ann.end_date) : null
    return now >= start && (!end || now <= end)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Manage Announcements</h1>
          <p className={styles.subtitle}>Create and manage announcement banners displayed on the site</p>
        </div>
        <button className={styles.createBtn} onClick={handleCreate}>
          + New Announcement
        </button>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className={styles.empty}>
          <p>No announcements yet</p>
          <button className={styles.createBtn} onClick={handleCreate}>Create your first announcement</button>
        </div>
      ) : (
        <div className={styles.list}>
          {announcements.map((ann) => (
            <div key={ann.id} className={styles.card}>
              <div className={styles.cardPreview} style={{ backgroundColor: ann.background_color || '#1E40AF', color: ann.text_color || '#FFF' }}>
                {ann.text}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardMeta}>
                  <span className={`${styles.badge} ${isActive(ann) ? styles.activeBadge : styles.inactiveBadge}`}>
                    {isActive(ann) ? 'Active' : 'Inactive'}
                  </span>
                  <span className={styles.priority}>Priority: {ann.priority}</span>
                </div>
                <div className={styles.cardDates}>
                  <span>Start: {formatDate(ann.start_date)}</span>
                  <span>End: {formatDate(ann.end_date)}</span>
                </div>
                <div className={styles.cardActions}>
                  <button className={styles.editBtn} onClick={() => handleEdit(ann)}>Edit</button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(ann.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddEditAnnouncementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        announcement={editingAnnouncement}
      />
    </div>
  )
}

export default ManageAnnouncements
