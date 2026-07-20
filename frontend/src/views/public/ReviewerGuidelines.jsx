import { Link } from 'react-router-dom'

const H = { hero: { background: 'linear-gradient(160deg, #0a1628 0%, #1a5490 100%)', color: 'white', padding: '5rem 2rem 4rem', textAlign: 'center' }, h1: { fontSize: '2.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white' }, sub: { fontSize: '1.05rem', color: '#ffffff', maxWidth: 650, margin: '0 auto', lineHeight: 1.7 }, gold: { width: 60, height: 3, background: '#d4af37', margin: '0 auto 1.5rem', borderRadius: 2 }, sec: { padding: '4rem 2rem', background: 'white' }, secAlt: { padding: '4rem 2rem', background: '#f0f4f8' }, wrap: { maxWidth: 1100, margin: '0 auto' }, title: { fontSize: '1.75rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.5rem', textAlign: 'center' }, card: { background: 'white', borderRadius: 12, padding: '2rem', border: '1px solid #e8edf2', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }, cta: { background: 'linear-gradient(160deg, #0a1628, #1a5490)', color: 'white', padding: '5rem 2rem', textAlign: 'center' }, btn: { display: 'inline-block', padding: '0.85rem 2.5rem', background: '#d4af37', color: '#0a1628', borderRadius: 8, textDecoration: 'none', fontWeight: 700 } }

function ReviewerGuidelines() {
  return (
    <div style={{ backgroundColor: '#f5f5f5', overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
      <section style={H.hero}>
        <h1 style={H.h1}>Reviewer Guidelines</h1>
        <div style={H.gold}></div>
        <p style={H.sub}>Guidelines for peer reviewers of The Essence — SPSU Journal. Your expertise ensures the quality of our publications.</p>
      </section>

      <section style={H.sec}><div style={H.wrap}>
        <h2 style={H.title}>Role of Reviewers</h2><div style={H.gold}></div>
        <div style={{ ...H.card, maxWidth: 800, margin: '1rem auto 0' }}>
          <p style={{ color: '#555', lineHeight: 1.8, marginBottom: '1rem' }}>Peer reviewers play a critical role in maintaining the academic standards of The Essence. As a reviewer, you are expected to provide constructive, unbiased, and timely evaluations of submitted manuscripts.</p>
          <p style={{ color: '#555', lineHeight: 1.8, margin: 0 }}>All reviews are conducted under a double-blind process — the identities of both authors and reviewers remain confidential throughout the review process.</p>
        </div>
      </div></section>

      <section style={H.secAlt}><div style={H.wrap}>
        <h2 style={H.title}>Review Criteria</h2><div style={H.gold}></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
          {[['💡','Originality','Does the paper present new ideas, methods, or findings?'],['🔬','Methodology','Is the research design sound and appropriate?'],['📝','Clarity','Is the paper well-written and logically structured?'],['🎯','Significance','Does the work contribute meaningfully to the field?'],['📚','References','Are citations adequate, relevant, and up-to-date?']].map(([icon,t,d],i) => (
            <div key={i} style={H.card}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{icon}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.4rem' }}>{t}</h3>
              <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.6, margin: 0 }}>{d}</p>
            </div>
          ))}
        </div>
      </div></section>

      <section style={H.sec}><div style={H.wrap}>
        <h2 style={H.title}>Review Process</h2><div style={H.gold}></div>
        <div className="process-container" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem' }}>
          {[['01','Assignment','Receive review invitation'],['02','Download','Access anonymized manuscript'],['03','Evaluate','Assess using review criteria'],['04','Submit','Provide recommendation & comments']].map(([n,t,d],i) => (
            <div key={i} className="process-step-wrapper" style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ textAlign: 'center', minWidth: 130 }}>
                <div style={{ width: 55, height: 55, background: 'linear-gradient(135deg, #1a5490, #0f3d6e)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem', fontWeight: 700, margin: '0 auto 0.6rem', border: '3px solid #d4af37' }}>{n}</div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.15rem' }}>{t}</h3>
                <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>{d}</p>
              </div>
              {i < 3 && <div className="process-arrow" style={{ paddingTop: 16, margin: '0 0.25rem', color: '#d4af37', fontSize: '1.5rem', fontWeight: 700 }}>→</div>}
            </div>
          ))}
        </div>
      </div></section>

      <section style={H.secAlt}><div style={H.wrap}>
        <h2 style={H.title}>Ethical Guidelines</h2><div style={H.gold}></div>
        <div style={{ ...H.card, maxWidth: 800, margin: '1rem auto 0' }}>
          {['Maintain strict confidentiality of the manuscript and review process', 'Declare any conflicts of interest before accepting a review assignment', 'Provide objective, constructive feedback without personal bias', 'Complete reviews within the assigned deadline (typically 3-4 weeks)', 'Do not use unpublished information from manuscripts for personal advantage', 'Report any suspected plagiarism or ethical violations to the editor'].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#d4af37', fontWeight: 700 }}>▸</span>
              <span style={{ color: '#555', lineHeight: 1.7 }}>{item}</span>
            </div>
          ))}
        </div>
      </div></section>

      <section style={H.cta}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white' }}>Join as a Reviewer</h2>
        <div style={H.gold}></div>
        <p style={{ fontSize: '1.05rem', color: 'white', maxWidth: 550, margin: '0 auto 2rem', lineHeight: 1.7 }}>Contribute to academic excellence by joining our panel of expert reviewers.</p>
        <Link to="/contact" style={H.btn}>Contact Editorial Office →</Link>
      </section>
    </div>
  )
}
export default ReviewerGuidelines
