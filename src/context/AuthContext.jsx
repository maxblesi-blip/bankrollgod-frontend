// src/context/AuthContext.js
// Authentication Context for Option B Multi-User Integration
// ✅ FIXED: Compatible with new api.js structure

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, testConnection } from '../services/api';
import { Navigate } from 'react-router-dom';

// Create Auth Context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper functions (moved from api.js)
const initializeAuth = () => {
  // Check if token exists in localStorage
  const token = localStorage.getItem('token');
  return !!token;
};

const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  // ✅ DEBUG: Schauen was wirklich passiert
  console.log('🔧 isAuthenticated DEBUG - Token exists:', !!token);
  console.log('🔧 isAuthenticated DEBUG - User exists:', !!user);
  console.log('🔧 isAuthenticated DEBUG - Token value:', token?.substring(0, 50));
  console.log('🔧 isAuthenticated DEBUG - User value:', user?.substring(0, 100));
  
  const result = !!(token && user);
  console.log('🔧 isAuthenticated DEBUG - Final result:', result);
  
  return result;
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  console.log('🔧 getCurrentUser DEBUG - Raw user string:', userStr);
  
  if (userStr) {
    try {
      const parsed = JSON.parse(userStr);
      console.log('🔧 getCurrentUser DEBUG - Parsed user:', parsed);
      return parsed;
    } catch (error) {
      console.error('🔧 getCurrentUser DEBUG - Parse error:', error);
      return null;
    }
  }
  console.log('🔧 getCurrentUser DEBUG - No user string found');
  return null;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ Changed to false - no loading screens
  const [backendConnected, setBackendConnected] = useState(false);

  // Initialize authentication state
  useEffect(() => {
    initializeAuthState();
  }, []);

  const initializeAuthState = async () => {
  console.log('🔧 DEBUG 1 - initializeAuthState started');
  
  try {
    // Test backend connection
    console.log('🔧 DEBUG 2 - Testing backend connection');
    const connectionTest = await testConnection();
    setBackendConnected(connectionTest);
    console.log('🔧 DEBUG 3 - Backend connected:', connectionTest);
    
    if (!connectionTest) {
      console.warn('Backend connection failed');
      return;
    }

    // Initialize auth tokens
    console.log('🔧 DEBUG 4 - Calling initializeAuth()');
    initializeAuth();
    
    // Check if user is already authenticated
    console.log('🔧 DEBUG 5 - Checking isAuthenticated():', isAuthenticated());
    if (isAuthenticated()) {
      const currentUser = getCurrentUser();
      console.log('🔧 DEBUG 6 - Current user from localStorage:', currentUser);
      
      // Verify token with backend
      try {
  console.log('🔧 DEBUG 7 - Calling authAPI.getCurrentUser()');
  const profileResult = await authAPI.getCurrentUser();
  console.log('🔧 DEBUG 8 - Profile result:', profileResult);
  
  // ✅ FIX: Check correct API response structure
  if (profileResult && profileResult.success && profileResult.user) {
    console.log('🔧 DEBUG 9 - Setting user:', profileResult.user);
    setUser(profileResult.user);  // Set the USER object, not the whole response
  } else {
    console.log('🔧 DEBUG 10 - Profile failed, clearing auth');
    // Token is invalid, clear auth
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }
} catch (error) {
        console.error('🔧 DEBUG 11 - Token verification failed:', error);
        // Try to use cached user data
        if (currentUser) {
          console.log('🔧 DEBUG 12 - Using cached user');
          setUser(currentUser);
        } else {
          console.log('🔧 DEBUG 13 - No cached user, clearing');
          setUser(null);
        }
      }
    } else {
      console.log('🔧 DEBUG 14 - Not authenticated, clearing user');
      setUser(null);
    }
  } catch (error) {
    console.error('🔧 DEBUG 15 - Auth initialization error:', error);
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      setUser(null);
    }
  } finally {
    console.log('🔧 DEBUG 16 - Setting loading to false');
    setLoading(false);
  }
};

  // ✅ FIXED Login function - Returns proper error objects
  const login = async (credentials) => {
    try {
      setLoading(true);
      
      const result = await authAPI.login(credentials);
      
      console.log('🔧 AUTH DEBUG - Login result:', result);
      
      if (result.success || result.token) {
        const userData = result.user;
        const token = result.token;
        
        console.log('🔧 AUTH DEBUG - User data:', userData);
        console.log('🔧 AUTH DEBUG - Token:', token);
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        // ✅ Return success
        return { success: true, user: userData };
      } else {
        // ✅ Return error when login fails
        return { 
          success: false, 
          error: result.message || 'Login fehlgeschlagen. Bitte überprüfe deine Anmeldedaten.' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Verbindung zum Server fehlgeschlagen. Bitte versuche es später erneut.' 
      };
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED Register function - Returns proper error objects
  const register = async (userData) => {
    try {
      setLoading(true);
      
      const result = await authAPI.register(userData);
      
      console.log('🔧 REGISTER DEBUG - Register result:', result);
      
      if (result.success || result.token) {
        const user = result.user;
        const token = result.token;
        
        console.log('🔧 REGISTER DEBUG - User:', user);
        console.log('🔧 REGISTER DEBUG - Token:', token);
        
        // Auto-login after successful registration
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        
        // ✅ Return success
        return { success: true, user: user };
      } else {
        // ✅ Return error when registration fails
        return { 
          success: false, 
          error: result.message || 'Registrierung fehlgeschlagen. Bitte versuche es erneut.' 
        };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { 
        success: false, 
        error: error.message || 'Verbindung zum Server fehlgeschlagen. Bitte versuche es später erneut.' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await authAPI.logout();
      
      // Clear all auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if backend call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const result = await authAPI.getCurrentUser();
      
      if (result.success || result.user) {
        const updatedUser = result.user;
        
        console.log('🔧 UPDATE DEBUG - Old user:', user);
        console.log('🔧 UPDATE DEBUG - New user:', updatedUser);
        
        // State aktualisieren
        setUser(updatedUser);
        
        // LocalStorage aktualisieren
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        console.log('🔧 UPDATE DEBUG - Updated localStorage:', JSON.parse(localStorage.getItem('user')));
        
        return { success: true, user: updatedUser };
      } else {
        return { 
          success: false, 
          error: result.message || 'Profil-Update fehlgeschlagen.' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Verbindung fehlgeschlagen.' 
      };
    }
  };

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      const result = await testConnection();
      setBackendConnected(result);
      return { success: result };
    } catch (error) {
      setBackendConnected(false);
      return { success: false, error: error.message };
    }
  };

  // Check if user is authenticated
  const checkAuthenticated = () => {
    return !!(user && isAuthenticated());
  };

  // Get current user
  const getUser = () => {
    return user;
  };

  // Context value
  const value = {
    // State
    user,
    loading,
    backendConnected,
    
    // Functions
    login,
    register,
    logout,
    updateProfile,
    testBackendConnection,
    initializeAuthState,
    
    // Getters
    isAuthenticated: checkAuthenticated,
    getCurrentUser: getUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ SICHER: Keine Experimente mit Auth-Security
export const ProtectedRoute = ({ children, fallback = null }) => {
  const { isAuthenticated, loading } = useAuth();

  // ✅ SICHER: Während loading → zeige NICHTS
  if (loading) {
    return (
      <div className="loading-screen">
        <div>Loading...</div>
      </div>
    );
  }

  // ✅ SICHER: Nicht authentifiziert → redirect sofort  
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  // ✅ SICHER: Nur authentifizierte User sehen Content
  return children;
};

// Backend Connection Status Component
export const BackendStatus = () => {
  const { backendConnected, testBackendConnection } = useAuth();

  if (backendConnected) {
    return (
      <div className="backend-status connected">
        <div className="status-indicator green"></div>
        <span>Connected</span>
      </div>
    );
  }

  return (
    <div className="backend-status disconnected">
      <div className="status-indicator red"></div>
      <span>Backend offline</span>
      <button 
        onClick={testBackendConnection}
        className="reconnect-btn"
      >
        Reconnect
      </button>
    </div>
  );
};

export default AuthContext;