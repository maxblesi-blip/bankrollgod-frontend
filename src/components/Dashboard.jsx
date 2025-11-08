import React, { useState, useEffect, useRef } from 'react';
import './Dashboard.css';
import './BankrollModals.css';
import './Statistics.css';
import { 
  bankrollAPI, 
  sessionAPI, 
  gameAPI, 
  testConnection,
  checkAndRecoverSessions,         // 🔧 NEU
  createSessionWithRecovery,       // 🔧 NEU
  sessionPersistence,              // 🔧 NEU
  initializeSessionRecovery        // 🔧 NEU
} from '../services/api';
import EndGameModal from './modals/EndGameModal';
import SessionHistoryPanel from './SessionHistoryPanel';
import Sessions from './Sessions';  // ← NEU HINZUFÜGEN
import Statistics from './Statistics';
import SessionRecoveryModal from './SessionRecoveryModal';

// ============================================================================
// CURRENCY UTILITIES
// ============================================================================
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
];

const formatCurrency = (amount, currency = 'USD') => {
  const curr = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  const formatted = parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${curr.symbol}${formatted}`;
};

// ============================================================================
// CREATE BANKROLL MODAL
// ============================================================================
const CreateBankrollModal = ({ isOpen, onClose, onBankrollCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'online',
    starting_amount: '',
    goal_amount: '',
    currency: 'USD'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Bitte gib einen Namen ein');
      return;
    }
    
    const startingAmount = parseFloat(formData.starting_amount);
    if (isNaN(startingAmount) || startingAmount <= 0) {
      setError('Bitte gib einen gültigen Startbetrag ein');
      return;
    }
    
    // ✅ NEUE VALIDIERUNG: Maximum für Beträge
    const MAX_AMOUNT = 10000000; // 10 Millionen
    
    if (startingAmount > MAX_AMOUNT) {
      setError(`Startbetrag darf ${formatCurrency(MAX_AMOUNT, formData.currency)} nicht überschreiten`);
      return;
    }
    
    // Validierung für goal_amount
    if (formData.goal_amount) {
      const goalAmount = parseFloat(formData.goal_amount);
      
      if (isNaN(goalAmount)) {
        setError('Bitte gib einen gültigen Zielbetrag ein');
        return;
      }
      
      if (goalAmount > MAX_AMOUNT) {
        setError(`Zielbetrag darf ${formatCurrency(MAX_AMOUNT, formData.currency)} nicht überschreiten`);
        return;
      }
      
      if (goalAmount <= startingAmount) {
        setError('Zielbetrag muss größer als der Startbetrag sein');
        return;
      }
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const bankrollData = {
        name: formData.name.trim(),
        type: formData.type,
        starting_amount: startingAmount,
        current_amount: startingAmount, // Start with starting amount
        goal_amount: formData.goal_amount ? parseFloat(formData.goal_amount) : null,
        currency: formData.currency
      };
      
      console.log('🔧 Creating bankroll:', bankrollData);
      const newBankroll = await bankrollAPI.create(bankrollData);
      console.log('✅ Bankroll created:', newBankroll);
      
      // Reset form
      setFormData({
        name: '',
        type: 'online',
        starting_amount: '',
        goal_amount: '',
        currency: 'USD'
      });
      
      onBankrollCreated(newBankroll);
      onClose();
      
    } catch (err) {
      setError(err.message || 'Fehler beim Erstellen der Bankroll');
      console.error('❌ Error creating bankroll:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-bankroll-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✨ Neue Bankroll erstellen</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        {error && (
          <div className="error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bankroll-form">
          <div className="form-group">
            <label>Bankroll Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="z.B. PokerStars Main Bankroll"
              required
              disabled={isSubmitting}
              autoFocus
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Typ *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="online">💻 Online Poker</option>
                <option value="live">🏢 Live Poker</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Währung *</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                {CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.code} - {curr.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
              <label>Startbetrag * ({CURRENCIES.find(c => c.code === formData.currency)?.symbol})</label>
              <input
                type="number"
                name="starting_amount"
                value={formData.starting_amount}
                onChange={handleChange}
                placeholder="z.B. 1000.00"
                min="0"
                max="10000000"
                step="0.01"
                required
                disabled={isSubmitting}
              />
              <span className="input-hint">Max: {formatCurrency(10000000, formData.currency)}</span>
            </div>
            
           <div className="form-group">
              <label>Zielbetrag (optional) ({CURRENCIES.find(c => c.code === formData.currency)?.symbol})</label>
              <input
                type="number"
                name="goal_amount"
                value={formData.goal_amount}
                onChange={handleChange}
                placeholder="z.B. 5000.00"
                min="0"
                max="10000000"
                step="0.01"
                disabled={isSubmitting}
              />
              <span className="input-hint">Max: {formatCurrency(10000000, formData.currency)}</span>
            </div>
          
          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-cancel"
              disabled={isSubmitting}
            >
              Abbrechen
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-small"></span>
                  Wird erstellt...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Bankroll erstellen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// EDIT BANKROLL MODAL
// ============================================================================
const EditBankrollModal = ({ isOpen, onClose, bankroll, onBankrollUpdated }) => {
  const [formData, setFormData] = useState({
    name: bankroll?.name || '',
    goal_amount: bankroll?.goal_amount || '',
    currency: bankroll?.currency || 'USD'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (bankroll) {
      setFormData({
        name: bankroll.name || '',
        goal_amount: bankroll.goal_amount || '',
        currency: bankroll.currency || 'USD'
      });
    }
  }, [bankroll]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Bitte gib einen Namen ein');
      return;
    }
    
    // ✅ Validierung für goal_amount
    if (formData.goal_amount) {
      const goalAmount = parseFloat(formData.goal_amount);
      const MAX_AMOUNT = 10000000;
      
      if (isNaN(goalAmount)) {
        setError('Bitte gib einen gültigen Zielbetrag ein');
        return;
      }
      
      if (goalAmount > MAX_AMOUNT) {
        setError(`Zielbetrag darf ${formatCurrency(MAX_AMOUNT, formData.currency)} nicht überschreiten`);
        return;
      }
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const updateData = {
        name: formData.name.trim(),
        goal_amount: formData.goal_amount ? parseFloat(formData.goal_amount) : null,
        currency: formData.currency
      };
      
      console.log('🔧 Updating bankroll:', bankroll.id, updateData);
      const updatedBankroll = await bankrollAPI.update(bankroll.id, updateData);
      console.log('✅ Bankroll updated:', updatedBankroll);
      
      onBankrollUpdated(updatedBankroll);
      onClose();
      
    } catch (err) {
      setError(err.message || 'Fehler beim Aktualisieren der Bankroll');
      console.error('❌ Error updating bankroll:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !bankroll) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-bankroll-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ Bankroll bearbeiten</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        {error && (
          <div className="error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bankroll-form">
          <div className="form-group">
            <label>Bankroll Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="z.B. PokerStars Main"
              required
              disabled={isSubmitting}
              autoFocus
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Währung</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                {CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.code} - {curr.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Zielbetrag (optional) ({CURRENCIES.find(c => c.code === formData.currency)?.symbol})</label>
              <input
                type="number"
                name="goal_amount"
                value={formData.goal_amount}
                onChange={handleChange}
                placeholder="z.B. 5000.00"
                min="0"
                step="0.01"
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="info-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <span>Typ und Startbetrag können nicht geändert werden</span>
          </div>
          
          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-cancel"
              disabled={isSubmitting}
            >
              Abbrechen
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-small"></span>
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                  </svg>
                  Speichern
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// DELETE CONFIRMATION MODAL
// ============================================================================
const DeleteConfirmModal = ({ isOpen, onClose, bankroll, onConfirmDelete }) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (confirmText !== bankroll?.name) {
      setError('Der Name stimmt nicht überein');
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    try {
      console.log('🔧 Deleting bankroll:', bankroll.id);
      await bankrollAPI.delete(bankroll.id);
      console.log('✅ Bankroll deleted');
      
      onConfirmDelete(bankroll.id);
      setConfirmText('');
      onClose();
    } catch (err) {
      setError(err.message || 'Fehler beim Löschen der Bankroll');
      console.error('❌ Error deleting bankroll:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setError(null);
    onClose();
  };

  if (!isOpen || !bankroll) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header danger">
          <h2>⚠️ Bankroll löschen</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="warning-box">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <p className="warning-text">
              <strong>Achtung!</strong> Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>
          
          <p className="delete-message">
            Du bist dabei, die Bankroll <strong>"{bankroll.name}"</strong> zu löschen.
            <br />
            Alle zugehörigen <strong>Sessions</strong> und <strong>Games</strong> werden ebenfalls gelöscht.
          </p>
          
          {error && (
            <div className="error-banner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          <div className="form-group">
            <label>Gib den Namen der Bankroll ein um zu bestätigen:</label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                if (error) setError(null);
              }}
              placeholder={bankroll.name}
              disabled={isDeleting}
              className={confirmText && confirmText !== bankroll.name ? 'error' : ''}
            />
            {confirmText && confirmText !== bankroll.name && (
              <span className="input-error">Der Name stimmt nicht überein</span>
            )}
          </div>
        </div>
        
        <div className="modal-actions">
          <button 
            onClick={handleClose} 
            className="btn-cancel"
            disabled={isDeleting}
          >
            Abbrechen
          </button>
          <button 
            onClick={handleDelete} 
            className="btn-delete"
            disabled={isDeleting || confirmText !== bankroll.name}
          >
            {isDeleting ? (
              <>
                <span className="spinner-small"></span>
                Wird gelöscht...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                Unwiderruflich löschen
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ENHANCED GAME MANAGER (mit Winnings Modal)
// ============================================================================
const GameManager = ({ session, onGameUpdate, sessionActive, currency = 'USD' }) => {
  const [showGameForm, setShowGameForm] = useState(false);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameType, setGameType] = useState('tournament');
  const [gameName, setGameName] = useState('');
  const [buyIn, setBuyIn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const gameTypeOptions = [
    {
      value: 'tournament',
      icon: '🏆',
      label: 'Tournament',
      description: 'Multi-table tournament'
    },
    {
      value: 'cashgame',
      icon: '💰',
      label: 'Cash Game',
      description: 'Ring game session'
    },
    {
      value: 'sng',
      icon: '🎯',
      label: 'Sit & Go',
      description: 'Single table tournament'
    },
    {
      value: 'mtt',
      icon: '🌟',
      label: 'MTT',
      description: 'Multi-table tournament'
    }
  ];

const loadGames = async () => {
  if (!session?.id) return;
  
  setIsLoading(true);
  setError(null);
  
  try {
    console.log('🔧 Loading games for session:', session.id);
    
    // 🎯 Try backend first (if endpoints are fixed)
    try {
      const sessionGames = await sessionAPI.getGames(session.id);
      console.log('✅ Games loaded from backend:', sessionGames.length);
      setGames(sessionGames);
      return;
    } catch (backendError) {
      console.log('⚠️ Backend games endpoint failed, using local game management');
      
      // 🛡️ FALLBACK: Local game state management
      // Don't setGames([]) - keep existing games
      console.log('💡 Keeping existing games and managing locally');
    }
    
  } catch (err) {
    console.log('⚠️ Games loading failed:', err.message);
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    loadGames();
  }, [session?.id]);

  const handleStartGame = async () => {
  if (!gameName.trim() || !buyIn.trim() || !session?.id) return;
  
  const buyInAmount = parseFloat(buyIn);
  if (isNaN(buyInAmount) || buyInAmount <= 0) return;
  
  setIsSubmitting(true);
  
  try {
    const gameData = {
      session_id: session.id,
      name: gameName,
      type: gameType,
      buy_in: buyInAmount,
      entries: gameType === 'cashgame' ? 1 : 1
    };
    
    const result = await gameAPI.create(gameData);
    
    console.log('✅ Game created with bankroll update:', result);
    
    // Update local games list
    setGames(prev => [result.game || result, ...prev]);
    
    // Reset form
    setGameName('');
    setBuyIn('');
    setShowGameForm(false);
    
    // ⚡ Notify parent with updated bankroll
    if (onGameUpdate && result?.bankroll) {
      console.log('✅ Passing bankroll to parent:', result.bankroll);
      onGameUpdate(result.bankroll);
    } else if (onGameUpdate) {
      onGameUpdate();
    }
    
  } catch (err) {
    setError(err);
    console.error('Error creating game:', err);
  } finally {
    setIsSubmitting(false);
  }
};

  const handleEndGame = (game) => {
    setSelectedGame(game);
    setShowEndGameModal(true);
  };

 const handleGameEnded = async (gameId, winningsAmount) => {
  console.log('🔧 handleGameEnded called with gameId:', gameId, 'winnings:', winningsAmount);
  
  try {
    // ⚡ API CALL: Complete the game
    const result = await gameAPI.complete(gameId, { winnings: winningsAmount });  // ← FIX: Objekt übergeben
    
    console.log('✅ Game completed, result:', result);
    
    await loadGames(); // Reload games
    
    // Update parent with bankroll
    if (onGameUpdate && result?.bankroll) {
      console.log('✅ Updating parent with bankroll:', result.bankroll);
      onGameUpdate(result.bankroll);
    }
    
    setShowEndGameModal(false);
    setSelectedGame(null);
    
  } catch (error) {
    console.error('❌ Error completing game:', error);
    setError(error);
    throw error; // Re-throw so EndGameModal can catch it
  }
};

 const handleUpdateEntries = async (gameId, newEntries) => {
  try {
    console.log(`🎮 Updating entries for game ${gameId} to ${newEntries}`);
    
    // Finde das aktuelle Game
    const currentGame = games.find(game => game.id === gameId);
    if (!currentGame) {
      throw new Error('Game not found');
    }
    
    // Berechne Entry-Differenz
    const oldEntries = currentGame.entries || 1;
    const entryDifference = newEntries - oldEntries;
    const buyInAmount = parseFloat(currentGame.buy_in || 0);
    const bankrollChange = -(entryDifference * buyInAmount);
    
    console.log(`📊 Entry change: ${oldEntries} → ${newEntries} (${entryDifference > 0 ? '+' : ''}${entryDifference})`);
    console.log(`💰 Bankroll change: ${bankrollChange > 0 ? '+' : ''}${bankrollChange}`);
    
    // 1. Update Game in State
    setGames(prevGames => 
      prevGames.map(game => 
        game.id === gameId 
          ? { 
              ...game, 
              entries: newEntries,
              total_investment: (buyInAmount * newEntries).toFixed(2),
              updated_at: new Date().toISOString() 
            }
          : game
      )
    );
    
    // 2. 🛡️ SESSION-SAFE Bankroll Update - NUR wenn wirklich eine Änderung da ist
    if (onGameUpdate && bankrollChange !== 0) {
      // 🔑 SENDE EIN SPEZIFISCHES BANKROLL-ONLY UPDATE SIGNAL
      const bankrollUpdateSignal = {
        type: 'BANKROLL_ADJUSTMENT', // 🎯 Spezifischer Typ
        bankrollId: session?.bankroll_id,
        amount: bankrollChange,
        source: 'entry_update',
        gameId: gameId,
        // 🛡️ WICHTIG: Keine Session-Daten, nur Bankroll-Update!
      };
      
      console.log(`💰 Triggering session-safe bankroll update: ${bankrollChange}`);
      onGameUpdate(bankrollUpdateSignal);
    }
    
    console.log('✅ Entries updated successfully (session-safe)!');
    
  } catch (err) {
    setError(`Failed to update entries: ${err.message}`);
    console.error('Error updating entries:', err);
  }
};

  const getGameTypeIcon = (type) => {
    const option = gameTypeOptions.find(opt => opt.value === type);
    return option ? option.icon : '🎮';
  };

  if (!sessionActive) {
    return (
      <div className="game-manager disabled">
        <div className="no-session-message">
          <p>Starte zuerst eine Bankroll Session um Games zu tracken</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="game-manager">
        <LoadingSpinner message="Lade Games..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-manager">
        <ErrorMessage error={error} onRetry={loadGames} />
      </div>
    );
  }

  return (
    <>
      <div className="game-manager">
        <div className="games-header">
          <h4>Laufende Games</h4>
          <button 
            onClick={() => setShowGameForm(!showGameForm)} 
            className="btn-secondary"
            disabled={isSubmitting}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Game starten
          </button>
        </div>

        {showGameForm && (
          <div className="game-form-card">
            <div className="form-header">
              <h5>Neues Game starten</h5>
              <button onClick={() => setShowGameForm(false)} className="form-close">✕</button>
            </div>
            
            <div className="game-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Game Type</label>
                  <CustomDropdown
                    value={gameType}
                    onChange={setGameType}
                    options={gameTypeOptions}
                    placeholder="Wähle Game Type"
                  />
                </div>
                <div className="form-group">
                  <label>Buy-In ({CURRENCIES.find(c => c.code === currency)?.symbol})</label>
                  <input
                    type="number"
                    placeholder="z.B. 215"
                    value={buyIn}
                    onChange={(e) => setBuyIn(e.target.value)}
                    min="0"
                    step="0.01"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Game Name</label>
                  <input
                    type="text"
                    placeholder={
                      gameType === 'tournament' || gameType === 'mtt' ? 'z.B. Sunday Million' :
                      gameType === 'sng' ? 'z.B. $5 Turbo SNG' :
                      'z.B. NL200 6-max'
                    }
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isSubmitting && handleStartGame()}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button onClick={() => setShowGameForm(false)} className="btn-cancel" disabled={isSubmitting}>
                  Abbrechen
                </button>
                <button 
                  onClick={handleStartGame} 
                  className="btn-submit"
                  disabled={
                    isSubmitting ||
                    !gameName.trim() || 
                    !buyIn.trim() || 
                    isNaN(parseFloat(buyIn)) || 
                    parseFloat(buyIn) <= 0
                  }
                >
                  {isSubmitting ? 'Wird erstellt...' : 'Game starten'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="games-list">
          {games.length === 0 ? (
            <div className="no-games">
              <p>Noch keine Games gestartet</p>
              <small>Starte ein Tournament oder Cash Game</small>
            </div>
          ) : (
            games.map((game) => (
              <div key={game.id} className={`game-item ${game.status}`}>
                <div className="game-info">
                  <div className="game-header">
                    <span className="game-type-icon">{getGameTypeIcon(game.type)}</span>
                    <span className="game-name">{game.name}</span>
                    {game.status === 'running' && <span className="game-status">🔴 Läuft</span>}
                    {game.status === 'completed' && <span className="game-status completed">✅ Beendet</span>}
                  </div>
                  <div className="game-meta">
                    <GameTimer startTime={game.start_time} endTime={game.end_time} />
                    <span className="buy-in-info">{formatCurrency(game.buy_in, currency)}</span>
                    {(game.type === 'tournament' || game.type === 'sng' || game.type === 'mtt') && (
                      <span className="entries-info">{game.entries} Entry{game.entries > 1 ? 's' : ''}</span>
                    )}
                    {game.status === 'completed' && game.winnings !== undefined && (
                      <span className={`game-result ${(game.winnings - game.buy_in * game.entries) >= 0 ? 'positive' : 'negative'}`}>
                        {(game.winnings - game.buy_in * game.entries) >= 0 ? '+' : ''}
                        {formatCurrency(game.winnings - game.buy_in * game.entries, currency)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="game-controls">
                  {(game.type === 'tournament' || game.type === 'sng' || game.type === 'mtt') && game.status === 'running' && (
                    <div className="entries-counter">
                      <button 
                        onClick={() => handleUpdateEntries(game.id, Math.max(1, game.entries - 1))}
                        className="count-btn"
                      >
                        -
                      </button>
                      <span className="count-display">{game.entries}</span>
                      <button 
                        onClick={() => handleUpdateEntries(game.id, game.entries + 1)}
                        className="count-btn"
                      >
                        +
                      </button>
                    </div>
                  )}
                  
                  {game.status === 'running' ? (
                    <button 
                      onClick={() => handleEndGame(game)}
                      className="btn-end-game"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h12v12H6z"/>
                      </svg>
                      Beenden
                    </button>
                  ) : (
                    <span className="game-duration">
                      {game.duration_minutes ? `${game.duration_minutes}min` : 'Beendet'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* End Game Modal */}
      <EndGameModal
        isOpen={showEndGameModal}
        onClose={() => {
          setShowEndGameModal(false);
          setSelectedGame(null);
        }}
        game={selectedGame}
        onComplete={handleGameEnded}
      />
    </>
  );
};

// ============================================================================
// SIDEBAR ITEM WITH OPTIONS MENU
// ============================================================================
const SidebarItemWithOptions = ({ 
  icon, 
  label, 
  isActive, 
  onClick, 
  isCollapsed
}) => {
  return (
    <div 
      className={`sidebar-item-wrapper ${isActive ? 'active' : ''}`}
      data-label={label}
    >
      <button
        className={`sidebar-item ${isActive ? 'active' : ''}`}
        onClick={onClick}
      >
        {icon}
        {!isCollapsed && <span>{label}</span>}
      </button>
    </div>
  );
};

// ============================================================================
// DASHBOARD SIDEBAR (Fixed JSX)
// ============================================================================
const DashboardSidebar = ({ 
  activeSection, 
  onSectionChange, 
  isCollapsed, 
  onToggle, 
  selectedBankroll,
  bankrolls = [],
  onBankrollEdit,
  onBankrollDelete,
  onBackToBankrolls 
}) => {
  const currentBankroll = bankrolls.find(br => br.id === selectedBankroll?.id);

  return (
    <div className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && (
          <div className="sidebar-logo">
            <h3>♦️ BankrollGod</h3>
          </div>
        )}
        <button 
          className="sidebar-toggle" 
          onClick={onToggle}
          title={isCollapsed ? 'Sidebar öffnen' : 'Sidebar schließen'}
          aria-label={isCollapsed ? 'Sidebar öffnen' : 'Sidebar schließen'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav">
        

        {/* Bankrolls - immer sichtbar */}
        <SidebarItemWithOptions
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
            </svg>
          }
          label="Bankrolls"
          isActive={activeSection === 'bankrolls' || activeSection === 'bankroll-detail'}
          onClick={() => onSectionChange('bankrolls')}
          isCollapsed={isCollapsed}
        />

        {/* Sessions - immer sichtbar */}
        <SidebarItemWithOptions
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
          }
          label="Sessions"
          isActive={activeSection === 'sessions'}
          onClick={() => onSectionChange('sessions')}
          isCollapsed={isCollapsed}
        />

        {/* Statistiken - immer sichtbar */}
        <SidebarItemWithOptions
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
          }
          label="Statistiken"
          isActive={activeSection === 'statistics'}
          onClick={() => onSectionChange('statistics')}
          isCollapsed={isCollapsed}
        />

        {/* Übersicht - immer sichtbar */}
        <SidebarItemWithOptions
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
          }
          label="Übersicht"
          isActive={activeSection === 'overview'}
          onClick={() => onSectionChange('overview')}
          isCollapsed={isCollapsed}
        />

        {/* Einstellungen - immer sichtbar */}
        <SidebarItemWithOptions
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
          }
          label="Einstellungen"
          isActive={activeSection === 'settings'}
          onClick={() => onSectionChange('settings')}
          isCollapsed={isCollapsed}
        />
      </nav>
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => (
  <div className={`loading-spinner ${size}`}>
    <div className="spinner"></div>
  </div>
);

// Error Message Component
const ErrorMessage = ({ error, onRetry }) => (
  <div className="error-message">
    <div className="error-icon">❌</div>
    <h3>Fehler beim Laden</h3>
    <p>{error.message || 'Ein unbekannter Fehler ist aufgetreten'}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-retry">
        Erneut versuchen
      </button>
    )}
  </div>
);

// Connection Status Component
const ConnectionStatus = ({ isConnected, onReconnect }) => {
  if (isConnected) return null;
  
  return (
    <div className="connection-status offline">
      <div className="status-content">
        <span className="status-icon">📡</span>
        <span className="status-text">Backend-Verbindung unterbrochen</span>
        <button onClick={onReconnect} className="btn-reconnect">
          Neu verbinden
        </button>
      </div>
    </div>
  );
};

// Timer Components
const SessionTimer = ({ startTime }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - new Date(startTime).getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const displayHours = hours;
    const displayMinutes = minutes % 60;
    const displaySeconds = seconds % 60;
    
    return `${displayHours.toString().padStart(2, '0')}:${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
  };

  return <span className="session-timer">{formatTime(elapsed)}</span>;
};

const GameTimer = ({ startTime, endTime }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!endTime) {
      const interval = setInterval(() => {
        setElapsed(Date.now() - new Date(startTime).getTime());
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsed(new Date(endTime).getTime() - new Date(startTime).getTime());
    }
  }, [startTime, endTime]);

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const displayHours = hours;
    const displayMinutes = minutes % 60;
    const displaySeconds = seconds % 60;
    
    if (hours > 0) {
      return `${displayHours}h ${displayMinutes}m`;
    } else if (minutes > 0) {
      return `${displayMinutes}m ${displaySeconds}s`;
    } else {
      return `${displaySeconds}s`;
    }
  };

  return <span className="game-timer">{formatTime(elapsed)}</span>;
};

// Custom Dropdown Component
const CustomDropdown = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <button 
        className={`dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="dropdown-value">
          {selectedOption ? (
            <>
              <span className="dropdown-icon">{selectedOption.icon}</span>
              <span className="dropdown-text">{selectedOption.label}</span>
            </>
          ) : (
            <span className="dropdown-placeholder">{placeholder}</span>
          )}
        </span>
        <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </button>
      
      {isOpen && (
        <div className="dropdown-menu">
          {options.map((option) => (
            <button
              key={option.value}
              className={`dropdown-option ${value === option.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              type="button"
            >
              <span className="option-icon">{option.icon}</span>
              <span className="option-text">{option.label}</span>
              <span className="option-description">{option.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


// ============================================================================
// ENHANCED BANKROLLS SECTION (mit Currency, Edit, Delete) - FIXED MAPPING
// ============================================================================
const BankrollsSection = ({ onBankrollSelect, activeSessions, onBankrollsChange }) => {
  const [bankrolls, setBankrolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBankroll, setSelectedBankroll] = useState(null);

  const loadBankrolls = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await bankrollAPI.getAll();
      console.log('🔍 DEBUGGING - Raw bankrolls data:', data);
      
      // ⚡ VALIDATE DATA STRUCTURE
      let validBankrolls = [];
      
      if (Array.isArray(data)) {
        // If data is directly an array
        validBankrolls = data.filter(br => br && typeof br === 'object' && br.id);
      } else if (data && Array.isArray(data.data)) {
        // If data.data is an array
        validBankrolls = data.data.filter(br => br && typeof br === 'object' && br.id);
      } else if (data && data.success && Array.isArray(data.data)) {
        // If response format: {success: true, data: [...]}
        validBankrolls = data.data.filter(br => br && typeof br === 'object' && br.id);
      } else {
        console.warn('⚠️ Unexpected bankrolls data structure:', data);
        validBankrolls = [];
      }
      
      console.log('✅ Valid bankrolls:', validBankrolls);
      setBankrolls(validBankrolls);
      
      // Notify parent if needed
      if (onBankrollsChange) {
        onBankrollsChange(validBankrolls);
      }
    } catch (err) {
      setError(err);
      console.error('Error loading bankrolls:', err);
      setBankrolls([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBankrolls();
  }, []);

  // Handlers
  const handleBankrollCreated = (newBankroll) => {
    setBankrolls(prev => [...prev, newBankroll]);
    if (onBankrollsChange) {
      onBankrollsChange([...bankrolls, newBankroll]);
    }
  };

  const handleBankrollUpdated = (updatedBankroll) => {
    setBankrolls(prev => 
      prev.map(br => br.id === updatedBankroll.id ? updatedBankroll : br)
    );
    if (onBankrollsChange) {
      const updated = bankrolls.map(br => br.id === updatedBankroll.id ? updatedBankroll : br);
      onBankrollsChange(updated);
    }
  };

  const handleBankrollDeleted = (bankrollId) => {
    setBankrolls(prev => prev.filter(br => br.id !== bankrollId));
    if (onBankrollsChange) {
      const filtered = bankrolls.filter(br => br.id !== bankrollId);
      onBankrollsChange(filtered);
    }
  };

  const handleEdit = (bankroll) => {
    setSelectedBankroll(bankroll);
    setShowEditModal(true);
  };

  const handleDelete = (bankroll) => {
    setSelectedBankroll(bankroll);
    setShowDeleteModal(true);
  };

  if (isLoading) {
    return (
      <div className="dashboard-section">
        <LoadingSpinner size="large" message="Lade Bankrolls..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-section">
        <ErrorMessage error={error} onRetry={loadBankrolls} />
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Meine Bankrolls</h2>
            <p>Verwalte deine Poker Bankrolls mit Echtzeit-Updates</p>
          </div>
          <button 
            className="btn-primary-enhanced" 
            onClick={() => setShowCreateModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Neue Bankroll
          </button>
        </div>
        
        <div className="bankrolls-grid">
          {/* ⚡ FIXED MAPPING WITH NULL CHECKS */}
          {bankrolls && bankrolls.length > 0 ? bankrolls.filter(br => br && br.id).map(br => {
            // ⚡ SAFE ACCESS WITH NULL CHECKS
            const activeSession = activeSessions && activeSessions[br.name] ? activeSessions[br.name] : null;
            const currency = br.currency || 'USD';
            const currentAmount = br.current_amount || 0;
            const startingAmount = br.starting_amount || 0;
            const goalAmount = br.goal_amount || 0;
            const totalSessions = br.total_sessions || 0;
            
            return (
  <div 
    key={br.id} 
    className={`bankroll-card clickable ${activeSession ? 'has-active-session' : ''}`}
    onClick={() => onBankrollSelect(br)}
  >
    {/* Active Session Indicator */}
    {activeSession && (
      <div className="active-session-indicator">
        <span className="live-indicator">🔴 LIVE</span>
        <div className="session-details">
          <span className="session-name">{activeSession.name || 'Unnamed Session'}</span>
          <span className="games-count">
            {activeSession.total_games || 0} Game{activeSession.total_games !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    )}
    
    {/* ✅ NEU: Edit/Delete Buttons */}
    <div className="bankroll-actions">
      <button
        className="btn-icon btn-edit"
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(br);
        }}
        title="Bearbeiten"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
      </button>
      
      <button
        className="btn-icon btn-delete"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(br);
        }}
        title="Löschen"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      </button>
    </div>
         
                
                <div className="bankroll-header">
                  <h3>{br.name || 'Unnamed Bankroll'}</h3>
                  <span className={`bankroll-type ${br.type || 'online'}`}>
                    {br.type === 'live' ? '🏢' : '💻'} {br.type || 'online'}
                  </span>
                </div>
                
                <div className="bankroll-stats">
                  <div className="stat-row">
                    <span>Start:</span>
                    <span>{formatCurrency(startingAmount, currency)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Aktuell:</span>
                    <span className="current-value">{formatCurrency(currentAmount, currency)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Ziel:</span>
                    <span>{formatCurrency(goalAmount, currency)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Sessions:</span>
                    <span>{totalSessions}</span>
                  </div>
                  <div className="stat-row">
                    <span>Gewinn:</span>
                    <span className={`profit-value ${currentAmount >= startingAmount ? 'positive' : 'negative'}`}>
                      {currentAmount >= startingAmount ? '+' : ''}
                      {formatCurrency(currentAmount - startingAmount, currency)}
                    </span>
                  </div>
                </div>
                
                <div className="progress-container">
                  <div className="progress-info">
                    <span>Fortschritt zum Ziel</span>
                    <span className="progress-percentage">
                      {goalAmount ? 
                        Math.round(((currentAmount - startingAmount) / (goalAmount - startingAmount)) * 100) : 
                        0
                      }%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{
                        width: `${goalAmount ? 
                          Math.min(((currentAmount - startingAmount) / (goalAmount - startingAmount)) * 100, 100) : 
                          0
                        }%`
                      }}
                    />
                  </div>
                </div>
            
              </div>
            );
          }) : (
            <div className="no-bankrolls">
              <p>Noch keine Bankrolls erstellt</p>
              <small>Erstelle deine erste Bankroll um zu starten</small>
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      <CreateBankrollModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onBankrollCreated={handleBankrollCreated}
      />
      
      <EditBankrollModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBankroll(null);
        }}
        bankroll={selectedBankroll}
        onBankrollUpdated={handleBankrollUpdated}
      />
      
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedBankroll(null);
        }}
        bankroll={selectedBankroll}
        onConfirmDelete={handleBankrollDeleted}
      />
    </>
  );
};

// ============================================================================
// TWO-LEVEL SESSION MANAGER
// ============================================================================
const TwoLevelSessionManager = ({ bankroll, activeSession, onSessionUpdate }) => {
  const [sessionName, setSessionName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const currency = bankroll?.currency || 'USD';

  const handleStartSession = async () => {
    if (!sessionName.trim() || !bankroll?.id) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const sessionData = {
        name: sessionName,
        bankroll_id: bankroll.id,
        location: 'Online',
        session_type: 'Mixed Games'
      };
      
      const newSession = await sessionAPI.create(sessionData);
      
      setSessionName('');
      setShowNameInput(false);
      
      if (onSessionUpdate) {
        onSessionUpdate(newSession);
      }
      
    } catch (err) {
      setError(err);
      console.error('Error starting session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

 const handleEndSession = async () => {
  console.log('🔧 HANDLE END SESSION CALLED!');
  console.log('🔧 activeSession:', activeSession);
  console.log('🔧 activeSession.id:', activeSession?.id);
  
  if (!activeSession?.id) {
    console.log('❌ NO SESSION ID - returning');
    return;
  }
  
  console.log('🔧 Starting session end process...');
  setIsSubmitting(true);
  setError(null);
  
  try {
    console.log('🔧 Calling sessionAPI.complete...');
    await sessionAPI.complete(activeSession.id);
    console.log('✅ Session API call successful');
    
    if (onSessionUpdate) {
      console.log('🔧 Calling onSessionUpdate...');
      onSessionUpdate(null);
    }
    
  } catch (err) {
    console.log('❌ Session API error:', err);
    setError(err);
    console.error('Error ending session:', err);
  } finally {
    setIsSubmitting(false);
  }
};

  // No active session
  if (!activeSession) {
    return (
      <div className="two-level-session-manager">
        <div className="session-start-card">
          <h3>Bankroll Session starten</h3>
          <p>Starte eine Session für {bankroll?.name} um Games zu tracken</p>
          
          {error && <ErrorMessage error={error} />}
          
          {showNameInput ? (
            <div className="session-name-input">
              <input
                type="text"
                placeholder="Session Name (z.B. 'Friday Night Grind', 'Tournament Sunday')"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isSubmitting && handleStartSession()}
                autoFocus
                disabled={isSubmitting}
              />
              <div className="session-name-actions">
                <button 
                  onClick={() => setShowNameInput(false)} 
                  className="btn-cancel"
                  disabled={isSubmitting}
                >
                  Abbrechen
                </button>
                <button 
                  onClick={handleStartSession} 
                  className="btn-submit"
                  disabled={isSubmitting || !sessionName.trim()}
                >
                  {isSubmitting ? 'Wird erstellt...' : 'Session starten'}
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowNameInput(true)} 
              className="btn-primary-enhanced"
              disabled={isSubmitting}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Bankroll Session starten
            </button>
          )}
        </div>
      </div>
    );
  }

  // Active session
  return (
    <div className="two-level-session-manager">
      {/* Bankroll Session Header */}
      <div className="bankroll-session-card">
        <div className="session-header">
          <div className="session-info">
            <h3>🎰 Bankroll Session: {activeSession.name}</h3>
            <div className="session-meta">
              <span className="session-status">🔴 LIVE</span>
              <SessionTimer startTime={activeSession.start_time} />
              <span className="games-count">
                {activeSession.total_games || 0} Game{activeSession.total_games !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <button 
            onClick={handleEndSession} 
            className="btn-end-session"
            disabled={isSubmitting}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h12v12H6z"/>
            </svg>
            {isSubmitting ? 'Wird beendet...' : 'Session beenden'}
          </button>
        </div>
        
        {error && <ErrorMessage error={error} />}
      </div>

      {/* Game Management */}
      <GameManager
        session={activeSession}
        onGameUpdate={onSessionUpdate}
        sessionActive={true}
        currency={currency}
      />
    </div>
  );
};



// ============================================================================
// BANKROLL DETAIL SECTION - REDESIGNED
// ============================================================================
const BankrollDetailSection = ({ bankroll, activeSession, onSessionUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // States for Burger Menu
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const currency = bankroll?.currency || 'USD';
// Handler für Edit und Delete
  const handleEdit = (bankroll) => {
    setShowEditModal(true);
  };

  const handleDelete = (bankroll) => {
    setShowDeleteModal(true);
  };

  const handleBankrollUpdated = (updatedBankroll) => {
    // Aktualisiere die Bankroll-Daten
    if (onSessionUpdate) {
      onSessionUpdate(activeSession);
    }
    setShowEditModal(false);
  };

  const handleBankrollDeleted = () => {
    // Navigiere zurück zur Bankroll-Übersicht
    window.location.href = '/';
  };
  // Handler for session start
  const handleStartSession = async () => {
    if (!sessionName.trim() || !bankroll?.id) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const sessionData = {
        name: sessionName,
        bankroll_id: bankroll.id,
        location: 'Online',
        session_type: 'Mixed Games'
      };
      
      const newSession = await sessionAPI.create(sessionData);
      
      setSessionName('');
      setShowNameInput(false);
      
      if (onSessionUpdate) {
        onSessionUpdate(newSession);
      }
      
    } catch (err) {
      setError(err);
      console.error('Error starting session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

// Handler for session end
const handleEndSession = async () => {
  if (!activeSession?.id) return;
  
  setIsSubmitting(true);
  setError(null);
  
  try {
    await sessionAPI.complete(activeSession.id);
    
    if (onSessionUpdate) {
      onSessionUpdate(null);
    }
    
  } catch (err) {
    setError(err);
    console.error('Error ending session:', err);
  } finally {
    setIsSubmitting(false);
  }
};

const totalProfit = parseFloat(bankroll.current_amount) - parseFloat(bankroll.starting_amount);
const progressPercent = bankroll.goal_amount ? 
  Math.min(((parseFloat(bankroll.current_amount) - parseFloat(bankroll.starting_amount)) / 
  (parseFloat(bankroll.goal_amount) - parseFloat(bankroll.starting_amount))) * 100, 100) : 0;

return (
  <div className="dashboard-section bankroll-detail-section">
    
    {/* 1. BANKROLL STATUS CARD - mit Edit/Delete Buttons */}
    <div className="bankroll-status-card">
      <div className="status-card-header">
        <div className="bankroll-title-section">
          <h2>{bankroll.name}</h2>
          <span className={`bankroll-type ${bankroll.type} large`}>
            {bankroll.type === 'online' ? '💻' : '🏢'} {bankroll.type}
          </span>
        </div>
        
        <div className="bankroll-actions">
          <button
            className="btn-icon btn-edit"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(bankroll);
            }}
            title="Bearbeiten"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
          
          <button
            className="btn-icon btn-delete"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(bankroll);
            }}
            title="Löschen"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>  {/* ← ✅ WICHTIG: status-card-header schließt HIER! */}

        {/* Stats Grid */}
        <div className="bankroll-stats-grid">
          <div className="stat-item">
            <span className="stat-label">Start</span>
            <span className="stat-value">{formatCurrency(bankroll.starting_amount, currency)}</span>
          </div>
          <div className="stat-item highlight">
            <span className="stat-label">Aktuell</span>
            <span className="stat-value current">{formatCurrency(bankroll.current_amount, currency)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Ziel</span>
            <span className="stat-value">{formatCurrency(bankroll.goal_amount || 0, currency)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Gewinn</span>
            <span className={`stat-value ${totalProfit >= 0 ? 'positive' : 'negative'}`}>
              {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit, currency)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-info">
            <span>Fortschritt zum Ziel</span>
            <span className="progress-percentage">{Math.round(progressPercent)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Session Start/End - Integriert in Bankroll Status! */}
        {!activeSession ? (
          <div className="session-start-section">
            {!showNameInput ? (
              <button 
                onClick={() => setShowNameInput(true)} 
                className="btn-start-session"
                disabled={isSubmitting}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Bankroll Session starten
              </button>
            ) : (
              <div className="session-name-input">
                <input
                  type="text"
                  placeholder="Session Name (z.B. 'Friday Night Grind')"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isSubmitting && handleStartSession()}
                  autoFocus
                  disabled={isSubmitting}
                />
                <div className="session-name-actions">
                  <button 
                    onClick={() => setShowNameInput(false)} 
                    className="btn-cancel"
                    disabled={isSubmitting}
                  >
                    Abbrechen
                  </button>
                  <button 
                    onClick={handleStartSession} 
                    className="btn-submit"
                    disabled={isSubmitting || !sessionName.trim()}
                  >
                    {isSubmitting ? 'Wird erstellt...' : 'Starten'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="active-session-section">
            <div className="session-info-bar">
              <div className="session-info">
                <span className="session-status">🔴 LIVE</span>
                <span className="session-name">{activeSession.name}</span>
                <SessionTimer startTime={activeSession.start_time} />
                <span className="games-count">
                  {activeSession.total_games || 0} Game{activeSession.total_games !== 1 ? 's' : ''}
                </span>
              </div>
              <button 
                onClick={handleEndSession} 
                className="btn-end-session"
                disabled={isSubmitting}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h12v12H6z"/>
                </svg>
                {isSubmitting ? 'Wird beendet...' : 'Session beenden'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>{error.message || 'Ein Fehler ist aufgetreten'}</span>
          </div>
        )}
      </div>

      {/* 2. GAME MANAGER - Zum Starten neuer Games */}
      {activeSession && (
        <GameManager
          session={activeSession}
          onGameUpdate={onSessionUpdate}
          sessionActive={true}
          currency={currency}
        />
      )}

  

    {/* Modals für Edit/Delete */}
      <EditBankrollModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        bankroll={bankroll}
        onBankrollUpdated={handleBankrollUpdated}
      />
      
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        bankroll={bankroll}
        onConfirmDelete={handleBankrollDeleted}
      />
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================
const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('bankrolls');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedBankroll, setSelectedBankroll] = useState(null);
  const [activeSessions, setActiveSessions] = useState({});
  const [isConnected, setIsConnected] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [bankrolls, setBankrolls] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingBankroll, setEditingBankroll] = useState(null);
  // 🔧 NEU: Session Recovery State (nach den bestehenden useState-Hooks hinzufügen)
const [showSessionRecovery, setShowSessionRecovery] = useState(false);
const [recoverySession, setRecoverySession] = useState(null);
const [recoveryBankroll, setRecoveryBankroll] = useState(null);
const [sessionRecoveryData, setSessionRecoveryData] = useState(null);
const [isCheckingRecovery, setIsCheckingRecovery] = useState(false);

  // Test backend connection on mount
  useEffect(() => {
    const initializeApp = async () => {
      setIsInitializing(true);
      
      try {
        const connected = await testConnection();
        setIsConnected(connected);
        
        if (connected) {
          // Load active sessions (don't let errors block bankrolls)
          try {
            await loadActiveSessions();
          } catch (error) {
            console.log('⚠️ Sessions loading failed, continuing anyway:', error);
          }
          
          // Always load bankrolls
          await loadBankrolls();
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setIsConnected(false);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

// 🔧 Intelligente Session-Persistenz (ohne störende Modals)
  useEffect(() => {
    if (isConnected && !isInitializing) {
      initializeSessionPersistence();
    }
  }, [isConnected, isInitializing]);

  // 🔧 Intelligente Session-Persistenz ohne Modals
  const initializeSessionPersistence = async () => {
    setIsCheckingRecovery(true);
    
    try {
      console.log('🔄 Checking for persistent sessions...');
      
      // Check server for active sessions
      const recoveryData = await initializeSessionRecovery();
      
      if (recoveryData.needsRecovery && recoveryData.serverSessions.length > 0) {
        console.log('📊 Found persistent sessions:', recoveryData.serverSessions.length);
        
        // Instead of showing modal, update your existing active sessions state
        const sessionsByBankroll = {};
        recoveryData.serverSessions.forEach(session => {
          if (session.bankroll) {
            sessionsByBankroll[session.bankroll.name] = {
              ...session,
              // Mark as recovered for UI indication
              isRecovered: true,
              recoveredAt: new Date().toISOString()
            };
            
            // Save to local storage for persistence
            sessionPersistence.saveSessionState(session.id, {
              bankrollId: session.bankroll.id,
              sessionName: session.name,
              recoveredAt: new Date().toISOString()
            });
          }
        });
        
        // Update your existing activeSessions state seamlessly
        console.log('✅ Found persistent sessions, refreshing via loadActiveSessions');
        
        // Just save the persistence data and let loadActiveSessions handle the display
        recoveryData.serverSessions.forEach(session => {
          if (session.bankroll) {
            sessionPersistence.saveSessionState(session.id, {
              bankrollId: session.bankroll.id,
              sessionName: session.name,
              recoveredAt: new Date().toISOString()
            });
          }
        });
        
        // Let the existing loadActiveSessions function handle the UI update
       await loadActiveSessions();
        
        console.log('✅ Sessions restored seamlessly to your existing system');
      } else {
        console.log('✅ No persistent sessions found');
      }
    } catch (error) {
      console.error('Error checking persistent sessions:', error);
    } finally {
      setIsCheckingRecovery(false);
    }
  };  // <-- Diese Klammer schließt initializeSessionPersistence

  // Load active sessions
const loadActiveSessions = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      return;
    }
    
    console.log('🔧 DEBUG: Loading sessions...');
    const sessions = await sessionAPI.getActive();
    console.log('🔧 DEBUG: Raw sessions:', sessions);
    console.log('🔧 DEBUG: Is Array?', Array.isArray(sessions));
    
    const sessionsMap = {}; 

    if (sessions && Array.isArray(sessions)) {
      sessions.forEach(session => {
        console.log('🔧 DEBUG: Processing session:', session);
        console.log('🔧 DEBUG: Session bankroll_id:', session.bankroll_id);
        
        if (session && session.bankroll_id) {
          // Finde die Bankroll anhand der ID
          const matchingBankroll = bankrolls.find(br => br.id === session.bankroll_id);
          console.log('🔧 DEBUG: Found bankroll:', matchingBankroll?.name);
          
          if (matchingBankroll) {
            sessionsMap[matchingBankroll.name] = session;
          }
        }
      });
    }
    
    console.log('🔧 DEBUG: Final sessionsMap:', sessionsMap);
    setActiveSessions(sessionsMap);
    console.log('✅ Active sessions loaded:', sessions.length);
    
  } catch (error) {
    console.error('Error loading active sessions:', error);
    // Check if it's an auth error
    if (error.message?.includes('401') || error.message?.includes('403')) {
      // Redirect to login or refresh token
      window.location.href = '/login';
    }
  }
};

  // Load all bankrolls
  const loadBankrolls = async () => {
    try {
      const data = await bankrollAPI.getAll();
      setBankrolls(data);
    } catch (error) {
      console.error('Error loading bankrolls:', error);
    }
  };

  // Handler für Bankroll Edit aus Sidebar
  const handleBankrollEdit = (bankroll) => {
    console.log('Editing bankroll from sidebar:', bankroll);
    setEditingBankroll(bankroll);
    setShowEditModal(true);
  };

  // Handler für Bankroll Delete aus Sidebar
  const handleBankrollDelete = (bankroll) => {
    console.log('Deleting bankroll from sidebar:', bankroll);
    setEditingBankroll(bankroll);
    setShowDeleteModal(true);
  };

  // After update from sidebar
  const handleBankrollUpdatedFromSidebar = (updatedBankroll) => {
    setBankrolls(prev => 
      prev.map(br => br.id === updatedBankroll.id ? updatedBankroll : br)
    );
    
    if (selectedBankroll?.id === updatedBankroll.id) {
      setSelectedBankroll(updatedBankroll);
    }
    
    setShowEditModal(false);
    setEditingBankroll(null);
  };

  // After delete from sidebar
  const handleBankrollDeletedFromSidebar = (bankrollId) => {
    setBankrolls(prev => prev.filter(br => br.id !== bankrollId));
    
    if (selectedBankroll?.id === bankrollId) {
      setSelectedBankroll(null);
      setActiveSection('bankrolls');
    }
    
    setShowDeleteModal(false);
    setEditingBankroll(null);
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (section !== 'bankroll-detail') {
      setSelectedBankroll(null);
    }
  };

  const handleBankrollSelect = (bankroll) => {
    setSelectedBankroll(bankroll);
    setActiveSection('bankroll-detail');
  };

  const handleBackToBankrolls = () => {
    setSelectedBankroll(null);
    setActiveSection('bankrolls');
  };

  const handleSessionUpdate = async (updatedDataOrSignal = null) => {
  // 🛡️ Check for specific bankroll-only update signal
  if (updatedDataOrSignal && updatedDataOrSignal.type === 'BANKROLL_ADJUSTMENT') {
    console.log('💰 Processing bankroll-only adjustment:', updatedDataOrSignal);
    
    // Update nur die Bankroll, Session bleibt unberührt
    if (selectedBankroll && updatedDataOrSignal.bankrollId === selectedBankroll.id) {
      setSelectedBankroll(prev => ({
        ...prev,
        current_amount: (parseFloat(prev.current_amount) + updatedDataOrSignal.amount).toFixed(2),
        updated_at: new Date().toISOString()
      }));
    }
    
    // 🚫 KEIN loadActiveSessions() - Session bleibt ungestört!
    console.log('✅ Bankroll updated, session untouched');
    return;
  }
  
  // 🔄 Original Session-Update-Logik für echte Session-Updates
  if (selectedBankroll) {
    if (updatedDataOrSignal && updatedDataOrSignal.id === selectedBankroll.id) {
      setSelectedBankroll(updatedDataOrSignal);
    }
    
    if (updatedDataOrSignal && updatedDataOrSignal.id !== selectedBankroll.id) {
      setActiveSessions(prev => ({
        ...prev,
        [selectedBankroll.name]: updatedDataOrSignal
      }));
    } else if (!updatedDataOrSignal) {
      setActiveSessions(prev => {
        const updated = { ...prev };
        delete updated[selectedBankroll.name];
        return updated;
      });
    }
  }
  
  await loadActiveSessions();
};

  // 🔧 NEU: Session Recovery Handlers
  const handleSessionRecovered = async (session) => {
    console.log('✅ Session recovered:', session);
    
    // Save session state for persistence
    sessionPersistence.saveSessionState(session.id, {
      bankrollId: session.bankroll_id,
      sessionName: session.name,
      recoveredAt: new Date().toISOString()
    });
    
    // Update active sessions and UI
    await loadActiveSessions();
    
    // Close recovery modal
    setShowSessionRecovery(false);
    setRecoverySession(null);
    setRecoveryBankroll(null);
  };

  const handleSessionRecoveryAction = async (action) => {
    if (!recoverySession || !recoveryBankroll) return;

    try {
      console.log('🔧 Executing recovery action:', action);

      switch (action) {
        case 'pause_existing':
          await sessionAPI.pause(recoverySession.id);
          console.log('⏸️ Existing session paused');
          break;
          
        case 'complete_existing':
          await sessionAPI.complete(recoverySession.id);
          console.log('✅ Existing session completed');
          sessionPersistence.removeSessionState(recoverySession.id);
          break;
          
        case 'create_new':
          // This will be handled by the calling component
          break;
          
        default:
          console.log('Unknown action:', action);
          return;
      }

      // Refresh sessions and close modal
      await loadActiveSessions();
      setShowSessionRecovery(false);
      setRecoverySession(null);
      setRecoveryBankroll(null);
    } catch (error) {
      console.error('Error executing recovery action:', error);
      throw error;
    }
  };

  const handleReconnect = async () => {
    const connected = await testConnection();
    setIsConnected(connected);
    
    if (connected) {
      console.log('✅ Sessions restored seamlessly to your existing system');
    }
  };

  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className="dashboard-section">
          <ErrorMessage 
            error={{ message: 'Backend-Server ist nicht erreichbar. Stelle sicher, dass der Server läuft.' }}
            onRetry={handleReconnect}
          />
        </div>
      );
    }

    switch (activeSection) {
      case 'bankrolls':
        return (
          <BankrollsSection 
            onBankrollSelect={handleBankrollSelect} 
            activeSessions={activeSessions}
            onBankrollsChange={loadActiveSessions}
          />
        );
      case 'bankroll-detail':
        return selectedBankroll ? (
          <BankrollDetailSection 
            bankroll={selectedBankroll}
            activeSession={activeSessions[selectedBankroll.name]}
            onSessionUpdate={handleSessionUpdate}
          />
        ) : null;
      case 'sessions':
        return <Sessions />;
      case 'statistics':
  return <Statistics />;
      case 'overview':
        return (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Dashboard Übersicht</h2>
              <p>Zusammenfassung aller deiner Poker-Aktivitäten</p>
            </div>
            <div className="overview-content">
              <div className="overview-stats">
                <div className="overview-card">
                  <h3>Gesamte Bankrolls</h3>
                  <div className="overview-value">{bankrolls.length}</div>
                </div>
                <div className="overview-card">
                  <h3>Aktive Sessions</h3>
                  <div className="overview-value">{Object.keys(activeSessions).length}</div>
                </div>
                <div className="overview-card">
                  <h3>Gesamtwert</h3>
                  <div className="overview-value">
                    {formatCurrency(
                      bankrolls.reduce((total, br) => total + parseFloat(br.current_amount), 0),
                      'USD'
                    )}
                  </div>
                </div>
              </div>
              
              <div className="recent-activity">
                <h3>Letzte Aktivitäten</h3>
                <p>Aktivitäts-Feed wird implementiert...</p>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Einstellungen</h2>
              <p>App-Konfiguration und Einstellungen</p>
            </div>
            <div className="settings-content">
              <div className="settings-group">
                <h3>Allgemein</h3>
                <div className="setting-item">
                  <label>Standard-Währung</label>
                  <select>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>
                <div className="setting-item">
                  <label>Sprache</label>
                  <select>
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              
              <div className="settings-group">
                <h3>Benachrichtigungen</h3>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Session-Updates
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Bankroll-Änderungen
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Dashboard</h2>
              <p>Willkommen bei BankrollGod</p>
            </div>
            <p>Wähle einen Bereich aus der Sidebar</p>
          </div>
        );
    }
  };

  if (isInitializing) {
    return (
      <div className="dashboard">
        <LoadingSpinner size="large" message="Verbinde mit Backend..." />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <ConnectionStatus isConnected={isConnected} onReconnect={handleReconnect} />
      
      <DashboardSidebar 
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        selectedBankroll={selectedBankroll}
        bankrolls={bankrolls}
        onBankrollEdit={handleBankrollEdit}
        onBankrollDelete={handleBankrollDelete}
        onBackToBankrolls={handleBackToBankrolls}
      />
      
      <div className={`dashboard-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {renderContent()}
      </div>

      {/* Modals für Sidebar-Actions */}
      <EditBankrollModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingBankroll(null);
        }}
        bankroll={editingBankroll}
        onBankrollUpdated={handleBankrollUpdatedFromSidebar}
      />
      
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setEditingBankroll(null);
        }}
        bankroll={editingBankroll}
        onConfirmDelete={handleBankrollDeletedFromSidebar}
      />
{/* 🔧 NEU: Session Recovery Modal */}
       {/*
      <SessionRecoveryModal
        isOpen={showSessionRecovery}
        onClose={() => {
          setShowSessionRecovery(false);
          setRecoverySession(null);
          setRecoveryBankroll(null);
        }}
        activeSession={recoverySession}
        bankroll={recoveryBankroll}
        onSessionResumed={handleSessionRecovered}
        onSessionAction={handleSessionRecoveryAction}
      />         */}
    </div>
  );
};

export default Dashboard;