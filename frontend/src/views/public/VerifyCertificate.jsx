import { useState } from 'react'
import certificateService from '../../services/certificateService'

const H = { hero: { background: 'linear-gradient(160deg, #0a1628 0%, #1a5490 100%)', color: 'white', padding: '5rem 2rem 4rem', textAlign: 'center' }, gold: { width: 60, height: 3, background: '#d4af37', margin: '0 auto 1.5rem', borderRadius: 2 }, sec: { padding: '4rem 2rem', background: 'white' }, wrap: { maxWidth: 700, margin: '0 auto' }, card: { background: 'white', borderRadius: 12, padding: '2.5rem', border: '1px solid #e8edf2', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }, inp: { width: '100%', padding: '0.8rem 1rem', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: '1rem', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box', transition: 'border 0.2s' }, btn: { width: '100%', padding: '0.85rem', background: '#1a5490', color: 'white', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' } }

function VerifyCertificate() {
  const [certId, setCertId] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault(); setError(''); setResult(null)
    if (!certId.trim()) { setError('Please enter a certificate ID'); return }
    try {
      setLoading(true)
      const data = await certificateService.verifyCertificate(certId.trim())
      setResult(data)
    } catch (err) { setError(err.detail || 'Certificate not found or invalid') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5' }}>
      <section style={H.hero}>
        <h1 style={{ fontSize: '2.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white' }}>Verify Certificate</h1>
        <div style={H.gold}></div>
        <p style={{ fontSize: '1.05rem', color: 'white', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>Verify the authenticity of certificates issued by The Essence — SPSU Journal</p>
      </section>

      <section style={H.sec}><div style={H.wrap}>
        <div style={H.card}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.5rem', textAlign: 'center' }}>Enter Certificate ID</h2>
          <p style={{ fontSize: '0.875rem', color: '#666', textAlign: 'center', marginBottom: '1.5rem' }}>Enter the unique certificate ID printed on the certificate to verify its authenticity.</p>

          <form onSubmit={handleVerify}>
            <div style={{ marginBottom: '1rem' }}>
              <input value={certId} onChange={e => setCertId(e.target.value)} placeholder="e.g. CERT-SUB-2026-XXXXX" style={H.inp} onFocus={e => e.target.style.borderColor = '#1a5490'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
            </div>
            <button type="submit" disabled={loading} style={{ ...H.btn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Verifying...' : '🔍 Verify Certificate'}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#991B1B', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚠️ {error}
            </div>
          )}

          {result && (
            <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#F0FDF4', border: '2px solid #86EFAC', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>✅</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#166534', margin: 0 }}>Certificate Verified</h3>
              </div>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: 8, border: '1px solid #D1FAE5' }}>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {[
                    ['Certificate ID', result.certificate_id, true],
                    ['Recipient', result.recipient_name],
                    ['Type', result.certificate_type === 'subscription' ? 'Reviewer Joining Certificate' : 'Event Participation'],
                    ['Issued Date', result.issued_date ? new Date(result.issued_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'],
                    result.event_name && ['Event', result.event_name],
                    result.role && ['Role', result.role.charAt(0).toUpperCase() + result.role.slice(1)]
                  ].filter(Boolean).map(([label, value, mono], i) => (
                    <div key={i}>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.15rem', fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: '0.95rem', color: '#111827', fontWeight: mono ? 600 : 400, fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: '#ECFDF5', borderRadius: 6, fontSize: '0.8rem', color: '#065F46', textAlign: 'center' }}>
                ✓ This certificate was issued by The Essence — SPSU Journal and is authentic.
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ ...H.card, padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.5rem' }}>📜 What can be verified?</h3>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#555', fontSize: '0.85rem', lineHeight: 1.8 }}>
              <li>Reviewer Joining Certificates</li>
              <li>Author Subscription Certificates</li>
              <li>Event Participation Certificates</li>
            </ul>
          </div>
          <div style={{ ...H.card, padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.5rem' }}>🔒 How it works</h3>
            <p style={{ color: '#555', fontSize: '0.85rem', lineHeight: 1.8, margin: 0 }}>Each certificate has a unique ID. Enter it above to confirm it was officially issued by The Essence — SPSU Journal.</p>
          </div>
        </div>
      </div></section>
    </div>
  )
}
export default VerifyCertificate
