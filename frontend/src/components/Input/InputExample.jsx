import React, { useState } from 'react';
import Input from './Input';
import Textarea from './Textarea';
import './InputExample.css';

/**
 * InputExample Component
 * 
 * Demonstrates all variants and features of the Input and Textarea components.
 * This file serves as both documentation and a testing playground.
 */
const InputExample = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [bio, setBio] = useState('');
  const [emailError, setEmailError] = useState('');

  // Email validation
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    if (value && !value.includes('@')) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  return (
    <div className="input-example">
      <div className="input-example__header">
        <h1>Input Component Examples</h1>
        <p>Modern, accessible input components with floating labels and enhanced styling</p>
      </div>

      {/* Basic Inputs */}
      <section className="input-example__section">
        <h2>Basic Inputs</h2>
        <div className="input-example__grid">
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={email}
            onChange={handleEmailChange}
            error={emailError}
            helperText="We'll never share your email"
            required
            fullWidth
          />

          <Input
            label="Username"
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            helperText="Choose a unique username"
            fullWidth
          />

          <Input
            label="Phone Number"
            type="tel"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            fullWidth
          />
        </div>
      </section>

      {/* Password Input with Toggle */}
      <section className="input-example__section">
        <h2>Password Input with Toggle</h2>
        <div className="input-example__grid">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            prefixIcon="🔒"
            suffixIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            }
            helperText="Must be at least 8 characters"
            required
            fullWidth
          />
        </div>
      </section>

      {/* Inputs with Icons */}
      <section className="input-example__section">
        <h2>Inputs with Icons</h2>
        <div className="input-example__grid">
          <Input
            label="Search"
            type="search"
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefixIcon="🔍"
            placeholder="Search..."
            fullWidth
          />

          <Input
            label="Amount"
            type="number"
            name="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            prefixIcon="$"
            helperText="Enter amount in USD"
            fullWidth
          />

          <Input
            label="Email with Icon"
            type="email"
            name="email-icon"
            prefixIcon="📧"
            placeholder="user@example.com"
            fullWidth
          />
        </div>
      </section>

      {/* Size Variants */}
      <section className="input-example__section">
        <h2>Size Variants</h2>
        <div className="input-example__grid">
          <Input
            label="Small Input"
            size="sm"
            placeholder="Small size"
            fullWidth
          />

          <Input
            label="Medium Input (Default)"
            size="md"
            placeholder="Medium size"
            fullWidth
          />

          <Input
            label="Large Input"
            size="lg"
            placeholder="Large size"
            fullWidth
          />
        </div>
      </section>

      {/* States */}
      <section className="input-example__section">
        <h2>Input States</h2>
        <div className="input-example__grid">
          <Input
            label="Normal State"
            placeholder="Type something..."
            fullWidth
          />

          <Input
            label="Disabled State"
            value="Cannot edit this"
            disabled
            fullWidth
          />

          <Input
            label="Read-only State"
            value="Read-only value"
            readOnly
            fullWidth
          />

          <Input
            label="Error State"
            value="invalid@"
            error="Invalid email format"
            fullWidth
          />
        </div>
      </section>

      {/* Textarea Examples */}
      <section className="input-example__section">
        <h2>Textarea Component</h2>
        <div className="input-example__grid">
          <Textarea
            label="Description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            helperText="Provide a brief description"
            rows={4}
            fullWidth
          />

          <Textarea
            label="Bio"
            name="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            helperText="Tell us about yourself"
            rows={4}
            fullWidth
          />

          <Textarea
            label="Auto-resize Textarea"
            autoResize
            rows={3}
            placeholder="This textarea grows as you type..."
            fullWidth
          />
        </div>
      </section>

      {/* Form Example */}
      <section className="input-example__section">
        <h2>Complete Form Example</h2>
        <form className="input-example__form" onSubmit={(e) => e.preventDefault()}>
          <div className="input-example__form-row">
            <Input
              label="First Name"
              type="text"
              required
              fullWidth
            />
            <Input
              label="Last Name"
              type="text"
              required
              fullWidth
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            prefixIcon="📧"
            required
            fullWidth
          />

          <Input
            label="Phone Number"
            type="tel"
            prefixIcon="📱"
            fullWidth
          />

          <Textarea
            label="Message"
            rows={5}
            maxLength={500}
            helperText="Share your thoughts with us"
            required
            fullWidth
          />

          <div className="input-example__form-actions">
            <button type="submit" className="btn-primary">
              Submit Form
            </button>
            <button type="reset" className="btn-secondary">
              Reset
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default InputExample;
