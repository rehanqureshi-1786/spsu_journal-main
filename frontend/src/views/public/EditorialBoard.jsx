import { Link } from 'react-router-dom'
import useInlineEdit from '../../hooks/useInlineEdit'
import InlineEditToolbar from '../../components/InlineEditToolbar/InlineEditToolbar'

const H = { hero: { background: 'linear-gradient(160deg, #0a1628 0%, #1a5490 100%)', color: 'white', padding: '5rem 2rem 4rem', textAlign: 'center' }, h1: { fontSize: '2.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white' }, sub: { fontSize: '1.05rem', color: '#ffffff', maxWidth: 700, margin: '0 auto', lineHeight: 1.7 }, gold: { width: 60, height: 3, background: '#d4af37', margin: '0 auto 1.5rem', borderRadius: 2 }, sec: { padding: '4rem 2rem', background: 'white' }, secAlt: { padding: '4rem 2rem', background: '#f0f4f8' }, wrap: { maxWidth: 1100, margin: '0 auto' }, title: { fontSize: '1.75rem', fontWeight: 700, color: '#0a1628', marginBottom: '0.5rem', textAlign: 'center' }, card: { background: 'white', borderRadius: 12, padding: '2rem', border: '1px solid #e8edf2', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', transition: 'transform 0.2s, box-shadow 0.2s' } }

function EditorialBoard() {
  const { isAdmin, isEditing, editableRef, startEditing, saveEdits, cancelEdits, fileInputRef, handleFileChange } = useInlineEdit('editorial-board')

  const advisoryMembers = [
    { name: 'Prof. (Dr.) Prasun Chakrabarti', title: 'Pro-President, SPSU', spec: '', inst: 'Sir Padampat Singhania University', loc: 'Udaipur, Rajasthan, India', img: '/faculty/prasun-chakrabarti.jpg' },
    { name: 'Col (Dr.) H. P. Singh', title: 'Campus Director, SPSU', spec: '', inst: 'Sir Padampat Singhania University', loc: 'Udaipur, Rajasthan, India', img: '/faculty/hp-singh.jpg' },
    { name: 'Prof. Amit Kumar Goel', title: 'Dean, FCI, SPSU', spec: '', inst: 'Sir Padampat Singhania University', loc: 'Udaipur, Rajasthan, India', img: '/faculty/amit-kumar-goel.jpg' }
  ]

  const boardMembers = [
    { name: 'Dr. Ashutosh Gupta', title: 'Associate Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/ashutosh-gupta.jpg' },
    { name: 'Dr. Anandkumar A. Bhaskar', title: 'Associate Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/anandkumar-bhaskar.jpg' },
    { name: 'Dr. Kamal Kant Hiran', title: 'Associate Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/kamal-kant-hiran.jpg' },
    { name: 'Dr. Chandani Joshi', title: 'Associate Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/chandani-joshi.jpg' },
    { name: 'Dr. Rahul Kumar', title: 'Associate Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/rahul-kumar.jpg' },
    { name: 'Dr. Poonam Saini', title: 'Assistant Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/poonam-saini.jpg' },
    { name: 'Dr. Harish Tiwari', title: 'Assistant Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/harish-tiwari.jpg' },
    { name: 'Dr. Manish Tiwari', title: 'Assistant Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/manish-tiwari.jpg' },
    { name: 'Dr. Manuj Joshi', title: 'Assistant Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/manuj-joshi.jpg' },
    { name: 'Dr. Brajesh Kumar Sharma', title: 'Assistant Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/brajesh-sharma.jpg' },
    { name: 'Dr. Arun Vaishnav', title: 'Assistant Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/arun-vaishnav.jpg' },
    { name: 'Dr. Priyanka Sisodia', title: 'Assistant Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/priyanka-sisodia.jpg' },
    { name: 'Mr. Ajay Shankar', title: 'Assistant Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/ajay-shankar.jpg' },
    { name: 'Mr. Dipesh Vaya', title: 'Assistant Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/dipesh-vaya.jpg' },
    { name: 'Ms. Sonali Dhave', title: 'Assistant Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/sonali-dhave.jpg' },
    { name: 'Mr. Sunit Kumar Meena', title: 'Assistant Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/sunit-meena.jpg' },
    { name: 'Mr. Shubham Kumar Singh', title: 'Assistant Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/shubham-singh.jpg' },
    { name: 'Mr. Arvind Singh Rathore', title: 'Assistant Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/arvind-rathore.jpg' },
    { name: 'Mr. Adnan Pipawala', title: 'Assistant Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/adnan-pipawala.jpg' },
    { name: 'Ms. Konika Abid', title: 'Assistant Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/konika-abid.jpg' },
    { name: 'Ms. Roopali Kachhi', title: 'Assistant Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/roopali-kachhi.jpg' },
    { name: 'Mr. Ashish Sen', title: 'Assistant Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/ashish-sen.jpg' },
    { name: 'Ms. Priyanka Jaroli', title: 'Assistant Professor', spec: '', inst: 'FCI, SPSU', img: '/faculty/priyanka-jaroli.jpg' }
  ]

  return (
    <div style={{ backgroundColor: '#f5f5f5' }} ref={editableRef}>
      {/* Hero */}
      <section style={H.hero}>
        <h1 style={H.h1}>Editorial Board</h1>
        <div style={H.gold}></div>
        <p style={H.sub}>Distinguished editorial board comprising leading scholars and researchers. Our team ensures the highest standards of academic rigor and editorial excellence of "The Essence".</p>
      </section>

      {/* Chief Patron */}
      <section style={H.sec}><div style={H.wrap}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}><h2 style={H.title}>Chief Patron</h2><div style={H.gold}></div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', maxWidth: 850, margin: '0 auto', padding: '2.5rem', background: 'white', borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: '2px solid #d4af37', transition: 'all 0.3s ease', cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 16px 50px rgba(212,175,55,0.25)'; e.currentTarget.style.borderColor = '#b8962e' }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#d4af37' }}>
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <img src='/faculty/sanjay-sinha.png' alt='Dr. Sanjay Sinha, FRSA' style={{ width: 160, height: 160, borderRadius: 12, objectFit: 'cover', border: '4px solid #d4af37' }} />
            <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #d4af37, #b8962e)', color: '#0a1628', padding: '0.35rem 1rem', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, marginTop: '0.75rem', textTransform: 'uppercase' }}>Honorary Chairperson</div>
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', color: '#0a1628', fontWeight: 700, marginBottom: '0.25rem' }}>Dr. Sanjay Sinha, FRSA</h3>
            <p style={{ fontSize: '1.05rem', color: '#1a5490', fontWeight: 600, marginBottom: '1rem' }}>President, SPSU</p>
            <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📍 Sir Padampat Singhania University (SPSU)</p>
            <p style={{ fontSize: '0.9rem', color: '#555', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📧 Udaipur, Rajasthan, India</p>
          </div>
        </div>
      </div></section>

      {/* Advisory Board */}
      <section style={H.secAlt}><div style={H.wrap}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}><h2 style={H.title}>Editorial Advisory Board</h2><div style={H.gold}></div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {advisoryMembers.map((m, i) => (
            <div key={i} style={{ ...H.card, textAlign: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)' }}>
              <img src={m.img} alt={m.name} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid #2a6aaa', margin: '0 auto 1rem' }} />
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, #e8edf2, #f0f4f8)', margin: '0 auto 1rem', display: 'none', alignItems: 'center', justifyContent: 'center', border: '3px solid #2a6aaa', fontSize: '2.5rem' }}>👤</div>
              <h3 style={{ fontSize: '1.1rem', color: '#0a1628', fontWeight: 600, marginBottom: '0.25rem' }}>{m.name}</h3>
              <p style={{ fontSize: '0.9rem', color: '#1a5490', fontWeight: 600, marginBottom: '0.2rem' }}>{m.title}</p>
              <p style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic', marginBottom: '0.3rem' }}>{m.spec}</p>
              <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.15rem' }}>{m.inst}</p>
              <p style={{ fontSize: '0.8rem', color: '#999' }}>{m.loc}</p>
            </div>
          ))}
        </div>
      </div></section>

      {/* Editorial Board */}
      <section style={H.sec}><div style={H.wrap}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}><h2 style={H.title}>Editorial Board</h2><div style={H.gold}></div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.25rem' }}>
          {boardMembers.map((m, i) => (
            <div key={i} style={{ ...H.card, padding: 0, overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)' }}>
              <div style={{ background: 'linear-gradient(135deg, #1a5490, #0f3d6e)', padding: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <img src={m.img} alt={m.name} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.3)' }} />
                <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'none', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.3)', fontSize: '2rem', color: 'white' }}>👤</div>
              </div>
              <div style={{ padding: '1.25rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1rem', color: '#0a1628', fontWeight: 600, marginBottom: '0.2rem' }}>{m.name}</h3>
                <p style={{ fontSize: '0.85rem', color: '#1a5490', fontWeight: 600, marginBottom: '0.2rem' }}>{m.title}</p>
                <p style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic', marginBottom: '0.15rem' }}>{m.spec}</p>
                <p style={{ fontSize: '0.8rem', color: '#999' }}>{m.inst}</p>
              </div>
            </div>
          ))}
        </div>
      </div></section>

      {/* Join */}
      <section style={{ padding: '4rem 2rem', background: 'linear-gradient(160deg, #0a1628, #1a5490)', textAlign: 'center', color: 'white' }}>
        <div style={{ maxWidth: 650, margin: '0 auto', padding: '3rem', background: 'rgba(255,255,255,0.08)', borderRadius: 16, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white' }}>Join the Board</h2>
          <div style={H.gold}></div>
          <p style={{ fontSize: '1rem', lineHeight: 1.8, color: 'white', marginBottom: '1.5rem' }}>We are always looking for distinguished scholars to join our editorial board. If you are interested in contributing to academic publishing, please get in touch.</p>
          <Link to="/contact" style={{ display: 'inline-block', padding: '0.8rem 2.5rem', background: '#d4af37', color: '#0a1628', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '1rem' }}>Contact Us</Link>
        </div>
      </section>

      <InlineEditToolbar isAdmin={isAdmin} isEditing={isEditing} onEdit={startEditing} onSave={saveEdits} onCancel={cancelEdits} fileInputRef={fileInputRef} onFileChange={handleFileChange} />
    </div>
  )
}
export default EditorialBoard
