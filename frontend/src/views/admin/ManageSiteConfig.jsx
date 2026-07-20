import { useState, useEffect } from 'react'
import configService from '../../services/configService'
import styles from './ManageSiteConfig.module.css'

/**
 * ManageSiteConfig Component
 * Admin page for managing site configuration
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5
 */

const ManageSiteConfig = () => {
  const [config, setConfig] = useState({
    site_name: '',
    site_tagline: '',
    logo_url: '',
    primary_color: '#2563eb',
    secondary_color: '#7c3aed',
    contact_email: '',
    contact_phone: '',
    footer_text: '',
    social_links: {
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: ''
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalConfig, setOriginalConfig] = useState(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await configService.getSiteConfig()
      if (data) {
        const merged = {
          site_name: data.site_name || '',
          site_tagline: data.site_tagline || '',
          logo_url: data.logo_url || '',
          primary_color: data.primary_color || '#2563eb',
          secondary_color: data.secondary_color || '#7c3aed',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          footer_text: data.footer_text || '',
          social_links: {
            facebook: data.social_links?.facebook || '',
            twitter: data.social_links?.twitter || '',
            linkedin: data.social_links?.linkedin || '',
            instagram: data.social_links?.instagram || '',
            ...data.social_links
          }
        }
        setConfig(merged)
        setOriginalConfig(JSON.stringify(merged))
      }
    } catch (err) {
      // If 404, it means no config exists yet - that's fine
      if (err?.detail?.includes('not found')) {
        setOriginalConfig(JSON.stringify(config))
      } else {
        setError('Failed to load site configuration')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    const updated = { ...config, [field]: value }
    setConfig(updated)
    setHasChanges(JSON.stringify(updated) !== originalConfig)
    setSuccess(null)
  }

  const handleSocialChange = (platform, value) => {
    const updated = {
      ...config,
      social_links: { ...config.social_links, [platform]: value }
    }
    setConfig(updated)
    setHasChanges(JSON.stringify(updated) !== originalConfig)
    setSuccess(null)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const payload = {
        site_name: config.site_name || undefined,
        site_tagline: config.site_tagline || undefined,
        logo_url: config.logo_url || undefined,
        primary_color: config.primary_color || undefined,
        secondary_color: config.secondary_color || undefined,
        contact_email: config.contact_email || undefined,
        contact_phone: config.contact_phone || undefined,
        footer_text: config.footer_text || undefined,
        social_links: config.social_links
      }

      await configService.updateSiteConfig(payload)
      setOriginalConfig(JSON.stringify(config))
      setHasChanges(false)
      setSuccess('Site configuration saved successfully')
    } catch (err) {
      setError(err?.detail || 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading configuration...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Site Configuration</h1>
          <p className={styles.subtitle}>Manage your site's name, branding, colors, and contact information</p>
        </div>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}
      {success && <div className={styles.successBanner}>{success}</div>}
      {hasChanges && <div className={styles.warningBanner}>You have unsaved changes</div>}

      <div className={styles.sections}>
        {/* General Settings */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>General Settings</h2>
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.label}>Site Name</label>
              <input
                type="text"
                className={styles.input}
                value={config.site_name}
                onChange={(e) => handleChange('site_name', e.target.value)}
                placeholder="The Essence Journal"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Tagline</label>
              <input
                type="text"
                className={styles.input}
                value={config.site_tagline}
                onChange={(e) => handleChange('site_tagline', e.target.value)}
                placeholder="Academic Excellence in Research"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Logo URL</label>
              <input
                type="text"
                className={styles.input}
                value={config.logo_url}
                onChange={(e) => handleChange('logo_url', e.target.value)}
                placeholder="/storage/uploads/logo.png"
              />
              {config.logo_url && (
                <div className={styles.logoPreview}>
                  <img src={config.logo_url} alt="Logo preview" onError={(e) => e.target.style.display = 'none'} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Theme Colors */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Theme Colors</h2>
          <div className={styles.colorGroup}>
            <div className={styles.colorField}>
              <label className={styles.label}>Primary Color</label>
              <div className={styles.colorInput}>
                <input
                  type="color"
                  value={config.primary_color}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  className={styles.colorPicker}
                />
                <input
                  type="text"
                  className={styles.colorText}
                  value={config.primary_color}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  placeholder="#2563eb"
                />
              </div>
            </div>
            <div className={styles.colorField}>
              <label className={styles.label}>Secondary Color</label>
              <div className={styles.colorInput}>
                <input
                  type="color"
                  value={config.secondary_color}
                  onChange={(e) => handleChange('secondary_color', e.target.value)}
                  className={styles.colorPicker}
                />
                <input
                  type="text"
                  className={styles.colorText}
                  value={config.secondary_color}
                  onChange={(e) => handleChange('secondary_color', e.target.value)}
                  placeholder="#7c3aed"
                />
              </div>
            </div>
          </div>
          <div className={styles.colorPreview}>
            <div className={styles.previewSwatch} style={{ backgroundColor: config.primary_color }}>
              Primary
            </div>
            <div className={styles.previewSwatch} style={{ backgroundColor: config.secondary_color }}>
              Secondary
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Contact Information</h2>
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.label}>Contact Email</label>
              <input
                type="email"
                className={styles.input}
                value={config.contact_email}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                placeholder="journal@example.com"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Contact Phone</label>
              <input
                type="tel"
                className={styles.input}
                value={config.contact_phone}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Social Media Links</h2>
          <div className={styles.fieldGroup}>
            {Object.entries(config.social_links).map(([platform, url]) => (
              <div className={styles.field} key={platform}>
                <label className={styles.label}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</label>
                <input
                  type="url"
                  className={styles.input}
                  value={url}
                  onChange={(e) => handleSocialChange(platform, e.target.value)}
                  placeholder={`https://${platform}.com/yourpage`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Footer</h2>
          <div className={styles.field}>
            <label className={styles.label}>Footer Text</label>
            <textarea
              className={styles.textarea}
              value={config.footer_text}
              onChange={(e) => handleChange('footer_text', e.target.value)}
              placeholder="© 2026 The Essence Journal. All rights reserved."
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManageSiteConfig
