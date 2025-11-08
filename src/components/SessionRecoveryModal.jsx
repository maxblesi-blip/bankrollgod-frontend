import React, { useState, useEffect } from 'react';
import { sessionAPI } from '../services/api';
import './SessionRecovery.css';

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

const SessionRecoveryModal = ({ 
  isOpen, 
  onClose, 
  activeSession, 
  bankroll,
  onSessionResumed,
  onSessionAction 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAction, setSelectedAction] = useState('resume');
  const [currentStats, setCurrentStats] = useState(null);

  useEffect(() => {
    if (isOpen && activeSession) {
      loadCurrentStats();
    }
  }, [isOpen, activeSession]);

  const loadCurrentStats = async () => {
    if (!activeSession?.id) return;
    
    try {
      // Load games to calculate current stats
      const gamesResponse = await sessionAPI.getGames(activeSession.id);
      const games = gamesResponse.data || [];
      
      let totalBuyIn = 0;
      let totalWinnings = 0;
      
      games.forEach(game => {
        totalBuyIn += parseFloat(game.buy_in || 0) * (game.entries || 1);
        totalWinnings += parseFloat(game.winnings || 0);
      });
      
      // Calculate current duration
      const currentDuration = activeSession.start_time ? 
        Math.round((new Date() - new Date(activeSession.start_time)) / (1000 * 60)) : 0;
      
      setCurrentStats({
        totalBuyIn,
        totalWinnings,
        totalResult: totalWinnings - totalBuyIn,
        gameCount: games.length,
        currentDuration
      });
    } catch (err) {
      console.error('Error loading current stats:', err);
    }
  };

  const handleResumeSession = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await sessionAPI.resume(activeSession.id);
      console.log('✅ Session resumed:', response);
      onSessionResumed(response.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Fehler beim Fortsetzen der Session');
      console.error('Error resuming session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewSession = async () => {
    if (!onSessionAction) {
      setError('Aktion nicht verfügbar');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await onSessionAction(selectedAction);
      onClose();
    } catch (err) {
      setError(err.message || 'Fehler beim Erstellen der neuen Session');
      console.error('Error creating new session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSession = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await sessionAPI.complete(activeSession.id);
      console.log('✅ Session completed');
      
      // Trigger callback to create new session
      if (onSessionAction) {
        await onSessionAction('create_new');
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Fehler beim Beenden der Session');
      console.error('Error completing session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !activeSession) return null;

  const startTime = activeSession.start_time ? new Date(activeSession.start_time) : null;

  return (
    <div className="modal-overlay session-recovery-overlay">
      <div className="modal-content session-recovery-modal">
        <div className="modal-header">
          <div className="session-recovery-title">
            <div className="session-status-indicator">
              <div className="status-dot running"></div>
              <span>Aktive Session gefunden</span>
            </div>
            <h2>Session fortsetzen oder neue erstellen?</h2>
          </div>
          <button className="modal-close" onClick={onClose} disabled={isLoading}>×</button>
        </div>

        {error && (
          <div className="error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="session-recovery-content">
          {/* Active Session Info */}
          <div className="active-session-info">
            <div className="session-header">
              <h3>{activeSession.name}</h3>
              <span className="session-type">
                {bankroll?.type === 'online' ? '💻' : '🏢'} {bankroll?.name}
              </span>
            </div>

            <div className="session-meta">
              <div className="meta-item">
                <span className="meta-label">Gestartet:</span>
                <span className="meta-value">
                  {startTime ? startTime.toLocaleString() : 'Unbekannt'}
                </span>
              </div>
              
              {currentStats && (
                <>
                  <div className="meta-item">
                    <span className="meta-label">Laufzeit:</span>
                    <span className="meta-value">
                      {formatDuration(currentStats.currentDuration)}
                    </span>
                  </div>
                  
                  <div className="meta-item">
                    <span className="meta-label">Spiele:</span>
                    <span className="meta-value">{currentStats.gameCount}</span>
                  </div>
                  
                  <div className="meta-item">
                    <span className="meta-label">Aktuelles Ergebnis:</span>
                    <span className={`meta-value ${currentStats.totalResult >= 0 ? 'positive' : 'negative'}`}>
                      {currentStats.totalResult >= 0 ? '+' : ''}
                      {formatCurrency(currentStats.totalResult, bankroll?.currency)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {activeSession.location && (
              <div className="session-location">
                📍 {activeSession.location}
              </div>
            )}
          </div>

          {/* Action Options */}
          <div className="action-options">
            <h4>Was möchtest du tun?</h4>
            
            <div className="action-grid">
              {/* Resume Option */}
              <button 
                className="action-option primary-option"
                onClick={handleResumeSession}
                disabled={isLoading}
              >
                <div className="action-icon">▶️</div>
                <div className="action-content">
                  <div className="action-title">Session fortsetzen</div>
                  <div className="action-description">
                    Bestehende Session weiterspielen
                  </div>
                </div>
                {isLoading && <div className="loading-spinner"></div>}
              </button>

              {/* Complete and New Option */}
              <button 
                className="action-option secondary-option"
                onClick={handleCompleteSession}
                disabled={isLoading}
              >
                <div className="action-icon">✅</div>
                <div className="action-content">
                  <div className="action-title">Session beenden & neue starten</div>
                  <div className="action-description">
                    Aktuelle Session abschließen und neue erstellen
                  </div>
                </div>
                {isLoading && <div className="loading-spinner"></div>}
              </button>
            </div>

            {/* Advanced Options */}
            <details className="advanced-options">
              <summary>Erweiterte Optionen</summary>
              
              <div className="advanced-grid">
                <label className="radio-option">
                  <input 
                    type="radio" 
                    name="action" 
                    value="pause_existing"
                    checked={selectedAction === 'pause_existing'}
                    onChange={(e) => setSelectedAction(e.target.value)}
                  />
                  <div className="radio-content">
                    <div className="radio-title">⏸️ Pausieren & neue Session</div>
                    <div className="radio-description">Aktuelle Session pausieren</div>
                  </div>
                </label>

                <button 
                  className="action-execute"
                  onClick={handleCreateNewSession}
                  disabled={isLoading || !selectedAction}
                >
                  {isLoading ? 'Wird ausgeführt...' : 'Ausführen'}
                </button>
              </div>
            </details>
          </div>

          {/* Warning */}
          <div className="warning-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <span>
              Pro Bankroll kann nur eine aktive Session gleichzeitig laufen
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionRecoveryModal;
