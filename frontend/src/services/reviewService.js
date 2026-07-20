import api from '../config/api'

/**
 * Review Service
 * Handles reviewer operations including fetching assignments and submitting reviews
 * Requirements: 5.1, 5.3
 */

const reviewService = {
  /**
   * Get all review assignments for the current reviewer
   * @returns {Promise<Array>} List of review assignments with paper details
   */
  async getAssignedPapers() {
    try {
      const response = await api.get('/reviews/assignments')
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch assigned papers' }
    }
  },

  /**
   * Get a specific review assignment by ID
   * @param {string} assignmentId - Review assignment UUID
   * @returns {Promise<Object>} Assignment details
   */
  async getAssignment(assignmentId) {
    try {
      const response = await api.get(`/reviews/assignments/${assignmentId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch assignment' }
    }
  },

  /**
   * Download anonymized manuscript for an assigned paper
   * @param {string} paperId - Paper UUID
   * @returns {Promise<Blob>} Anonymized paper file blob
   */
  async downloadAnonymizedManuscript(paperId) {
    try {
      const response = await api.get(`/papers/${paperId}/download`, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to download manuscript' }
    }
  },

  /**
   * Submit a review for an assigned paper
   * @param {Object} reviewData - Review submission data
   * @param {string} reviewData.assignment_id - Review assignment UUID
   * @param {string} reviewData.recommendation - Review recommendation (accept, minor_revision, major_revision, reject)
   * @param {string} reviewData.comments_for_author - Comments visible to the author
   * @param {string} reviewData.comments_for_editor - Comments visible only to the editor
   * @param {File} [reviewData.review_file] - Optional review document file
   * @returns {Promise<Object>} Submitted review data
   */
  async submitReview(reviewData) {
    try {
      const formData = new FormData()
      formData.append('assignment_id', reviewData.assignment_id)
      formData.append('recommendation', reviewData.recommendation)
      formData.append('comments_for_author', reviewData.comments_for_author)
      formData.append('comments_for_editor', reviewData.comments_for_editor)
      
      if (reviewData.review_file) {
        formData.append('review_file', reviewData.review_file)
      }

      const response = await api.post('/reviews', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to submit review' }
    }
  },

  /**
   * Get reviews submitted by the current reviewer
   * @returns {Promise<Array>} List of submitted reviews
   */
  async getMyReviews() {
    try {
      const response = await api.get('/reviews/assignments')
      // Filter to only show completed assignments
      const assignments = response.data || []
      return assignments.filter(assignment => assignment.status === 'completed')
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch reviews' }
    }
  },

  /**
   * Helper function to create a download link for a manuscript
   * @param {Blob} blob - File blob
   * @param {string} filename - Filename for download
   */
  downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  async declineAssignment(assignmentId) {
    try {
      const response = await api.post(`/reviews/assignments/${assignmentId}/decline`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to decline assignment' }
    }
  }
}

export default reviewService
