import api from '../config/api';

/**
 * Slideshow Service
 * Handles slideshow CRUD operations for content management
 * Requirements: Frontend UI Modernization - Dynamic Homepage Slideshow
 */

const slideshowService = {
  /**
   * Get all slides (public endpoint)
   * @returns {Promise<Array>} List of active slides in order
   */
  async getSlides() {
    try {
      const response = await api.get('/content/slideshow');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch slides' };
    }
  },

  /**
   * Get all slides with admin details (admin only)
   * @returns {Promise<Array>} List of all slides including inactive ones
   */
  async getAllSlides() {
    try {
      const response = await api.get('/content/admin/slideshow');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch slides' };
    }
  },

  /**
   * Create a new slide (admin only)
   * @param {Object} slideData - Slide data
   * @param {string} slideData.image_url - URL of the slide image
   * @param {string} [slideData.caption] - Slide caption
   * @param {string} [slideData.link] - Link URL when slide is clicked
   * @param {number} [slideData.order] - Display order
   * @param {boolean} [slideData.is_active] - Whether slide is active
   * @returns {Promise<Object>} Created slide data
   */
  async createSlide(slideData) {
    try {
      const response = await api.post('/content/admin/slideshow', slideData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create slide' };
    }
  },

  /**
   * Update an existing slide (admin only)
   * @param {number} id - Slide ID
   * @param {Object} slideData - Updated slide data
   * @param {string} [slideData.image_url] - URL of the slide image
   * @param {string} [slideData.caption] - Slide caption
   * @param {string} [slideData.link] - Link URL when slide is clicked
   * @param {number} [slideData.order] - Display order
   * @param {boolean} [slideData.is_active] - Whether slide is active
   * @returns {Promise<Object>} Updated slide data
   */
  async updateSlide(id, slideData) {
    try {
      const response = await api.put(`/content/admin/slideshow/${id}`, slideData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update slide' };
    }
  },

  /**
   * Delete a slide (admin only)
   * @param {number} id - Slide ID
   * @returns {Promise<Object>} Success message
   */
  async deleteSlide(id) {
    try {
      const response = await api.delete(`/content/admin/slideshow/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to delete slide' };
    }
  },

  /**
   * Reorder slides (admin only)
   * @param {Array<Object>} slides - Array of slides with updated order
   * @param {number} slides[].id - Slide ID
   * @param {number} slides[].order - New order position
   * @returns {Promise<Object>} Success message
   */
  async reorderSlides(slides) {
    try {
      // Transform slides array to the format expected by the API
      const slideOrder = slides.map((slide, index) => ({
        id: slide.id,
        order: index + 1
      }));
      
      const response = await api.put('/content/admin/slideshow/reorder', {
        slides: slideOrder
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to reorder slides' };
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
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to upload image' };
    }
  }
};

export default slideshowService;
