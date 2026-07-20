import { useState, useEffect } from 'react'
import styles from './AnnouncementBanner.module.css'

/**
 * AnnouncementBanner Component
 * Displays dismissible announcement banners
 * Requirements: 18.4, 18.5
 */

const AnnouncementBanner = ({ announcements = [] }) => {
  const [dismissed, setDismissed] = useState(new Set())
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]')
      setDismissed(new Set(stored))
    } catch {
      // ignore
    }
  }, [])

  const handleDismiss = (id) => {
    const updated = new Set([...dismissed, id])
    setDismissed(updated)
    localStorage.setItem('dismissed_announcements', JSON.stringify([...updated]))
  }

  // Filter out dismissed announcements and get highest priority
  const activeAnnouncements = announcements.filter(a => !dismissed.has(a.id))

  if (activeAnnouncements.length === 0 || !visible) return null

  // Show highest priority announcement
  const announcement = activeAnnouncements[0]

  return (
    <div
      className={styles.banner}
      style={{
        backgroundColor: announcement.background_color || '#1E40AF',
        color: announcement.text_color || '#FFFFFF'
      }}
      role="alert"
    >
      <div className={styles.content}>
        <span className={styles.text}>{announcement.text}</span>
        {activeAnnouncements.length > 1 && (
          <span className={styles.count}>+{activeAnnouncements.length - 1} more</span>
        )}
      </div>
      <button
        className={styles.dismissBtn}
        onClick={() => handleDismiss(announcement.id)}
        aria-label="Dismiss announcement"
        style={{ color: announcement.text_color || '#FFFFFF' }}
      >
        &times;
      </button>
    </div>
  )
}

export default AnnouncementBanner
