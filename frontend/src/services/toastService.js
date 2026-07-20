// Toast service for managing toast notifications
class ToastService {
  constructor() {
    this.listeners = [];
    this.toastId = 0;
  }

  // Subscribe to toast updates
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  notify(toast) {
    this.listeners.forEach(listener => listener(toast));
  }

  // Show success toast
  success(message, duration = 5000) {
    const toast = {
      id: ++this.toastId,
      type: 'success',
      message,
      duration
    };
    this.notify(toast);
  }

  // Show error toast
  error(message, duration = 5000) {
    const toast = {
      id: ++this.toastId,
      type: 'error',
      message,
      duration
    };
    this.notify(toast);
  }

  // Show warning toast
  warning(message, duration = 5000) {
    const toast = {
      id: ++this.toastId,
      type: 'warning',
      message,
      duration
    };
    this.notify(toast);
  }

  // Show info toast
  info(message, duration = 5000) {
    const toast = {
      id: ++this.toastId,
      type: 'info',
      message,
      duration
    };
    this.notify(toast);
  }
}

// Create singleton instance
const toastService = new ToastService();

export default toastService;
