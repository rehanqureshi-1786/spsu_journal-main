import api from '../config/api';

/**
 * Content Service
 * Handles page content CRUD operations
 * Requirements: 13.7
 */

const contentService = {
  /**
   * Get content for a specific page
   * @param {string} pageKey - Page identifier (e.g., 'about', 'author-guidelines')
   * @returns {Promise<Object>} Page content data
   */
  async getPageContent(pageKey) {
    try {
      const response = await api.get(`/content/pages/${pageKey}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error.response?.data || { detail: 'Failed to fetch page content' };
    }
  },

  /**
   * Update content for a specific page (admin only)
   * @param {string} pageKey - Page identifier
   * @param {string} content - HTML content
   * @returns {Promise<Object>} Updated page content data
   */
  async updatePageContent(pageKey, content) {
    try {
      const response = await api.put(`/content/admin/pages/${pageKey}`, { content });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update page content' };
    }
  },
  /**
   * Upload an image file (admin only)
   * @param {File} file - Image file to upload
   * @returns {Promise<Object>} Upload response with file URL
   */
  async uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/content/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to upload image' };
    }
  }
};

export default contentService;
