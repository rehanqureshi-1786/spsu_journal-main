import api from '../config/api'

/**
 * Certificate Service
 * Handles certificate generation, retrieval, verification, and management
 * Requirements: Certificate Generation System - All user-facing requirements
 */

const certificateService = {
  /**
   * Create a subscription certificate for the current user
   * @param {string} subscriptionDate - ISO date string of subscription
   * @returns {Promise<Object>} Created certificate data
   */
  async createSubscriptionCertificate(subscriptionDate) {
    try {
      const response = await api.post('/certificates/subscription', {
        subscription_date: subscriptionDate
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create subscription certificate' }
    }
  },

  /**
   * Get all certificates for the current user
   * @returns {Promise<Array>} List of user's certificates
   */
  async getUserCertificates() {
    try {
      const response = await api.get('/certificates/me')
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch certificates' }
    }
  },

  /**
   * Download a certificate PDF
   * @param {string} certificateId - Certificate ID
   * @returns {Promise<Blob>} Certificate PDF blob
   */
  async downloadCertificate(certificateId) {
    try {
      const response = await api.get(`/certificates/${certificateId}/download`, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to download certificate' }
    }
  },

  /**
   * Verify a certificate by ID (public endpoint)
   * @param {string} certificateId - Certificate ID to verify
   * @returns {Promise<Object>} Certificate verification details
   */
  async verifyCertificate(certificateId) {
    try {
      const response = await api.get(`/certificates/verify/${certificateId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Certificate verification failed' }
    }
  },

  /**
   * Get all certificates with optional filters (admin only)
   * @param {Object} filters - Filter parameters
   * @param {string} [filters.type] - Certificate type ('subscription' or 'event')
   * @param {number} [filters.event_id] - Filter by event ID
   * @param {number} [filters.recipient_id] - Filter by recipient ID
   * @param {string} [filters.date_from] - Filter by date from (ISO string)
   * @param {string} [filters.date_to] - Filter by date to (ISO string)
   * @returns {Promise<Array>} List of certificates
   */
  async getAllCertificates(filters = {}) {
    try {
      const response = await api.get('/certificates', { params: filters })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch certificates' }
    }
  },

  /**
   * Search certificates by certificate ID or recipient name (admin only)
   * @param {string} query - Search query
   * @returns {Promise<Array>} List of matching certificates
   */
  async searchCertificates(query) {
    try {
      const response = await api.get('/certificates', {
        params: { search: query }
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to search certificates' }
    }
  },

  /**
   * Get certificate details by ID
   * @param {string} certificateId - Certificate ID
   * @returns {Promise<Object>} Certificate details
   */
  async getCertificate(certificateId) {
    try {
      const response = await api.get(`/certificates/${certificateId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch certificate' }
    }
  },

  /**
   * Helper function to create a download link for a certificate
   * @param {Blob} blob - Certificate PDF blob
   * @param {string} certificateId - Certificate ID for filename
   */
  downloadFile(blob, certificateId) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `certificate-${certificateId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}

export default certificateService
