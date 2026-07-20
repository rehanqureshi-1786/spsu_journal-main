import { Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import AnnouncementBanner from '../components/AnnouncementBanner'
import { useSiteConfig } from '../contexts/SiteConfigContext'
import announcementService from '../services/announcementService'

function PublicLayout() {
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  const { config } = useSiteConfig()
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await announcementService.getActiveAnnouncements()
        setAnnouncements(Array.isArray(data) ? data : [])
      } catch {
        // silently fail
      }
    }
    fetchAnnouncements()
  }, [])

  return (
    <div className="public-layout">
      <AnnouncementBanner announcements={announcements} />
      <Navbar />
      <main className={isHomePage ? '' : 'main-content'}>
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-container">
          <p>{config.footer_text || `\u00A9 ${new Date().getFullYear()} The Essence - Sir Padampat Singhania University. All rights reserved.`}</p>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout
