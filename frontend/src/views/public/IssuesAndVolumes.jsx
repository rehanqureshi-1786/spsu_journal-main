import { useState, useEffect } from 'react'
import { getVolumes, getIssues, getPublishedPapers } from '../../services/publicationService'

const H = { hero: { background: 'linear-gradient(160deg, #0a1628 0%, #1a5490 100%)', color: 'white', padding: '5rem 2rem 4rem', textAlign: 'center' }, gold: { width: 60, height: 3, background: '#d4af37', margin: '0 auto 1.5rem', borderRadius: 2 }, sec: { padding: '3rem 2rem', background: 'white' }, secAlt: { padding: '3rem 2rem', background: '#f0f4f8' }, wrap: { maxWidth: 1100, margin: '0 auto' }, card: { background: 'white', borderRadius: 12, padding: '1.75rem', border: '1px solid #e8edf2', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' } }

function IssuesAndVolumes() {
  const [volumes, setVolumes] = useState([])
  const [selectedVolume, setSelectedVolume] = useState(null)
  const [issues, setIssues] = useState([])
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { loadVolumes() }, [])
  useEffect(() => { if (selectedVolume) loadIssues(selectedVolume.id) }, [selectedVolume])
  useEffect(() => { if (selectedIssue) loadPapers(selectedIssue.id) }, [selectedIssue])

  const loadVolumes = async () => {
    try { setLoading(true); const data = await getVolumes(); setVolumes(data || []); if (data?.length) setSelectedVolume(data[0]) }
    catch (e) { setError('Failed to load volumes') }
    finally { setLoading(false) }
  }

  const loadIssues = async (volId) => {
    try { const data = await getIssues(volId); setIssues(data || []); setSelectedIssue(null); setPapers([]) ; if (data?.length) setSelectedIssue(data[0]) }
    catch (e) { setIssues([]) }
  }

  const loadPapers = async (issueId) => {
    try { const resp = await getPublishedPapers(issueId); setPapers(Array.isArray(resp) ? resp : resp?.papers || []) }
    catch (e) { setPapers([]) }
  }

  const btnStyle = (active) => ({ padding: '0.75rem 1.75rem', border: `2px solid #1a5490`, borderRadius: 8, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: active ? '#1a5490' : 'white', color: active ? 'white' : '#1a1a2e', boxShadow: active ? '0 4px 12px rgba(26,84,144,0.3)' : '0 2px 8px rgba(0,0,0,0.06)' })

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#666' }}>Loading...</div>
  if (error) return <div style={{ padding: '4rem', textAlign: 'center', color: '#dc2626' }}>{error}</div>

  return (
    <div style={{ backgroundColor: '#f5f5f5' }}>
      <section style={H.hero}>
        <h1 style={{ fontSize: '2.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white' }}>Issues & Volumes</h1>
        <div style={H.gold}></div>
        <p style={{ fontSize: '1.05rem', color: 'white', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>Browse published issues and download research papers</p>
      </section>

      {/* Volume Selection */}
      <section style={H.sec}><div style={H.wrap}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a1628', textAlign: 'center', marginBottom: '1.5rem' }}>Select Volume</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {volumes.map(v => (
            <button key={v.id} onClick={() => setSelectedVolume(v)} style={btnStyle(selectedVolume?.id === v.id)}>
              Volume {v.volume_number} ({v.year})
            </button>
          ))}
        </div>
        {volumes.length === 0 && <p style={{ textAlign: 'center', color: '#999', marginTop: '1rem' }}>No volumes published yet.</p>}
      </div></section>

      {/* Issue Selection */}
      {selectedVolume && issues.length > 0 && (
        <section style={H.secAlt}><div style={H.wrap}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a1628', textAlign: 'center', marginBottom: '1.5rem' }}>Select Issue — Volume {selectedVolume.volume_number}</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {issues.map(iss => (
              <button key={iss.id} onClick={() => setSelectedIssue(iss)} style={btnStyle(selectedIssue?.id === iss.id)}>
                Issue {iss.issue_number}
              </button>
            ))}
          </div>
        </div></section>
      )}

      {/* Papers */}
      {selectedIssue && (
        <section style={H.sec}><div style={H.wrap}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.5rem', textAlign: 'center' }}>
            Volume {selectedVolume?.volume_number}, Issue {selectedIssue.issue_number}
          </h2>
          <div style={H.gold}></div>
          {papers.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999', padding: '2rem 0' }}>No papers published in this issue yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
              {papers.map(paper => (
                <div key={paper.id} style={{ ...H.card, borderLeft: '4px solid #1a5490' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#0a1628', marginBottom: '0.5rem', lineHeight: 1.4 }}>{paper.title}</h3>
                  {paper.authors && <p style={{ fontSize: '0.9rem', color: '#1a5490', fontWeight: 500, marginBottom: '0.5rem' }}>{typeof paper.authors === 'string' ? paper.authors : paper.authors.map(a => `${a.first_name} ${a.last_name}`).join(', ')}</p>}
                  {paper.abstract && <p style={{ fontSize: '0.875rem', color: '#555', lineHeight: 1.7, marginBottom: '1rem' }}>{paper.abstract}</p>}
                  <a href={`${import.meta.env.VITE_API_BASE_URL ?? ''}/publications/papers/${paper.id}/download`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '0.6rem 1.5rem', background: '#1a5490', color: 'white', borderRadius: 6, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>Download PDF</a>
                </div>
              ))}
            </div>
          )}
        </div></section>
      )}
    </div>
  )
}
export default IssuesAndVolumes
