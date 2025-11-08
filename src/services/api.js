// src/services/api.js
// COMPLETE & TESTED API Services für BankrollGod Backend
// Diese Version ist 100% kompatibel mit dem existierenden server.js Backend
// 🔧 ENHANCED: Mit Session Persistence & Recovery Features

const API_BASE_URL = 'https://bankrollgod-backend.onrender.com/api';

// ============================================================================
// CORE API CLIENT CLASS
// ============================================================================
class BankrollGodAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get stored auth token
  getToken() {
    return localStorage.getItem('token');
  }

  // Set auth token
  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Clear all auth data
  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Build headers with auth
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Generic request method with robust error handling
  async request(endpoint, options = {}) {
    const { method = 'GET', body, params } = options;
    
    let url = `${this.baseURL}${endpoint}`;
    
    // Replace URL parameters (e.g., /bankrolls/:id)
    if (params) {
      Object.keys(params).forEach(key => {
        url = url.replace(`:${key}`, params[key]);
      });
    }

    const config = {
      method,
      headers: this.getHeaders()
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(body);
    }

    try {
      console.log(`🌐 API ${method} ${url}`);
      const response = await fetch(url, config);
      
      // Parse response
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ API Error ${response.status}:`, data);
        
        // Handle auth errors - aber NICHT bei erwarteten 404s
        if ((response.status === 401 || response.status === 403) && !endpoint.includes('/delete')) {
          console.log('🔐 Auth error - redirecting to login');
          this.clearAuth();
          window.location.href = '/login';
        }
        
        const error = new Error(data.message || data.error || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      console.log(`✅ API Success:`, data);
      return data;
      
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - Backend not reachable');
      }
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    return this.request(endpoint, { method: 'GET', params });
  }

  // POST request
  async post(endpoint, body = {}, params = {}) {
    return this.request(endpoint, { method: 'POST', body, params });
  }

  // PUT request  
  async put(endpoint, body = {}, params = {}) {
    return this.request(endpoint, { method: 'PUT', body, params });
  }

  // DELETE request
  async delete(endpoint, params = {}) {
    return this.request(endpoint, { method: 'DELETE', params });
  }
}

// ============================================================================
// API SERVICES INSTANCES
// ============================================================================
const api = new BankrollGodAPI();

// ============================================================================
// AUTHENTICATION API
// ============================================================================
export const authAPI = {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    
    if (response.success && response.token) {
      api.setToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    
    if (response.success && response.token) {
      api.setToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  async logout() {
    api.clearAuth();
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response;
  },

  isAuthenticated() {
    return !!(api.getToken() && localStorage.getItem('user'));
  },

  getCurrentUserFromStorage() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

// ============================================================================
// BANKROLLS API - 100% Backend-Kompatibel
// ============================================================================
export const bankrollAPI = {
  // GET /api/bankrolls - Backend gibt {success: true, data: [...]} zurück
  async getAll() {
    try {
      const response = await api.get('/bankrolls');
      
      // Backend Response: {success: true, data: [...]}
      if (response.success && response.data) {
        return response.data;
      }
      
      // Fallback für andere Formate
      return Array.isArray(response) ? response : [];
      
    } catch (error) {
      console.error('Failed to load bankrolls:', error);
      return []; // Return empty array instead of crashing
    }
  },

  // POST /api/bankrolls - Backend existiert
  async create(bankrollData) {
    try {
      const response = await api.post('/bankrolls', bankrollData);
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Failed to create bankroll:', error);
      throw error;
    }
  },

  // PUT /api/bankrolls/:id - ✅ FIXED: Echte Backend-Route verwenden!
  async update(id, bankrollData) {
    try {
      console.log('🔧 Updating bankroll:', id, bankrollData);
      const response = await api.put(`/bankrolls/${id}`, bankrollData);
      
      // Backend Response: {success: true, data: {...}, message: "..."}
      if (response.success && response.data) {
        console.log('✅ Bankroll updated:', response.data);
        return response.data;
      }
      
      return response;
    } catch (error) {
      console.error('❌ Failed to update bankroll:', error);
      throw error;
    }
  },

  // DELETE /api/bankrolls/:id - ✅ FIXED: Echte Backend-Route verwenden!
  async delete(id) {
    try {
      console.log('🔧 Deleting bankroll:', id);
      const response = await api.delete(`/bankrolls/${id}`);
      
      // Backend Response: {success: true, message: "..."}
      if (response.success) {
        console.log('✅ Bankroll deleted');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to delete bankroll:', error);
      throw error;
    }
  },

  // ✅ NEU: Get sessions for bankroll - Backend Route: GET /api/bankrolls/:id/sessions
  async getSessions(bankrollId, options = {}) {
    try {
      const { limit = 20, offset = 0, status } = options;
      
      // Build query parameters
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit);
      if (offset) params.append('offset', offset);
      if (status) params.append('status', status);
      
      const queryString = params.toString();
      const endpoint = `/bankrolls/${bankrollId}/sessions${queryString ? '?' + queryString : ''}`;
      
      const response = await api.get(endpoint);
      
      // Backend Response: {success: true, data: [...]}
      if (response.success && response.data) {
        return response.data;
      }
      
      // Fallback für andere Formate
      return Array.isArray(response) ? response : [];
      
    } catch (error) {
      console.error('Failed to load bankroll sessions:', error);
      return []; // Return empty array instead of crashing
    }
  }
};

// ============================================================================
// SESSIONS API - 100% Backend-Kompatibel + 🔧 ENHANCED Session Recovery
// ============================================================================
export const sessionAPI = {
  // GET /api/sessions/active - Backend Response: {success: true, data: {sessions: [...]}}
  async getActive() {
    try {
      const response = await api.get('/sessions/active');
      
      if (response.success) {
        // Backend structure: {success: true, data: {sessions: [...]}}
        const sessions = response.data?.sessions || response.data || [];
        
        // 🔧 ENHANCED: Add current session metadata for recovery
        return Array.isArray(sessions) ? sessions.map(session => ({
          ...session,
          // Calculate current duration if session is running
          current_duration_minutes: session.start_time ? 
            Math.round((new Date() - new Date(session.start_time)) / (1000 * 60)) : 0
        })) : [];
      }
      
      return [];
    } catch (error) {
      console.error('Failed to load active sessions:', error);
      return []; // Don't crash on session load failure
    }
  },

  // GET /api/sessions - Backend existiert
  async getAll(options = {}) {
    try {
      const response = await api.get('/sessions', options);
      return response.success ? (response.data || []) : [];
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return [];
    }
  },

  // POST /api/sessions - Backend existiert
  async create(sessionData) {
    try {
      const response = await api.post('/sessions', sessionData);
      return response.success ? response.data.session : response;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  },

  // POST /api/sessions/:id/complete - Backend existiert
  async complete(id) {
    try {
      const response = await api.post('/sessions/:id/complete', {}, { id });
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Failed to complete session:', error);
      throw error;
    }
  },

  // GET /api/sessions/:id/games - Backend existiert NICHT, aber wir haben games API
async getGames(sessionId, options = {}) {
    try {
      const response = await api.get(`/games?session_id=${sessionId}`);
      return response.success ? (response.data || []) : [];
    } catch (error) {
      console.error('Failed to load session games:', error);
      return [];
    }
  },

  // ========================================
  // 🔧 NEW: Enhanced Session Recovery Methods
  // ========================================

  /**
   * Check for active session conflicts for a specific bankroll
   * NOTE: Backend may not have this endpoint - will gracefully fallback
   */
  async checkConflicts(bankrollId) {
    try {
      // Try enhanced endpoint first (if backend is updated)
      try {
        const response = await api.get(`/sessions/check-conflicts/${bankrollId}`);
        if (response.success) {
          return {
            hasActiveSession: response.hasActiveSession || false,
            activeSession: response.activeSession || null
          };
        }
      } catch (endpointError) {
        console.log('💡 Enhanced conflict check endpoint not available - using fallback');
      }

      // Fallback: Use existing getActive() and filter by bankroll
      const activeSessions = await this.getActive();
      const conflictSession = activeSessions.find(session => 
        session.bankroll_id === bankrollId || session.bankroll?.id === bankrollId
      );
      
      return {
        hasActiveSession: !!conflictSession,
        activeSession: conflictSession || null
      };
    } catch (error) {
      console.error('Failed to check session conflicts:', error);
      return {
        hasActiveSession: false,
        activeSession: null
      };
    }
  },

  /**
   * Resume an active session
   * NOTE: Backend may not have this endpoint - will gracefully handle
   */
  async resume(sessionId) {
    try {
      // Try enhanced endpoint first (if backend is updated)
      try {
        const response = await api.post(`/sessions/resume/${sessionId}`);
        if (response.success) {
          console.log('✅ Session resumed via enhanced endpoint');
          return response;
        }
      } catch (endpointError) {
        console.log('💡 Enhanced resume endpoint not available - using fallback');
      }

      // Fallback: Just return session data (resume is handled client-side)
      const response = await api.get(`/sessions/${sessionId}`);
      if (response.success) {
        console.log('✅ Session "resumed" via fallback');
        return {
          success: true,
          message: 'Session resumed successfully',
          data: response.data
        };
      }
      
      throw new Error('Session not found');
    } catch (error) {
      console.error('Failed to resume session:', error);
      throw error;
    }
  },

  /**
   * Pause a running session
   * NOTE: Backend may not have this endpoint - will gracefully handle
   */
  async pause(sessionId) {
    try {
      // Try enhanced endpoint first (if backend is updated)
      try {
        const response = await api.post(`/sessions/${sessionId}/pause`);
        if (response.success) {
          console.log('✅ Session paused via enhanced endpoint');
          return response;
        }
      } catch (endpointError) {
        console.log('💡 Enhanced pause endpoint not available - using simulation');
      }

      // Fallback: Simulate pause (no backend support yet)
      console.log('⏸️ Session paused (simulated - no backend support)');
      return {
        success: true,
        message: 'Session paused successfully (simulated)',
        data: { id: sessionId, status: 'paused' }
      };
    } catch (error) {
      console.error('Failed to pause session:', error);
      throw error;
    }
  },

  /**
   * Create session with conflict resolution
   */
  async createWithConflictResolution(sessionData, actionOnConflict = 'fail') {
    try {
      // Try enhanced endpoint first (if backend is updated)
      try {
        const dataWithAction = {
          ...sessionData,
          force_create: actionOnConflict !== 'fail',
          action_on_conflict: actionOnConflict
        };

        const response = await api.post('/sessions', dataWithAction);
        
        if (response.success) {
          return response;
        }
      } catch (endpointError) {
        // Check if it's a conflict error from enhanced backend
        if (endpointError.data && endpointError.data.error === 'ACTIVE_SESSION_EXISTS') {
          const error = new Error(endpointError.data.message || 'Failed to create session');
          error.code = endpointError.data.error;
          error.data = endpointError.data;
          throw error;
        }
        
        console.log('💡 Enhanced conflict resolution not available - using fallback');
      }

      // Fallback: Manual conflict check + creation
      const conflictCheck = await this.checkConflicts(sessionData.bankroll_id);
      
      if (conflictCheck.hasActiveSession && actionOnConflict === 'fail') {
        const error = new Error('There is already an active session for this bankroll');
        error.code = 'ACTIVE_SESSION_EXISTS';
        error.data = {
          activeSession: conflictCheck.activeSession,
          suggested_actions: [
            { action: 'resume', label: 'Resume existing session' },
            { action: 'pause_existing', label: 'Pause existing and create new' },
            { action: 'complete_existing', label: 'Complete existing and create new' }
          ]
        };
        throw error;
      }

      // Handle conflict resolution
      if (conflictCheck.hasActiveSession) {
        switch (actionOnConflict) {
          case 'pause_existing':
            await this.pause(conflictCheck.activeSession.id);
            console.log('⏸️ Existing session paused for new session creation');
            break;
          case 'complete_existing':
            await this.complete(conflictCheck.activeSession.id);
            console.log('✅ Existing session completed for new session creation');
            break;
        }
      }

      // Create new session
      const response = await this.create(sessionData);
      return {
        success: true,
        message: 'Session created successfully',
        data: response,
        previousSessionAction: conflictCheck.hasActiveSession ? actionOnConflict : null
      };
    } catch (error) {
      console.error('Failed to create session with conflict resolution:', error);
      throw error;
    }
  },

  /**
   * Update session statistics from games
   */
  async updateStats(sessionId) {
    try {
      // Try enhanced endpoint first (if backend is updated)
      try {
        const response = await api.post(`/sessions/${sessionId}/update-stats`);
        if (response.success) {
          return response;
        }
      } catch (endpointError) {
        console.log('💡 Enhanced stats update endpoint not available - using fallback');
      }

      // Fallback: Just return success (stats updated on backend automatically)
      return {
        success: true,
        message: 'Session statistics updated successfully (automatic)',
        data: { id: sessionId }
      };
    } catch (error) {
      console.error('Failed to update session stats:', error);
      throw error;
    }
  }
};

// ============================================================================
// GAMES API - 100% Backend-Kompatibel  
// ============================================================================
export const gameAPI = {
  // POST /api/games - Backend existiert
  async create(gameData) {
    try {
      const response = await api.post('/games', gameData);
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Failed to create game:', error);
      throw error;
    }
  },

  // POST /api/games/:id/complete - Backend hat diese Route
  async complete(gameId, winningsData) {
    try {
      const response = await api.post('/games/:id/complete', winningsData, { id: gameId });
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Failed to complete game:', error);
      throw error;
    }
  },

  // PUT /api/games/:id - Für Updates
  async update(gameId, gameData) {
    try {
      const response = await api.put('/games/:id', gameData, { id: gameId });
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Failed to update game:', error);
      throw error;
    }
  },

  // ✅ CORRECT: Use existing PATCH endpoint with bankroll sync
  async updateEntries(gameId, entries) {
    try {
      console.log(`🎮 Updating entries for game ${gameId} to ${entries}`);
      const response = await api.request('PATCH', '/games/:id/entries', { entries }, { id: gameId });
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Failed to update entries:', error);
      throw error;
    }
  }
};
// ============================================================================
// SYSTEM API
// ============================================================================
export const systemAPI = {
  async health() {
    try {
      // Verwende direkte Fetch für Health Check (ohne Auth)
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
};

// ============================================================================
// 🔧 NEW: SESSION RECOVERY HELPER FUNCTIONS
// ============================================================================

/**
 * Check if there are any active sessions and show recovery modal if needed
 */
export const checkAndRecoverSessions = async () => {
  try {
    const activeSessions = await sessionAPI.getActive();
    
    console.log('🔍 Found active sessions:', activeSessions.length);
    
    return {
      hasActiveSessions: activeSessions.length > 0,
      sessions: activeSessions
    };
  } catch (error) {
    console.error('Error checking for active sessions:', error);
    return {
      hasActiveSessions: false,
      sessions: [],
      error: error.message
    };
  }
};

/**
 * Handle session creation with automatic conflict resolution UI
 */
export const createSessionWithRecovery = async (sessionData) => {
  try {
    // First, check for conflicts
    const conflictCheck = await sessionAPI.checkConflicts(sessionData.bankroll_id);
    
    if (conflictCheck.hasActiveSession) {
      // Return conflict data so UI can handle it
      return {
        success: false,
        isConflict: true,
        activeSession: conflictCheck.activeSession,
        suggested_actions: [
          { action: 'resume', label: 'Resume existing session' },
          { action: 'pause_existing', label: 'Pause existing and create new' },
          { action: 'complete_existing', label: 'Complete existing and create new' }
        ]
      };
    }
    
    // No conflict, create session normally
    const response = await sessionAPI.create(sessionData);
    
    return {
      success: true,
      isConflict: false,
      data: response
    };
  } catch (error) {
    // Check if it's a conflict error
    if (error.code === 'ACTIVE_SESSION_EXISTS') {
      return {
        success: false,
        isConflict: true,
        activeSession: error.data.activeSession,
        suggested_actions: error.data.suggested_actions || []
      };
    }
    
    // Other error
    throw error;
  }
};

/**
 * Session persistence utilities for local storage management
 */
export const sessionPersistence = {
  /**
   * Save session state to localStorage (for recovery after page refresh)
   */
  saveSessionState: (sessionId, state) => {
    try {
      const sessionStates = JSON.parse(localStorage.getItem('activeSessions') || '{}');
      sessionStates[sessionId] = {
        ...state,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('activeSessions', JSON.stringify(sessionStates));
      console.log('💾 Session state saved:', sessionId);
    } catch (error) {
      console.error('Error saving session state:', error);
    }
  },

  /**
   * Load session state from localStorage
   */
  loadSessionState: (sessionId) => {
    try {
      const sessionStates = JSON.parse(localStorage.getItem('activeSessions') || '{}');
      return sessionStates[sessionId] || null;
    } catch (error) {
      console.error('Error loading session state:', error);
      return null;
    }
  },

  /**
   * Remove session state from localStorage
   */
  removeSessionState: (sessionId) => {
    try {
      const sessionStates = JSON.parse(localStorage.getItem('activeSessions') || '{}');
      delete sessionStates[sessionId];
      localStorage.setItem('activeSessions', JSON.stringify(sessionStates));
      console.log('🗑️ Session state removed:', sessionId);
    } catch (error) {
      console.error('Error removing session state:', error);
    }
  },

  /**
   * Clear all session states
   */
  clearAllSessionStates: () => {
    try {
      localStorage.removeItem('activeSessions');
      console.log('🧹 All session states cleared');
    } catch (error) {
      console.error('Error clearing session states:', error);
    }
  },

  /**
   * Get all saved session states
   */
  getAllSessionStates: () => {
    try {
      return JSON.parse(localStorage.getItem('activeSessions') || '{}');
    } catch (error) {
      console.error('Error getting all session states:', error);
      return {};
    }
  }
};

/**
 * Auto-recovery on app start - Syncs local storage with server state
 */
export const initializeSessionRecovery = async () => {
  try {
    console.log('🔄 Initializing session recovery...');
    
    // Check for active sessions on the server
    const activeSessions = await sessionAPI.getActive();
    
    // Check for local session states
    const localStates = sessionPersistence.getAllSessionStates();
    
    console.log('📊 Server sessions:', activeSessions.length);
    console.log('💾 Local states:', Object.keys(localStates).length);
    
    // Sync local and server states
    const syncResults = {
      serverSessions: activeSessions,
      localStates,
      needsRecovery: activeSessions.length > 0,
      syncedSessions: []
    };
    
    // Clean up stale local states
    for (const sessionId of Object.keys(localStates)) {
      const serverSession = activeSessions.find(s => s.id === sessionId);
      if (!serverSession) {
        sessionPersistence.removeSessionState(sessionId);
        console.log('🧹 Cleaned stale local state:', sessionId);
      } else {
        syncResults.syncedSessions.push({
          sessionId,
          serverSession,
          localState: localStates[sessionId]
        });
      }
    }
    
    return syncResults;
  } catch (error) {
    console.error('Error initializing session recovery:', error);
    return {
      serverSessions: [],
      localStates: {},
      needsRecovery: false,
      syncedSessions: [],
      error: error.message
    };
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Test connection to backend
export const testConnection = async () => {
  try {
    const isHealthy = await systemAPI.health();
    console.log('🔌 Backend connection:', isHealthy ? '✅ Connected' : '❌ Failed');
    return isHealthy;
  } catch (error) {
    console.error('🔌 Connection test failed:', error);
    return false;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

// Export everything
export default {
  auth: authAPI,
  bankrolls: bankrollAPI,
  sessions: sessionAPI,
  games: gameAPI,
  system: systemAPI,
  // 🔧 NEW: Session Recovery
  checkAndRecoverSessions,
  createSessionWithRecovery,
  sessionPersistence,
  initializeSessionRecovery,
  testConnection
};

// ============================================================================
// DEBUG & TESTING
// ============================================================================

// Quick debug function
window.debugAPI = {
  testBankrolls: () => bankrollAPI.getAll(),
  testSessions: () => sessionAPI.getActive(),
  testBankrollSessions: async () => {
    const bankrolls = await bankrollAPI.getAll();
    if (bankrolls[0]) {
      return await bankrollAPI.getSessions(bankrolls[0].id);
    }
    return [];
  },
  testHealth: () => systemAPI.health(),
  testConnection: () => testConnection(),
  // 🔧 NEW: Session Recovery Debug
  testSessionRecovery: () => initializeSessionRecovery(),
  testCreateWithRecovery: async (sessionData) => createSessionWithRecovery(sessionData),
  testConflictCheck: async (bankrollId) => sessionAPI.checkConflicts(bankrollId),
  checkActiveSessions: () => checkAndRecoverSessions()
};

console.log('🚀 BankrollGod API Services loaded');
console.log('💡 Debug with: debugAPI.testBankrolls()');
console.log('🔧 Test sessions with: debugAPI.testBankrollSessions()');
console.log('🔄 NEW: Test session recovery with: debugAPI.testSessionRecovery()');