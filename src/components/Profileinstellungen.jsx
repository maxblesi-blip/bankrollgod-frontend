// src/components/ProfileSettings.jsx
// Complete Profile Settings Component - Account, Security & Privacy

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ProfileSettings.css';

const ProfileSettings = ({ onClose }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Account Form State
  const [accountForm, setAccountForm] = useState({
    username: user?.username || '',
    nickname: user?.nickname || '',
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || ''
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Privacy Settings State
  const [privacySettings, setPrivacySettings] = useState({
    profilePublic: false,
    showStats: true,
    allowMessages: true,
    dataSharing: false
  });

  // Account Deletion State
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    if (user) {
      setAccountForm({
        username: user.username || '',
        nickname: user.nickname || '',
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      });
    }
  }, [user]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Account Information Update
  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Implement actual API call
      // const response = await authAPI.updateProfile(accountForm);
      
      showMessage('success', 'Account information updated successfully!');
    } catch (error) {
      showMessage('error', error.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  // Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Implement actual API call
      // const response = await authAPI.changePassword(passwordForm);
      
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMessage('success', 'Password changed successfully!');
    } catch (error) {
      showMessage('error', error.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  // Privacy Settings Update
  const handlePrivacyUpdate = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // TODO: Implement actual API call
      // const response = await authAPI.updatePrivacySettings(privacySettings);
      
      showMessage('success', 'Privacy settings updated!');
    } catch (error) {
      showMessage('error', 'Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  // Account Deletion
  const handleAccountDeletion = async () => {
    if (deleteConfirmation !== 'DELETE') {
      showMessage('error', 'Please type "DELETE" to confirm account deletion');
      return;
    }

    if (!window.confirm('Are you absolutely sure? This action cannot be undone!')) {
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: Implement actual API call
      // const response = await authAPI.deleteAccount();
      
      showMessage('success', 'Account deleted successfully. Redirecting...');
      setTimeout(() => {
        logout();
        onClose();
      }, 2000);
    } catch (error) {
      showMessage('error', error.message || 'Account deletion failed');
    } finally {
      setLoading(false);
    }
  };

  const renderAccountTab = () => (
    <div className="settings-tab-content">
      <div className="settings-section">
        <h3>Account Information</h3>
        <p>Update your basic account details and how you appear in the app.</p>
        
        <form onSubmit={handleAccountUpdate} className="settings-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                id="username"
                type="text"
                value={accountForm.username}
                onChange={(e) => setAccountForm({...accountForm, username: e.target.value})}
                required
                disabled={loading}
                placeholder="Used for login"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="nickname">Display Name</label>
              <input
                id="nickname"
                type="text"
                value={accountForm.nickname}
                onChange={(e) => setAccountForm({...accountForm, nickname: e.target.value})}
                placeholder="How others see you"
                disabled={loading}
              />
              <small>If empty, your username will be displayed</small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              type="email"
              value={accountForm.email}
              onChange={(e) => setAccountForm({...accountForm, email: e.target.value})}
              required
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                value={accountForm.firstName}
                onChange={(e) => setAccountForm({...accountForm, firstName: e.target.value})}
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={accountForm.lastName}
                onChange={(e) => setAccountForm({...accountForm, lastName: e.target.value})}
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                Updating...
              </>
            ) : (
              'Update Account Information'
            )}
          </button>
        </form>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="settings-tab-content">
      <div className="settings-section">
        <h3>Password & Security</h3>
        <p>Change your password to keep your account secure.</p>
        
        <form onSubmit={handlePasswordChange} className="settings-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password *</label>
            <input
              id="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password *</label>
            <input
              id="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
              required
              disabled={loading}
              minLength={6}
            />
            <small>Minimum 6 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password *</label>
            <input
              id="confirmPassword"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                Changing...
              </>
            ) : (
              'Change Password'
            )}
          </button>
        </form>
      </div>

      <div className="settings-section danger-zone">
        <h3>Delete Account</h3>
        <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
        
        <div className="form-group">
          <label htmlFor="deleteConfirm">Type "DELETE" to confirm:</label>
          <input
            id="deleteConfirm"
            type="text"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="DELETE"
            disabled={loading}
          />
        </div>
        
        <button 
          onClick={handleAccountDeletion} 
          className="btn-danger"
          disabled={loading || deleteConfirmation !== 'DELETE'}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Deleting...
            </>
          ) : (
            'Delete Account Permanently'
          )}
        </button>
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="settings-tab-content">
      <div className="settings-section">
        <h3>Privacy Settings</h3>
        <p>Control how your information is shared and displayed.</p>
        
        <div className="privacy-settings">
          <div className="privacy-item">
            <div className="privacy-info">
              <h4>Public Profile</h4>
              <p>Allow other users to see your profile and basic statistics</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={privacySettings.profilePublic}
                onChange={(e) => setPrivacySettings({
                  ...privacySettings,
                  profilePublic: e.target.checked
                })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="privacy-item">
            <div className="privacy-info">
              <h4>Show Statistics</h4>
              <p>Display your poker statistics on your public profile</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={privacySettings.showStats}
                onChange={(e) => setPrivacySettings({
                  ...privacySettings,
                  showStats: e.target.checked
                })}
                disabled={!privacySettings.profilePublic}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="privacy-item">
            <div className="privacy-info">
              <h4>Allow Messages</h4>
              <p>Let other users send you messages through the platform</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={privacySettings.allowMessages}
                onChange={(e) => setPrivacySettings({
                  ...privacySettings,
                  allowMessages: e.target.checked
                })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="privacy-item">
            <div className="privacy-info">
              <h4>Anonymous Data Sharing</h4>
              <p>Help improve the service by sharing anonymous usage data</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={privacySettings.dataSharing}
                onChange={(e) => setPrivacySettings({
                  ...privacySettings,
                  dataSharing: e.target.checked
                })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <button 
          onClick={handlePrivacyUpdate} 
          className="btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Saving...
            </>
          ) : (
            'Save Privacy Settings'
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="profile-settings-overlay" onClick={onClose}>
      <div className="profile-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Profile Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {message.text && (
          <div className={`settings-message ${message.type}`}>
            <span className="message-icon">
              {message.type === 'success' ? '✅' : '❌'}
            </span>
            {message.text}
          </div>
        )}

        <div className="settings-content">
          <div className="settings-tabs">
            <button 
              className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <span>👤</span>
              Account
            </button>
            <button 
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <span>🔐</span>
              Security
            </button>
            <button 
              className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              <span>🛡️</span>
              Privacy
            </button>
          </div>

          <div className="settings-body">
            {activeTab === 'account' && renderAccountTab()}
            {activeTab === 'security' && renderSecurityTab()}
            {activeTab === 'privacy' && renderPrivacyTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;