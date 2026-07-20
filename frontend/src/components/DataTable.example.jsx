import { useState } from 'react'
import DataTable from './DataTable'

/**
 * DataTable Component Example
 * 
 * This file demonstrates the usage of the enhanced DataTable component
 * with all its features including:
 * - Alternating row colors
 * - Hover row highlighting
 * - Sticky header on scroll
 * - Mobile card view transformation
 * - Loading skeleton states
 * - Empty state with illustration
 * - Sorting and filtering
 */

const DataTableExample = () => {
  const [loading, setLoading] = useState(false)
  const [showEmpty, setShowEmpty] = useState(false)

  // Sample data
  const sampleData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Author', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Reviewer', status: 'Active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor', status: 'Inactive' },
    { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'Author', status: 'Active' },
    { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Reviewer', status: 'Active' },
    { id: 6, name: 'Diana Prince', email: 'diana@example.com', role: 'Editor', status: 'Active' },
    { id: 7, name: 'Ethan Hunt', email: 'ethan@example.com', role: 'Author', status: 'Inactive' },
    { id: 8, name: 'Fiona Green', email: 'fiona@example.com', role: 'Reviewer', status: 'Active' },
  ]

  // Column definitions
  const columns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (row) => (
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          backgroundColor: row.role === 'Author' ? '#dbeafe' : 
                          row.role === 'Reviewer' ? '#fef3c7' : '#d1fae5',
          color: row.role === 'Author' ? '#1e40af' : 
                 row.role === 'Reviewer' ? '#92400e' : '#065f46'
        }}>
          {row.role}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          backgroundColor: row.status === 'Active' ? '#d1fae5' : '#fee2e2',
          color: row.status === 'Active' ? '#065f46' : '#991b1b'
        }}>
          {row.status}
        </span>
      )
    }
  ]

  // Handle row click
  const handleRowClick = (row) => {
    alert(`Clicked on: ${row.name} (${row.email})`)
  }

  // Simulate loading
  const simulateLoading = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 2000)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem', fontSize: '2rem', fontWeight: 'bold' }}>
        DataTable Component Examples
      </h1>
      
      <p style={{ marginBottom: '2rem', color: '#6b7280' }}>
        This page demonstrates the enhanced DataTable component with modern styling,
        loading states, empty states, and responsive design.
      </p>

      {/* Controls */}
      <div style={{ 
        marginBottom: '2rem', 
        display: 'flex', 
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={simulateLoading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#1a5490',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Show Loading State
        </button>
        
        <button
          onClick={() => setShowEmpty(!showEmpty)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          {showEmpty ? 'Show Data' : 'Show Empty State'}
        </button>
      </div>

      {/* Example 1: Basic Table with All Features */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '600' }}>
          Basic Table with All Features
        </h2>
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          Features: Sorting, filtering, alternating row colors, hover highlighting, 
          sticky header, mobile card view, and clickable rows.
        </p>
        
        <DataTable
          columns={columns}
          data={showEmpty ? [] : sampleData}
          onRowClick={handleRowClick}
          loading={loading}
          emptyTitle="No Users Found"
          emptyMessage="There are no users to display. Try adjusting your filters or add new users."
        />
      </section>

      {/* Example 2: Table Without Row Click */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '600' }}>
          Table Without Row Click
        </h2>
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          Same table but without clickable rows (no onRowClick handler).
        </p>
        
        <DataTable
          columns={columns}
          data={showEmpty ? [] : sampleData}
          loading={loading}
        />
      </section>

      {/* Example 3: Table with Custom Accessor */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '600' }}>
          Table with Custom Accessor
        </h2>
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          Using custom accessor functions to transform data.
        </p>
        
        <DataTable
          columns={[
            { key: 'id', label: 'ID' },
            { 
              key: 'fullInfo', 
              label: 'Full Information',
              accessor: (row) => `${row.name} (${row.email})`
            },
            { key: 'role', label: 'Role' },
            { key: 'status', label: 'Status' }
          ]}
          data={showEmpty ? [] : sampleData}
          loading={loading}
        />
      </section>

      {/* Instructions */}
      <section style={{ 
        marginTop: '3rem', 
        padding: '1.5rem', 
        backgroundColor: '#f3f4f6',
        borderRadius: '0.5rem'
      }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
          Try These Features:
        </h3>
        <ul style={{ paddingLeft: '1.5rem', color: '#4b5563' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>Search:</strong> Use the search box to filter data across all columns
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>Sort:</strong> Click on column headers to sort (ascending/descending)
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>Hover:</strong> Hover over rows to see the highlight effect
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>Click:</strong> Click on rows in the first table to trigger the action
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>Scroll:</strong> Scroll down to see the sticky header in action
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>Resize:</strong> Resize your browser window to see the mobile card view (below 768px)
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>Loading:</strong> Click "Show Loading State" to see the skeleton loader
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>Empty State:</strong> Click "Show Empty State" to see the empty state illustration
          </li>
        </ul>
      </section>
    </div>
  )
}

export default DataTableExample
