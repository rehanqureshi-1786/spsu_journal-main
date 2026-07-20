import api from '../config/api'

/**
 * Paper Service
 * Handles paper submission, retrieval, and management
 * Requirements: 3.2, 3.6, 6.1, 6.3, 6.5
 */

const paperService = {
  /**
   * Submit a new paper with file upload
   * @param {Object} paperData - Paper submission data
   * @param {string} paperData.title - Paper title
   * @param {string} paperData.abstract - Paper abstract
   * @param {string[]} paperData.keywords - Paper keywords
   * @param {File} paperData.file - PDF file to upload
   * @param {Function} [onProgress] - Optional progress callback (progress: 0-100)
   * @returns {Promise<Object>} Created paper data
   */
  async submitPaper(paperData, onProgress = null) {
    try {
      const formData = new FormData()
      formData.append('title', paperData.title)
      formData.append('abstract', paperData.abstract)
      formData.append('keywords', JSON.stringify(paperData.keywords))
      formData.append('file', paperData.file)

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }

      // Add progress tracking if callback provided
      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percentCompleted)
        }
      }

      const response = await api.post('/papers', formData, config)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Paper submission failed' }
    }
  },

  /**
   * Get all papers for the current user (role-filtered)
   * @returns {Promise<Object>} List of papers
   */
  async getPapers() {
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
   * Get a specific paper by ID (role-filtered)
   * @param {string} paperId - Paper UUID
   * @returns {Promise<Object>} Paper details
   */
  async getPaper(paperId) {
    try {
      const response = await api.get(`/papers/${paperId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch paper' }
    }
  },

  /**
   * Download a paper file (role-filtered, anonymized for reviewers)
   * @param {string} paperId - Paper UUID
   * @returns {Promise<Blob>} Paper file blob
   */
  async downloadPaper(paperId) {
    try {
      const response = await api.get(`/papers/${paperId}/download`, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to download paper' }
    }
  },

  /**
   * Get paper timeline (author only)
   * @param {string} paperId - Paper UUID
   * @returns {Promise<Object>} Paper timeline with status changes
   */
  async getPaperTimeline(paperId) {
    try {
      const response = await api.get(`/papers/${paperId}/timeline`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch timeline' }
    }
  },

  /**
   * Upload a revised version of a paper (author only)
   * @param {string} paperId - Paper UUID
   * @param {File} file - Revised PDF file
   * @param {string} [notes] - Optional revision notes
   * @param {Function} [onProgress] - Optional progress callback (progress: 0-100)
   * @returns {Promise<Object>} Updated paper data
   */
  async uploadRevision(paperId, file, notes = null, onProgress = null) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (notes) {
        formData.append('notes', notes)
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }

      // Add progress tracking if callback provided
      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percentCompleted)
        }
      }

      const response = await api.post(`/papers/${paperId}/revisions`, formData, config)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to upload revision' }
    }
  },

  /**
   * Get reviews for a specific paper (role-filtered)
   * @param {string} paperId - Paper UUID
   * @returns {Promise<Object>} List of reviews
   */
  async getPaperReviews(paperId) {
    try {
      const response = await api.get(`/reviews/paper/${paperId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch reviews' }
    }
  },

  /**
   * Helper function to create a download link for a paper
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

  /**
   * Generic file upload with progress tracking
   * @param {string} url - Upload endpoint URL
   * @param {FormData} formData - Form data with file
   * @param {Function} onProgress - Progress callback (progress: 0-100)
   * @param {AbortSignal} [signal] - Optional abort signal for cancellation
   * @returns {Promise<Object>} Upload response
   */
  async uploadWithProgress(url, formData, onProgress, signal = null) {
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percentCompleted)
        },
      }

      // Add abort signal if provided for cancellation support
      if (signal) {
        config.signal = signal
      }

      const response = await api.post(url, formData, config)
      return response.data
    } catch (error) {
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        throw new Error('Upload canceled')
      }
      throw error.response?.data || { detail: 'Upload failed' }
    }
  }
}

export default paperService
