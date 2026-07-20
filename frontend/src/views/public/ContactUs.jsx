const H = { hero: { background: 'linear-gradient(160deg, #0a1628 0%, #1a5490 100%)', color: 'white', padding: '5rem 2rem 4rem', textAlign: 'center' }, h1: { fontSize: '2.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white' }, sub: { fontSize: '1.05rem', color: '#ffffff', maxWidth: 650, margin: '0 auto', lineHeight: 1.7 }, gold: { width: 60, height: 3, background: '#d4af37', margin: '0 auto 1.5rem', borderRadius: 2 }, sec: { padding: '4rem 2rem', background: 'white' }, secAlt: { padding: '4rem 2rem', background: '#f0f4f8' }, wrap: { maxWidth: 1100, margin: '0 auto' }, title: { fontSize: '1.75rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.5rem', textAlign: 'center' }, card: { background: 'white', borderRadius: 12, padding: '2rem', border: '1px solid #e8edf2', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' } }

function ContactUs() {
  return (
    <div style={{ backgroundColor: '#f5f5f5' }}>
      <section style={H.hero}>
        <h1 style={H.h1}>Contact Us</h1>
        <div style={H.gold}></div>
        <p style={H.sub}>Get in touch with the editorial office of The Essence — SPSU Journal</p>
      </section>

      <section style={H.sec}><div style={H.wrap}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div style={H.card}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📧</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.75rem' }}>Editorial Office</h3>
            <p style={{ color: '#555', lineHeight: 1.8, margin: '0 0 0.5rem' }}><strong>Email:</strong> journal@spsu.ac.in</p>
            <p style={{ color: '#555', lineHeight: 1.8, margin: '0 0 0.5rem' }}><strong>Phone:</strong> 1800 8896 555</p>
            <p style={{ color: '#555', lineHeight: 1.8, margin: 0 }}><strong>Hours:</strong> Mon–Fri, 9:00 AM – 5:00 PM IST</p>
          </div>
          <div style={H.card}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📍</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.75rem' }}>Mailing Address</h3>
            <p style={{ color: '#555', lineHeight: 1.8, margin: 0 }}>The Essence — Editorial Office<br/>Sir Padampat Singhania University<br/>Bhatewar, Udaipur<br/>Rajasthan 313601, India</p>
          </div>
          <div style={H.card}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🌐</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.75rem' }}>Online</h3>
            <p style={{ color: '#555', lineHeight: 1.8, margin: '0 0 0.5rem' }}><strong>University:</strong> <a href="https://www.spsu.ac.in" target="_blank" rel="noreferrer" style={{ color: '#1a5490', textDecoration: 'none' }}>www.spsu.ac.in</a></p>
            <p style={{ color: '#555', lineHeight: 1.8, margin: 0 }}><strong>Journal Portal:</strong> This website</p>
          </div>
        </div>
      </div></section>

      <section style={H.secAlt}><div style={H.wrap}>
        <h2 style={H.title}>Quick Help</h2><div style={H.gold}></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
          <div style={{ ...H.card, borderLeft: '4px solid #1a5490' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a5490', marginBottom: '0.5rem' }}>📝 For Authors</h3>
            <p style={{ color: '#555', lineHeight: 1.7, margin: 0 }}>For queries related to manuscript submission, review status, revisions, or publication — please email with your Paper ID in the subject line.</p>
          </div>
          <div style={{ ...H.card, borderLeft: '4px solid #d4af37' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#d4af37', marginBottom: '0.5rem' }}>🔍 For Reviewers</h3>
            <p style={{ color: '#555', lineHeight: 1.7, margin: 0 }}>For review assignment queries, deadline extensions, or technical issues with the review portal — please contact the editorial office.</p>
          </div>
        </div>
      </div></section>

      <section style={H.sec}><div style={H.wrap}>
        <h2 style={H.title}>Location</h2><div style={H.gold}></div>
        <div style={{ ...H.card, maxWidth: 800, margin: '1rem auto 0', textAlign: 'center' }}>
          <div style={{ background: '#f0f4f8', borderRadius: 8, padding: '3rem 2rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.5rem' }}>Sir Padampat Singhania University</h3>
            <p style={{ color: '#555', lineHeight: 1.7, margin: 0 }}>Bhatewar, Udaipur – Chittorgarh Highway<br/>Udaipur, Rajasthan 313601<br/>India</p>
          </div>
          <a href="https://maps.google.com/?q=Sir+Padampat+Singhania+University+Udaipur" target="_blank" rel="noreferrer" style={{ color: '#1a5490', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>View on Google Maps →</a>
        </div>
      </div></section>
    </div>
  )
}
export default ContactUs
