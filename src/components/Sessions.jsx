// src/components/Sessions.jsx
import React, { useState, useEffect } from 'react';
import { bankrollAPI, sessionAPI } from '../services/api';
import SessionHistoryPanel from './SessionHistoryPanel';
import './Sessions.css';

const formatCurrency = (amount, currency = 'EUR') => {
  const formatter = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return formatter.format(amount);
};

const Sessions = () => {
  const [bankrolls, setBankrolls] = useState([]);
  const [selectedBankroll, setSelectedBankroll] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBankrolls();
  }, []);

  const loadBankrolls = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await bankrollAPI.getAll();
      setBankrolls(data);
    } catch (err) {
      setError(err);
      console.error('Error loading bankrolls:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToBankrolls = () => {
    setSelectedBankroll(null);
  };

  if (isLoading) {
    return (
      <div className="sessions-page">
        <div className="loading-state">Lade Bankrolls...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sessions-page">
        <div className="error-state">
          ❌ Fehler beim Laden der Bankrolls
          <button onClick={loadBankrolls} className="btn-retry-small">
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  // Show selected bankroll's sessions
  if (selectedBankroll) {
    return (
      <div className="sessions-page">
        <div className="page-header-with-back">
          <button className="btn-back" onClick={handleBackToBankrolls}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Zurück zu Bankrolls
          </button>
          <h1>{selectedBankroll.name} - Sessions</h1>
        </div>
        
        <SessionHistoryPanel 
          bankrollId={selectedBankroll.id}
          currency={selectedBankroll.currency}
        />
      </div>
    );
  }

  // Show bankrolls list
  return (
    <div className="sessions-page">
      <div className="page-header">
        <h1>📊 Session History</h1>
        <p>Wähle eine Bankroll um die Sessions anzuzeigen</p>
      </div>

      <div className="bankrolls-selection-grid">
        {bankrolls.map(bankroll => {
          const profit = parseFloat(bankroll.current_amount) - parseFloat(bankroll.starting_amount);
          const isProfit = profit >= 0;
          
          return (
            <div 
              key={bankroll.id} 
              className="bankroll-selection-card"
              onClick={() => setSelectedBankroll(bankroll)}
            >
              <div className="bankroll-selection-header">
                <h3>{bankroll.name}</h3>
                <span className={`bankroll-type ${bankroll.type}`}>
                  {bankroll.type === 'online' ? '💻' : '🏢'} {bankroll.type}
                </span>
              </div>
              
              <div className="bankroll-selection-stats">
                <div className="selection-stat">
                  <span className="selection-label">Aktuell</span>
                  <span className="selection-value">
                    {formatCurrency(bankroll.current_amount, bankroll.currency)}
                  </span>
                </div>
                
                <div className="selection-stat">
                  <span className="selection-label">Gewinn</span>
                  <span className={`selection-value ${isProfit ? 'positive' : 'negative'}`}>
                    {isProfit ? '+' : ''}{formatCurrency(profit, bankroll.currency)}
                  </span>
                </div>
              </div>
              
              <div className="selection-footer">
                <span className="selection-hint">Klicken für Sessions →</span>
              </div>
            </div>
          );
        })}
      </div>

      {bankrolls.length === 0 && (
        <div className="empty-state">
          <p>Keine Bankrolls vorhanden</p>
          <small>Erstelle zuerst eine Bankroll im Bankrolls-Menü</small>
        </div>
      )}
    </div>
  );
};

export default Sessions;