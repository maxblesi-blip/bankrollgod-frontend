// src/components/ProfileSettings.jsx
// ProfileSettings Component with REAL API Integration

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ProfileSettings.css';

const ProfileSettings = ({ onClose }) => {
  const { user, logout, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Account Form State
  const [accountForm, setAccountForm] = useState({
    username: user?.username || '',
    nickname: user?.nickname || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || ''
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Privacy Settings State
  const [privacySettings, setPrivacySettings] = useState({
    profilePublic: user?.profilePublic || false,
    showStats: user?.showStats || true,
    allowMessages: user?.allowMessages || true,
    dataSharing: user?.dataSharing || false
  });

  // Account Deletion State
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    if (user) {
      setAccountForm({
        username: user.username || '',
        nickname: user.nickname || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || ''
      });
    }
  }, [user]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // REAL API: Account Information Update
  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://bankrollgod-backend.onrender.com/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(accountForm)
      });

      const data = await response.json();

      if (data.success) {
  // Update user in AuthContext
  if (updateProfile) {
    updateProfile(data.user);
  }
  showMessage('success', 'Account information updated successfully!');
} else {
        showMessage('error', data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showMessage('error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // REAL API: Password Change
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
      const response = await fetch('https://bankrollgod-backend.onrender.com/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showMessage('success', 'Password changed successfully!');
      } else {
        showMessage('error', data.message || 'Password change failed');
      }
    } catch (error) {
      console.error('Password change error:', error);
      showMessage('error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // REAL API: Privacy Settings Update
  const handlePrivacyUpdate = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('https://bankrollgod-backend.onrender.com/api/users/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(privacySettings)
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'Privacy settings updated!');
      } else {
        showMessage('error', data.message || 'Failed to update privacy settings');
      }
    } catch (error) {
      console.error('Privacy update error:', error);
      showMessage('error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // REAL API: Account Deletion
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
      const response = await fetch('https://bankrollgod-backend.onrender.com/api/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'Account deleted successfully. Redirecting...');
        setTimeout(() => {
          logout();
          onClose();
        }, 2000);
      } else {
        showMessage('error', data.message || 'Account deletion failed');
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      showMessage('error', 'Network error. Please try again.');
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
                value={accountForm.first_name}
                onChange={(e) => setAccountForm({...accountForm, first_name: e.target.value})}
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={accountForm.last_name}
                onChange={(e) => setAccountForm({...accountForm, last_name: e.target.value})}
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
    <div className="profile-settings-overlay">
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