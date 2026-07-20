import { useState } from 'react'
import TextFormatToolbar from '../TextFormatToolbar/TextFormatToolbar'
import styles from './InlineEditToolbar.module.css'

/**
 * Floating toolbar for inline page editing (admin only).
 */
function InlineEditToolbar({ isAdmin, isEditing, onEdit, onSave, onCancel, fileInputRef, onFileChange }) {
  const [saving, setSaving] = useState(false)

  if (!isAdmin) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <TextFormatToolbar isEditing={isEditing} />
      <div className={`${styles.toolbar} ${isEditing ? styles.editing : ''}`}>
        {isEditing ? (
          <>
            <span className={styles.statusText}>✏️ Editing — select text for formatting, click images to replace</span>
            <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onCancel}>
              Cancel
            </button>
            <button
              className={`${styles.btn} ${styles.btnSave}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : '💾 Save'}
            </button>
          </>
        ) : (
          <button className={`${styles.btn} ${styles.btnEdit}`} onClick={onEdit}>
            ✏️ Edit Page
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          style={{ display: 'none' }}
          onChange={onFileChange}
          aria-hidden="true"
        />
      </div>
    </>
  )
}

export default InlineEditToolbar