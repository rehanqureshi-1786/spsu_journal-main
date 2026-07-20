import { useState, useEffect } from 'react'
import certificateService from '../../services/certificateService'
import styles from './MyCertificates.module.css'

/**
 * MyCertificates Component (Author)
 * Displays list of certificates issued to the author
 * Requirements: 2.1, 5.1, 5.2
 */

const MyCertificates = () => {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    loadCertificates()
  }, [])

  const loadCertificates = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await certificateService.getUserCertificates()
      setCertificates(data)
    } catch (err) {
      setError(err.detail || 'Failed to load certificates')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (certificateId) => {
    try {
      setDownloading(certificateId)
      const blob = await certificateService.downloadCertificate(certificateId)
      certificateService.downloadFile(blob, certificateId)
    } catch (err) {
      alert(err.detail || 'Failed to download certificate')
    } finally {
      setDownloading(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCertificateTypeLabel = (type) => {
    return type === 'subscription' ? 'Author Subscription Certificate' : 'Event Participation'
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          textAlign: 'center',
          padding: '3rem'
        }}>
          <div style={{ fontSize: '1rem', color: '#6B7280' }}>Loading certificates...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} style={{ padding: '2rem', backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '1.875rem', 
            fontWeight: '700', 
            color: '#111827',
            marginBottom: '0.5rem'
          }}>
            My Certificates
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            View and download your certificates
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <p style={{ color: '#DC2626', fontSize: '0.875rem', margin: 0 }}>
              {error}
            </p>
          </div>
        )}

        {/* Certificates List */}
        {certificates.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center',
            border: '1px solid #E5E7EB'
          }}>
            <svg 
              style={{ 
                width: '64px', 
                height: '64px', 
                margin: '0 auto 1rem',
                color: '#D1D5DB'
              }} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              color: '#111827',
              marginBottom: '0.5rem'
            }}>
              No Certificates Yet
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              You haven't received any certificates yet. Certificates will appear here when issued.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {certificates.map((cert) => (
              <div
                key={cert.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className={styles.certCard} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  {/* Certificate Info */}
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        padding: '0.5rem',
                        backgroundColor: '#D1FAE5',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg 
                          style={{ width: '24px', height: '24px', color: '#10B981' }} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" 
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: '600', 
                          color: '#111827',
                          marginBottom: '0.25rem'
                        }}>
                          {cert.event_name || 'Author Subscription Certificate'}
                        </h3>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#F3F4F6',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          color: '#6B7280'
                        }}>
                          {getCertificateTypeLabel(cert.certificate_type)}
                        </span>
                      </div>
                    </div>

                    {/* Certificate Details */}
                    <div className={styles.certDetails} style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      marginTop: '1rem'
                    }}>
                      {cert.event_date && (
                        <div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#9CA3AF',
                            marginBottom: '0.25rem'
                          }}>
                            Event Date
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>
                            {formatDate(cert.event_date)}
                          </div>
                        </div>
                      )}
                      <div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#9CA3AF',
                          marginBottom: '0.25rem'
                        }}>
                          Issued Date
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>
                          {formatDate(cert.issued_date)}
                        </div>
                      </div>
                      {cert.role && (
                        <div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#9CA3AF',
                            marginBottom: '0.25rem'
                          }}>
                            Role
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>
                            {cert.role.charAt(0).toUpperCase() + cert.role.slice(1)}
                          </div>
                        </div>
                      )}
                      <div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#9CA3AF',
                          marginBottom: '0.25rem'
                        }}>
                          Certificate ID
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#6B7280', 
                          fontFamily: 'monospace',
                          backgroundColor: '#F9FAFB',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          {cert.certificate_id}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                      onClick={() => handleDownload(cert.certificate_id)}
                      disabled={downloading === cert.certificate_id}
                      style={{
                        padding: '0.625rem 1.25rem',
                        backgroundColor: downloading === cert.certificate_id ? '#D1D5DB' : '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: downloading === cert.certificate_id ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s',
                        opacity: downloading === cert.certificate_id ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (downloading !== cert.certificate_id) {
                          e.target.style.backgroundColor = '#059669'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (downloading !== cert.certificate_id) {
                          e.target.style.backgroundColor = '#10B981'
                        }
                      }}
                    >
                      <svg 
                        style={{ width: '16px', height: '16px' }} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                        />
                      </svg>
                      {downloading === cert.certificate_id ? 'Downloading...' : 'Download PDF'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyCertificates
