import { useState, useEffect } from 'react'
import styles from './AddEditAnnouncementModal.module.css'

/**
 * AddEditAnnouncementModal Component
 * Modal form for creating/editing announcements
 * Requirements: 18.1, 18.2, 18.3
 */

const AddEditAnnouncementModal = ({ isOpen, onClose, onSave, announcement = null }) => {
  const [form, setForm] = useState({
    text: '',
    background_color: '#1E40AF',
    text_color: '#FFFFFF',
    start_date: '',
    end_date: '',
    priority: 0,
    is_active: true
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (announcement) {
      setForm({
        text: announcement.text || '',
        background_color: announcement.background_color || '#1E40AF',
        text_color: announcement.text_color || '#FFFFFF',
        start_date: announcement.start_date ? announcement.start_date.slice(0, 16) : '',
        end_date: announcement.end_date ? announcement.end_date.slice(0, 16) : '',
        priority: announcement.priority || 0,
        is_active: announcement.is_active !== undefined ? announcement.is_active : true
      })
    } else {
      const now = new Date()
      const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      setForm({
        text: '',
        background_color: '#1E40AF',
        text_color: '#FFFFFF',
        start_date: localISO,
        end_date: '',
        priority: 0,
        is_active: true
      })
    }
    setError(null)
  }, [announcement, isOpen])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.text.trim()) {
      setError('Announcement text is required')
      return
    }
    if (!form.start_date) {
      setError('Start date is required')
      return
    }

    try {
      setSaving(true)
      const payload = {
        ...form,
        start_date: new Date(form.start_date).toISOString(),
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        priority: parseInt(form.priority, 10) || 0
      }
      await onSave(payload)
      onClose()
    } catch (err) {
      setError(err?.detail || 'Failed to save announcement')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{announcement ? 'Edit Announcement' : 'Create Announcement'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {/* Preview */}
        <div className={styles.preview} style={{ backgroundColor: form.background_color, color: form.text_color }}>
          {form.text || 'Preview will appear here...'}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Announcement Text *</label>
            <textarea
              className={styles.textarea}
              value={form.text}
              onChange={(e) => handleChange('text', e.target.value)}
              placeholder="Enter announcement text..."
              rows={3}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.colorField}>
              <label className={styles.label}>Background Color</label>
              <div className={styles.colorInput}>
                <input type="color" value={form.background_color} onChange={(e) => handleChange('background_color', e.target.value)} />
                <input type="text" value={form.background_color} onChange={(e) => handleChange('background_color', e.target.value)} className={styles.colorText} />
              </div>
            </div>
            <div className={styles.colorField}>
              <label className={styles.label}>Text Color</label>
              <div className={styles.colorInput}>
                <input type="color" value={form.text_color} onChange={(e) => handleChange('text_color', e.target.value)} />
                <input type="text" value={form.text_color} onChange={(e) => handleChange('text_color', e.target.value)} className={styles.colorText} />
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Start Date *</label>
              <input type="datetime-local" className={styles.input} value={form.start_date} onChange={(e) => handleChange('start_date', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>End Date</label>
              <input type="datetime-local" className={styles.input} value={form.end_date} onChange={(e) => handleChange('end_date', e.target.value)} />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Priority</label>
              <input type="number" className={styles.input} value={form.priority} onChange={(e) => handleChange('priority', e.target.value)} min="0" max="100" />
              <span className={styles.hint}>Higher number = higher priority</span>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Status</label>
              <label className={styles.toggle}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => handleChange('is_active', e.target.checked)} />
                <span>{form.is_active ? 'Active' : 'Inactive'}</span>
              </label>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? 'Saving...' : (announcement ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddEditAnnouncementModal
