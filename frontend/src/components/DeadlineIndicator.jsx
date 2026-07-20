import React from 'react'

/**
 * DeadlineIndicator Component
 * Visual indicator for review deadlines with color-coded urgency
 * Requirements: 5.2-5.5, 5.7
 */

/**
 * Calculate deadline status based on days remaining
 * @param {Date} deadline - The review deadline
 * @param {Date|null} submittedAt - When the review was submitted (null if not submitted)
 * @returns {Object} Status object with status, color, label, and daysRemaining
 */
const calculateDeadlineStatus = (deadline, submittedAt) => {
  // If review is submitted, mark as completed
  if (submittedAt) {
    return {
      status: 'completed',
      color: 'bg-gray-100 text-gray-800',
      label: 'Completed',
      daysRemaining: null
    }
  }

  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffTime = deadlineDate - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Overdue (deadline has passed)
  if (diffDays < 0) {
    return {
      status: 'overdue',
      color: 'bg-red-100 text-red-800',
      label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`,
      daysRemaining: diffDays
    }
  }

  // Urgent (less than 3 days)
  if (diffDays < 3) {
    return {
      status: 'urgent',
      color: 'bg-red-100 text-red-800',
      label: diffDays === 0 ? 'Due today' : `${diffDays} day${diffDays !== 1 ? 's' : ''} left`,
      daysRemaining: diffDays
    }
  }

  // Warning (3-7 days)
  if (diffDays <= 7) {
    return {
      status: 'warning',
      color: 'bg-yellow-100 text-yellow-800',
      label: `${diffDays} days left`,
      daysRemaining: diffDays
    }
  }

  // Safe (more than 7 days)
  return {
    status: 'safe',
    color: 'bg-green-100 text-green-800',
    label: `${diffDays} days left`,
    daysRemaining: diffDays
  }
}

const DeadlineIndicator = ({ deadline, submittedAt = null }) => {
  if (!deadline) {
    return null
  }

  const deadlineStatus = calculateDeadlineStatus(deadline, submittedAt)

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${deadlineStatus.color}`}
      title={`Deadline: ${new Date(deadline).toLocaleDateString()}`}
    >
      {deadlineStatus.label}
    </span>
  )
}

export default DeadlineIndicator
export { calculateDeadlineStatus }
