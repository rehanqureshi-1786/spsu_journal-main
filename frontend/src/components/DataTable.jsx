import { useState, useMemo, useEffect } from 'react'
import styles from './DataTable.module.css'

/**
 * DataTable Component
 * Sortable, filterable table component for displaying tabular data
 * Supports mobile card view for better mobile experience
 * Requirements: 2.2, 11.7, 15.1, 10.1, 10.2, 10.3, 10.4, 11.4
 */

const DataTable = ({ 
  columns, 
  data, 
  onRowClick = null,
  emptyMessage = 'No data available',
  emptyTitle = 'No Results Found',
  className = '',
  mobileCardView = true, // Enable mobile card view by default
  loading = false // Loading state
}) => {
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [filterText, setFilterText] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle column sorting
  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and default to ascending
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data

    // Apply text filter across all columns
    if (filterText) {
      filtered = data.filter(row => {
        return columns.some(col => {
          const value = col.accessor ? col.accessor(row) : row[col.key]
          return value && value.toString().toLowerCase().includes(filterText.toLowerCase())
        })
      })
    }

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const column = columns.find(col => col.key === sortColumn)
        const aValue = column.accessor ? column.accessor(a) : a[sortColumn]
        const bValue = column.accessor ? column.accessor(b) : b[sortColumn]

        if (aValue === bValue) return 0

        const comparison = aValue < bValue ? -1 : 1
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return filtered
  }, [data, columns, filterText, sortColumn, sortDirection])

  // Render mobile card view
  const renderMobileCard = (row, rowIndex) => (
    <div
      key={row.id || rowIndex}
      className={`${styles.mobileCard} ${onRowClick ? styles.clickable : ''}`}
      onClick={() => onRowClick && onRowClick(row)}
      onKeyDown={(e) => {
        if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onRowClick(row)
        }
      }}
      tabIndex={onRowClick ? 0 : -1}
      role={onRowClick ? 'button' : undefined}
    >
      {columns.map((column) => (
        <div key={column.key} className={styles.mobileCardRow}>
          <span className={styles.mobileCardLabel}>
            {column.label}
          </span>
          <span className={styles.mobileCardValue}>
            {column.render
              ? column.render(row)
              : column.accessor
              ? column.accessor(row)
              : row[column.key]}
          </span>
        </div>
      ))}
    </div>
  )

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className={styles.loadingContainer}>
      {[...Array(5)].map((_, index) => (
        <div key={index} className={styles.skeletonRow}>
          {columns.map((column, colIndex) => (
            <div
              key={column.key}
              className={styles.skeletonCell}
              style={{
                width: colIndex === 0 ? '30%' : colIndex === columns.length - 1 ? '20%' : '25%'
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )

  // Render empty state
  const renderEmptyState = () => (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateIcon}>📋</div>
      <h3 className={styles.emptyStateTitle}>{emptyTitle}</h3>
      <p className={styles.emptyStateMessage}>{emptyMessage}</p>
    </div>
  )

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Filter Input */}
      <div className={styles.filterContainer}>
        <input
          type="text"
          placeholder="Search..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className={styles.filterInput}
          aria-label="Search table"
        />
      </div>

      {/* Loading State */}
      {loading ? (
        isMobile && mobileCardView ? (
          <div className={styles.mobileCardContainer}>
            {renderLoadingSkeleton()}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            {renderLoadingSkeleton()}
          </div>
        )
      ) : (
        <>
          {/* Mobile Card View */}
          {isMobile && mobileCardView ? (
            <div className={styles.mobileCardContainer}>
              {processedData.length === 0 ? (
                renderEmptyState()
              ) : (
                processedData.map((row, rowIndex) => renderMobileCard(row, rowIndex))
              )}
            </div>
          ) : (
            /* Desktop Table View */
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead className={styles.tableHeader}>
                  <tr className={styles.tableHeaderRow}>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={`${styles.tableHeaderCell} ${
                          column.sortable !== false ? styles.sortable : ''
                        }`}
                        onClick={() => column.sortable !== false && handleSort(column.key)}
                        role={column.sortable !== false ? 'button' : undefined}
                        tabIndex={column.sortable !== false ? 0 : -1}
                        onKeyDown={(e) => {
                          if (column.sortable !== false && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault()
                            handleSort(column.key)
                          }
                        }}
                        aria-sort={
                          sortColumn === column.key
                            ? sortDirection === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : undefined
                        }
                      >
                        <div className={styles.headerContent}>
                          <span>{column.label}</span>
                          {column.sortable !== false && sortColumn === column.key && (
                            <span className={styles.sortIcon} aria-hidden="true">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {processedData.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length}>
                        {renderEmptyState()}
                      </td>
                    </tr>
                  ) : (
                    processedData.map((row, rowIndex) => (
                      <tr
                        key={row.id || rowIndex}
                        className={`${styles.tableRow} ${
                          onRowClick ? styles.clickable : ''
                        }`}
                        onClick={() => onRowClick && onRowClick(row)}
                        onKeyDown={(e) => {
                          if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault()
                            onRowClick(row)
                          }
                        }}
                        tabIndex={onRowClick ? 0 : -1}
                        role={onRowClick ? 'button' : undefined}
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={styles.tableCell}
                            data-label={column.label}
                          >
                            {column.render
                              ? column.render(row)
                              : column.accessor
                              ? column.accessor(row)
                              : row[column.key]}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Results count */}
      {!loading && (
        <div className={styles.resultsCount}>
          Showing <span className={styles.highlight}>{processedData.length}</span> of{' '}
          <span className={styles.highlight}>{data.length}</span> results
          {filterText && ' (filtered)'}
        </div>
      )}
    </div>
  )
}

export default DataTable
