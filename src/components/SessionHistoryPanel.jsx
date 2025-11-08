// src/components/SessionHistoryPanel.jsx
import React, { useState, useEffect } from 'react';
import { sessionAPI, bankrollAPI } from '../services/api';
import './SessionHistoryPanel.css';

const formatCurrency = (amount, currency = 'EUR') => {
  const formatter = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return formatter.format(amount);
};

const formatTime = (minutes) => {
  if (!minutes) return '0h 0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const SessionHistoryPanel = ({ bankrollId, currency = 'EUR' }) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSession, setExpandedSession] = useState(null);
  const [expandedSessionGames, setExpandedSessionGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  
  const itemsPerPage = 10;

  useEffect(() => {
    loadSessions();
  }, [bankrollId]);

  const loadSessions = async () => {
    if (!bankrollId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Hole alle abgeschlossenen Sessions
      const data = await bankrollAPI.getSessions(bankrollId);  // ← RICHTIG (bankrollAPI statt sessionAPI)
      
      // Filtere nur completed Sessions
      const sessionsArray = Array.isArray(data) ? data : (data.sessions || []);
const completedSessions = sessionsArray.filter(s => s.status === 'completed');
      
      // Sortiere nach Datum (neueste zuerst)
      completedSessions.sort((a, b) => 
        new Date(b.start_time) - new Date(a.start_time)
      );
      
      setSessions(completedSessions);
    } catch (err) {
      setError(err);
      console.error('Error loading sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionGames = async (sessionId) => {
    setLoadingGames(true);
    try {
      const games = await sessionAPI.getGames(sessionId);
      setExpandedSessionGames(games || []);
    } catch (err) {
      console.error('Error loading session games:', err);
      setExpandedSessionGames([]);
    } finally {
      setLoadingGames(false);
    }
  };

  const toggleSession = async (sessionId) => {
    if (expandedSession === sessionId) {
      // Close expanded session
      setExpandedSession(null);
      setExpandedSessionGames([]);
    } else {
      // Open new session
      setExpandedSession(sessionId);
      await loadSessionGames(sessionId);
    }
  };

  // Pagination
  const totalPages = Math.ceil(sessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = sessions.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setExpandedSession(null); // Close expanded when changing page
      setExpandedSessionGames([]);
    }
  };

  if (isLoading) {
    return (
      <div className="session-history-panel">
        <h3>📊 Session History</h3>
        <div className="loading-state">Lade Sessions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="session-history-panel">
        <h3>📊 Session History</h3>
        <div className="error-state">
          ❌ Fehler beim Laden der Sessions
          <button onClick={loadSessions} className="btn-retry-small">
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="session-history-panel">
      <div className="history-header">
        <h3>📊 Session History</h3>
        <span className="total-sessions">{sessions.length} Sessions</span>
      </div>
      
      {sessions.length === 0 ? (
        <div className="empty-state">
          <p>Noch keine abgeschlossenen Sessions</p>
          <small>Starte und beende eine Session, um sie hier zu sehen</small>
        </div>
      ) : (
        <>
          <div className="sessions-table">
            {/* Table Header */}
            <div className="table-header">
              <div className="table-cell">Datum</div>
              <div className="table-cell">Session Name</div>
              <div className="table-cell">Dauer</div>
              <div className="table-cell">Games</div>
              <div className="table-cell">Ergebnis</div>
              <div className="table-cell">Aktionen</div>
            </div>
            
            {/* Table Rows */}
            {currentSessions.map(session => (
              <React.Fragment key={session.id}>
                <div 
                  className={`table-row ${expandedSession === session.id ? 'expanded' : ''}`}
                  onClick={() => toggleSession(session.id)}
                >
                  <div className="table-cell">
                    {formatDate(session.start_time)}
                  </div>
                  <div className="table-cell session-name-cell">
                    <span className="expand-icon">
                      {expandedSession === session.id ? '▼' : '▶'}
                    </span>
                    <span className="session-name">{session.name}</span>
                  </div>
                  <div className="table-cell">
                    {formatTime(session.duration_minutes)}
                  </div>
                  <div className="table-cell">
                    <span className="games-badge">{session.total_games || 0}</span>
                  </div>
                  <div className="table-cell">
                    <span className={`result-value ${(session.total_result || 0) >= 0 ? 'positive' : 'negative'}`}>
                      {(session.total_result || 0) >= 0 ? '+' : ''}
                      {formatCurrency(session.total_result || 0, currency)}
                    </span>
                  </div>
                  <div className="table-cell">
                    <button 
                      className="btn-details"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSession(session.id);
                      }}
                    >
                      {expandedSession === session.id ? 'Schließen' : 'Details'}
                    </button>
                  </div>
                </div>
                
                {/* Expandable Games Section */}
                {expandedSession === session.id && (
                  <div className="session-games-expanded">
                    <div className="games-header">
                      <h4>🎮 Games in dieser Session</h4>
                      <span className="games-count">
                        {expandedSessionGames.length} Game{expandedSessionGames.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    {loadingGames ? (
                      <div className="loading-games">Lade Games...</div>
                    ) : expandedSessionGames.length === 0 ? (
                      <div className="no-games">
                        <p>Keine Games in dieser Session</p>
                      </div>
                    ) : (
                      <div className="games-list">
                        {expandedSessionGames.map((game, index) => {
                          const totalCost = (parseFloat(game.buy_in) || 0) * (game.entries || 1);
                          const winnings = parseFloat(game.winnings) || 0;
                          const profit = winnings - totalCost;
                          
                          return (
                            <div key={game.id} className="game-detail-row">
                              <div className="game-number">#{index + 1}</div>
                              <div className="game-info">
                                <div className="game-name">
                                  <span className="game-icon">
                                    {game.type === 'tournament' ? '🏆' : 
                                     game.type === 'sng' ? '🎯' : 
                                     game.type === 'mtt' ? '🌟' : '💰'}
                                  </span>
                                  {game.name}
                                </div>
                                <div className="game-meta">
                                  <span className="game-type">{game.type}</span>
                                  <span className="buy-in">{formatCurrency(game.buy_in, currency)}</span>
                                  {game.entries > 1 && (
                                    <span className="entries">x{game.entries}</span>
                                  )}
                                  {winnings > 0 && (
                                    <span className="winnings">
                                      Gewinn: {formatCurrency(winnings, currency)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="game-result">
                                <span className={profit >= 0 ? 'profit' : 'loss'}>
                                  {profit >= 0 ? '+' : ''}{formatCurrency(profit, currency)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Zurück
              </button>
              
              <div className="pagination-info">
                Seite {currentPage} von {totalPages}
              </div>
              
              <button 
                className="pagination-btn"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Weiter →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SessionHistoryPanel;