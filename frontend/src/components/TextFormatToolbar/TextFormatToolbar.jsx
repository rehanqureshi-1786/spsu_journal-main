import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './TextFormatToolbar.module.css'

const PRESET_COLORS = [
  '#000000', '#374151', '#6B7280',
  '#DC2626', '#EA580C', '#D97706',
  '#16A34A', '#0284C7', '#7C3AED',
  '#DB2777', '#FFFFFF',
]

/**
 * Floating text format toolbar that appears when text is selected in edit mode.
 * Supports text color changes via document.execCommand which wraps in <font>/<span> tags,
 * persisted automatically since the parent saves innerHTML.
 */
function TextFormatToolbar({ isEditing }) {
  const [position, setPosition] = useState(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const toolbarRef = useRef(null)
  const colorInputRef = useRef(null)

  const updatePosition = useCallback(() => {
    if (!isEditing) {
      setPosition(null)
      return
    }
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      setPosition(null)
      setShowColorPicker(false)
      return
    }
    // Only show if selection is inside a data-editable element
    const anchor = selection.anchorNode
    const editableParent = anchor?.nodeType === 3
      ? anchor.parentElement?.closest('[data-editable]')
      : anchor?.closest?.('[data-editable]')
    if (!editableParent) {
      setPosition(null)
      return
    }
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    if (rect.width === 0) {
      setPosition(null)
      return
    }
    setPosition({
      top: rect.top + window.scrollY - 50,
      left: rect.left + window.scrollX + rect.width / 2,
    })
  }, [isEditing])


  useEffect(() => {
    if (!isEditing) {
      setPosition(null)
      setShowColorPicker(false)
      return
    }
    document.addEventListener('selectionchange', updatePosition)
    return () => document.removeEventListener('selectionchange', updatePosition)
  }, [isEditing, updatePosition])

  const applyColor = useCallback((color) => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.rangeCount) return

    const range = selection.getRangeAt(0)

    // First use execCommand to apply color (creates <font> tags)
    document.execCommand('foreColor', false, color)

    // Now convert any <font color="..."> tags within the editable parent to <span style="color:...">
    // This ensures the color persists since <font> is deprecated and often overridden by CSS
    const anchor = selection.anchorNode
    const editableParent = anchor?.nodeType === 3
      ? anchor.parentElement?.closest('[data-editable]')
      : anchor?.closest?.('[data-editable]')

    if (editableParent) {
      const fontTags = editableParent.querySelectorAll('font[color]')
      fontTags.forEach(font => {
        const span = document.createElement('span')
        span.style.color = font.getAttribute('color')
        span.innerHTML = font.innerHTML
        font.parentNode.replaceChild(span, font)
      })
    }

    setShowColorPicker(false)
  }, [])

  const applyFormat = useCallback((command) => {
    document.execCommand(command, false, null)
  }, [])

  const handleCustomColor = useCallback((e) => {
    applyColor(e.target.value)
  }, [applyColor])

  if (!isEditing || !position) return null

  return (
    <div
      ref={toolbarRef}
      className={styles.formatToolbar}
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button className={styles.formatBtn} onClick={() => applyFormat('bold')} title="Bold">
        <strong>B</strong>
      </button>
      <button className={styles.formatBtn} onClick={() => applyFormat('italic')} title="Italic">
        <em>I</em>
      </button>
      <button className={styles.formatBtn} onClick={() => applyFormat('underline')} title="Underline">
        <u>U</u>
      </button>
      <span className={styles.divider} />
      <div className={styles.colorSection}>
        <button
          className={styles.formatBtn}
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Text Color"
        >
          🎨
        </button>
        {showColorPicker && (
          <div className={styles.colorDropdown} onMouseDown={(e) => e.preventDefault()}>
            <div className={styles.colorGrid}>
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className={styles.colorSwatch}
                  style={{ backgroundColor: color, border: color === '#FFFFFF' ? '1px solid #ccc' : 'none' }}
                  onClick={() => applyColor(color)}
                  title={color}
                  aria-label={`Set text color to ${color}`}
                />
              ))}
            </div>
            <div className={styles.customColor}>
              <label className={styles.customColorLabel}>
                Custom:
                <input
                  ref={colorInputRef}
                  type="color"
                  className={styles.colorInput}
                  onChange={handleCustomColor}
                  defaultValue="#000000"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TextFormatToolbar