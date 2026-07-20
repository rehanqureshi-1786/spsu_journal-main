import React from 'react';
import Card from './Card';
import './CardExample.css';

/**
 * Card Component Examples
 * 
 * Demonstrates various Card component configurations and use cases.
 */
const CardExample = () => {
  const handleCardClick = () => {
    alert('Card clicked!');
  };

  return (
    <div className="card-examples">
      <div className="examples-container">
        <h1>Card Component Examples</h1>
        <p className="subtitle">Modern, flexible card component with multiple variants</p>

        {/* Variants Section */}
        <section className="example-section">
          <h2>Variants</h2>
          <div className="cards-grid">
            <Card variant="default">
              <h3>Default Card</h3>
              <p>This is a default card with subtle border and shadow.</p>
            </Card>

            <Card variant="elevated">
              <h3>Elevated Card</h3>
              <p>This card has a prominent shadow for emphasis.</p>
            </Card>

            <Card variant="outlined">
              <h3>Outlined Card</h3>
              <p>This card has a border without shadow for a clean look.</p>
            </Card>
          </div>
        </section>

        {/* With Header and Footer */}
        <section className="example-section">
          <h2>With Header and Footer</h2>
          <div className="cards-grid">
            <Card
              variant="default"
              header={<h3>Card with Header</h3>}
            >
              <p>This card has a header section with distinct styling.</p>
              <p>The body content is clearly separated.</p>
            </Card>

            <Card
              variant="elevated"
              footer={
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button className="btn-secondary">Cancel</button>
                  <button className="btn-primary">Save</button>
                </div>
              }
            >
              <h3>Card with Footer</h3>
              <p>This card has a footer section, perfect for actions.</p>
            </Card>

            <Card
              variant="outlined"
              header={<h3>Complete Card</h3>}
              footer={<p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Last updated: 2 hours ago</p>}
            >
              <p>This card has both header and footer sections.</p>
              <p>Great for complex content with metadata.</p>
            </Card>
          </div>
        </section>

        {/* Hoverable Cards */}
        <section className="example-section">
          <h2>Hoverable Cards</h2>
          <p className="section-description">Hover over these cards to see the effect</p>
          <div className="cards-grid">
            <Card variant="default" hoverable>
              <h3>Hoverable Default</h3>
              <p>Hover to see the elevation effect.</p>
            </Card>

            <Card variant="elevated" hoverable>
              <h3>Hoverable Elevated</h3>
              <p>Hover to see increased shadow.</p>
            </Card>

            <Card variant="outlined" hoverable>
              <h3>Hoverable Outlined</h3>
              <p>Hover to see border color change.</p>
            </Card>
          </div>
        </section>

        {/* Interactive/Clickable Cards */}
        <section className="example-section">
          <h2>Interactive Cards</h2>
          <p className="section-description">Click these cards to trigger an action</p>
          <div className="cards-grid">
            <Card variant="default" onClick={handleCardClick}>
              <h3>Clickable Card</h3>
              <p>Click me to trigger an action!</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Keyboard accessible (Enter/Space)</p>
            </Card>

            <Card 
              variant="elevated" 
              hoverable 
              onClick={handleCardClick}
              header={<h3>Interactive with Header</h3>}
            >
              <p>This card is both hoverable and clickable.</p>
              <p>Perfect for navigation or selection.</p>
            </Card>
          </div>
        </section>

        {/* Real-world Examples */}
        <section className="example-section">
          <h2>Real-world Examples</h2>

          <div className="example-card">
            <h3>User Profile Card</h3>
            <Card
              variant="elevated"
              header={
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '50%', 
                    backgroundColor: '#1a5490',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.25rem'
                  }}>
                    JD
                  </div>
                  <div>
                    <h4 style={{ margin: 0 }}>John Doe</h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>john.doe@example.com</p>
                  </div>
                </div>
              }
              footer={
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-outline">View Profile</button>
                  <button className="btn-primary">Edit</button>
                </div>
              }
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                <div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>42</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Papers</p>
                </div>
                <div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>18</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Reviews</p>
                </div>
                <div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>5</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Pending</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="example-card">
            <h3>Statistics Card</h3>
            <div className="cards-grid">
              <Card variant="default" hoverable>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>Total Papers</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>1,234</p>
                  </div>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px', 
                    backgroundColor: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    📄
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#10b981', margin: '0.5rem 0 0 0' }}>
                  ↑ 12% from last month
                </p>
              </Card>

              <Card variant="default" hoverable>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>Active Reviewers</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>89</p>
                  </div>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px', 
                    backgroundColor: '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    👥
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#10b981', margin: '0.5rem 0 0 0' }}>
                  ↑ 5% from last month
                </p>
              </Card>
            </div>
          </div>

          <div className="example-card">
            <h3>Article Card</h3>
            <Card
              variant="outlined"
              hoverable
              onClick={handleCardClick}
            >
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ 
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#eff6ff',
                  color: '#1a5490',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  Computer Science
                </span>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>
                Machine Learning Applications in Healthcare
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>
                Exploring the latest advancements in ML algorithms for medical diagnosis and treatment planning...
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
                <span>Dr. Jane Smith</span>
                <span>Published: Jan 15, 2024</span>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CardExample;
