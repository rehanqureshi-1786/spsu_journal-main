import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import authService from '../services/authService'

/**
 * AuthorLayout Component
 * Professional sidebar layout for author pages with mobile support
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 14.3
 */

const AuthorLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = authService.getCurrentUser()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const toggleButtonRef = useRef(null)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 1024
      setIsMobile(mobile)
      // Close sidebar when resizing to desktop
      if (!mobile) {
        setIsMobileSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileSidebarOpen])

  const handleLogout = async () => {
    try {
      await authService.logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      navigate('/login')
    }
  }

  const isActive = (path) => location.pathname === path

  const closeMobileSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(false)
      // Return focus to toggle button on close
      if (toggleButtonRef.current) {
        toggleButtonRef.current.focus()
      }
    }
  }

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Mobile Header with Hamburger */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          zIndex: 1001
        }}>
          <button
            ref={toggleButtonRef}
            onClick={toggleMobileSidebar}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              width: '30px',
              height: '25px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
            aria-label="Toggle sidebar"
          >
            <span style={{
              width: '30px',
              height: '3px',
              backgroundColor: '#111827',
              borderRadius: '3px',
              transition: 'all 0.3s ease',
              transform: isMobileSidebarOpen ? 'rotate(45deg) translateY(8px)' : 'none'
            }}></span>
            <span style={{
              width: '30px',
              height: '3px',
              backgroundColor: '#111827',
              borderRadius: '3px',
              transition: 'all 0.3s ease',
              opacity: isMobileSidebarOpen ? 0 : 1
            }}></span>
            <span style={{
              width: '30px',
              height: '3px',
              backgroundColor: '#111827',
              borderRadius: '3px',
              transition: 'all 0.3s ease',
              transform: isMobileSidebarOpen ? 'rotate(-45deg) translateY(-8px)' : 'none'
            }}></span>
          </button>
          <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#111827' }}>
            The Essence - Author
          </div>
          <div style={{ width: '30px' }}></div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileSidebarOpen && (
        <div
          onClick={closeMobileSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
        ></div>
      )}

      {/* Sidebar */}
      <aside style={{
        width: isMobile ? '280px' : '260px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        
        zIndex: 1000,
        transition: 'transform 0.3s ease-in-out',
        transform: isMobile ? (isMobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        top: isMobile ? '60px' : 0,
        height: isMobile ? 'calc(100vh - 60px)' : '100vh'
      }}>
        {/* Logo */}
        {!isMobile && (
          <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid #E5E7EB' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                backgroundColor: '#10B981',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '700',
                fontSize: '1.125rem'
              }}>
                E
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#111827', lineHeight: '1.2' }}>
                  The Essence
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                  Author Panel
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {/* Main Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              padding: '0 1.25rem', 
              marginBottom: '0.5rem', 
              fontSize: '0.6875rem', 
              fontWeight: '600', 
              color: '#9CA3AF', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em' 
            }}>
              Main
            </div>
            <Link
              to="/author/dashboard"
              onClick={closeMobileSidebar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 1.25rem',
                margin: '0 0.75rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                backgroundColor: isActive('/author/dashboard') ? '#D1FAE5' : 'transparent',
                color: isActive('/author/dashboard') ? '#10B981' : '#6B7280',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </Link>
          </div>

          {/* Manuscripts Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              padding: '0 1.25rem', 
              marginBottom: '0.5rem', 
              fontSize: '0.6875rem', 
              fontWeight: '600', 
              color: '#9CA3AF', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em' 
            }}>
              Manuscripts
            </div>
            <Link
              to="/author/papers"
              onClick={closeMobileSidebar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 1.25rem',
                margin: '0 0.75rem 0.25rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                backgroundColor: isActive('/author/papers') ? '#D1FAE5' : 'transparent',
                color: isActive('/author/papers') ? '#10B981' : '#6B7280',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>My Papers</span>
            </Link>
            <Link
              to="/author/submit"
              onClick={closeMobileSidebar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 1.25rem',
                margin: '0 0.75rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                backgroundColor: isActive('/author/submit') ? '#D1FAE5' : 'transparent',
                color: isActive('/author/submit') ? '#10B981' : '#6B7280',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Submit Paper</span>
            </Link>
          </div>

          {/* Certificates Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              padding: '0 1.25rem', 
              marginBottom: '0.5rem', 
              fontSize: '0.6875rem', 
              fontWeight: '600', 
              color: '#9CA3AF', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em' 
            }}>
              Certificates
            </div>
            <Link
              to="/author/certificates"
              onClick={closeMobileSidebar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 1.25rem',
                margin: '0 0.75rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                backgroundColor: isActive('/author/certificates') ? '#D1FAE5' : 'transparent',
                color: isActive('/author/certificates') ? '#10B981' : '#6B7280',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span>My Certificates</span>
            </Link>
          </div>

          {/* Account Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              padding: '0 1.25rem', 
              marginBottom: '0.5rem', 
              fontSize: '0.6875rem', 
              fontWeight: '600', 
              color: '#9CA3AF', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em' 
            }}>
              Account
            </div>
            <Link
              to="/"
              onClick={closeMobileSidebar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 1.25rem',
                margin: '0 0.75rem 0.25rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                color: '#6B7280',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Public Site</span>
            </Link>
          </div>
        </nav>

        {/* User Profile */}
        <div style={{ 
          padding: '1rem 1.25rem', 
          borderTop: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email?.split('@')[0] || 'Author'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                Author
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#DC2626',
              cursor: 'pointer',
              transition: 'all 0.2s',
              minHeight: isMobile ? '44px' : 'auto'
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ 
        marginLeft: isMobile ? 0 : '260px', 
        flex: 1, 
        minHeight: '100vh',
        marginTop: isMobile ? '60px' : 0
      }}>
        <Outlet />
      </main>
    </div>
  )
}

export default AuthorLayout
