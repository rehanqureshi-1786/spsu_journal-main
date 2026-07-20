import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useSiteConfig } from '../contexts/SiteConfigContext'

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const { config } = useSiteConfig()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024)
      if (window.innerWidth > 1024) setIsMobileMenuOpen(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setIsMobileMenuOpen(false) }, [location])

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isMobileMenuOpen])

  const isActive = (path) => location.pathname === path
  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  const navStyle = {
    background: isScrolled ? 'rgba(26, 84, 144, 0.97)' : '#1a5490',
    padding: 0,
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: isScrolled ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
    transition: 'all 0.3s ease',
    borderBottom: '3px solid #d4af37'
  }

  const containerStyle = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '72px'
  }

  const linkStyle = (active) => ({
    color: active ? '#d4af37' : '#ffffff',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: active ? '700' : '500',
    padding: '0.5rem 0.75rem',
    borderRadius: '4px',
    transition: 'all 0.2s',
    letterSpacing: '0.02em',
    borderBottom: active ? '2px solid #d4af37' : '2px solid transparent'
  })

  return (
    <>
      {/* Top Bar */}
      <div style={{ background: '#0a2240', color: '#ffffff', fontSize: '0.75rem', padding: '0.4rem 0', borderBottom: '1px solid rgba(212,175,55,0.3)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Sir Padampat Singhania University, Udaipur</span>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span>ISSN: XXXX-XXXX</span>
            <a href="https://www.spsu.ac.in" target="_blank" rel="noreferrer" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: '600' }}>SPSU Main Site →</a>
          </div>
        </div>
      </div>

      <nav style={navStyle}>
        <div style={containerStyle}>
          {/* Brand */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'white' }} onClick={closeMobileMenu}>
            {config.logo_url ? (
              <img src={config.logo_url} alt="Logo" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'contain' }} />
            ) : (
              <img src="/spsu-logo.png" alt="SPSU" style={{ width: 52, height: 52, objectFit: 'contain', background: 'white', borderRadius: 8, padding: 3 }} />
            )}
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.1 }}>{config.site_name || 'The Essence'}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 500, opacity: 0.7, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{config.site_tagline || 'SPSU Academic Journal'}</div>
            </div>
          </Link>

          {/* Mobile Toggle */}
          {isMobile && (
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', zIndex: 1001 }}>
              <div style={{ width: 24, height: 2, background: 'white', marginBottom: 6, transition: '0.3s', transform: isMobileMenuOpen ? 'rotate(45deg) translateY(8px)' : 'none' }}></div>
              <div style={{ width: 24, height: 2, background: 'white', marginBottom: 6, transition: '0.3s', opacity: isMobileMenuOpen ? 0 : 1 }}></div>
              <div style={{ width: 24, height: 2, background: 'white', transition: '0.3s', transform: isMobileMenuOpen ? 'rotate(-45deg) translateY(-8px)' : 'none' }}></div>
            </button>
          )}

          {/* Nav Links */}
          <div style={{
            display: isMobile ? (isMobileMenuOpen ? 'flex' : 'none') : 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '0' : '0.25rem',
            ...(isMobile ? { position: 'fixed', top: 0, right: 0, height: '100vh', width: '300px', background: '#1a5490', flexDirection: 'column', padding: '5rem 1.5rem 2rem', zIndex: 1000, boxShadow: '-4px 0 24px rgba(0,0,0,0.3)' } : {})
          }}>
            {['/', '/about', '/editorial-board', '/author-guidelines', '/reviewer-guidelines', '/issues', '/contact'].map((path) => {
              const labels = { '/': 'Home', '/about': 'About', '/editorial-board': 'Editorial Board', '/author-guidelines': 'For Authors', '/reviewer-guidelines': 'For Reviewers', '/issues': 'Issues & Volumes', '/contact': 'Contact' }
              return (
                <Link key={path} to={path} style={{ ...linkStyle(isActive(path)), ...(isMobile ? { width: '100%', padding: '0.875rem 1rem', fontSize: '0.95rem' } : {}) }} onClick={closeMobileMenu}>
                  {labels[path]}
                </Link>
              )
            })}
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: isMobile ? 0 : '1rem', marginTop: isMobile ? '1.5rem' : 0, ...(isMobile ? { flexDirection: 'column', width: '100%', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.5rem' } : {}) }}>
              <Link to="/login" style={{ padding: '0.5rem 1.25rem', border: '1.5px solid #ffffffcc', borderRadius: 6, color: 'white', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }} onClick={closeMobileMenu}>Login</Link>
              <Link to="/signup" style={{ padding: '0.5rem 1.25rem', background: '#d4af37', borderRadius: 6, color: '#0a2240', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, border: 'none', textAlign: 'center' }} onClick={closeMobileMenu}>Submit Paper</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div onClick={closeMobileMenu} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}></div>
      )}
    </>
  )
}

export default Navbar
