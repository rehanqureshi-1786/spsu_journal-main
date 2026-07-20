import api from '../config/api';

/**
 * Announcement Service
 * Handles announcement CRUD operations
 * Requirements: 18.1, 18.2, 18.3
 */

const announcementService = {
  async getActiveAnnouncements() {
    try {
      const response = await api.get('/content/announcements/active');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) return [];
      throw error.response?.data || { detail: 'Failed to fetch announcements' };
    }
  },

  async getAllAnnouncements() {
    try {
      const response = await api.get('/content/admin/announcements');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch announcements' };
    }
  },

  async createAnnouncement(data) {
    try {
      const response = await api.post('/content/admin/announcements', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create announcement' };
    }
  },

  async updateAnnouncement(id, data) {
    try {
      const response = await api.put(`/content/admin/announcements/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update announcement' };
    }
  },

  async deleteAnnouncement(id) {
    try {
      await api.delete(`/content/admin/announcements/${id}`);
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to delete announcement' };
    }
  }
};

export default announcementService;
