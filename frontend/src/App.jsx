import { BrowserRouter as Router } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AppRoutes from './routes/AppRoutes'
import { initializeSessionTimeout } from './config/api'
import authService from './services/authService'
import toastService from './services/toastService'
import ToastContainer from './components/ToastContainer'
import { ThemeProvider } from './contexts/ThemeContext'
import { SiteConfigProvider } from './contexts/SiteConfigContext'

function App() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Initialize session timeout tracking if user is already logged in
    if (authService.isAuthenticated()) {
      initializeSessionTimeout()
    }

    // Listen for session warning events
    const handleSessionWarning = () => {
      // You can show a modal or notification here
      console.warn('Your session will expire soon due to inactivity')
    }

    window.addEventListener('session-warning', handleSessionWarning)

    // Subscribe to toast notifications
    const unsubscribe = toastService.subscribe((toast) => {
      setToasts((prevToasts) => [...prevToasts, toast]);
    });

    return () => {
      window.removeEventListener('session-warning', handleSessionWarning)
      unsubscribe();
    }
  }, [])

  const handleCloseToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ThemeProvider>
      <SiteConfigProvider>
        <Router>
          <AppRoutes />
          <ToastContainer toasts={toasts} onClose={handleCloseToast} />
        </Router>
      </SiteConfigProvider>
    </ThemeProvider>
  )
}

export default App
