import api from '../config/api'

/**
 * Event Service
 * Handles event management and event certificate issuance
 * Requirements: Certificate Generation System - Event management
 */

const eventService = {
  /**
   * Create a new event (admin only)
   * @param {Object} eventData - Event data
   * @param {string} eventData.name - Event name
   * @param {string} eventData.event_date - Event date (ISO string)
   * @param {string} eventData.event_type - Event type (e.g., 'conference', 'workshop', 'webinar')
   * @param {string} [eventData.description] - Optional event description
   * @returns {Promise<Object>} Created event data
   */
  async createEvent(eventData) {
    try {
      const response = await api.post('/events', eventData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create event' }
    }
  },

  /**
   * Get all events (admin only)
   * @returns {Promise<Array>} List of all events
   */
  async getAllEvents() {
    try {
      const response = await api.get('/events')
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch events' }
    }
  },

  /**
   * Get event details by ID (admin only)
   * @param {number} eventId - Event ID
   * @returns {Promise<Object>} Event details
   */
  async getEvent(eventId) {
    try {
      const response = await api.get(`/events/${eventId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch event' }
    }
  },

  /**
   * Update an event (admin only)
   * @param {number} eventId - Event ID
   * @param {Object} updates - Event update data
   * @param {string} [updates.name] - Updated event name
   * @param {string} [updates.event_date] - Updated event date (ISO string)
   * @param {string} [updates.event_type] - Updated event type
   * @param {string} [updates.description] - Updated event description
   * @returns {Promise<Object>} Updated event data
   */
  async updateEvent(eventId, updates) {
    try {
      const response = await api.put(`/events/${eventId}`, updates)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update event' }
    }
  },

  /**
   * Issue an event certificate to a single recipient (admin only)
   * @param {number} eventId - Event ID
   * @param {number} recipientId - Recipient user ID
   * @param {string} role - Recipient role ('author' or 'reviewer')
   * @returns {Promise<Object>} Created certificate data
   */
  async issueEventCertificate(eventId, recipientId, role) {
    try {
      const response = await api.post(`/certificates/events/${eventId}/issue`, {
        recipient_id: recipientId,
        role: role
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to issue certificate' }
    }
  },

  /**
   * Bulk issue event certificates to multiple recipients (admin only)
   * @param {number} eventId - Event ID
   * @param {Array<Object>} recipients - Array of recipient objects
   * @param {number} recipients[].recipient_id - Recipient user ID
   * @param {string} recipients[].role - Recipient role ('author' or 'reviewer')
   * @returns {Promise<Object>} Bulk issuance result with success_count and failures
   */
  async bulkIssueEventCertificates(eventId, recipients) {
    try {
      const response = await api.post(`/certificates/events/${eventId}/bulk-issue`, {
        recipients: recipients
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to bulk issue certificates' }
    }
  }
}

export default eventService
