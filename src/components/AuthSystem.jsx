// src/components/AuthSystem.js
// Professional Login/Register System for Option B Integration
// Matches your existing Bankrollgod design

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthSystem.css';

// Icons (matching your existing style)
const SpadeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C9 7 5 9 5 14c0 2.8 2.2 5 5 5c1 0 2-.3 2.8-.8L11 22h2l-1.8-3.8c.8.5 1.8.8 2.8.8c2.8 0 5-2.2 5-5c0-5-4-7-7-12z"/>
  </svg>
);

const DiamondIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L5 12l7 10l7-10z"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
  </svg>
);

// Input Component
const AuthInput = ({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  required = false, 
  disabled = false,
  name,
  autoComplete,
  showPasswordToggle = false,
  onTogglePassword
}) => {
  return (
    <div className="auth-input-container">
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className="auth-input"
      />
      {showPasswordToggle && (
        <button
          type="button"
          className="password-toggle"
          onClick={onTogglePassword}
          tabIndex={-1}
        >
          {type === 'password' ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      )}
    </div>
  );
};

// Login Form Component
const LoginForm = ({ onSwitchToRegister, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember_me: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(formData);
      
      if (result.success) {
        onSuccess && onSuccess(result.user);
      } else {
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-header">
        <h2>Welcome Back</h2>
        <p>Sign in to your poker account</p>
      </div>

      {error && (
        <div className="error-message">
          <span>❌</span>
          <span>{error}</span>
        </div>
      )}

      <div className="form-fields">
        <AuthInput
          type="email"
          name="email"
          placeholder="Email address"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          autoComplete="email"
        />

        <AuthInput
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          autoComplete="current-password"
          showPasswordToggle
          onTogglePassword={() => setShowPassword(!showPassword)}
        />

        <div className="form-checkbox">
          <input
            type="checkbox"
            id="remember_me"
            name="remember_me"
            checked={formData.remember_me}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          <label htmlFor="remember_me">Remember me</label>
        </div>
      </div>

      <button
        type="submit"
        className="auth-submit"
        disabled={isSubmitting || !formData.email || !formData.password}
      >
        {isSubmitting ? (
          <>
            <div className="button-spinner"></div>
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <SpadeIcon />
            <span>Sign In</span>
          </>
        )}
      </button>

      <div className="form-footer">
        <span>Don't have an account? </span>
        <button
          type="button"
          className="link-button"
          onClick={onSwitchToRegister}
          disabled={isSubmitting}
        >
          Create one here
        </button>
      </div>
    </form>
  );
};

// Register Form Component
const RegisterForm = ({ onSwitchToLogin, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    first_name: '',
    last_name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    
    if (!formData.email || !formData.password || !formData.username) {
      return 'Please fill in all required fields';
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      const result = await register(registrationData);
      
      if (result.success) {
        onSuccess && onSuccess(result.user);
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-header">
        <h2>Join BankrollGod</h2>
        <p>Create your poker tracking account</p>
      </div>

      {error && (
        <div className="error-message">
          <span>❌</span>
          <span>{error}</span>
        </div>
      )}

      <div className="form-fields">
        <div className="form-row">
          <AuthInput
            type="text"
            name="first_name"
            placeholder="First name"
            value={formData.first_name}
            onChange={handleChange}
            disabled={isSubmitting}
            autoComplete="given-name"
          />
          <AuthInput
            type="text"
            name="last_name"
            placeholder="Last name"
            value={formData.last_name}
            onChange={handleChange}
            disabled={isSubmitting}
            autoComplete="family-name"
          />
        </div>

        <AuthInput
          type="text"
          name="username"
          placeholder="Username *"
          value={formData.username}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          autoComplete="username"
        />

        <AuthInput
          type="email"
          name="email"
          placeholder="Email address *"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          autoComplete="email"
        />

        <AuthInput
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="Password (min. 6 characters) *"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          autoComplete="new-password"
          showPasswordToggle
          onTogglePassword={() => setShowPassword(!showPassword)}
        />

        <AuthInput
          type={showConfirmPassword ? 'text' : 'password'}
          name="confirmPassword"
          placeholder="Confirm password *"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          autoComplete="new-password"
          showPasswordToggle
          onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
        />
      </div>

      <button
        type="submit"
        className="auth-submit"
        disabled={isSubmitting || !formData.email || !formData.password || !formData.username}
      >
        {isSubmitting ? (
          <>
            <div className="button-spinner"></div>
            <span>Creating account...</span>
          </>
        ) : (
          <>
            <DiamondIcon />
            <span>Create Account</span>
          </>
        )}
      </button>

      <div className="form-footer">
        <span>Already have an account? </span>
        <button
          type="button"
          className="link-button"
          onClick={onSwitchToLogin}
          disabled={isSubmitting}
        >
          Sign in here
        </button>
      </div>
    </form>
  );
};

// Main Auth System Component
const AuthSystem = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const { backendConnected, testBackendConnection } = useAuth();

  const handleSwitchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  return (
    <div className="auth-system">
      <div className="auth-background">
        {/* Animated poker cards background */}
        <div className="poker-cards-bg">
          <div className="floating-card card-1">A<SpadeIcon /></div>
          <div className="floating-card card-2">K<DiamondIcon /></div>
          <div className="floating-card card-3">Q<DiamondIcon /></div>
          <div className="floating-card card-4">J<SpadeIcon /></div>
        </div>
      </div>

      <div className="auth-container">
        <div className="auth-header">
          <div className="logo">
            <SpadeIcon />
            <span className="logo-text">BankrollGod</span>
            <DiamondIcon />
          </div>
          <div className="subtitle">Professional Poker Bankroll Management</div>
        </div>

        {!backendConnected && (
          <div className="connection-warning">
            <div className="warning-content">
              <span>⚠️</span>
              <span>Backend connection failed</span>
              <button onClick={testBackendConnection} className="retry-connection">
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="auth-card">
          {mode === 'login' ? (
            <LoginForm
              onSwitchToRegister={handleSwitchMode}
              onSuccess={onAuthSuccess}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={handleSwitchMode}
              onSuccess={onAuthSuccess}
            />
          )}
        </div>

        <div className="auth-features">
          <div className="feature-item">
            <span>🔒</span>
            <span>Secure Multi-User System</span>
          </div>
          <div className="feature-item">
            <span>☁️</span>
            <span>Cloud Data Synchronization</span>
          </div>
          <div className="feature-item">
            <span>📊</span>
            <span>Professional Session Tracking</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSystem;