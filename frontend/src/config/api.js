import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

// Session timeout configuration (15 minutes for access token)
const SESSION_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes
const SESSION_WARNING_MS = 13 * 60 * 1000 // 13 minutes (2 min warning)

// Track last activity time
let lastActivityTime = Date.now()
let sessionTimeoutId = null
let sessionWarningTimeoutId = null
let isRefreshing = false
let refreshSubscribers = []

/**
 * Subscribe to token refresh completion
 * @param {Function} callback - Callback to execute after refresh
 */
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback)
}

/**
 * Notify all subscribers that token refresh is complete
 * @param {Error|null} error - Error if refresh failed
 */
function onRefreshComplete(error = null) {
  refreshSubscribers.forEach(callback => callback(error))
  refreshSubscribers = []
}

/**
 * Update last activity time and reset session timeout
 */
function updateActivity() {
  lastActivityTime = Date.now()
  resetSessionTimeout()
}

/**
 * Reset session timeout timers
 */
function resetSessionTimeout() {
  // Clear existing timers
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId)
  }
  if (sessionWarningTimeoutId) {
    clearTimeout(sessionWarningTimeoutId)
  }

  // Only set timers if user is authenticated
  const user = localStorage.getItem('user')
  if (!user) {
    return
  }

  // Set warning timer (2 minutes before timeout)
  sessionWarningTimeoutId = setTimeout(() => {
    console.warn('Session will expire in 2 minutes due to inactivity')
    // You can dispatch an event here to show a warning modal
    window.dispatchEvent(new CustomEvent('session-warning'))
  }, SESSION_WARNING_MS)

  // Set timeout timer
  sessionTimeoutId = setTimeout(() => {
    console.warn('Session expired due to inactivity')
    handleSessionTimeout()
  }, SESSION_TIMEOUT_MS)
}

/**
 * Handle session timeout - logout user
 */
function handleSessionTimeout() {
  localStorage.removeItem('user')
  window.location.href = '/login?reason=timeout'
}

/**
 * Clear session timers (on logout)
 */
export function clearSessionTimers() {
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId)
    sessionTimeoutId = null
  }
  if (sessionWarningTimeoutId) {
    clearTimeout(sessionWarningTimeoutId)
    sessionWarningTimeoutId = null
  }
}

/**
 * Initialize session timeout tracking
 */
export function initializeSessionTimeout() {
  // Reset timeout on user activity
  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
  
  activityEvents.forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true })
  })

  // Initialize timeout if user is logged in
  const user = localStorage.getItem('user')
  if (user) {
    resetSessionTimeout()
  }
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookie-based auth
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Update activity on each request
    updateActivity()
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling errors and token refresh
api.interceptors.response.use(
  (response) => {
    // Update activity on successful response
    updateActivity()
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Don't retry login, logout, or refresh endpoints
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/logout') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        // If refresh endpoint fails, it means refresh token expired
        if (originalRequest.url?.includes('/auth/refresh')) {
          console.warn('Refresh token expired - logging out')
          localStorage.removeItem('user')
          clearSessionTimers()
          window.location.href = '/login?reason=session_expired'
        }
        return Promise.reject(error)
      }

      // If not already retrying, attempt token refresh
      if (!originalRequest._retry) {
        originalRequest._retry = true

        // If already refreshing, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((error) => {
              if (error) {
                reject(error)
              } else {
                resolve(api(originalRequest))
              }
            })
          })
        }

        isRefreshing = true

        try {
          // Try to refresh the token
          await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            withCredentials: true
          })
          
          // Refresh successful - update activity and reset timeout
          updateActivity()
          isRefreshing = false
          onRefreshComplete()
          
          // Retry the original request
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh failed - refresh token expired or invalid
          isRefreshing = false
          onRefreshComplete(refreshError)
          
          console.warn('Token refresh failed - logging out')
          localStorage.removeItem('user')
          clearSessionTimers()
          window.location.href = '/login?reason=session_expired'
          
          return Promise.reject(refreshError)
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api
