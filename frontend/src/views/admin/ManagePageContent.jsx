import { useState, useEffect } from 'react'
import contentService from '../../services/contentService'
import RichTextEditor from '../../components/RichTextEditor'
import styles from './ManagePageContent.module.css'

/**
 * ManagePageContent - Admin page for editing dynamic page content
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
 */

const PAGES = [
  { key: 'about', label: 'About Us' },
  { key: 'author-guidelines', label: 'Author Guidelines' },
  { key: 'reviewer-guidelines', label: 'Reviewer Guidelines' },
  { key: 'contact', label: 'Contact Us' },
  { key: 'editorial-board', label: 'Editorial Board' },
  { key: 'verify-certificate', label: 'Verify Certificate' },
  { key: 'issues-volumes', label: 'Issues & Volumes' },
  { key: 'home', label: 'Home Page' }
]

const ManagePageContent = () => {
  const [selectedPage, setSelectedPage] = useState(PAGES[0].key)
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    loadContent(selectedPage)
  }, [selectedPage])

  const loadContent = async (pageKey) => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const data = await contentService.getPageContent(pageKey)
      const pageContent = data?.content || ''
      setContent(pageContent)
      setOriginalContent(pageContent)
      setLastUpdated(data?.updated_at || null)
    } catch (err) {
      setContent('')
      setOriginalContent('')
      setLastUpdated(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const data = await contentService.updatePageContent(selectedPage, content)
      setOriginalContent(content)
      setLastUpdated(data?.updated_at || new Date().toISOString())
      setSuccess('Content saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.detail || 'Failed to save content')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = content !== originalContent
  const currentPageLabel = PAGES.find(p => p.key === selectedPage)?.label || selectedPage

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Manage Page Content</h1>
        <p className={styles.subtitle}>Edit the content displayed on public pages</p>
      </div>

      {/* Page Selector */}
      <div className={styles.toolbar}>
        <div className={styles.pageSelector}>
          <label htmlFor="page-select" className={styles.selectorLabel}>Select Page:</label>
          <select
            id="page-select"
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className={styles.select}
            disabled={loading || saving}
          >
            {PAGES.map(page => (
              <option key={page.key} value={page.key}>{page.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.actions}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={styles.previewBtn}
          >
            {showPreview ? '✏️ Editor' : '👁️ Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges || loading}
            className={styles.saveBtn}
          >
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className={styles.errorMsg}>⚠️ {error}</div>
      )}
      {success && (
        <div className={styles.successMsg}>✅ {success}</div>
      )}

      {/* Last Updated Info */}
      {lastUpdated && (
        <div className={styles.lastUpdated}>
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className={styles.unsavedWarning}>
          You have unsaved changes for "{currentPageLabel}"
        </div>
      )}

      {/* Content Area */}
      <div className={styles.contentArea}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading content...</p>
          </div>
        ) : showPreview ? (
          <div className={styles.previewArea}>
            <div className={styles.previewHeader}>
              Preview: {currentPageLabel}
            </div>
            <div
              className={styles.previewContent}
              dangerouslySetInnerHTML={{ __html: content || '<p style="color: #999;">No content yet. Switch to editor to add content.</p>' }}
            />
          </div>
        ) : (
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder={`Enter content for ${currentPageLabel}...`}
            toolbar="full"
          />
        )}
      </div>
    </div>
  )
}

export default ManagePageContent
