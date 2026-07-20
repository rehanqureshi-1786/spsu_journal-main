import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import publicationService from '../../services/publicationService'
import paperService from '../../services/paperService'

function HomePage() {
  const [stats, setStats] = useState({ totalArticles: 0, currentVolume: 1, currentIssue: 1 })
  const [publishedPapers, setPublishedPapers] = useState([])

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const papersResponse = await paperService.getPapers()
      const papers = Array.isArray(papersResponse) ? papersResponse : []
      const published = papers.filter(p => p.status === 'Published')
      setPublishedPapers(published.slice(0, 6))
      const issues = await publicationService.getAllIssues()
      if (issues?.length > 0) {
        const volumes = [...new Set(issues.map(i => i.volume?.volume_number || 1))]
        setStats({ totalArticles: published.length, currentVolume: Math.max(...volumes), currentIssue: Math.max(...issues.map(i => i.issue_number || 1)) })
      } else {
        setStats({ totalArticles: published.length, currentVolume: 1, currentIssue: 1 })
      }
    } catch { setStats({ totalArticles: 0, currentVolume: 1, currentIssue: 1 }) }
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5', overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
      {/* ===== HERO ===== */}
      <section style={{ background: 'linear-gradient(160deg, #0a1628 0%, #122a4e 40%, #1a5490 100%)', color: 'white', padding: '6rem 2rem 5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(ellipse at 20% 80%, rgba(212,175,55,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(26,84,144,0.2) 0%, transparent 50%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>
          <img src="/spsu-logo.png" alt="SPSU" style={{ width: 180, height: 'auto', objectFit: 'contain', margin: '0 auto 1.5rem', background: 'white', borderRadius: 16, padding: '10px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }} />
          <div className="university-name" style={{ display: 'inline-block', padding: '0.4rem 1.5rem', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 30, color: '#d4af37', marginBottom: '1.5rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Sir Padampat Singhania University, Udaipur
          </div>
          <h1 className="journal-title" style={{ textShadow: '0 2px 20px rgba(212,175,55,0.3)', marginBottom: '0.5rem' }}>THE ESSENCE</h1>
          <p className="journal-subtitle" style={{ color: '#ffffff', marginBottom: '2rem', textTransform: 'uppercase', fontWeight: 500 }}>A Multidisciplinary Peer-Reviewed Academic Journal</p>
          <div style={{ width: 60, height: 3, background: '#d4af37', margin: '0 auto 2rem', borderRadius: 2 }}></div>
          <p style={{ fontSize: '1.1rem', color: '#ffffff', maxWidth: 700, margin: '0 auto 2.5rem', lineHeight: 1.8 }}>
            Publishing original research across Engineering, Science, Management, Humanities & Social Sciences. Committed to academic excellence and advancing knowledge since establishment.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            {[
              { num: stats.totalArticles || '—', label: 'Articles Published' },
              { num: `Vol. ${stats.currentVolume}`, label: 'Current Volume' },
              { num: `Issue ${stats.currentIssue}`, label: 'Latest Issue' },
              { num: '4+', label: 'Disciplines' }
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#d4af37', lineHeight: 1 }}>{s.num}</div>
                <div style={{ fontSize: '0.75rem', letterSpacing: 1, color: '#e8c94e', marginTop: '0.3rem', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" style={{ padding: '0.85rem 2.5rem', background: '#d4af37', color: '#0a1628', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem', boxShadow: '0 4px 20px rgba(212,175,55,0.3)' }}>Submit Manuscript →</Link>
            <Link to="/issues" style={{ padding: '0.85rem 2.5rem', border: '2px solid rgba(255,255,255,0.35)', borderRadius: 8, color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>Browse Issues</Link>
          </div>
        </div>
      </section>

      {/* ===== JOURNAL HIGHLIGHTS BAR ===== */}
      <section style={{ background: '#0f2a4a', padding: '1rem 2rem', borderBottom: '2px solid #d4af37' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {['📖 Open Access', '🔬 Peer Reviewed', '📅 Biannual Publication', '🌐 Online ISSN: XXXX-XXXX', '🏛️ Published by SPSU'].map((item, i) => (
            <span key={i} style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 500, letterSpacing: 0.5 }}>{item}</span>
          ))}
        </div>
      </section>

      {/* ===== ABOUT JOURNAL ===== */}
      <section style={{ padding: '5rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.5rem' }}>About The Essence</h2>
            <div style={{ width: 60, height: 3, background: '#d4af37', margin: '0 auto 1.5rem', borderRadius: 2 }}></div>
            <p style={{ fontSize: '1rem', color: '#555', maxWidth: 750, margin: '0 auto', lineHeight: 1.8 }}>
              The Essence is the official academic journal of Sir Padampat Singhania University (SPSU), Udaipur, Rajasthan. 
              It serves as a platform for researchers, faculty, and students to disseminate original research findings, 
              review articles, and scholarly work across multiple disciplines.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: '🔬', title: 'Rigorous Peer Review', desc: 'Double-blind peer review process ensuring quality, originality, and academic integrity of every publication.' },
              { icon: '🌐', title: 'Open Access', desc: 'All articles freely available online, maximizing global reach and impact of published research.' },
              { icon: '📚', title: 'Multidisciplinary', desc: 'Covering Engineering, Computer Science, Management, Applied Sciences, Humanities & Social Sciences.' },
              { icon: '⚡', title: 'Fast Track Review', desc: 'Efficient editorial workflow with average review turnaround of 4-6 weeks from submission to decision.' }
            ].map((item, i) => (
              <div key={i} style={{ padding: '2rem', background: '#f8fafc', borderRadius: 12, border: '1px solid #e8edf2', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{item.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.5rem' }}>{item.title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#666', lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SCOPE & SUBJECTS ===== */}
      <section style={{ padding: '5rem 2rem', background: '#f0f4f8' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.5rem' }}>Scope & Subject Areas</h2>
            <div style={{ width: 60, height: 3, background: '#d4af37', margin: '0 auto 1.5rem', borderRadius: 2 }}></div>
            <p style={{ fontSize: '1rem', color: '#555', maxWidth: 650, margin: '0 auto', lineHeight: 1.7 }}>
              The Essence welcomes submissions from a wide range of academic disciplines
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', maxWidth: 1000, margin: '0 auto' }}>
            {[
              '💻 Computer Science & Engineering', '⚙️ Mechanical Engineering', '🏗️ Civil Engineering',
              '📡 Electronics & Communication', '📊 Data Science & Analytics', '🧪 Applied Sciences & Physics',
              '💼 Management & Business', '📈 Finance & Economics', '🎨 Design & Liberal Arts',
              '⚖️ Law & Governance', '🧬 Biotechnology', '📖 Humanities & Social Sciences'
            ].map((subject, i) => (
              <div key={i} style={{ padding: '0.875rem 1rem', background: 'white', borderRadius: 8, fontSize: '0.875rem', color: '#1a1a2e', fontWeight: 500, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {subject}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LATEST PUBLICATIONS ===== */}
      {publishedPapers.length > 0 && (
        <section style={{ padding: '5rem 2rem', background: 'white' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.5rem' }}>Latest Publications</h2>
              <div style={{ width: 60, height: 3, background: '#d4af37', margin: '0 auto 1.5rem', borderRadius: 2 }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {publishedPapers.map(paper => (
                <div key={paper.id} style={{ background: '#f8fafc', borderRadius: 12, padding: '1.75rem', border: '1px solid #e8edf2', borderLeft: '4px solid #1a5490' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0a1628', marginBottom: '0.5rem', lineHeight: 1.4 }}>{paper.title}</h3>
                  {paper.abstract && <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.6, margin: 0 }}>{paper.abstract.substring(0, 150)}...</p>}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to="/issues" style={{ color: '#1a5490', fontWeight: 600, textDecoration: 'none' }}>View All Issues & Volumes →</Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== SUBMISSION PROCESS ===== */}
      <section style={{ padding: '5rem 2rem', background: '#f0f4f8' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.5rem' }}>How to Publish</h2>
            <div style={{ width: 60, height: 3, background: '#d4af37', margin: '0 auto 1.5rem', borderRadius: 2 }}></div>
            <p style={{ fontSize: '1rem', color: '#555', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>Simple and transparent submission process</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { step: '01', title: 'Register', desc: 'Create an author account' },
              { step: '02', title: 'Submit', desc: 'Upload manuscript (PDF)' },
              { step: '03', title: 'Review', desc: 'Double-blind peer review' },
              { step: '04', title: 'Revise', desc: 'Address feedback' },
              { step: '05', title: 'Publish', desc: 'Published online' }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ textAlign: 'center', minWidth: 120 }}>
                  <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg, #1a5490, #0f3d6e)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', fontWeight: 700, margin: '0 auto 0.75rem', boxShadow: '0 4px 15px rgba(26,84,144,0.3)', border: '3px solid #d4af37' }}>{item.step}</div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.2rem' }}>{item.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.4, margin: 0 }}>{item.desc}</p>
                </div>
                {i < 4 && (
                  <div style={{ display: 'flex', alignItems: 'center', paddingTop: 18, margin: '0 0.25rem', color: '#d4af37', fontSize: '1.5rem', fontWeight: 700 }} className="process-arrow">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== QUICK LINKS ===== */}
      <section style={{ padding: '4rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[
            { icon: '📝', label: 'Author Guidelines', to: '/author-guidelines', color: '#1a5490' },
            { icon: '🔍', label: 'Reviewer Guidelines', to: '/reviewer-guidelines', color: '#0f3d6e' },
            { icon: '👥', label: 'Editorial Board', to: '/editorial-board', color: '#122a4e' },
            { icon: '🏆', label: 'Verify Certificate', to: '/verify-certificate', color: '#0a1628' }
          ].map((link, i) => (
            <Link key={i} to={link.to} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 1.5rem', background: link.color, borderRadius: 10, textDecoration: 'none', color: 'white', fontWeight: 600, fontSize: '0.95rem', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
              <span style={{ fontSize: '1.5rem' }}>{link.icon}</span> {link.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ===== CALL FOR PAPERS CTA ===== */}
      <section style={{ background: 'linear-gradient(160deg, #0a1628 0%, #1a5490 100%)', color: 'white', padding: '5rem 2rem', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.08) 0%, transparent 60%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', padding: '0.3rem 1.25rem', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 20, fontSize: '0.7rem', letterSpacing: 2, color: '#d4af37', marginBottom: '1.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Now Accepting Submissions</div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem', color: 'white', lineHeight: 1.2 }}>Call for Papers</h2>
          <div style={{ width: 50, height: 3, background: '#d4af37', margin: '0 auto 1.5rem', borderRadius: 2 }}></div>
          <p style={{ fontSize: '1.05rem', color: 'white', lineHeight: 1.8, marginBottom: '2rem' }}>
            We invite researchers, academicians, and scholars to submit their original research papers, 
            review articles, and case studies for publication in the upcoming issue of The Essence.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" style={{ padding: '0.9rem 2.5rem', background: '#d4af37', color: '#0a1628', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '1rem' }}>Submit Your Paper</Link>
            <Link to="/contact" style={{ padding: '0.9rem 2.5rem', border: '2px solid rgba(255,255,255,0.4)', borderRadius: 8, color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }}>Contact Editorial Office</Link>
          </div>
        </div>
      </section>

      {/* ===== JOURNAL PARTICULARS ===== */}
      <section style={{ padding: '3rem 2rem', background: '#0a1628', color: '#ffffff', borderTop: '3px solid #d4af37' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ color: '#d4af37', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>The Essence</h3>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.8, margin: 0, color: '#ffffff' }}>Official academic journal of Sir Padampat Singhania University (SPSU), Udaipur, Rajasthan, India. Dedicated to publishing quality research across multiple disciplines.</p>
            </div>
            <div>
              <h3 style={{ color: '#d4af37', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Journal Info</h3>
              <div style={{ fontSize: '0.85rem', lineHeight: 2 }}>
                <div>Publisher: SPSU, Udaipur</div>
                <div>Frequency: Biannual</div>
                <div>Language: English</div>
                <div>Format: Online (Open Access)</div>
              </div>
            </div>
            <div>
              <h3 style={{ color: '#d4af37', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Links</h3>
              <div style={{ fontSize: '0.85rem', lineHeight: 2 }}>
                <div><Link to="/author-guidelines" style={{ color: '#ffffff', textDecoration: 'none' }}>Author Guidelines</Link></div>
                <div><Link to="/reviewer-guidelines" style={{ color: '#ffffff', textDecoration: 'none' }}>Reviewer Guidelines</Link></div>
                <div><Link to="/editorial-board" style={{ color: '#ffffff', textDecoration: 'none' }}>Editorial Board</Link></div>
                <div><Link to="/contact" style={{ color: '#ffffff', textDecoration: 'none' }}>Contact Us</Link></div>
                <div><Link to="/verify-certificate" style={{ color: "#ffffff", textDecoration: "none" }}>Verify Certificate</Link></div>
              </div>
            </div>
            <div>
              <h3 style={{ color: '#d4af37', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Contact</h3>
              <div style={{ fontSize: '0.85rem', lineHeight: 2 }}>
                <div>Sir Padampat Singhania University</div>
                <div>Bhatewar, Udaipur</div>
                <div>Rajasthan 313601, India</div>
                <div><a href="https://www.spsu.ac.in" target="_blank" rel="noreferrer" style={{ color: '#d4af37', textDecoration: 'none' }}>www.spsu.ac.in</a></div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} The Essence — Sir Padampat Singhania University. All rights reserved.
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
