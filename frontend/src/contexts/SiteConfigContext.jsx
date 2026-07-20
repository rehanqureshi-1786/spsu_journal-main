import { createContext, useContext, useState, useEffect } from 'react'
import configService from '../services/configService'

const SiteConfigContext = createContext(null)

/**
 * SiteConfigProvider
 * Fetches site configuration on app load and provides it globally
 * Requirements: 17.6
 */
export function SiteConfigProvider({ children }) {
  const [config, setConfig] = useState({
    site_name: 'The Essence',
    site_tagline: 'SPSU Journal',
    logo_url: '',
    primary_color: '#2563eb',
    secondary_color: '#7c3aed',
    contact_email: '',
    contact_phone: '',
    footer_text: '',
    social_links: {}
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await configService.getSiteConfig()
        if (data) {
          setConfig(prev => ({ ...prev, ...data }))
        }
      } catch {
        // Use defaults if fetch fails
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [])

  const refreshConfig = async () => {
    try {
      const data = await configService.getSiteConfig()
      if (data) {
        setConfig(prev => ({ ...prev, ...data }))
      }
    } catch {
      // silently fail
    }
  }

  return (
    <SiteConfigContext.Provider value={{ config, loading, refreshConfig }}>
      {children}
    </SiteConfigContext.Provider>
  )
}

export function useSiteConfig() {
  const context = useContext(SiteConfigContext)
  if (!context) {
    return {
      config: { site_name: 'The Essence', site_tagline: 'SPSU Journal' },
      loading: false,
      refreshConfig: () => {}
    }
  }
  return context
}

export default SiteConfigContext
