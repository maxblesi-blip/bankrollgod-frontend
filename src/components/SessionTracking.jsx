import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import './SessionTracking.css';

// Session Detail Modal Component
const SessionDetailModal = ({ session, onClose }) => {
  if (!session) return null;

  const isCashGame = session.type === 'cashgame';
  const profit = parseFloat(session.total_result) || 0;
  const isProfit = profit >= 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content session-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {isCashGame ? '💰 Cash Game Session' : '🏆 Tournament Session'}
          </h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="session-detail-body">
          {/* Main Info */}
          <div className="detail-section">
            <h3>Session Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Name</span>
                <span className="detail-value">{session.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Started</span>
                <span className="detail-value">
                  {new Date(session.start_time).toLocaleString()}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Location</span>
                <span className="detail-value">{session.location || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Duration</span>
                <span className="detail-value">
                  {session.duration_minutes ? `${session.duration_minutes} min` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Games List */}
          {session.games && session.games.length > 0 && (
            <div className="detail-section">
              <h3>Games ({session.games.length})</h3>
              <div className="games-list">
                {session.games.map(game => (
                  <div key={game.id} className="game-item">
                    <div className="game-name">{game.name}</div>
                    <div className="game-details">
                      <span>Buy-In: €{game.buy_in}</span>
                      {game.entries > 1 && <span> x{game.entries}</span>}
                      <span> | Winnings: €{game.winnings || 0}</span>
                      <span className={parseFloat(game.net_result) >= 0 ? 'profit' : 'loss'}>
                        {' '}| P/L: {parseFloat(game.net_result) >= 0 ? '+' : ''}€{game.net_result}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profit Display */}
          <div className="detail-section">
            <div className="profit-display">
              <span className="profit-label">Total Profit/Loss</span>
              <span className={`profit-amount ${isProfit ? 'profit' : 'loss'}`}>
                {isProfit ? '+' : ''}€{profit.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {session.notes && (
            <div className="detail-section">
              <h3>Notes</h3>
              <div className="notes-box">{session.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Active Session Component
const ActiveSession = ({ session, bankroll, onUpdate, onEnd }) => {
  const [games, setGames] = useState(session.games || []);
  const [showAddGame, setShowAddGame] = useState(false);
  const [currentBankroll, setCurrentBankroll] = useState(bankroll);
  const [gameForm, setGameForm] = useState({
    name: '',
    type: 'tournament',
    buy_in: '',
    entries: 1,
    winnings: 0,
    position_finished: '',
    total_players: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      refreshSessionData();
    }, 5000);

    return () => clearInterval(interval);
  }, [session.id]);

  const refreshSessionData = async () => {
    try {
      const response = await apiService.getSession(session.id, true);
      if (response.success) {
        setGames(response.data.games || []);
        // Also refresh bankroll
        const bankrollResponse = await apiService.getBankroll(session.bankroll_id);
        if (bankrollResponse.success) {
          setCurrentBankroll(bankrollResponse.data);
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  const calculateTotalInvested = () => {
    return games.reduce((sum, g) => {
      return sum + (parseFloat(g.buy_in) || 0) * (g.entries || 1);
    }, 0);
  };

  const calculateTotalWon = () => {
    return games.reduce((sum, g) => {
      return sum + (parseFloat(g.winnings) || 0);
    }, 0);
  };

  const calculateCurrentProfit = () => {
    return calculateTotalWon() - calculateTotalInvested();
  };

  const handleAddGame = async () => {
    if (!gameForm.name || !gameForm.buy_in) {
      alert('Bitte mindestens Namen und Buy-In eingeben');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.createGame({
        ...gameForm,
        session_id: session.id,
        status: gameForm.position_finished ? 'completed' : 'running'
      });

      if (response.success) {
        // Update bankroll from response
        if (response.data.bankroll) {
          setCurrentBankroll(response.data.bankroll);
        }
        
        // Refresh games list
        await refreshSessionData();
        
        setGameForm({
          name: '',
          type: 'tournament',
          buy_in: '',
          entries: 1,
          winnings: 0,
          position_finished: '',
          total_players: '',
          location: ''
        });
        setShowAddGame(false);
      }
    } catch (error) {
      alert('Fehler beim Hinzufügen des Spiels: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGame = async (gameId, updates) => {
    setLoading(true);
    try {
      const response = await apiService.updateGame(gameId, updates);
      
      if (response.success) {
        // Update bankroll from response
        if (response.data.bankroll) {
          setCurrentBankroll(response.data.bankroll);
        }
        
        // Refresh games list
        await refreshSessionData();
      }
    } catch (error) {
      alert('Fehler beim Aktualisieren: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGame = async (gameId) => {
    if (!window.confirm('Spiel wirklich löschen?')) return;

    setLoading(true);
    try {
      const response = await apiService.deleteGame(gameId);
      
      if (response.success) {
        // Update bankroll from response
        if (response.data.bankroll) {
          setCurrentBankroll(response.data.bankroll);
        }
        
        // Refresh games list
        await refreshSessionData();
      }
    } catch (error) {
      alert('Fehler beim Löschen: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (games.length === 0) {
      if (!window.confirm('Session ohne Spiele beenden?')) return;
    }

    setLoading(true);
    try {
      const response = await apiService.completeSession(session.id);
      if (response.success) {
        onEnd();
      }
    } catch (error) {
      alert('Fehler beim Beenden der Session: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const profitColor = calculateCurrentProfit() >= 0 ? 'profit' : 'loss';
  const realTimeBankroll = parseFloat(currentBankroll?.current_amount || 0);

  return (
    <div className="active-session-container">
      <div className="active-session-header">
        <div className="session-info">
          <h2>🎮 Aktive Session: {session.name}</h2>
          <span className="session-time">
            Gestartet: {new Date(session.start_time).toLocaleTimeString()}
          </span>
        </div>
        <button 
          className="btn-end-session" 
          onClick={handleEndSession}
          disabled={loading}
        >
          Session beenden
        </button>
      </div>

      <div className="active-session-stats">
        <div className="stat-card highlight">
          <span className="stat-label">💰 Live Bankroll</span>
          <span className="stat-value bankroll">€{realTimeBankroll.toFixed(2)}</span>
          <span className="stat-hint">Aktualisiert in Echtzeit</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Investiert</span>
          <span className="stat-value invested">-€{calculateTotalInvested().toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Gewonnen</span>
          <span className="stat-value won">+€{calculateTotalWon().toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Session P/L</span>
          <span className={`stat-value ${profitColor}`}>
            {calculateCurrentProfit() >= 0 ? '+' : ''}€{calculateCurrentProfit().toFixed(2)}
          </span>
        </div>
      </div>

      <div className="games-section">
        <div className="section-header">
          <h3>Spiele ({games.length})</h3>
          <button 
            className="btn-add-game"
            onClick={() => setShowAddGame(!showAddGame)}
            disabled={loading}
          >
            {showAddGame ? '− Cancel' : '+ Add Game'}
          </button>
        </div>

        {showAddGame && (
          <div className="add-game-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="Game Name *"
                value={gameForm.name}
                onChange={e => setGameForm({...gameForm, name: e.target.value})}
              />
              <select
                value={gameForm.type}
                onChange={e => setGameForm({...gameForm, type: e.target.value})}
              >
                <option value="tournament">Tournament</option>
                <option value="cashgame">Cash Game</option>
                <option value="sng">SNG</option>
                <option value="mtt">MTT</option>
              </select>
            </div>
            <div className="form-row">
              <input
                type="number"
                placeholder="Buy-In (€) *"
                value={gameForm.buy_in}
                onChange={e => setGameForm({...gameForm, buy_in: e.target.value})}
                step="0.01"
              />
              <input
                type="number"
                placeholder="Entries"
                value={gameForm.entries}
                onChange={e => setGameForm({...gameForm, entries: e.target.value})}
                min="1"
              />
            </div>
            <div className="form-row">
              <input
                type="number"
                placeholder="Winnings (€)"
                value={gameForm.winnings}
                onChange={e => setGameForm({...gameForm, winnings: e.target.value})}
                step="0.01"
              />
              <input
                type="text"
                placeholder="Location"
                value={gameForm.location}
                onChange={e => setGameForm({...gameForm, location: e.target.value})}
              />
            </div>
            {gameForm.type === 'tournament' && (
              <div className="form-row">
                <input
                  type="number"
                  placeholder="Position (optional)"
                  value={gameForm.position_finished}
                  onChange={e => setGameForm({...gameForm, position_finished: e.target.value})}
                />
                <input
                  type="number"
                  placeholder="Total Players"
                  value={gameForm.total_players}
                  onChange={e => setGameForm({...gameForm, total_players: e.target.value})}
                />
              </div>
            )}
            <button 
              className="btn-save" 
              onClick={handleAddGame}
              disabled={loading}
            >
              {loading ? 'Wird hinzugefügt...' : 'Spiel hinzufügen'}
            </button>
          </div>
        )}

        <div className="games-list">
          {games.length === 0 ? (
            <div className="empty-state">
              <p>Noch keine Spiele registriert</p>
              <p className="empty-hint">Klicke auf "+ Add Game" um zu starten</p>
            </div>
          ) : (
            games.map(game => (
              <GameCard
                key={game.id}
                game={game}
                onUpdate={handleUpdateGame}
                onRemove={handleRemoveGame}
                loading={loading}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Game Card Component
const GameCard = ({ game, onUpdate, onRemove, loading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: game.name,
    buy_in: game.buy_in,
    entries: game.entries,
    winnings: game.winnings || 0,
    position_finished: game.position_finished || '',
    total_players: game.total_players || ''
  });

  const totalCost = (parseFloat(game.buy_in) || 0) * (game.entries || 1);
  const winnings = parseFloat(game.winnings) || 0;
  const profit = winnings - totalCost;
  const isFinished = game.status === 'completed';

  const handleSave = () => {
    onUpdate(game.id, editForm);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="game-card editing">
        <div className="edit-form">
          <input
            type="text"
            value={editForm.name}
            onChange={e => setEditForm({...editForm, name: e.target.value})}
            placeholder="Name"
          />
          <div className="form-row-mini">
            <input
              type="number"
              value={editForm.buy_in}
              onChange={e => setEditForm({...editForm, buy_in: e.target.value})}
              placeholder="Buy-In"
              step="0.01"
            />
            <input
              type="number"
              value={editForm.entries}
              onChange={e => setEditForm({...editForm, entries: e.target.value})}
              placeholder="Entries"
              min="1"
            />
          </div>
          <input
            type="number"
            value={editForm.winnings}
            onChange={e => setEditForm({...editForm, winnings: e.target.value})}
            placeholder="Winnings"
            step="0.01"
          />
          <div className="edit-actions">
            <button className="btn-save-mini" onClick={handleSave} disabled={loading}>
              Save
            </button>
            <button className="btn-cancel-mini" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`game-card ${isFinished ? 'finished' : 'running'}`}>
      <div className="game-header">
        <div className="game-name">
          <span className="game-icon">
            {game.type === 'tournament' || game.type === 'mtt' ? '🏆' : '💰'}
          </span>
          <span>{game.name}</span>
          <span className={`status-badge ${isFinished ? 'finished' : 'running'}`}>
            {isFinished ? 'Finished' : 'Running'}
          </span>
        </div>
        <div className="game-actions">
          <button 
            className="btn-icon" 
            onClick={() => setIsEditing(true)}
            disabled={loading}
          >
            ✏️
          </button>
          <button 
            className="btn-icon" 
            onClick={() => onRemove(game.id)}
            disabled={loading}
          >
            🗑️
          </button>
        </div>
      </div>
      <div className="game-details">
        <div className="detail-row">
          <span>Buy-In:</span>
          <span>€{game.buy_in} x{game.entries || 1}</span>
        </div>
        {game.position_finished && (
          <div className="detail-row">
            <span>Position:</span>
            <span>#{game.position_finished}/{game.total_players || '?'}</span>
          </div>
        )}
        {winnings > 0 && (
          <div className="detail-row">
            <span>Winnings:</span>
            <span className="won">€{winnings.toFixed(2)}</span>
          </div>
        )}
        <div className="detail-row profit-row">
          <span>P/L:</span>
          <span className={profit >= 0 ? 'profit' : 'loss'}>
            {profit >= 0 ? '+' : ''}€{profit.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Main Sessions Page Component
const SessionsPage = ({ bankrollId }) => {
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [bankroll, setBankroll] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [bankrollId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load bankroll
      const bankrollResponse = await apiService.getBankroll(bankrollId);
      if (bankrollResponse.success) {
        setBankroll(bankrollResponse.data);
      }

      // Load sessions
      const sessionsResponse = await apiService.getSessions(bankrollId);
      if (sessionsResponse.success) {
        setSessions(sessionsResponse.data);
      }

      // Check for active session
      const activeResponse = await apiService.getActiveSessions();
      if (activeResponse.success && activeResponse.data.length > 0) {
        const activeBankrollSession = activeResponse.data.find(
          s => s.bankroll_id === bankrollId
        );
        if (activeBankrollSession) {
          const sessionDetail = await apiService.getSession(activeBankrollSession.id, true);
          if (sessionDetail.success) {
            setActiveSession(sessionDetail.data);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    try {
      const response = await apiService.createSession({
        name: `Session ${new Date().toLocaleDateString()}`,
        bankroll_id: bankrollId,
        location: 'Online',
        session_type: 'Tournament Grind'
      });

      if (response.success) {
        setActiveSession(response.data);
      }
    } catch (error) {
      alert('Fehler beim Starten der Session: ' + error.message);
    }
  };

  const endSession = async () => {
    await loadData(); // Reload all data
    setActiveSession(null);
  };

  if (loading) {
    return (
      <div className="sessions-page">
        <div className="loading-state">Lädt...</div>
      </div>
    );
  }

  if (activeSession) {
    return (
      <div className="sessions-page">
        <div className="page-header">
          <h1>Sessions</h1>
        </div>
        <ActiveSession 
          session={activeSession}
          bankroll={bankroll}
          onUpdate={(data) => setActiveSession(data)}
          onEnd={endSession}
        />
      </div>
    );
  }

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalProfit = completedSessions.reduce((sum, s) => sum + parseFloat(s.total_result || 0), 0);
  const avgSession = completedSessions.length > 0 ? totalProfit / completedSessions.length : 0;
  const winRate = completedSessions.length > 0 
    ? (completedSessions.filter(s => parseFloat(s.total_result) > 0).length / completedSessions.length) * 100 
    : 0;

  return (
    <div className="sessions-page">
      <div className="page-header">
        <h1>Sessions</h1>
        <button className="btn-primary" onClick={startSession}>
          🎮 Session starten
        </button>
      </div>

      <div className="sessions-stats">
        <div className="stat-box">
          <h3>Current Bankroll</h3>
          <p className="stat-number">€{parseFloat(bankroll?.current_amount || 0).toFixed(2)}</p>
        </div>
        <div className="stat-box">
          <h3>Gesamt Sessions</h3>
          <p className="stat-number">{completedSessions.length}</p>
        </div>
        <div className="stat-box">
          <h3>Gesamt Profit</h3>
          <p className={`stat-number ${totalProfit >= 0 ? 'profit' : 'loss'}`}>
            {totalProfit >= 0 ? '+' : ''}€{totalProfit.toFixed(2)}
          </p>
        </div>
        <div className="stat-box">
          <h3>Avg. Session</h3>
          <p className={`stat-number ${avgSession >= 0 ? 'profit' : 'loss'}`}>
            {avgSession >= 0 ? '+' : ''}€{avgSession.toFixed(2)}
          </p>
        </div>
        <div className="stat-box">
          <h3>Win Rate</h3>
          <p className="stat-number">{winRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="sessions-list">
        <h2>Session History</h2>
        {completedSessions.map(session => (
          <div 
            key={session.id} 
            className="session-card"
            onClick={() => setSelectedSession(session)}
          >
            <div className="session-type">
              🏆 {session.session_type || 'Session'}
            </div>
            <div className="session-details">
              <div className="session-main">
                <span className="session-date">
                  {new Date(session.start_time).toLocaleString()}
                </span>
                <span className="session-name">{session.name}</span>
                <span className="session-location">{session.location}</span>
              </div>
              <div className="session-stats">
                <span className="game-count">
                  {session.total_games} {session.total_games === 1 ? 'Spiel' : 'Spiele'}
                </span>
                {session.duration_minutes && (
                  <span className="duration">{session.duration_minutes} min</span>
                )}
              </div>
            </div>
            <div className={`session-profit ${parseFloat(session.total_result) >= 0 ? 'positive' : 'negative'}`}>
              {parseFloat(session.total_result) >= 0 ? '+' : ''}€{parseFloat(session.total_result).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {selectedSession && (
        <SessionDetailModal 
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
};

export default SessionsPage;