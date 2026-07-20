import api from '../config/api'

/**
 * Admin Service
 * Handles admin operations including user management, reviewer creation,
 * reviewer assignment, paper status management, and publication functions
 * Requirements: 2.1, 2.2, 2.3, 7.2, 8.1
 */

const adminService = {
  // ==================== User Management (CRUD) ====================
  
  /**
   * Get all roles
   * @returns {Promise<Array>} List of roles
   */
  async getRoles() {
    try {
      const response = await api.get('/roles')
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch roles' }
    }
  },

  /**
   * Get all users with pagination
   * @param {number} skip - Number of records to skip
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Object>} Object with users array and total count
   */
  async getAllUsers(skip = 0, limit = 100) {
    try {
      const response = await api.get('/users', {
        params: { skip, limit }
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch users' }
    }
  },

  /**
   * Get a specific user by ID
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} User details
   */
  async getUserById(userId) {
    try {
      const response = await api.get(`/users/${userId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch user' }
    }
  },

  /**
   * Create a new user
   * @param {Object} userData - User creation data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.role_id - Role UUID
   * @returns {Promise<Object>} Created user details
   */
  async createUser(userData) {
    try {
      const response = await api.post('/users', userData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create user' }
    }
  },

  /**
   * Update an existing user
   * @param {string} userId - User UUID
   * @param {Object} userData - User update data
   * @param {string} [userData.email] - Updated email
   * @param {string} [userData.password] - Updated password
   * @param {string} [userData.role_id] - Updated role UUID
   * @param {boolean} [userData.is_active] - Updated active status
   * @returns {Promise<Object>} Updated user details
   */
  async updateUser(userId, userData) {
    try {
      const response = await api.put(`/users/${userId}`, userData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update user' }
    }
  },

  /**
   * Delete a user
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Status response
   */
  async deleteUser(userId) {
    try {
      const response = await api.delete(`/users/${userId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to delete user' }
    }
  },

  // ==================== Reviewer Management ====================
  
  /**
   * Get all reviewers with pagination
   * @param {number} skip - Number of records to skip
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Object>} Object with reviewers array and total count
   */
  async getAllReviewers(skip = 0, limit = 100) {
    try {
      const response = await api.get('/reviewers', {
        params: { skip, limit }
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch reviewers' }
    }
  },

  /**
   * Create a new reviewer account
   * @param {Object} reviewerData - Reviewer creation data
   * @param {string} reviewerData.email - Reviewer email
   * @param {string} reviewerData.password - Reviewer password
   * @param {string} reviewerData.first_name - Reviewer first name
   * @param {string} reviewerData.last_name - Reviewer last name
   * @param {string} reviewerData.affiliation - Reviewer affiliation
   * @param {Array<string>} reviewerData.expertise - List of expertise areas
   * @returns {Promise<Object>} Created reviewer details
   */
  async createReviewer(reviewerData) {
    try {
      const response = await api.post('/reviewers', reviewerData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create reviewer' }
    }
  },

  /**
   * Delete a reviewer
   * @param {string} reviewerId - Reviewer UUID
   * @returns {Promise<Object>} Status response
   */
  async deleteReviewer(reviewerId) {
    try {
      const response = await api.delete(`/reviewers/${reviewerId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to delete reviewer' }
    }
  },

  /**
   * Get workload information for all reviewers
   * @returns {Promise<Array>} Array of workload data with reviewer_id, assigned_count, and pending_count
   */
  async getReviewersWorkload() {
    try {
      const response = await api.get('/reviewers/workload')
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch reviewers workload' }
    }
  },

  // ==================== Reviewer Assignment ====================
  
  /**
   * Assign a reviewer to a paper
   * @param {Object} assignmentData - Assignment data
   * @param {string} assignmentData.paper_id - Paper UUID
   * @param {string} assignmentData.reviewer_id - Reviewer UUID
   * @param {string} assignmentData.deadline - Deadline in ISO format
   * @returns {Promise<Object>} Created assignment details
   */
  async assignReviewer(assignmentData) {
    try {
      const response = await api.post('/reviews/assign', assignmentData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to assign reviewer' }
    }
  },

  /**
   * Assign multiple reviewers to a paper
   * @param {string} paperId - Paper UUID
   * @param {Array<string>} reviewerIds - Array of reviewer UUIDs
   * @returns {Promise<Array>} Array of created assignment details
   */
  async assignReviewers(paperId, reviewerIds) {
    try {
      // Calculate deadline (30 days from now)
      const deadline = new Date()
      deadline.setDate(deadline.getDate() + 30)
      
      // Track successful and failed assignments
      const results = []
      const errors = []
      
      // Create assignments for each reviewer
      for (const reviewerId of reviewerIds) {
        try {
          const assignment = await this.assignReviewer({
            paper_id: paperId,
            reviewer_id: reviewerId,
            deadline: deadline.toISOString()
          })
          results.push(assignment)
        } catch (error) {
          // Collect errors but continue with other reviewers
          errors.push({
            reviewerId,
            error: error.detail || 'Unknown error'
          })
        }
      }
      
      // If all assignments failed, throw error
      if (results.length === 0 && errors.length > 0) {
        const errorMsg = errors[0].error
        throw { detail: errorMsg }
      }
      
      // If some succeeded, update paper status to "Under Review"
      if (results.length > 0) {
        try {
          await this.updatePaperStatus(paperId, { 
            status: 'Under Review',
            notes: `${results.length} reviewer(s) assigned`
          })
        } catch (statusError) {
          console.warn('Failed to update paper status after assignment:', statusError)
        }
      }
      
      // If there were partial failures, include that in the response
      if (errors.length > 0) {
        console.warn('Some reviewer assignments failed:', errors)
      }
      
      return results
    } catch (error) {
      throw error.response?.data || error || { detail: 'Failed to assign reviewers' }
    }
  },

  // ==================== Paper Status Management ====================
  
  /**
   * Update paper status
   * @param {string} paperId - Paper UUID
   * @param {Object} statusData - Status update data
   * @param {string} statusData.status - New status value
   * @param {string} [statusData.notes] - Optional notes about the status change
   * @returns {Promise<Object>} Updated paper details
   */
  async updatePaperStatus(paperId, statusData) {
    try {
      const response = await api.put(`/papers/${paperId}/status`, statusData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update paper status' }
    }
  },

  /**
   * Get all papers (admin view)
   * @returns {Promise<Array>} List of all papers
   */
  async getAllPapers() {
    try {
      const response = await api.get('/papers')
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch papers' }
    }
  },

  /**
   * Search and filter papers with pagination
   * @param {Object} params - Search parameters
   * @param {string} [params.q] - Search query for title or author name
   * @param {string} [params.status] - Filter by paper status
   * @param {string} [params.date_from] - Filter by submission date (from)
   * @param {string} [params.date_to] - Filter by submission date (to)
   * @param {number} [params.page] - Page number (default: 1)
   * @param {number} [params.page_size] - Items per page (default: 20)
   * @returns {Promise<Object>} Object with items, total, page, page_size, total_pages
   */
  async searchPapers(params) {
    try {
      const response = await api.get('/papers/search', { params })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to search papers' }
    }
  },

  /**
   * Perform bulk action on multiple papers
   * @param {Object} bulkData - Bulk action data
   * @param {string} bulkData.action - Action to perform ("change_status" or "assign_reviewer")
   * @param {Array<string>} bulkData.paper_ids - Array of paper UUIDs
   * @param {string} [bulkData.new_status] - New status for change_status action
   * @param {string} [bulkData.reviewer_id] - Reviewer UUID for assign_reviewer action
   * @param {string} [bulkData.deadline] - Deadline for assign_reviewer action
   * @param {string} [bulkData.notes] - Optional notes
   * @returns {Promise<Object>} Object with successful and failed arrays
   */
  async bulkAction(bulkData) {
    try {
      const response = await api.post('/papers/bulk-action', bulkData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to perform bulk action' }
    }
  },

  /**
   * Export papers to CSV
   * @param {string} queryString - Query string with filters (q, status, date_from, date_to)
   * @returns {Promise<string>} CSV content
   */
  async exportPapers(queryString) {
    try {
      const url = `/papers/export${queryString ? '?' + queryString : ''}`
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
          throw { detail: 'Failed to export papers' }
        }
      }
      throw error.response?.data || { detail: 'Failed to export papers' }
    }
  },

  /**
   * Get a specific paper by ID
   * @param {string} paperId - Paper UUID
   * @returns {Promise<Object>} Paper details
   */
  async getPaperById(paperId) {
    try {
      const response = await api.get(`/papers/${paperId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch paper' }
    }
  },

  /**
   * Get reviews for a paper (admin view with full details)
   * @param {string} paperId - Paper UUID
   * @returns {Promise<Object>} Object with reviews array and total count
   */
  async getPaperReviews(paperId) {
    try {
      const response = await api.get(`/reviews/paper/${paperId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch reviews' }
    }
  },

  // ==================== Publication Functions ====================
  
  /**
   * Create a new volume
   * @param {Object} volumeData - Volume creation data
   * @param {number} volumeData.volume_number - Volume number
   * @param {number} volumeData.year - Publication year
   * @param {string} [volumeData.title] - Optional volume title
   * @returns {Promise<Object>} Created volume details
   */
  async createVolume(volumeData) {
    try {
      const response = await api.post('/publications/volumes', volumeData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create volume' }
    }
  },

  /**
   * Get all volumes
   * @returns {Promise<Array>} List of volumes
   */
  async getAllVolumes() {
    try {
      const response = await api.get('/publications/volumes')
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch volumes' }
    }
  },

  /**
   * Create a new issue
   * @param {Object} issueData - Issue creation data
   * @param {string} issueData.volume_id - Volume UUID
   * @param {number} issueData.issue_number - Issue number
   * @param {string} issueData.publication_date - Publication date in ISO format
   * @param {string} [issueData.title] - Optional issue title
   * @returns {Promise<Object>} Created issue details
   */
  async createIssue(issueData) {
    try {
      const response = await api.post('/publications/issues', issueData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create issue' }
    }
  },

  /**
   * Get all issues, optionally filtered by volume
   * @param {string} [volumeId] - Optional volume UUID to filter by
   * @returns {Promise<Array>} List of issues
   */
  async getAllIssues(volumeId = null) {
    try {
      const params = volumeId ? { volume_id: volumeId } : {}
      const response = await api.get('/publications/issues', { params })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch issues' }
    }
  },

  /**
   * Publish a paper to an issue
   * @param {Object} publishData - Publication data
   * @param {string} publishData.paper_id - Paper UUID
   * @param {string} publishData.issue_id - Issue UUID
   * @param {number} [publishData.page_start] - Optional starting page number
   * @param {number} [publishData.page_end] - Optional ending page number
   * @param {string} [publishData.doi] - Optional DOI
   * @returns {Promise<Object>} Publication details
   */
  async publishPaper(publishData) {
    try {
      if (!publishData.issue_id) {
        throw { detail: 'Issue ID is required for publication' }
      }
      const response = await api.post('/publications/publish', publishData)
      return response.data
    } catch (error) {
      // Handle 400 errors for validation failures
      if (error.response?.status === 400) {
        throw error.response?.data || { detail: 'Validation error: ' + (error.response?.data?.detail || 'Invalid publication data') }
      }
      throw error.response?.data || { detail: 'Failed to publish paper' }
    }
  },

  // ==================== Statistics ====================
  
  /**
   * Get dashboard statistics
   * @param {Object} params - Date range parameters
   * @param {string} [params.date_from] - Start date in YYYY-MM-DD format
   * @param {string} [params.date_to] - End date in YYYY-MM-DD format
   * @returns {Promise<Object>} Statistics object with acceptance_rate, average_review_time, papers_by_status, submissions_by_month
   */
  async getDashboardStatistics(params = {}) {
    try {
      const response = await api.get('/statistics/dashboard', { params })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch statistics' }
    }
  },

  // ==================== Helper Functions ====================
  
  /**
   * Get available paper statuses
   * @returns {Array<string>} List of valid paper statuses
   */
  getPaperStatuses() {
    return [
      'Submitted',
      'Initial Screening',
      'Reviewer Assigned',
      'Under Review',
      'Revision Required',
      'Accepted',
      'Rejected',
      'Published'
    ]
  },

  /**
   * Get available review recommendations
   * @returns {Array<string>} List of valid review recommendations
   */
  getReviewRecommendations() {
    return [
      'accept',
      'minor_revision',
      'major_revision',
      'reject'
    ]
  }
}

export default adminService
