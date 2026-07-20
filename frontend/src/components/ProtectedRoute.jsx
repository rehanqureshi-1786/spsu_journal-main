import React from 'react'
import { Navigate } from 'react-router-dom'
import authService from '../services/authService'

/**
 * ProtectedRoute Component
 * Protects routes by checking authentication and role-based access
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string[]} props.allowedRoles - Array of roles allowed to access this route
 */
function ProtectedRoute({ children, allowedRoles = [] }) {
  const isAuthenticated = authService.isAuthenticated()
  const currentUser = authService.getCurrentUser()

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If allowedRoles is specified, check if user has required role
  if (allowedRoles.length > 0) {
    const hasRequiredRole = authService.hasAnyRole(allowedRoles)
    
    if (!hasRequiredRole) {
      // User is authenticated but doesn't have required role
      // Redirect to their appropriate dashboard based on their role
      const userRole = currentUser?.role?.name
      
      switch (userRole) {
        case 'admin':
          return <Navigate to="/admin" replace />
        case 'reviewer':
          return <Navigate to="/reviewer" replace />
        case 'author':
          return <Navigate to="/author" replace />
        default:
          return <Navigate to="/" replace />
      }
    }
  }

  // User is authenticated and has required role (or no role check needed)
  return children
}

export default ProtectedRoute
