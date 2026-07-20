import React, { useEffect, useRef } from 'react'
import './ConfirmDialog.css'

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger', 'warning', 'info'
  onConfirm,
  onCancel
}) => {
  const cancelButtonRef = useRef(null)

  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      // Auto-focus cancel button for safety
      cancelButtonRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        onConfirm()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onConfirm, onCancel])

  if (!isOpen) return null

  const getVariantClass = () => {
    switch (variant) {
      case 'danger':
        return 'confirm-dialog-danger'
      case 'warning':
        return 'confirm-dialog-warning'
      case 'info':
        return 'confirm-dialog-info'
      default:
        return 'confirm-dialog-danger'
    }
  }

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div 
        className="confirm-dialog-content" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-dialog-header">
          <h3>{title}</h3>
        </div>
        
        <div className="confirm-dialog-body">
          <p>{message}</p>
        </div>
        
        <div className="confirm-dialog-footer">
          <button
            ref={cancelButtonRef}
            className="confirm-dialog-button confirm-dialog-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`confirm-dialog-button confirm-dialog-confirm ${getVariantClass()}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
