// src/components/CompactLoginModal.jsx
// Improved Login Modal with Error Handling - No Page Reloads
// Uses compact-* CSS classes from your existing stylesheet

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './CompactLoginModal.css';

const CompactLoginModal = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    first_name: '',
    last_name: '',
    nickname: ''
  });

  // Reset form when switching between login/register
  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      username: '',
      first_name: '',
      last_name: '',
      nickname: ''
    });
    setError('');
    setSuccess('');
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN
        const result = await login({
  email: formData.email,
  password: formData.password
});
        
        if (result.success) {
          setSuccess('Login erfolgreich! Leite weiter...');
          setTimeout(() => {
            onClose();
            resetForm();
          }, 1000);
        } else {
          // Show error message in modal - NO PAGE RELOAD
          setError(result.error || 'Login fehlgeschlagen. Bitte überprüfe deine Anmeldedaten.');
        }
      } else {
        // REGISTER
        const result = await register(formData);
        
        if (result.success) {
          setSuccess('Registrierung erfolgreich! Du wirst eingeloggt...');
          setTimeout(() => {
            onClose();
            resetForm();
          }, 1500);
        } else {
          // Show error message in modal - NO PAGE RELOAD
          setError(result.error || 'Registrierung fehlgeschlagen. Bitte versuche es erneut.');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="compact-modal-overlay" onClick={onClose}>
      <div className="compact-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="compact-modal-close" onClick={onClose}>×</button>
        
        <form onSubmit={handleSubmit} className="compact-login-form">
          <div className="compact-form-header">
            <h2>{isLogin ? 'Login' : 'Registrieren'}</h2>
            <p>{isLogin ? 'Willkommen zurück bei BankrollGod' : 'Erstelle deinen Account'}</p>
          </div>

          {/* Error Message - using your subtle style */}
          {error && (
            <div className="compact-error-message subtle">
              <div className="error-content">
                <div className="error-dot"></div>
                <div className="error-text">{error}</div>
              </div>
            </div>
          )}

          {/* Success Message - using matching style */}
          {success && (
            <div className="compact-success-message subtle">
              <div className="success-content">
                <div className="success-dot"></div>
                <div className="success-text">{success}</div>
              </div>
            </div>
          )}

          <div className="compact-form-fields">
            {!isLogin && (
              <>
                <div className="compact-form-row">
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Vorname"
                    className="compact-input"
                    required={!isLogin}
                    disabled={loading}
                  />
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Nachname"
                    className="compact-input"
                    required={!isLogin}
                    disabled={loading}
                  />
                </div>

                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  className="compact-input"
                  required={!isLogin}
                  disabled={loading}
                />

                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  placeholder="Nickname (optional, z.B. PokerPro123)"
                  className="compact-input nickname-input"
                  disabled={loading}
                />

                {formData.nickname && (
                  <div className="nickname-preview">
                    🎮 Dein Nickname: <strong>{formData.nickname}</strong>
                  </div>
                )}
              </>
            )}

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="compact-input"
              required
              autoComplete="email"
              disabled={loading}
            />

            <div className="compact-input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Passwort"
                className="compact-input"
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                disabled={loading}
              />
              <button
                type="button"
                className="compact-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="compact-submit"
            disabled={loading}
          >
            {loading && <span className="compact-spinner"></span>}
            {loading 
              ? (isLogin ? 'Einloggen...' : 'Registrieren...') 
              : (isLogin ? 'Login' : 'Account erstellen')
            }
          </button>

          <div className="compact-form-footer">
            <span style={{ color: 'var(--text-secondary)' }}>
              {isLogin ? 'Noch kein Account?' : 'Bereits registriert?'}
            </span>
            {' '}
            <button 
              type="button"
              onClick={switchMode} 
              className="compact-link-button"
              disabled={loading}
            >
              {isLogin ? 'Jetzt registrieren' : 'Zum Login'}
            </button>
          </div>

          {!isLogin && (
            <div className="compact-features">
              <div className="compact-feature-item">
                <span>🔒</span>
                <span>Sicher</span>
              </div>
              <div className="compact-feature-item">
                <span>☁️</span>
                <span>Cloud Sync</span>
              </div>
              <div className="compact-feature-item">
                <span>⚡</span>
                <span>Schnell</span>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CompactLoginModal;