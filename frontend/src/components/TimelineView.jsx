import React from 'react'

/**
 * TimelineView Component
 * Professional timeline component for displaying chronological events
 * Requirements: 6.1
 */

const TimelineView = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 0', color: '#6B7280' }}>
        No timeline events available
      </div>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status) => {
    const statusColors = {
      'Submitted': { bg: '#DBEAFE', icon: '#3B82F6', border: '#93C5FD' },
      'Initial Screening': { bg: '#FEF3C7', icon: '#F59E0B', border: '#FCD34D' },
      'Reviewer Assigned': { bg: '#E0E7FF', icon: '#6366F1', border: '#C7D2FE' },
      'Under Review': { bg: '#FECACA', icon: '#EF4444', border: '#FCA5A5' },
      'Revision Required': { bg: '#FED7AA', icon: '#F97316', border: '#FDBA74' },
      'Accepted': { bg: '#D1FAE5', icon: '#10B981', border: '#A7F3D0' },
      'Rejected': { bg: '#FEE2E2', icon: '#DC2626', border: '#FECACA' },
      'Published': { bg: '#C7D2FE', icon: '#7C3AED', border: '#A5B4FC' },
    }
    return statusColors[status] || { bg: '#F3F4F6', icon: '#6B7280', border: '#D1D5DB' }
  }

  const getStatusIcon = (status) => {
    const icons = {
      'Submitted': (
        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      'Initial Screening': (
        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      'Reviewer Assigned': (
        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      'Under Review': (
        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      'Revision Required': (
        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      'Accepted': (
        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'Rejected': (
        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'Published': (
        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    }
    return icons[status] || (
      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {events.map((event, eventIdx) => {
        const colors = getStatusColor(event.status || event.title)
        const isLast = eventIdx === events.length - 1
        const isFirst = eventIdx === 0

        return (
          <div key={event.id || eventIdx} style={{ position: 'relative', paddingBottom: isLast ? '0' : '2rem' }}>
            {/* Connecting Line */}
            {!isLast && (
              <div
                style={{
                  position: 'absolute',
                  left: '19px',
                  top: '40px',
                  width: '2px',
                  height: 'calc(100% - 20px)',
                  background: 'linear-gradient(to bottom, ' + colors.border + ' 0%, #E5E7EB 100%)',
                }}
              />
            )}

            {/* Timeline Item */}
            <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
              {/* Icon Circle */}
              <div
                style={{
                  flexShrink: 0,
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: colors.bg,
                  border: `2px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.icon,
                  boxShadow: isFirst ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {getStatusIcon(event.status || event.title)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingTop: '2px' }}>
                {/* Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      backgroundColor: colors.bg,
                      color: colors.icon,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {event.status || event.title}
                  </span>
                  {isFirst && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: '#DBEAFE',
                        color: '#1E40AF',
                      }}
                    >
                      Current
                    </span>
                  )}
                </div>

                {/* Timestamp */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <svg style={{ width: '14px', height: '14px', color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                    {formatDate(event.changed_at || event.timestamp || event.date)}
                  </span>
                </div>

                {/* Notes */}
                {event.notes && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#374151',
                      lineHeight: '1.5',
                    }}
                  >
                    {event.notes}
                  </div>
                )}

                {/* Changed By */}
                {event.changed_by && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg style={{ width: '14px', height: '14px', color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                      Changed by: {event.changed_by}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TimelineView
