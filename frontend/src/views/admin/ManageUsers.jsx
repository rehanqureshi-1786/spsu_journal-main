import { useState, useEffect } from 'react'
import adminService from '../../services/adminService'
import toastService from '../../services/toastService'
import ConfirmDialog from '../../components/ConfirmDialog'
import styles from './ManageUsers.module.css'

const ManageUsers = () => {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [newUser, setNewUser] = useState({ email: '', password: '', role_id: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // Load users and roles in parallel
      const [usersData, rolesData] = await Promise.all([
        adminService.getAllUsers(0, 1000),
        adminService.getRoles()
      ])
      setUsers(usersData.users || [])
      setRoles(rolesData.roles || rolesData || [])
      
      // Set default role_id if roles are available
      const rolesList = rolesData.roles || rolesData || []
      if (rolesList.length > 0) {
        const authorRole = rolesList.find(r => r.name === 'author')
        if (authorRole) {
          setNewUser(prev => ({ ...prev, role_id: authorRole.id }))
        } else {
          setNewUser(prev => ({ ...prev, role_id: rolesList[0].id }))
        }
      }
    } catch (err) {
      setError(err.detail || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const data = await adminService.getAllUsers(0, 1000)
      setUsers(data.users || [])
    } catch (err) {
      setError(err.detail || 'Failed to load users')
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    try {
      await adminService.createUser(newUser)
      toastService.success('User created successfully!')
      setShowAddModal(false)
      setNewUser({ email: '', password: '', role_id: roles.find(r => r.name === 'author')?.id || '' })
      await loadUsers()
    } catch (err) {
      console.error('Failed to create user:', err)
      toastService.error(err.detail || 'Failed to create user')
    }
  }

  const handleDeleteUser = async (userId) => {
    setUserToDelete(userId)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteUser = async () => {
    try {
      await adminService.deleteUser(userToDelete)
      toastService.success('User deleted successfully!')
      await loadUsers()
    } catch (err) {
      console.error('Failed to delete user:', err)
      toastService.error('Failed to delete user')
    } finally {
      setShowDeleteConfirm(false)
      setUserToDelete(null)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '500px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            display: 'inline-block', 
            width: '48px', 
            height: '48px', 
            border: '4px solid #E5E7EB', 
            borderTopColor: '#1a5490', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6B7280', marginTop: '1rem' }}>Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
      {/* Header */}
      <div className={styles.header} style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
            Manage Users
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            Manage system users and their roles
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '0.625rem 1.25rem',
            backgroundColor: '#1a5490',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '1.25rem', lineHeight: '1' }}>+</span> Add User
        </button>
      </div>

      {/* Search */}
      <div className={styles.searchSection} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #E5E7EB' }}>
        <input
          type="text"
          placeholder="Search by email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.625rem 1rem',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '0.875rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Users Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827' }}>
            Users ({filteredUsers.length})
          </h2>
        </div>

        {filteredUsers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Created</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => {
                  const colors = ['#3B82F6', '#1a5490', '#10B981', '#F59E0B', '#EF4444']
                  const avatarColor = colors[index % colors.length]
                  const initial = user.email[0].toUpperCase()
                  
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: '600', color: '#374151' }}>
                        #{user.id}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: avatarColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {initial}
                          </div>
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                            {user.email}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: user.role?.name === 'admin' ? '#FEE2E2' : user.role?.name === 'reviewer' ? '#E0E7FF' : '#DBEAFE',
                          color: user.role?.name === 'admin' ? '#991B1B' : user.role?.name === 'reviewer' ? '#3730A3' : '#1E40AF',
                          textTransform: 'capitalize'
                        }}>
                          {user.role?.name || 'unknown'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6B7280' }}>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#FEE2E2',
                            color: '#991B1B',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
              No Users Found
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              {searchTerm ? 'Try adjusting your search' : 'No users in the system yet'}
            </p>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={() => setShowAddModal(false)}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '1.5rem' }}>
              Add New User
            </h2>
            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Role *
                </label>
                <select
                  required
                  value={newUser.role_id}
                  onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  <option value="">Select a role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    backgroundColor: 'white',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    backgroundColor: '#1a5490',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone and will permanently remove the user from the system."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteUser}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setUserToDelete(null)
        }}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default ManageUsers
