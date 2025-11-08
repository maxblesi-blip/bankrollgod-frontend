import React, { useState } from 'react';
import './LoginModal.css';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [activeTab, setActiveTab] = useState('email');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwörter stimmen nicht überein');
          setIsLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Passwort muss mindestens 6 Zeichen lang sein');
          setIsLoading(false);
          return;
        }
      }

      // Simuliere API-Call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Erfolgreicher Login/Registrierung
      onLogin(activeTab, {
        email: formData.email,
        username: formData.username || formData.email.split('@')[0]
      });
      
      onClose();
      
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordLogin = () => {
    setIsLoading(true);
    // Simuliere Discord OAuth
    setTimeout(() => {
      onLogin('discord', {
        username: 'DiscordUser#1234',
        email: 'user@discord.com'
      });
      onClose();
      setIsLoading(false);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {isSignUp ? 'Registrieren' : 'Anmelden'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="login-tabs">
          <button 
            className={`tab ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            📧 E-Mail
          </button>
          <button 
            className={`tab ${activeTab === 'discord' ? 'active' : ''}`}
            onClick={() => setActiveTab('discord')}
          >
            💬 Discord
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {activeTab === 'email' ? (
          <form onSubmit={handleSubmit} className="login-form">
            {isSignUp && (
              <div className="form-group">
                <label>Benutzername</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  placeholder="Dein Benutzername"
                />
              </div>
            )}

            <div className="form-group">
              <label>E-Mail</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="deine@email.com"
              />
            </div>

            <div className="form-group">
              <label>Passwort</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="••••••••"
              />
            </div>

            {isSignUp && (
              <div className="form-group">
                <label>Passwort bestätigen</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="••••••••"
                />
              </div>
            )}

            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Wird verarbeitet...' : (isSignUp ? 'Registrieren' : 'Anmelden')}
            </button>

            <div className="form-footer">
              <button 
                type="button" 
                className="link-btn"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Bereits ein Konto? Anmelden' : 'Noch kein Konto? Registrieren'}
              </button>
            </div>
          </form>
        ) : (
          <div className="discord-login">
            <div className="discord-info">
              <h3>Mit Discord anmelden</h3>
              <p>Schnelle und sichere Anmeldung über deinen Discord Account</p>
            </div>
            
            <button 
              className="discord-btn"
              onClick={handleDiscordLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Verbinde mit Discord...</span>
              ) : (
                <>
                  <span className="discord-icon">💬</span>
                  Mit Discord fortfahren
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;