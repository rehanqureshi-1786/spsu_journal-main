import React, { useState } from 'react';
import Button from './Button';
import './ButtonExample.css';

/**
 * Button Component Examples
 * 
 * This file demonstrates all the features and variants of the Button component.
 * Use this as a reference for implementing buttons throughout the application.
 */
const ButtonExample = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    console.log('Button clicked!');
  };

  const handleLoadingClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="button-example">
      <h1>Button Component Examples</h1>

      {/* Variants */}
      <section className="example-section">
        <h2>Variants</h2>
        <div className="button-group">
          <Button variant="primary" onClick={handleClick}>
            Primary
          </Button>
          <Button variant="secondary" onClick={handleClick}>
            Secondary
          </Button>
          <Button variant="outline" onClick={handleClick}>
            Outline
          </Button>
          <Button variant="ghost" onClick={handleClick}>
            Ghost
          </Button>
          <Button variant="danger" onClick={handleClick}>
            Danger
          </Button>
        </div>
      </section>

      {/* Sizes */}
      <section className="example-section">
        <h2>Sizes</h2>
        <div className="button-group">
          <Button size="sm" onClick={handleClick}>
            Small
          </Button>
          <Button size="md" onClick={handleClick}>
            Medium
          </Button>
          <Button size="lg" onClick={handleClick}>
            Large
          </Button>
        </div>
      </section>

      {/* States */}
      <section className="example-section">
        <h2>States</h2>
        <div className="button-group">
          <Button onClick={handleClick}>
            Normal
          </Button>
          <Button disabled onClick={handleClick}>
            Disabled
          </Button>
          <Button loading={loading} onClick={handleLoadingClick}>
            {loading ? 'Loading...' : 'Click to Load'}
          </Button>
        </div>
      </section>

      {/* With Icons */}
      <section className="example-section">
        <h2>With Icons</h2>
        <div className="button-group">
          <Button 
            icon={<span>🔍</span>} 
            iconPosition="left"
            onClick={handleClick}
          >
            Search
          </Button>
          <Button 
            icon={<span>→</span>} 
            iconPosition="right"
            onClick={handleClick}
          >
            Next
          </Button>
          <Button 
            icon={<span>📥</span>}
            aria-label="Download"
            onClick={handleClick}
          />
          <Button 
            variant="outline"
            icon={<span>⚙️</span>}
            aria-label="Settings"
            onClick={handleClick}
          />
        </div>
      </section>

      {/* Ripple Effect */}
      <section className="example-section">
        <h2>Ripple Effect</h2>
        <div className="button-group">
          <Button ripple onClick={handleClick}>
            Click for Ripple
          </Button>
          <Button variant="secondary" ripple onClick={handleClick}>
            Secondary Ripple
          </Button>
          <Button variant="outline" ripple onClick={handleClick}>
            Outline Ripple
          </Button>
        </div>
      </section>

      {/* Full Width */}
      <section className="example-section">
        <h2>Full Width</h2>
        <div className="button-group-vertical">
          <Button fullWidth onClick={handleClick}>
            Full Width Primary
          </Button>
          <Button variant="outline" fullWidth onClick={handleClick}>
            Full Width Outline
          </Button>
        </div>
      </section>

      {/* Button Types */}
      <section className="example-section">
        <h2>Button Types</h2>
        <form onSubmit={(e) => { e.preventDefault(); console.log('Form submitted'); }}>
          <div className="button-group">
            <Button type="button" onClick={handleClick}>
              Button Type
            </Button>
            <Button type="submit">
              Submit Type
            </Button>
            <Button type="reset" variant="outline">
              Reset Type
            </Button>
          </div>
        </form>
      </section>

      {/* Combined Examples */}
      <section className="example-section">
        <h2>Combined Examples</h2>
        <div className="button-group">
          <Button 
            variant="primary" 
            size="lg" 
            icon={<span>✓</span>}
            ripple
            onClick={handleClick}
          >
            Save Changes
          </Button>
          <Button 
            variant="danger" 
            size="sm" 
            icon={<span>🗑️</span>}
            onClick={handleClick}
          >
            Delete
          </Button>
          <Button 
            variant="ghost" 
            size="md" 
            icon={<span>✕</span>}
            onClick={handleClick}
          >
            Cancel
          </Button>
        </div>
      </section>

      {/* Real-world Examples */}
      <section className="example-section">
        <h2>Real-world Examples</h2>
        
        <div className="example-card">
          <h3>Form Actions</h3>
          <div className="button-group">
            <Button variant="outline" onClick={handleClick}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleClick}>
              Save
            </Button>
          </div>
        </div>

        <div className="example-card">
          <h3>Confirmation Dialog</h3>
          <div className="button-group">
            <Button variant="ghost" onClick={handleClick}>
              No, Cancel
            </Button>
            <Button variant="danger" onClick={handleClick}>
              Yes, Delete
            </Button>
          </div>
        </div>

        <div className="example-card">
          <h3>Navigation</h3>
          <div className="button-group">
            <Button 
              variant="outline" 
              icon={<span>←</span>}
              onClick={handleClick}
            >
              Back
            </Button>
            <Button 
              variant="primary" 
              icon={<span>→</span>}
              iconPosition="right"
              onClick={handleClick}
            >
              Continue
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ButtonExample;
