import React from 'react'

/**
 * StatusBadge Component
 * Visual indicator for paper status
 * Requirements: 3.2, 6.1
 */

const STATUS_COLORS = {
  'Submitted': 'bg-blue-100 text-blue-800',
  'Initial Screening': 'bg-yellow-100 text-yellow-800',
  'Reviewer Assigned': 'bg-purple-100 text-purple-800',
  'Under Review': 'bg-orange-100 text-orange-800',
  'Revision Required': 'bg-red-100 text-red-800',
  'Accepted': 'bg-green-100 text-green-800',
  'Rejected': 'bg-gray-100 text-gray-800',
  'Published': 'bg-emerald-100 text-emerald-800',
}

const StatusBadge = ({ status }) => {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}
    >
      {status}
    </span>
  )
}

export default StatusBadge
