import { Link } from 'react-router-dom'

const H = { hero: { background: 'linear-gradient(160deg, #0a1628 0%, #1a5490 100%)', color: 'white', padding: '5rem 2rem 4rem', textAlign: 'center' }, h1: { fontSize: '2.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white' }, sub: { fontSize: '1.05rem', color: '#ffffff', maxWidth: 650, margin: '0 auto', lineHeight: 1.7 }, gold: { width: 60, height: 3, background: '#d4af37', margin: '0 auto 1.5rem', borderRadius: 2 }, sec: { padding: '4rem 2rem', background: 'white' }, secAlt: { padding: '4rem 2rem', background: '#f0f4f8' }, wrap: { maxWidth: 1100, margin: '0 auto' }, title: { fontSize: '1.75rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.5rem', textAlign: 'center' }, card: { background: 'white', borderRadius: 12, padding: '2rem', border: '1px solid #e8edf2', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }, cta: { background: 'linear-gradient(160deg, #0a1628, #1a5490)', color: 'white', padding: '5rem 2rem', textAlign: 'center' }, btn: { display: 'inline-block', padding: '0.85rem 2.5rem', background: '#d4af37', color: '#0a1628', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }, li: { color: '#555', lineHeight: 1.8, marginBottom: '0.5rem', paddingLeft: '0.5rem' } }

function AuthorGuidelines() {
  return (
    <div style={{ backgroundColor: '#f5f5f5', overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
      <section style={H.hero}>
        <h1 style={H.h1}>Author Guidelines</h1>
        <div style={H.gold}></div>
        <p style={H.sub}>Guidelines for preparing and submitting manuscripts to The Essence — SPSU Journal</p>
      </section>

      <section style={H.sec}><div style={H.wrap}>
        <h2 style={H.title}>Submission Requirements</h2><div style={H.gold}></div>
        <div style={{ ...H.card, maxWidth: 800, margin: '1rem auto 0' }}>
          {['Manuscripts must be original and not published or under review elsewhere', 'Submit in PDF format only', 'Word count: 3,000 – 8,000 words (including references)', 'Language: English', 'Follow APA 7th Edition citation style', 'Include author details: name, affiliation, email, ORCID (optional)', 'Plagiarism must be below 15% (checked via plagiarism detection tools)'].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#1a5490', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.5 }}>✓</span>
              <span style={{ color: '#555', lineHeight: 1.7 }}>{item}</span>
            </div>
          ))}
        </div>
      </div></section>

      <section style={H.secAlt}><div style={H.wrap}>
        <h2 style={H.title}>Manuscript Structure</h2><div style={H.gold}></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {[['📄 Title Page','Title, author names, affiliations, corresponding author email'],['📝 Abstract','200–300 words summarizing objectives, methods, results, and conclusions'],['🔑 Keywords','4–6 keywords for indexing'],['📖 Introduction','Background, literature review, research gap, objectives'],['🔬 Methodology','Research design, data collection, analysis methods'],['📊 Results & Discussion','Findings with tables/figures, interpretation, comparison with existing literature'],['✅ Conclusion','Summary of findings, implications, limitations, future scope'],['📚 References','APA 7th Edition format, minimum 15 recent references']].map(([t,d],i) => (
            <div key={i} style={H.card}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.4rem' }}>{t}</h3>
              <p style={{ fontSize: '0.875rem', color: '#666', lineHeight: 1.6, margin: 0 }}>{d}</p>
            </div>
          ))}
        </div>
      </div></section>

      <section style={H.sec}><div style={H.wrap}>
        <h2 style={H.title}>Submission Process</h2><div style={H.gold}></div>
        <div className="process-container" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem' }}>
          {[['01','Register','Create author account'],['02','Upload','Submit manuscript PDF'],['03','Screening','Initial editorial check'],['04','Review','Peer review (4-6 weeks)'],['05','Decision','Accept / Revise / Reject']].map(([n,t,d],i) => (
            <div key={i} className="process-step-wrapper" style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ textAlign: 'center', minWidth: 110 }}>
                <div style={{ width: 50, height: 50, background: 'linear-gradient(135deg, #1a5490, #0f3d6e)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, margin: '0 auto 0.5rem', border: '3px solid #d4af37' }}>{n}</div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.15rem' }}>{t}</h3>
                <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>{d}</p>
              </div>
              {i < 4 && <div className="process-arrow" style={{ paddingTop: 14, margin: '0 0.25rem', color: '#d4af37', fontSize: '1.3rem', fontWeight: 700 }}>→</div>}
            </div>
          ))}
        </div>
      </div></section>

      <section style={H.secAlt}><div style={H.wrap}>
        <h2 style={H.title}>Publication Ethics</h2><div style={H.gold}></div>
        <div style={{ ...H.card, maxWidth: 800, margin: '1rem auto 0' }}>
          {['Authors must ensure originality and proper attribution of all sources', 'Fabrication, falsification, or manipulation of data is strictly prohibited', 'All authors listed must have made significant contributions to the work', 'Any conflicts of interest must be disclosed at the time of submission', 'The journal follows COPE (Committee on Publication Ethics) guidelines'].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#d4af37', fontWeight: 700 }}>▸</span>
              <span style={{ color: '#555', lineHeight: 1.7 }}>{item}</span>
            </div>
          ))}
        </div>
      </div></section>

      <section style={H.cta}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white' }}>Ready to Submit?</h2>
        <div style={H.gold}></div>
        <p style={{ fontSize: '1.05rem', color: 'white', maxWidth: 550, margin: '0 auto 2rem', lineHeight: 1.7 }}>Create an account and submit your manuscript for peer review.</p>
        <Link to="/signup" style={H.btn}>Submit Manuscript →</Link>
      </section>
    </div>
  )
}
export default AuthorGuidelines
