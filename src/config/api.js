// src/config/api.js
// API Configuration for Bankrollgod Multi-User Integration

const API_CONFIG = {
  // Backend URL
  BASE_URL: 'https://bankrollgod-backend.onrender.com/api',
  
  // Request configuration
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  ENVIRONMENT: process.env.NODE_ENV || 'production',
  
  // Feature flags
  FEATURES: {
    MULTI_USER: true,
    AUTHENTICATION: true,
    REAL_TIME: false,
    OFFLINE_MODE: false
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/me',
    UPDATE_PROFILE: '/auth/me',
    CHANGE_PASSWORD: '/auth/password',
    SETTINGS: '/auth/settings'
  },
  
  // Bankrolls
  BANKROLLS: {
    LIST: '/bankrolls',
    CREATE: '/bankrolls',
    GET: '/bankrolls/:id',
    UPDATE: '/bankrolls/:id',
    DELETE: '/bankrolls/:id',
    ARCHIVE: '/bankrolls/:id/archive',
    STATS: '/bankrolls/stats',
    SESSIONS: '/bankrolls/:id/sessions'
  },
  
  // Sessions
  SESSIONS: {
    LIST: '/sessions',
    CREATE: '/sessions',
    GET: '/sessions/:id',
    UPDATE: '/sessions/:id',
    COMPLETE: '/sessions/:id/complete',
    ACTIVE: '/sessions/active',
    GAMES: '/sessions/:id/games'
  },
  
  // Games
  GAMES: {
    LIST: '/games',
    CREATE: '/games',
    GET: '/games/:id',
    UPDATE: '/games/:id',
    COMPLETE: '/games/:id/complete',
    BUST: '/games/:id/bust',
    UPDATE_ENTRIES: '/games/:id/entries'
  },
  
  // System
  SYSTEM: {
    HEALTH: '/health',
    DOCS: '/docs'
  }
};

// Request headers helper
export const getAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  ...(token && { 'Authorization': `Bearer ${token}` })
});

// URL helper function
export const buildUrl = (endpoint, params = {}) => {
  let url = API_CONFIG.BASE_URL + endpoint;
  
  // Replace URL parameters
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  return url;
};

export default API_CONFIG;