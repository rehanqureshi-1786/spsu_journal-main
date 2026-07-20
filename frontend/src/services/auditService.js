import api from '../config/api'

/**
 * Audit Service
 * Handles audit log retrieval with filtering capabilities
 * Requirements: 11.7
 */

const auditService = {
  /**
   * Get audit logs with pagination and optional filters
   * @param {number} page - Page number (0-indexed)
   * @param {number} limit - Number of results per page (default: 50)
   * @param {Object} filters - Optional filter parameters
   * @param {string} [filters.user_id] - Filter by user ID
   * @param {string} [filters.action] - Filter by action type
   * @param {string} [filters.resource_type] - Filter by resource type
   * @param {string} [filters.resource_id] - Filter by resource ID
   * @param {string} [filters.start_date] - Filter logs after this date (ISO format)
   * @param {string} [filters.end_date] - Filter logs before this date (ISO format)
   * @returns {Promise<Object>} Object with logs array and total count
   */
  async getAuditLogs(page = 0, limit = 50, filters = {}) {
    try {
      const params = {
        limit: limit,
        offset: page * limit
      }
      
      if (filters.user_id) params.user_id = filters.user_id
      if (filters.action) params.action = filters.action
      if (filters.resource_type) params.resource_type = filters.resource_type
      if (filters.resource_id) params.resource_id = filters.resource_id
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date
      
      const response = await api.get('/audit/logs', { params })
      
      // Return in format expected by AuditLogs component
      return {
        logs: response.data || [],
        total: response.data?.length || 0
      }
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch audit logs' }
    }
  },

  /**
   * Get all audit logs for a specific user
   * @param {string} userId - User UUID
   * @param {number} limit - Maximum number of results (default: 100)
   * @param {number} offset - Number of results to skip (default: 0)
   * @returns {Promise<Array>} List of audit log entries for the user
   */
  async getUserAuditLogs(userId, limit = 100, offset = 0) {
    try {
      const response = await api.get(`/audit/logs/user/${userId}`, {
        params: { limit, offset }
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch user audit logs' }
    }
  },

  /**
   * Get all audit logs for a specific resource
   * @param {string} resourceType - Resource type (e.g., 'paper', 'review', 'user')
   * @param {string} resourceId - Resource UUID
   * @param {number} limit - Maximum number of results (default: 100)
   * @param {number} offset - Number of results to skip (default: 0)
   * @returns {Promise<Array>} List of audit log entries for the resource
   */
  async getResourceAuditLogs(resourceType, resourceId, limit = 100, offset = 0) {
    try {
      const response = await api.get(`/audit/logs/resource/${resourceType}/${resourceId}`, {
        params: { limit, offset }
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch resource audit logs' }
    }
  },

  /**
   * Get available action types for filtering
   * @returns {Array<string>} List of common action types
   */
  getActionTypes() {
    return [
      'login',
      'logout',
      'login_failed',
      'user_created',
      'user_updated',
      'user_deleted',
      'file_upload',
      'file_download',
      'status_change',
      'reviewer_assigned',
      'review_submitted',
      'paper_published'
    ]
  },

  /**
   * Get available resource types for filtering
   * @returns {Array<string>} List of common resource types
   */
  getResourceTypes() {
    return [
      'user',
      'paper',
      'review',
      'reviewer',
      'author',
      'publication',
      'volume',
      'issue'
    ]
  },

  /**
   * Export audit logs to CSV
   * @param {Object} filters - Optional filter parameters
   * @param {string} [filters.user_id] - Filter by user ID
   * @param {string} [filters.action] - Filter by action type
   * @param {string} [filters.resource_type] - Filter by resource type
   * @param {string} [filters.resource_id] - Filter by resource ID
   * @param {string} [filters.start_date] - Filter logs after this date (ISO format)
   * @param {string} [filters.end_date] - Filter logs before this date (ISO format)
   * @returns {Promise<string>} CSV content
   */
  async exportAuditLogs(filters = {}) {
    try {
      const params = new URLSearchParams()
      
      if (filters.user_id) params.append('user_id', filters.user_id)
      if (filters.action) params.append('action', filters.action)
      if (filters.resource_type) params.append('resource_type', filters.resource_type)
      if (filters.resource_id) params.append('resource_id', filters.resource_id)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      
      const url = `/audit/export${params.toString() ? '?' + params.toString() : ''}`
      const response = await api.get(url, {
        responseType: 'blob'  // Changed from 'text' to 'blob' for better file handling
      })
      // Convert blob to text
      return await response.data.text()
    } catch (error) {
      console.error('Export error:', error)
      // Handle blob error responses
      if (error.response?.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text()
          const errorData = JSON.parse(errorText)
          throw errorData
        } catch (parseError) {
          throw { detail: 'Failed to export audit logs' }
        }
      }
      throw error.response?.data || { detail: 'Failed to export audit logs' }
    }
  },

  /**
   * Format timestamp for display
   * @param {string} timestamp - ISO timestamp string
   * @returns {string} Formatted date and time string
   */
  formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A'
    
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  },

  /**
   * Get action display name
   * @param {string} action - Action type
   * @returns {string} Human-readable action name
   */
  getActionDisplayName(action) {
    const actionNames = {
      'login': 'Login',
      'logout': 'Logout',
      'login_failed': 'Login Failed',
      'user_created': 'User Created',
      'user_updated': 'User Updated',
      'user_deleted': 'User Deleted',
      'file_upload': 'File Upload',
      'file_download': 'File Download',
      'status_change': 'Status Change',
      'reviewer_assigned': 'Reviewer Assigned',
      'review_submitted': 'Review Submitted',
      'paper_published': 'Paper Published'
    }
    
    return actionNames[action] || action
  }
}

export default auditService
