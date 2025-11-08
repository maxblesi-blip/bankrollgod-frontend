// src/components/modals/EndGameModal.jsx
import React, { useState, useEffect } from 'react';
import './EndGameModal.css';

const EndGameModal = ({ 
  isOpen, 
  onClose, 
  game, 
  onComplete,
  currency = 'USD'
}) => {
  const [winnings, setWinnings] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setWinnings('');
    }
  }, [isOpen]);

  if (!isOpen || !game) return null;

  const buyIn = parseFloat(game.buy_in) || 0;
  const entries = parseInt(game.entries) || 1;
  const totalInvested = buyIn * entries;
  const winningsAmount = parseFloat(winnings) || 0;
  const netProfit = winningsAmount - totalInvested;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      await onComplete(game.id, winningsAmount);
      onClose();
    } catch (error) {
      console.error('Error completing game:', error);
      alert('Fehler beim Beenden des Games: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const formatCurrency = (amount, curr = currency) => {
    const formatter = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return formatter.format(amount);
  };

  return (
    <div className="modal-overlay end-game-modal" onClick={handleOverlayClick}>
      <div className="modal-content">
        {/* Modal Header */}
        <div className="modal-header">
          <h2>
            <span>🏁</span> Game beenden
          </h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Game Summary */}
          <div className="game-summary">
            <h3>{game.name || 'Unnamed Game'}</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Buy-In</span>
                <span className="value">{formatCurrency(buyIn)}</span>
              </div>
              <div className="summary-item">
                <span className="label">Entries</span>
                <span className="value">{entries}x</span>
              </div>
              <div className="summary-item">
                <span className="label">Total investiert</span>
                <span className="value invested">{formatCurrency(totalInvested)}</span>
              </div>
            </div>
          </div>

          {/* End Game Form */}
          <form className="end-game-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="winnings">GEWINN (WINNINGS) IN $</label>
              <input
                id="winnings"
                type="number"
                step="0.01"
                min="0"
                value={winnings}
                onChange={(e) => setWinnings(e.target.value)}
                placeholder="0"
                autoFocus
                disabled={isSubmitting}
              />
              <span className="input-hint">
                💡 Tipp: Gib 0 ein wenn du ausgeschieden bist, oder den gewonnenen Betrag
              </span>
            </div>

            {/* Profit Calculation */}
            {winnings && (
              <div className="profit-calculation">
                <div className="calc-row">
                  <span>Winnings:</span>
                  <span>{formatCurrency(winningsAmount)}</span>
                </div>
                <div className="calc-row neutral">
                  <span>Buy-Ins (bereits abgezogen):</span>
                  <span>-{formatCurrency(totalInvested)}</span>
                </div>
                <div className="calc-row total">
                  <span>Net Profit/Loss (gesamt):</span>
                  <span className={netProfit >= 0 ? 'positive' : 'negative'}>
                    {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
                  </span>
                </div>
                <div className="calc-row highlight">
                  <span>➕ Zur Bankroll hinzugefügt:</span>
                  <span className="positive">
                    +{formatCurrency(winningsAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="info-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              <span>
                {winningsAmount > 0 
                  ? `Deine Bankroll wird um ${formatCurrency(winningsAmount)} erhöht (nur Winnings, Buy-Ins bereits abgezogen)`
                  : 'Deine Bankroll bleibt unverändert (Buy-Ins bereits abgezogen beim Game-Start)'
                }
              </span>
            </div>
          </form>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="btn-submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-small"></span>
                Wird beendet...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Game beenden
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndGameModal;