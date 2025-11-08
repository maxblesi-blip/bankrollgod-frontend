// Enhanced sessionAPI with persistence and recovery features
// Add these methods to your existing api.js file

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Enhanced sessionAPI object
export const sessionAPI = {
  // Existing methods (keep your current implementation)
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/sessions${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  get: async (id) => {
    const response = await fetch(`${BASE_URL}/sessions/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  create: async (sessionData) => {
    const response = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(sessionData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create session');
    }
    
    return data;
  },

  update: async (id, sessionData) => {
    const response = await fetch(`${BASE_URL}/sessions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(sessionData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/sessions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  complete: async (id) => {
    const response = await fetch(`${BASE_URL}/sessions/${id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  getGames: async (sessionId) => {
    const response = await fetch(`${BASE_URL}/sessions/${sessionId}/games`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  addGame: async (sessionId, gameData) => {
    const response = await fetch(`${BASE_URL}/sessions/${sessionId}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(gameData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // 🔧 NEW: Enhanced session management methods
  
  /**
   * Get all active sessions for the current user
   */
  getActive: async () => {
    const response = await fetch(`${BASE_URL}/sessions/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  /**
   * Check for active session conflicts for a specific bankroll
   */
  checkConflicts: async (bankrollId) => {
    const response = await fetch(`${BASE_URL}/sessions/check-conflicts/${bankrollId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  /**
   * Resume an active session
   */
  resume: async (sessionId) => {
    const response = await fetch(`${BASE_URL}/sessions/resume/${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  /**
   * Pause a running session
   */
  pause: async (sessionId) => {
    const response = await fetch(`${BASE_URL}/sessions/${sessionId}/pause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  /**
   * Create session with conflict resolution
   * @param {Object} sessionData - Session data
   * @param {string} actionOnConflict - 'pause_existing', 'complete_existing', or 'fail'
   */
  createWithConflictResolution: async (sessionData, actionOnConflict = 'fail') => {
    const dataWithAction = {
      ...sessionData,
      force_create: actionOnConflict !== 'fail',
      action_on_conflict: actionOnConflict
    };

    const response = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(dataWithAction)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Create a custom error with the response data for conflict handling
      const error = new Error(data.message || 'Failed to create session');
      error.code = data.error;
      error.data = data;
      throw error;
    }
    
    return data;
  },

  /**
   * Update session statistics from games
   */
  updateStats: async (sessionId) => {
    const response = await fetch(`${BASE_URL}/sessions/${sessionId}/update-stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
};

// 🔧 NEW: Session Recovery Helper Functions

/**
 * Check if there are any active sessions and show recovery modal if needed
 */
export const checkAndRecoverSessions = async () => {
  try {
    const response = await sessionAPI.getActive();
    const activeSessions = response.data || [];
    
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
      data: response.data
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
 * Session persistence utilities
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

// 🔧 NEW: Auto-recovery on app start
export const initializeSessionRecovery = async () => {
  try {
    console.log('🔄 Initializing session recovery...');
    
    // Check for active sessions on the server
    const serverSessions = await sessionAPI.getActive();
    const activeSessions = serverSessions.data || [];
    
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

export default {
  sessionAPI,
  checkAndRecoverSessions,
  createSessionWithRecovery,
  sessionPersistence,
  initializeSessionRecovery
};
