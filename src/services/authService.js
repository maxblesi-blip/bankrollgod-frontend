// src/services/authService.js
// Authentication Service for Bankrollgod Multi-User Integration

import API_CONFIG, { API_ENDPOINTS, getAuthHeaders, buildUrl } from '../config/api';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('poker_auth_token');
    this.refreshToken = localStorage.getItem('poker_refresh_token');
    this.user = JSON.parse(localStorage.getItem('poker_user') || 'null');
  }

  // Make API request with error handling
  async apiRequest(url, options = {}) {
    try {
      const config = {
        method: 'GET',
        headers: getAuthHeaders(this.token),
        timeout: API_CONFIG.TIMEOUT,
        ...options
      };

      console.log(`🔌 API Call: ${config.method} ${url}`);

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log(`✅ API Response:`, data);
      return data;

    } catch (error) {
      console.error(`❌ API Error:`, error);
      
      // Handle token expiration
      if (error.message.includes('token') || error.message.includes('401')) {
        this.clearAuth();
      }
      
      throw error;
    }
  }

  // Register new user
  async register(userData) {
    try {
      const url = buildUrl(API_ENDPOINTS.AUTH.REGISTER);
      const response = await this.apiRequest(url, {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      if (response.success) {
        this.setAuth(response.data);
        return { success: true, user: response.data.user };
      }

      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Login user
  async login(credentials) {
    try {
      const url = buildUrl(API_ENDPOINTS.AUTH.LOGIN);
      const response = await this.apiRequest(url, {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      if (response.success) {
        this.setAuth(response.data);
        return { success: true, user: response.data.user };
      }

      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Logout user
  async logout() {
    try {
      if (this.token) {
        const url = buildUrl(API_ENDPOINTS.AUTH.LOGOUT);
        await this.apiRequest(url, { method: 'POST' });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  // Get current user profile
  async getProfile() {
    try {
      const url = buildUrl(API_ENDPOINTS.AUTH.PROFILE);
      const response = await this.apiRequest(url);

      if (response.success) {
        this.user = response.data.user;
        localStorage.setItem('poker_user', JSON.stringify(this.user));
        return { success: true, user: response.data.user };
      }

      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const url = buildUrl(API_ENDPOINTS.AUTH.UPDATE_PROFILE);
      const response = await this.apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });

      if (response.success) {
        this.user = response.data.user;
        localStorage.setItem('poker_user', JSON.stringify(this.user));
        return { success: true, user: response.data.user };
      }

      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      const url = buildUrl(API_ENDPOINTS.AUTH.CHANGE_PASSWORD);
      const response = await this.apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify(passwordData)
      });

      return { 
        success: response.success, 
        message: response.message 
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Refresh authentication token
  async refreshAuth() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const url = buildUrl(API_ENDPOINTS.AUTH.REFRESH);
      const response = await this.apiRequest(url, {
        method: 'POST',
        body: JSON.stringify({ refresh_token: this.refreshToken })
      });

      if (response.success) {
        this.setAuth(response.data);
        return { success: true };
      }

      this.clearAuth();
      return { success: false, message: response.message };
    } catch (error) {
      this.clearAuth();
      return { success: false, message: error.message };
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!(this.token && this.user);
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Get auth token
  getToken() {
    return this.token;
  }

  // Set authentication data
  setAuth(authData) {
    this.token = authData.access_token;
    this.refreshToken = authData.refresh_token;
    this.user = authData.user;

    // Store in localStorage
    localStorage.setItem('poker_auth_token', this.token);
    localStorage.setItem('poker_refresh_token', this.refreshToken);
    localStorage.setItem('poker_user', JSON.stringify(this.user));

    console.log('✅ Authentication set:', this.user.email);
  }

  // Clear authentication data
  clearAuth() {
    this.token = null;
    this.refreshToken = null;
    this.user = null;

    // Clear localStorage
    localStorage.removeItem('poker_auth_token');
    localStorage.removeItem('poker_refresh_token');
    localStorage.removeItem('poker_user');

    console.log('🔓 Authentication cleared');
  }

  // Check connection to backend
  async testConnection() {
    try {
      const url = buildUrl('/health');
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      console.log('✅ Backend connection successful');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;