import api from '../config/api'

/**
 * Fetch all volumes
 * @returns {Promise<Array>} List of volumes
 */
export const getVolumes = async () => {
  try {
    const response = await api.get('/publications/volumes')
    return response.data
  } catch (error) {
    console.error('Error fetching volumes:', error)
    throw error
  }
}

/**
 * Fetch issues for a specific volume
 * @param {string} volumeId - Volume ID
 * @returns {Promise<Array>} List of issues
 */
export const getIssues = async (volumeId) => {
  try {
    const response = await api.get(`/publications/issues?volume_id=${volumeId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching issues:', error)
    throw error
  }
}

/**
 * Fetch all issues (without volume filter)
 * @returns {Promise<Array>} List of all issues
 */
export const getAllIssues = async () => {
  try {
    const response = await api.get('/publications/issues')
    return response.data
  } catch (error) {
    console.error('Error fetching all issues:', error)
    throw error
  }
}

/**
 * Fetch published papers for a specific issue
 * @param {string} issueId - Issue ID
 * @returns {Promise<Array>} List of published papers
 */
export const getPublishedPapers = async (issueId) => {
  try {
    const response = await api.get(`/publications/issues/${issueId}/papers`)
    return response.data
  } catch (error) {
    console.error('Error fetching published papers:', error)
    throw error
  }
}

/**
 * Fetch a specific published paper by ID
 * @param {string} paperId - Paper ID
 * @returns {Promise<Object>} Published paper details
 */
export const getPublishedPaper = async (paperId) => {
  try {
    const response = await api.get(`/publications/papers/${paperId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching published paper:', error)
    throw error
  }
}

/**
 * Download a published paper PDF
 * @param {string} paperId - Paper ID
 * @returns {Promise<Blob>} PDF file blob
 */
export const downloadPublishedPaper = async (paperId) => {
  try {
    const response = await api.get(`/publications/papers/${paperId}/download`, {
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.error('Error downloading published paper:', error)
    throw error
  }
}

/**
 * Get download URL for a published paper
 * @param {string} paperId - Paper ID
 * @returns {string} Download URL
 */
export const getPublishedPaperDownloadUrl = (paperId) => {
  return `${api.defaults.baseURL}/publications/papers/${paperId}/download`
}

// Default export with all methods
export default {
  getVolumes,
  getIssues,
  getAllIssues,
  getPublishedPapers,
  getPublishedPaper,
  downloadPublishedPaper,
  getPublishedPaperDownloadUrl
}
