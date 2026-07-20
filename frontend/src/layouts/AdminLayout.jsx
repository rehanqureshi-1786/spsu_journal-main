import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import authService from '../services/authService'

/**
 * AdminLayout Component
 * Professional sidebar layout for admin pages with mobile support
 * Requirements: 15.3, 15.5
 */

const AdminLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = authService.getCurrentUser()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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
            The Essence - Admin
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
                backgroundColor: '#1a5490',
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
                  Admin Panel
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
              to="/admin/dashboard"
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
                backgroundColor: isActive('/admin/dashboard') ? '#e8f0f8' : 'transparent',
                color: isActive('/admin/dashboard') ? '#1a5490' : '#6B7280',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </Link>
          </div>

          {/* Editorial Section */}
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
              Editorial
            </div>
            <Link
              to="/admin/papers"
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
                backgroundColor: isActive('/admin/papers') ? '#e8f0f8' : 'transparent',
                color: isActive('/admin/papers') ? '#1a5490' : '#6B7280',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Manuscripts</span>
            </Link>
            <Link
              to="/admin/reviewers"
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
                backgroundColor: isActive('/admin/reviewers') ? '#e8f0f8' : 'transparent',
                color: isActive('/admin/reviewers') ? '#1a5490' : '#6B7280',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Reviewers</span>
            </Link>
            <Link
              to="/admin/publications"
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
                backgroundColor: isActive('/admin/publications') ? '#e8f0f8' : 'transparent',
                color: isActive('/admin/publications') ? '#1a5490' : '#6B7280',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Issues</span>
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
              to="/admin/events"
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
                backgroundColor: isActive('/admin/events') ? '#e8f0f8' : 'transparent',
                color: isActive('/admin/events') ? '#1a5490' : '#6B7280',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Events</span>
            </Link>
            <Link
              to="/admin/certificates"
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
                backgroundColor: isActive('/admin/certificates') ? '#e8f0f8' : 'transparent',
                color: isActive('/admin/certificates') ? '#1a5490' : '#6B7280',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Issue Certificates</span>
            </Link>
          </div>

          {/* Content Management Section */}
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
              Content
            </div>
            <Link
              to="/admin/slideshow"
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
                backgroundColor: isActive('/admin/slideshow') ? '#e8f0f8' : 'transparent',
                color: isActive('/admin/slideshow') ? '#1a5490' : '#6B7280',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Manage Slideshow</span>
            </Link>
            <Link
              to="/admin/config"
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
                backgroundColor: isActive('/admin/config') ? '#e8f0f8' : 'transparent',
                color: isActive('/admin/config') ? '#1a5490' : '#6B7280',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Site Configuration</span>
            </Link>
            <Link
              to="/admin/announcements"
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
                backgroundColor: isActive('/admin/announcements') ? '#e8f0f8' : 'transparent',
                color: isActive('/admin/announcements') ? '#1a5490' : '#6B7280',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <span>Announcements</span>
            </Link>
          </div>

          {/* System Section */}
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
              System
            </div>
            <Link
              to="/admin/users"
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
                backgroundColor: isActive('/admin/users') ? '#e8f0f8' : 'transparent',
                color: isActive('/admin/users') ? '#1a5490' : '#6B7280',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Users</span>
            </Link>
            <Link
              to="/admin/audit"
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
                backgroundColor: isActive('/admin/audit') ? '#e8f0f8' : 'transparent',
                color: isActive('/admin/audit') ? '#1a5490' : '#6B7280',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Audit Logs</span>
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
              backgroundColor: '#1a5490',
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
                {user?.email?.split('@')[0] || 'Admin'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                Administrator
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexDirection: isMobile ? 'column' : 'row' }}>
            <Link 
              to="/" 
              onClick={closeMobileSidebar}
              style={{
                flex: 1,
                padding: '0.5rem',
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: '#6B7280',
                textDecoration: 'none',
                textAlign: 'center',
                transition: 'all 0.2s',
                minHeight: isMobile ? '44px' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              Public Site
            </Link>
            <button 
              onClick={handleLogout}
              style={{
                flex: 1,
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
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ 
        marginLeft: isMobile ? 0 : '260px', 
        flex: 1, 
        minHeight: '100vh',
        marginTop: isMobile ? '60px' : 0,
        overflowX: 'hidden',
        width: isMobile ? '100%' : 'calc(100vw - 260px)',
        maxWidth: isMobile ? '100vw' : 'calc(100vw - 260px)'
      }}>
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
