import { useState, useRef, useCallback, useEffect } from 'react'
import authService from '../services/authService'
import contentService from '../services/contentService'

/**
 * Hook for inline page editing.
 * Makes elements marked with data-editable individually editable.
 * Saves each editable section's content keyed by its index.
 * On load, restores saved content into the matching data-editable elements.
 * Supports clicking images to replace them via file upload.
 *
 * @param {string} pageKey - The page key for the content API
 */
export default function useInlineEdit(pageKey) {
  const isAdmin = authService.hasRole('admin')
  const [isEditing, setIsEditing] = useState(false)
  const editableRef = useRef(null)
  const originalEditables = useRef([])
  const [loaded, setLoaded] = useState(false)
  const fileInputRef = useRef(null)
  const activeImageRef = useRef(null)
  const imageHandlersRef = useRef([])

  // On mount, load saved content and apply to data-editable elements
  useEffect(() => {
    if (!editableRef.current) return
    const apply = async () => {
      try {
        const data = await contentService.getPageContent(pageKey)
        console.log('[useInlineEdit] Loaded content for', pageKey, ':', data?.content ? data.content.substring(0, 200) + '...' : '(empty)')
        if (data?.content) {
          let sections
          try {
            sections = JSON.parse(data.content)
          } catch {
            setLoaded(true)
            return
          }
          const editables = editableRef.current.querySelectorAll('[data-editable]')
          console.log('[useInlineEdit] Found', editables.length, 'editable elements, saved sections:', Object.keys(sections).length)
          editables.forEach((el, i) => {
            const key = String(i)
            if (sections[key] !== undefined && sections[key] !== '') {
              el.innerHTML = sections[key]
            }
          })
        }
      } catch (err) {
        console.error('Failed to load page content for', pageKey, err)
      } finally {
        setLoaded(true)
      }
    }
    // Use requestAnimationFrame + small delay to ensure DOM is fully rendered
    const raf = requestAnimationFrame(() => {
      setTimeout(apply, 50)
    })
    return () => cancelAnimationFrame(raf)
  }, [pageKey])


  // Handle image click during edit mode — open file picker
  const handleImageClick = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    activeImageRef.current = e.target
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  // Handle file selection — upload and replace image src
  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file || !activeImageRef.current) return

    const img = activeImageRef.current
    const originalSrc = img.src

    // Show loading state
    img.style.opacity = '0.5'
    img.alt = 'Uploading...'

    try {
      const result = await contentService.uploadImage(file)
      // Build full URL since the backend returns a relative path like /storage/uploads/...
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''
      img.src = `${apiBase}${result.url}`
      img.alt = file.name
    } catch (err) {
      console.error('Image upload failed:', err)
      img.src = originalSrc
      alert('Failed to upload image. Please try again.')
    } finally {
      img.style.opacity = ''
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
      activeImageRef.current = null
    }
  }, [])

  // Attach/detach image click handlers when editing state changes
  const attachImageHandlers = useCallback(() => {
    if (!editableRef.current) return
    const images = editableRef.current.querySelectorAll('[data-editable] img')
    const handlers = []
    images.forEach(img => {
      // Prevent contentEditable from capturing clicks on images
      img.setAttribute('contenteditable', 'false')
      img.draggable = false
      img.style.userSelect = 'none'

      // Wrap image in a relative container with an overlay button
      const wrapper = document.createElement('span')
      wrapper.className = 'inline-edit-image-wrapper'
      wrapper.style.cssText = 'position:relative;display:inline-block;cursor:pointer;'
      img.parentNode.insertBefore(wrapper, img)
      wrapper.appendChild(img)

      // Create overlay button
      const overlay = document.createElement('span')
      overlay.className = 'inline-edit-image-overlay'
      overlay.textContent = '📷 Change Image'
      overlay.style.cssText =
        'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
        'background:rgba(0,0,0,0.7);color:#fff;padding:8px 16px;border-radius:8px;' +
        'font-size:14px;font-weight:600;pointer-events:none;opacity:0;transition:opacity 0.2s;' +
        'white-space:nowrap;z-index:5;'
      wrapper.appendChild(overlay)

      // Show overlay on hover
      const onEnter = () => { overlay.style.opacity = '1'; img.style.filter = 'brightness(0.5)' }
      const onLeave = () => { overlay.style.opacity = '0'; img.style.filter = '' }
      wrapper.addEventListener('mouseenter', onEnter)
      wrapper.addEventListener('mouseleave', onLeave)

      // Use capturing listener on the wrapper to beat contentEditable
      const onClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        activeImageRef.current = img
        if (fileInputRef.current) fileInputRef.current.click()
      }
      wrapper.addEventListener('click', onClick, true)

      img.classList.add('inline-edit-image')
      handlers.push({ img, wrapper, overlay, onClick, onEnter, onLeave })
    })
    imageHandlersRef.current = handlers
  }, [])

  const detachImageHandlers = useCallback(() => {
    imageHandlersRef.current.forEach(({ img, wrapper, overlay, onClick, onEnter, onLeave }) => {
      wrapper.removeEventListener('click', onClick, true)
      wrapper.removeEventListener('mouseenter', onEnter)
      wrapper.removeEventListener('mouseleave', onLeave)
      img.classList.remove('inline-edit-image')
      img.removeAttribute('contenteditable')
      img.draggable = true
      img.style.userSelect = ''
      img.style.filter = ''
      // Unwrap: move img back out of wrapper
      if (wrapper.parentNode) {
        wrapper.parentNode.insertBefore(img, wrapper)
        wrapper.remove()
      }
    })
    imageHandlersRef.current = []
  }, [])

  const startEditing = useCallback(() => {
    if (!editableRef.current) return
    const editables = editableRef.current.querySelectorAll('[data-editable]')
    originalEditables.current = Array.from(editables).map(el => ({
      element: el,
      html: el.innerHTML
    }))
    editables.forEach(el => {
      el.contentEditable = 'true'
      el.classList.add('inline-editing')
    })
    setIsEditing(true)
    // Attach image handlers after a tick so DOM is ready
    setTimeout(attachImageHandlers, 0)
  }, [attachImageHandlers])

  const cancelEdits = useCallback(() => {
    if (!editableRef.current) return
    detachImageHandlers()
    originalEditables.current.forEach(({ element, html }) => {
      element.innerHTML = html
      element.contentEditable = 'false'
      element.classList.remove('inline-editing')
    })
    originalEditables.current = []
    setIsEditing(false)
  }, [detachImageHandlers])

  const saveEdits = useCallback(async () => {
    if (!editableRef.current) return
    // First, clean up image wrappers/overlays so they don't get saved in HTML
    detachImageHandlers()
    const editables = editableRef.current.querySelectorAll('[data-editable]')
    const sections = {}
    editables.forEach((el, i) => {
      el.contentEditable = 'false'
      el.classList.remove('inline-editing')
      // Clean any leftover inline styles from image editing
      el.querySelectorAll('img').forEach(img => {
        img.style.opacity = ''
        img.style.filter = ''
        img.style.userSelect = ''
        img.removeAttribute('contenteditable')
      })
      sections[String(i)] = el.innerHTML
    })
    console.log('[useInlineEdit] Saving sections for', pageKey, ':', JSON.stringify(sections).substring(0, 300) + '...')
    try {
      const result = await contentService.updatePageContent(pageKey, JSON.stringify(sections))
      if (!result) {
        alert('Save may have failed — no response from server.')
      }
    } catch (err) {
      console.error('Failed to save page content:', err)
      const msg = err?.detail || err?.message || 'Unknown error'
      if (msg.includes('credentials') || msg.includes('401') || msg.includes('Unauthorized')) {
        alert('Your session has expired. Please log in again and retry.')
      } else {
        alert('Failed to save changes: ' + msg)
      }
      // Re-enter editing mode so user doesn't lose their work
      editables.forEach((el) => {
        el.contentEditable = 'true'
        el.classList.add('inline-editing')
      })
      setIsEditing(true)
      setTimeout(attachImageHandlers, 0)
      return
    }
    originalEditables.current = []
    setIsEditing(false)
  }, [pageKey, detachImageHandlers])

  return {
    isAdmin, isEditing, editableRef, startEditing, saveEdits, cancelEdits, loaded,
    fileInputRef, handleFileChange
  }
}