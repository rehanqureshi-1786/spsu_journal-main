import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import authorService from '../../services/authorService'

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return { score, label: ['', 'Weak', 'Fair', 'Good', 'Strong'][score] }
}

const sColors = { 1: '#ef4444', 2: '#f59e0b', 3: '#10b981', 4: '#059669' }

function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', affiliation: '', orcid_id: '', password: '', confirmPassword: '', role: 'author' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = getPasswordStrength(formData.password)
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleNext = () => {
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim() || !formData.affiliation.trim()) {
      setError('Please fill in all required fields'); return
    }
    setError(''); setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters'); return }
    try {
      setLoading(true)
      const { confirmPassword, ...signupData } = formData
      await authorService.signup(signupData)
      navigate('/login', { state: { message: 'Registration successful! Please log in.' } })
    } catch (err) { setError(err.detail || err.message || 'Registration failed') }
    finally { setLoading(false) }
  }

  const inp = { width: '100%', padding: '0.7rem 0.875rem', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', transition: 'border 0.2s' }

  return (
    <div className="auth-page-layout" style={{ minHeight: '100vh', display: 'grid', background: '#f0f4f8' }}>
      {/* Left Branding */}
      <div className="auth-branding-side" style={{ background: 'linear-gradient(160deg, #0a1628 0%, #1a5490 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(212,175,55,0.1) 0%, transparent 50%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420, color: 'white' }}>
          <div style={{ marginBottom: '2rem' }}>
            <img src="/spsu-logo.png" alt="SPSU" style={{ width: 120, height: 'auto', objectFit: 'contain', background: 'white', borderRadius: 12, padding: '6px 12px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '1rem', color: 'white' }}>Join The Essence</h1>
          <div style={{ width: 50, height: 3, background: '#d4af37', marginBottom: '1.5rem', borderRadius: 2 }}></div>
          <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#ffffff', marginBottom: '2rem' }}>
            Create your account to submit manuscripts, track reviews, and contribute to SPSU's academic journal.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {['📝 Submit & track manuscripts', '🔍 Peer review process', '📜 Publication certificates'].map((f, i) => (
              <div key={i} style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.15)', borderRadius: 8, fontSize: '0.875rem', color: '#ffffff', border: '1px solid rgba(255,255,255,0.12)' }}>{f}</div>
            ))}
          </div>
          <div style={{ fontSize: '0.75rem', letterSpacing: 2, color: '#e8c94e', textTransform: 'uppercase', fontWeight: 500, marginTop: '2rem' }}>Sir Padampat Singhania University</div>
        </div>
      </div>

      {/* Right Form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem', overflowY: 'auto', width: '100%' }}>
        <div style={{ width: '100%', maxWidth: 520, background: 'white', padding: '2.5rem', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.25rem' }}>Create Account</h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>{step === 1 ? 'Tell us about yourself' : 'Set up your credentials'}</p>

          {/* Step Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a5490', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}>1</div>
            <div style={{ width: 60, height: 3, background: step >= 2 ? '#1a5490' : '#e5e7eb', borderRadius: 2 }}></div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: step >= 2 ? '#1a5490' : '#e5e7eb', color: step >= 2 ? 'white' : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}>2</div>
          </div>

          {error && (
            <div style={{ padding: '0.75rem', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem', color: '#991B1B' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '0.4rem' }}>First Name *</label>
                    <input name="first_name" value={formData.first_name} onChange={handleChange} required style={inp} onFocus={e => e.target.style.borderColor = '#1a5490'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '0.4rem' }}>Last Name *</label>
                    <input name="last_name" value={formData.last_name} onChange={handleChange} required style={inp} onFocus={e => e.target.style.borderColor = '#1a5490'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '0.4rem' }}>Email *</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} required style={inp} onFocus={e => e.target.style.borderColor = '#1a5490'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '0.4rem' }}>Affiliation / Institution *</label>
                  <input name="affiliation" value={formData.affiliation} onChange={handleChange} required style={inp} onFocus={e => e.target.style.borderColor = '#1a5490'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '0.4rem' }}>ORCID ID (optional)</label>
                  <input name="orcid_id" value={formData.orcid_id} onChange={handleChange} placeholder="0000-0000-0000-0000" style={inp} onFocus={e => e.target.style.borderColor = '#1a5490'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                </div>
                <button type="button" onClick={handleNext} style={{ width: '100%', padding: '0.8rem', background: '#1a5490', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>
                  Continue →
                </button>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '0.4rem' }}>Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required style={{ ...inp, paddingRight: '2.5rem' }} onFocus={e => e.target.style.borderColor = '#1a5490'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.5 }}>{showPassword ? '🙈' : '👁️'}</button>
                  </div>
                  {strength.score > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.score ? sColors[strength.score] : '#e5e7eb' }}></div>)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: sColors[strength.score], textAlign: 'right', marginTop: 2, fontWeight: 600 }}>{strength.label}</div>
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '0.4rem' }}>Confirm Password *</label>
                  <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required style={inp} onFocus={e => e.target.style.borderColor = '#1a5490'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '0.8rem', background: 'white', color: '#374151', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
                  <button type="submit" disabled={loading} style={{ flex: 1, padding: '0.8rem', background: loading ? '#9CA3AF' : '#1a5490', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.95rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Creating...' : 'Create Account'}</button>
                </div>
              </>
            )}
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e0e0e0' }}>
            <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>Already have an account? <Link to="/login" style={{ color: '#1a5490', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link></p>
          </div>
        </div>
      </div>

      <style>{`.auth-page-layout { grid-template-columns: 1fr 1fr; } @media (max-width: 900px) { .auth-page-layout { grid-template-columns: 1fr; } .auth-branding-side { display: none !important; } }`}</style>
    </div>
  )
}
export default SignupPage
