import React, { useState, useEffect } from 'react';
import { sessionAPI } from '../services/api';
import SessionRecoveryModal from './SessionRecoveryModal';
import './ActiveSessionsPanel.css';

const formatCurrency = (amount, currency = 'EUR') => {
  const formatter = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return formatter.format(amount);
};

const formatDuration = (minutes) => {
  if (!minutes) return '0 Min';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes} Min`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
};

const ActiveSessionsPanel = ({ 
  onSessionSelected, 
  onRefreshNeeded,
  className = ''
}) => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  useEffect(() => {
    loadActiveSessions();
    
    // Refresh active sessions every 30 seconds
    const interval = setInterval(loadActiveSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveSessions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await sessionAPI.getActive();
      const sessions = response.data || [];
      
      console.log('📊 Active sessions loaded:', sessions.length);
      setActiveSessions(sessions);
    } catch (err) {
      console.error('Error loading active sessions:', err);
      setError(err.message || 'Fehler beim Laden der aktiven Sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setShowRecoveryModal(true);
  };

  const handleSessionResumed = (session) => {
    console.log('✅ Session resumed:', session);
    loadActiveSessions(); // Refresh the list
    
    if (onSessionSelected) {
      onSessionSelected(session);
    }
    
    if (onRefreshNeeded) {
      onRefreshNeeded();
    }
  };

  const handleSessionAction = async (action) => {
    // This will be handled by the parent component
    console.log('🔧 Session action:', action);
    loadActiveSessions(); // Refresh the list
    
    if (onRefreshNeeded) {
      onRefreshNeeded();
    }
  };

  const handleCompleteSession = async (sessionId) => {
    try {
      await sessionAPI.complete(sessionId);
      console.log('✅ Session completed:', sessionId);
      loadActiveSessions(); // Refresh the list
      
      if (onRefreshNeeded) {
        onRefreshNeeded();
      }
    } catch (err) {
      console.error('Error completing session:', err);
      setError(err.message || 'Fehler beim Beenden der Session');
    }
  };

  const handlePauseSession = async (sessionId) => {
    try {
      await sessionAPI.pause(sessionId);
      console.log('⏸️ Session paused:', sessionId);
      loadActiveSessions(); // Refresh the list
      
      if (onRefreshNeeded) {
        onRefreshNeeded();
      }
    } catch (err) {
      console.error('Error pausing session:', err);
      setError(err.message || 'Fehler beim Pausieren der Session');
    }
  };

  if (activeSessions.length === 0 && !isLoading && !error) {
    return null; // Don't show the panel if no active sessions
  }

  return (
    <div className={`active-sessions-panel ${className}`}>
      <div className="panel-header">
        <div className="panel-title">
          <div className="status-indicator">
            <div className="status-dot running"></div>
            <span>Aktive Sessions ({activeSessions.length})</span>
          </div>
          <button 
            className="refresh-btn"
            onClick={loadActiveSessions}
            disabled={isLoading}
            title="Aktualisieren"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              className={isLoading ? 'spinning' : ''}
            >
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="error-notice">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="sessions-list">
        {activeSessions.map(session => {
          // Calculate current duration
          const currentDuration = session.start_time ? 
            Math.round((new Date() - new Date(session.start_time)) / (1000 * 60)) : 0;
          
          const totalResult = (session.current_total_result || 0);
          const isProfit = totalResult >= 0;

          return (
            <div 
              key={session.id} 
              className="session-card"
              onClick={() => handleSessionClick(session)}
            >
              <div className="session-main">
                <div className="session-info">
                  <div className="session-name">
                    <span className="session-title">{session.name}</span>
                    <span className="bankroll-info">
                      {session.bankroll?.type === 'online' ? '💻' : '🏢'} {session.bankroll?.name}
                    </span>
                  </div>
                  
                  <div className="session-stats">
                    <div className="stat-item">
                      <span className="stat-label">Laufzeit:</span>
                      <span className="stat-value">{formatDuration(currentDuration)}</span>
                    </div>
                    
                    <div className="stat-item">
                      <span className="stat-label">Spiele:</span>
                      <span className="stat-value">{session.games?.length || 0}</span>
                    </div>
                    
                    <div className="stat-item">
                      <span className="stat-label">Ergebnis:</span>
                      <span className={`stat-value ${isProfit ? 'positive' : 'negative'}`}>
                        {isProfit ? '+' : ''}{formatCurrency(totalResult, session.bankroll?.currency)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="session-actions">
                  <button 
                    className="action-btn primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSessionClick(session);
                    }}
                    title="Session fortsetzen"
                  >
                    ▶️
                  </button>
                  
                  <button 
                    className="action-btn secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePauseSession(session.id);
                    }}
                    title="Session pausieren"
                  >
                    ⏸️
                  </button>
                  
                  <button 
                    className="action-btn tertiary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompleteSession(session.id);
                    }}
                    title="Session beenden"
                  >
                    ✅
                  </button>
                </div>
              </div>
              
              {session.location && (
                <div className="session-location">
                  📍 {session.location}
                </div>
              )}
              
              <div className="session-started">
                Gestartet: {new Date(session.start_time).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {isLoading && activeSessions.length === 0 && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Lade aktive Sessions...</span>
        </div>
      )}

      {/* Session Recovery Modal */}
      <SessionRecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => {
          setShowRecoveryModal(false);
          setSelectedSession(null);
        }}
        activeSession={selectedSession}
        bankroll={selectedSession?.bankroll}
        onSessionResumed={handleSessionResumed}
        onSessionAction={handleSessionAction}
      />
    </div>
  );
};

export default ActiveSessionsPanel;
