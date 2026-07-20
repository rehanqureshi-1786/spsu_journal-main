import api from '../config/api'

/**
 * Author Service
 * Handles author registration and profile management
 * Requirements: 3.1
 */

const authorService = {
  /**
   * Register a new author account
   * @param {Object} authorData - Author registration data
   * @param {string} authorData.email - Author email
   * @param {string} authorData.password - Author password
   * @param {string} authorData.first_name - Author first name
   * @param {string} authorData.last_name - Author last name
   * @param {string} authorData.affiliation - Author affiliation
   * @param {string} [authorData.orcid] - Author ORCID (optional)
   * @param {string} [authorData.bio] - Author biography (optional)
   * @returns {Promise<Object>} Created author profile
   */
  async signup(authorData) {
    try {
      const response = await api.post('/authors/signup', authorData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Author signup failed' }
    }
  },

  /**
   * Get current author's profile
   * @returns {Promise<Object>} Author profile data
   */
  async getProfile() {
    try {
      const response = await api.get('/authors/profile')
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch profile' }
    }
  },

  /**
   * Update current author's profile
   * @param {Object} profileData - Profile update data
   * @param {string} [profileData.first_name] - Updated first name
   * @param {string} [profileData.last_name] - Updated last name
   * @param {string} [profileData.affiliation] - Updated affiliation
   * @param {string} [profileData.orcid] - Updated ORCID
   * @param {string} [profileData.bio] - Updated biography
   * @returns {Promise<Object>} Updated author profile
   */
  async updateProfile(profileData) {
    try {
      const response = await api.put('/authors/profile', profileData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update profile' }
    }
  }
}

export default authorService
