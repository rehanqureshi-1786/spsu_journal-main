import api from '../config/api'
import { clearSessionTimers, initializeSessionTimeout } from '../config/api'

/**
 * Authentication Service
 * Handles login, logout, token refresh, and user session management
 */

const authService = {
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and tokens
   */
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password })
      
      // Store user data in localStorage
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user))
        // Initialize session timeout tracking after successful login
        initializeSessionTimeout()
      }
      
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Login failed' }
    }
  },

  /**
   * Logout current user
   * Clears cookies and local storage
   */
  async logout() {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always clear local storage and session timers even if API call fails
      localStorage.removeItem('user')
      clearSessionTimers()
      window.location.href = '/login'
    }
  },

  /**
   * Refresh access token using refresh token cookie
   * @returns {Promise<Object>} New access token
   */
  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh')
      return response.data
    } catch (error) {
      // If refresh fails, clear user data, session timers, and redirect to login
      localStorage.removeItem('user')
      clearSessionTimers()
      throw error
    }
  },

  /**
   * Get current user from localStorage
   * @returns {Object|null} Current user or null
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('user')
        return null
      }
    }
    return null
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is logged in
   */
  isAuthenticated() {
    return this.getCurrentUser() !== null
  },

  /**
   * Check if current user has a specific role
   * @param {string} role - Role to check
   * @returns {boolean} True if user has the role
   */
  hasRole(role) {
    const user = this.getCurrentUser()
    return user?.role?.name === role
  },

  /**
   * Check if current user has any of the specified roles
   * @param {string[]} roles - Array of roles to check
   * @returns {boolean} True if user has any of the roles
   */
  hasAnyRole(roles) {
    const user = this.getCurrentUser()
    return roles.includes(user?.role?.name)
  }
}

export default authService
