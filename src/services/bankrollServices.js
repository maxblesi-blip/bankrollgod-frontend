// src/services/bankrollService.js
// Bankroll Service for Bankrollgod Multi-User Integration

import API_CONFIG, { API_ENDPOINTS, getAuthHeaders, buildUrl } from '../config/api';
import authService from './authService';

class BankrollService {
  // Make authenticated API request
  async apiRequest(url, options = {}) {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const config = {
        method: 'GET',
        headers: getAuthHeaders(token),
        timeout: API_CONFIG.TIMEOUT,
        ...options
      };

      console.log(`🔌 Bankroll API Call: ${config.method} ${url}`);

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token
          const refreshResult = await authService.refreshAuth();
          if (refreshResult.success) {
            // Retry with new token
            return this.apiRequest(url, options);
          } else {
            throw new Error('Authentication expired');
          }
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log(`✅ Bankroll API Response:`, data);
      return data;

    } catch (error) {
      console.error(`❌ Bankroll API Error:`, error);
      throw error;
    }
  }

  // Get all user bankrolls
  async getAllBankrolls(filters = {}) {
    try {
      let url = buildUrl(API_ENDPOINTS.BANKROLLS.LIST);
      
      // Add query parameters
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.active !== undefined) params.append('active', filters.active);
      if (filters.archived !== undefined) params.append('archived', filters.archived);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await this.apiRequest(url);
      return {
        success: true,
        bankrolls: response.data || [],
        pagination: response.pagination
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get specific bankroll
  async getBankroll(bankrollId) {
    try {
      const url = buildUrl(API_ENDPOINTS.BANKROLLS.GET, { id: bankrollId });
      const response = await this.apiRequest(url);
      
      return {
        success: true,
        bankroll: response.data
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Create new bankroll
  async createBankroll(bankrollData) {
    try {
      const url = buildUrl(API_ENDPOINTS.BANKROLLS.CREATE);
      const response = await this.apiRequest(url, {
        method: 'POST',
        body: JSON.stringify(bankrollData)
      });

      return {
        success: true,
        bankroll: response.data,
        message: response.message
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Update bankroll
  async updateBankroll(bankrollId, updateData) {
    try {
      const url = buildUrl(API_ENDPOINTS.BANKROLLS.UPDATE, { id: bankrollId });
      const response = await this.apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      return {
        success: true,
        bankroll: response.data,
        message: response.message
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Archive bankroll
  async archiveBankroll(bankrollId) {
    try {
      const url = buildUrl(API_ENDPOINTS.BANKROLLS.ARCHIVE, { id: bankrollId });
      const response = await this.apiRequest(url, {
        method: 'POST'
      });

      return {
        success: true,
        bankroll: response.data,
        message: response.message
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Delete bankroll (requires confirmation)
  async deleteBankroll(bankrollId) {
    try {
      const url = buildUrl(API_ENDPOINTS.BANKROLLS.DELETE, { id: bankrollId });
      const response = await this.apiRequest(url, {
        method: 'DELETE',
        body: JSON.stringify({ confirm: 'DELETE' })
      });

      return {
        success: true,
        message: response.message
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get bankroll statistics
  async getBankrollStats() {
    try {
      const url = buildUrl(API_ENDPOINTS.BANKROLLS.STATS);
      const response = await this.apiRequest(url);
      
      return {
        success: true,
        stats: response.data
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get bankroll sessions
  async getBankrollSessions(bankrollId, filters = {}) {
    try {
      let url = buildUrl(API_ENDPOINTS.BANKROLLS.SESSIONS, { id: bankrollId });
      
      // Add query parameters
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await this.apiRequest(url);
      return {
        success: true,
        sessions: response.data || [],
        pagination: response.pagination
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Add tag to bankroll
  async addBankrollTag(bankrollId, tag) {
    try {
      const url = buildUrl('/bankrolls/:id/tags', { id: bankrollId });
      const response = await this.apiRequest(url, {
        method: 'POST',
        body: JSON.stringify({ tag })
      });

      return {
        success: true,
        tags: response.data.tags,
        message: response.message
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Remove tag from bankroll
  async removeBankrollTag(bankrollId, tag) {
    try {
      const url = buildUrl('/bankrolls/:id/tags/:tag', { id: bankrollId, tag });
      const response = await this.apiRequest(url, {
        method: 'DELETE'
      });

      return {
        success: true,
        tags: response.data.tags,
        message: response.message
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Calculate bankroll progress
  calculateProgress(bankroll) {
    if (!bankroll.goal_amount || bankroll.goal_amount === 0) {
      return null;
    }
    
    const progress = (bankroll.current_amount / bankroll.goal_amount) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  // Calculate net profit
  calculateNetProfit(bankroll) {
    return bankroll.current_amount - bankroll.starting_amount;
  }

  // Calculate profit percentage
  calculateProfitPercentage(bankroll) {
    if (bankroll.starting_amount === 0) return 0;
    return ((bankroll.current_amount - bankroll.starting_amount) / bankroll.starting_amount) * 100;
  }

  // Format currency
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Get bankroll type display name
  getTypeDisplayName(type) {
    const typeNames = {
      'online': 'Online',
      'live': 'Live',
      'tournament': 'Tournament',
      'mixed': 'Mixed'
    };
    return typeNames[type] || type;
  }

  // Validate bankroll data
  validateBankrollData(data) {
    const errors = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Bankroll name is required');
    }

    if (!data.type || !['online', 'live', 'tournament', 'mixed'].includes(data.type)) {
      errors.push('Valid bankroll type is required');
    }

    if (!data.starting_amount || data.starting_amount <= 0) {
      errors.push('Starting amount must be greater than 0');
    }

    if (data.goal_amount && data.goal_amount <= data.starting_amount) {
      errors.push('Goal amount must be greater than starting amount');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
const bankrollService = new BankrollService();
export default bankrollService;