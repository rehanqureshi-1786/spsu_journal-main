import { useTheme } from '../contexts/ThemeContext';
import './ThemeExample.css';

/**
 * ThemeExample Component
 * 
 * Demonstrates how to use the theme in both JavaScript and CSS.
 * This is an example component showing theme integration.
 */
const ThemeExample = () => {
  const theme = useTheme();

  return (
    <div className="theme-example">
      <h2 className="theme-example__title">Theme System Example</h2>
      
      <div className="theme-example__section">
        <h3>Using Theme in JavaScript</h3>
        <div 
          style={{
            backgroundColor: theme.colors.primary.main,
            color: theme.colors.primary.contrast,
            padding: theme.spacing[4],
            borderRadius: theme.borderRadius.md,
            boxShadow: theme.shadows.base,
            marginBottom: theme.spacing[4]
          }}
        >
          This box is styled using theme values from JavaScript
        </div>
      </div>

      <div className="theme-example__section">
        <h3>Using Theme in CSS</h3>
        <div className="theme-example__css-box">
          This box is styled using CSS custom properties (var(--color-primary-main))
        </div>
      </div>

      <div className="theme-example__section">
        <h3>Color Palette</h3>
        <div className="theme-example__colors">
          <div className="theme-example__color-box theme-example__color-box--primary">
            Primary
          </div>
          <div className="theme-example__color-box theme-example__color-box--secondary">
            Secondary
          </div>
          <div className="theme-example__color-box theme-example__color-box--accent">
            Accent
          </div>
          <div className="theme-example__color-box theme-example__color-box--success">
            Success
          </div>
          <div className="theme-example__color-box theme-example__color-box--warning">
            Warning
          </div>
          <div className="theme-example__color-box theme-example__color-box--error">
            Error
          </div>
        </div>
      </div>

      <div className="theme-example__section">
        <h3>Typography</h3>
        <div className="theme-example__typography">
          <p className="theme-example__text--xs">Extra Small Text (xs)</p>
          <p className="theme-example__text--sm">Small Text (sm)</p>
          <p className="theme-example__text--base">Base Text (base)</p>
          <p className="theme-example__text--lg">Large Text (lg)</p>
          <p className="theme-example__text--xl">Extra Large Text (xl)</p>
          <p className="theme-example__text--2xl">2XL Text (2xl)</p>
        </div>
      </div>

      <div className="theme-example__section">
        <h3>Spacing</h3>
        <div className="theme-example__spacing">
          <div className="theme-example__spacing-box theme-example__spacing-box--2">2</div>
          <div className="theme-example__spacing-box theme-example__spacing-box--4">4</div>
          <div className="theme-example__spacing-box theme-example__spacing-box--6">6</div>
          <div className="theme-example__spacing-box theme-example__spacing-box--8">8</div>
        </div>
      </div>

      <div className="theme-example__section">
        <h3>Shadows</h3>
        <div className="theme-example__shadows">
          <div className="theme-example__shadow-box theme-example__shadow-box--sm">sm</div>
          <div className="theme-example__shadow-box theme-example__shadow-box--base">base</div>
          <div className="theme-example__shadow-box theme-example__shadow-box--md">md</div>
          <div className="theme-example__shadow-box theme-example__shadow-box--lg">lg</div>
          <div className="theme-example__shadow-box theme-example__shadow-box--xl">xl</div>
        </div>
      </div>

      <div className="theme-example__section">
        <h3>Interactive Elements</h3>
        <div className="theme-example__buttons">
          <button className="theme-example__button theme-example__button--primary">
            Primary Button
          </button>
          <button className="theme-example__button theme-example__button--secondary">
            Secondary Button
          </button>
          <button className="theme-example__button theme-example__button--success">
            Success Button
          </button>
          <button className="theme-example__button theme-example__button--danger">
            Danger Button
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeExample;
