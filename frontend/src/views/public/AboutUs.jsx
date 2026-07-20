import { Link } from 'react-router-dom'

const H = { hero: { background: 'linear-gradient(160deg, #0a1628 0%, #1a5490 100%)', color: 'white', padding: '5rem 2rem 4rem', textAlign: 'center' }, h1: { fontSize: '2.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white' }, sub: { fontSize: '1.05rem', color: '#ffffff', maxWidth: 650, margin: '0 auto', lineHeight: 1.7 }, gold: { width: 60, height: 3, background: '#d4af37', margin: '0 auto 1.5rem', borderRadius: 2 }, sec: { padding: '4rem 2rem', background: 'white' }, secAlt: { padding: '4rem 2rem', background: '#f0f4f8' }, wrap: { maxWidth: 1100, margin: '0 auto' }, title: { fontSize: '1.75rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.5rem', textAlign: 'center' }, card: { background: 'white', borderRadius: 12, padding: '2rem', border: '1px solid #e8edf2', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }, cta: { background: 'linear-gradient(160deg, #0a1628, #1a5490)', color: 'white', padding: '5rem 2rem', textAlign: 'center' }, btn: { display: 'inline-block', padding: '0.85rem 2.5rem', background: '#d4af37', color: '#0a1628', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '1rem' } }

function AboutUs() {
  return (
    <div style={{ backgroundColor: '#f5f5f5' }}>
      <section style={H.hero}>
        <h1 style={H.h1}>About The Essence</h1>
        <div style={H.gold}></div>
        <p style={H.sub}>The official academic journal of Sir Padampat Singhania University (SPSU), Udaipur — dedicated to advancing knowledge through quality research publications.</p>
      </section>

      <section style={H.sec}><div style={H.wrap}>
        <h2 style={H.title}>Mission & Vision</h2><div style={H.gold}></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
          <div style={H.card}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a5490', marginBottom: '0.75rem' }}>🎯 Our Mission</h3>
            <p style={{ color: '#555', lineHeight: 1.8, margin: 0 }}>To provide a credible platform for researchers, academicians, and students to publish original, peer-reviewed research that contributes to the advancement of knowledge across multiple disciplines.</p>
          </div>
          <div style={H.card}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a5490', marginBottom: '0.75rem' }}>🔭 Our Vision</h3>
            <p style={{ color: '#555', lineHeight: 1.8, margin: 0 }}>To become a nationally recognized academic journal that fosters interdisciplinary research, promotes academic excellence, and bridges the gap between academia and industry.</p>
          </div>
        </div>
      </div></section>

      <section style={H.secAlt}><div style={H.wrap}>
        <h2 style={H.title}>Journal Particulars</h2><div style={H.gold}></div>
        <div style={{ ...H.card, maxWidth: 700, margin: '1rem auto 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[['Publisher', 'SPSU, Udaipur'], ['Frequency', 'Biannual'], ['Language', 'English'], ['Format', 'Online (Open Access)'], ['Established', '2024'], ['Scope', 'Multidisciplinary'], ['Review', 'Double-Blind Peer Review'], ['ISSN', 'Applied']].map(([k, v], i) => (
            <div key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.2rem' }}>{k}</div>
              <div style={{ fontSize: '0.95rem', color: '#0a1628', fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
      </div></section>

      <section style={H.sec}><div style={H.wrap}>
        <h2 style={H.title}>Aims & Scope</h2><div style={H.gold}></div>
        <div style={{ ...H.card, maxWidth: 800, margin: '1rem auto 0' }}>
          <p style={{ color: '#555', lineHeight: 1.8, marginBottom: '1rem' }}>The Essence aims to publish high-quality research across the following areas:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.5rem' }}>
            {['Computer Science & Engineering', 'Electronics & Communication', 'Mechanical & Civil Engineering', 'Management & Business Studies', 'Applied Sciences & Mathematics', 'Data Science & Analytics', 'Humanities & Social Sciences', 'Biotechnology & Life Sciences', 'Law & Governance', 'Design & Liberal Arts'].map((s, i) => (
              <div key={i} style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#d4af37', fontWeight: 700 }}>▸</span> {s}
              </div>
            ))}
          </div>
        </div>
      </div></section>

      <section style={H.secAlt}><div style={H.wrap}>
        <h2 style={H.title}>Why Publish With Us</h2><div style={H.gold}></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
          {[['🔬','Rigorous Review','Double-blind peer review ensuring quality and integrity'],['🌐','Open Access','Free global access to all published articles'],['⚡','Fast Processing','4-6 weeks average turnaround time'],['📜','Certificate','Publication and reviewer certificates issued']].map(([icon,t,d],i) => (
            <div key={i} style={H.card}><div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{icon}</div><h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.4rem' }}>{t}</h3><p style={{ fontSize: '0.875rem', color: '#666', lineHeight: 1.7, margin: 0 }}>{d}</p></div>
          ))}
        </div>
      </div></section>

      <section style={H.cta}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white' }}>Submit Your Research</h2>
        <div style={H.gold}></div>
        <p style={{ fontSize: '1.05rem', color: 'white', maxWidth: 600, margin: '0 auto 2rem', lineHeight: 1.7 }}>Join researchers from across India in publishing your work in The Essence.</p>
        <Link to="/signup" style={H.btn}>Get Started →</Link>
      </section>
    </div>
  )
}
export default AboutUs
