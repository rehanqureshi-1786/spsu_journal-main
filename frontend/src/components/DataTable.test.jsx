import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DataTable from './DataTable'

describe('DataTable Component', () => {
  const mockColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
  ]

  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
  ]

  it('renders table with data', () => {
    render(<DataTable columns={mockColumns} data={mockData} />)
    
    // Check if column headers are rendered
    expect(screen.getByText('ID')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    
    // Check if data is rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('displays empty state when no data', () => {
    render(
      <DataTable 
        columns={mockColumns} 
        data={[]} 
        emptyTitle="No Data"
        emptyMessage="Please add some data"
      />
    )
    
    expect(screen.getByText('No Data')).toBeInTheDocument()
    expect(screen.getByText('Please add some data')).toBeInTheDocument()
  })

  it('displays loading skeleton when loading', () => {
    const { container } = render(
      <DataTable columns={mockColumns} data={mockData} loading={true} />
    )
    
    // Check for skeleton elements using CSS module class pattern
    const skeletonCells = container.querySelectorAll('[class*="skeletonCell"]')
    expect(skeletonCells.length).toBeGreaterThan(0)
  })

  it('filters data based on search input', () => {
    render(<DataTable columns={mockColumns} data={mockData} />)
    
    const searchInput = screen.getByPlaceholderText('Search...')
    fireEvent.change(searchInput, { target: { value: 'Jane' } })
    
    // Jane should be visible
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    
    // John and Bob should not be visible
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
  })

  it('sorts data when column header is clicked', () => {
    render(<DataTable columns={mockColumns} data={mockData} />)
    
    const nameHeader = screen.getByText('Name')
    fireEvent.click(nameHeader)
    
    // Check if sort icon appears
    const sortIcon = screen.getByText('↑')
    expect(sortIcon).toBeInTheDocument()
  })

  it('calls onRowClick when row is clicked', () => {
    const handleRowClick = vi.fn()
    render(
      <DataTable 
        columns={mockColumns} 
        data={mockData} 
        onRowClick={handleRowClick}
      />
    )
    
    const firstRow = screen.getByText('John Doe').closest('tr')
    fireEvent.click(firstRow)
    
    expect(handleRowClick).toHaveBeenCalledWith(mockData[0])
  })

  it('displays results count', () => {
    render(<DataTable columns={mockColumns} data={mockData} />)
    
    expect(screen.getByText(/Showing/)).toBeInTheDocument()
    // Use getAllByText since "3" appears multiple times in the table
    const threeElements = screen.getAllByText('3')
    expect(threeElements.length).toBeGreaterThan(0)
  })

  it('renders with custom className', () => {
    const { container } = render(
      <DataTable 
        columns={mockColumns} 
        data={mockData} 
        className="custom-class"
      />
    )
    
    const containerDiv = container.firstChild
    expect(containerDiv).toHaveClass('custom-class')
  })

  it('supports custom render functions in columns', () => {
    const columnsWithRender = [
      { key: 'id', label: 'ID' },
      { 
        key: 'name', 
        label: 'Name',
        render: (row) => <strong>{row.name.toUpperCase()}</strong>
      }
    ]
    
    render(<DataTable columns={columnsWithRender} data={mockData} />)
    
    expect(screen.getByText('JOHN DOE')).toBeInTheDocument()
  })

  it('supports custom accessor functions in columns', () => {
    const columnsWithAccessor = [
      { key: 'id', label: 'ID' },
      { 
        key: 'fullName', 
        label: 'Full Name',
        accessor: (row) => `${row.name} (${row.id})`
      }
    ]
    
    render(<DataTable columns={columnsWithAccessor} data={mockData} />)
    
    expect(screen.getByText('John Doe (1)')).toBeInTheDocument()
  })
})
