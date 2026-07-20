import api from '../config/api';

/**
 * Config Service
 * Handles site configuration CRUD operations
 * Requirements: 17.6
 */

const configService = {
  /**
   * Get site configuration (public)
   * @returns {Promise<Object>} Site configuration data
   */
  async getSiteConfig() {
    try {
      const response = await api.get('/content/config');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error.response?.data || { detail: 'Failed to fetch site configuration' };
    }
  },

  /**
   * Update site configuration (admin only)
   * @param {Object} config - Configuration data to update
   * @returns {Promise<Object>} Updated site configuration
   */
  async updateSiteConfig(config) {
    try {
      const response = await api.put('/content/admin/config', config);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update site configuration' };
    }
  }
};

export default configService;
