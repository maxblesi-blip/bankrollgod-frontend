// src/components/OBSOverlays.jsx
// Einfache OBS Browser Overlays für BankrollGod

import React, { useState, useEffect } from 'react';

// Echte Daten von BankrollGod API
const getLiveData = async () => {
  try {
    // Bankroll-Daten abrufen
    const bankrollResponse = await fetch('https://bankrollgod-backend.onrender.com/api/bankrolls');
    const bankrolls = await bankrollResponse.json();
    
    // Aktive Bankroll finden
    const activeBankroll = bankrolls.find(b => b.status === 'active') || bankrolls[0];
    
    if (!activeBankroll) {
      throw new Error('Keine Bankroll gefunden');
    }

    // Session-Daten abrufen
    const sessionResponse = await fetch(`https://bankrollgod-backend.onrender.com/api/bankrolls/${activeBankroll.id}/sessions/active`);
    let activeSession = null;
    
    if (sessionResponse.ok) {
      activeSession = await sessionResponse.json();
    }

    return {
      activeSession: activeSession ? {
        total_buyins: activeSession.total_buyins || 0,
        total_cashes: activeSession.total_cashes || 0,
        cash_count: activeSession.cash_count || 0,
        session_name: activeSession.name || "Keine aktive Session"
      } : {
        total_buyins: 0,
        total_cashes: 0,
        cash_count: 0,
        session_name: "Keine aktive Session"
      },
      activeBankroll: {
        name: activeBankroll.name,
        current_amount: activeBankroll.current_amount,
        starting_amount: activeBankroll.starting_amount,
        currency: activeBankroll.currency
      }
    };
  } catch (error) {
    console.error('API Error:', error);
    // Fallback zu Mock-Daten bei Fehlern
    return {
      activeSession: {
        total_buyins: 0,
        total_cashes: 0,
        cash_count: 0,
        session_name: "API Fehler - Keine Daten"
      },
      activeBankroll: {
        name: "Bankroll nicht verfügbar",
        current_amount: 0,
        starting_amount: 0,
        currency: "EUR"
      }
    };
  }
};

// Utility Functions
const formatCurrency = (amount, currency = 'EUR') => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Base Overlay Styles
const overlayBaseStyle = {
  background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(13, 95, 63, 0.9) 100%)',
  border: '2px solid #0d5f3f',
  borderRadius: '12px',
  padding: '1rem',
  color: '#ffffff',
  fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  fontWeight: '600',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  minHeight: '60px',
  animation: 'fadeIn 0.5s ease-out'
};

const valueStyle = {
  fontSize: '1.8rem',
  fontWeight: '700',
  color: '#ffffff'
};

const labelStyle = {
  fontSize: '0.9rem',
  color: '#a0a0a0',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '0.5rem'
};

const positiveStyle = { color: '#16a34a' };
const goldStyle = { color: '#fbbf24' };

// CSS Animation
const globalStyle = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
`;

// Hook für Live-Daten
const useLiveData = () => {
  const [data, setData] = useState({
    activeSession: {
      total_buyins: 0,
      total_cashes: 0,
      cash_count: 0,
      session_name: "Lädt..."
    },
    activeBankroll: {
      name: "Lädt...",
      current_amount: 0,
      starting_amount: 0,
      currency: "EUR"
    }
  });
  
  useEffect(() => {
    const fetchData = async () => {
      const liveData = await getLiveData();
      setData(liveData);
    };

    // Sofort laden
    fetchData();
    
    // Update alle 5 Sekunden
    const interval = setInterval(fetchData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return data;
};

// 1. Session Buy-Ins Overlay
export const SessionBuyInsOverlay = () => {
  const { activeSession } = useLiveData();
  
  return (
    <>
      <style>{globalStyle}</style>
      <div style={{...overlayBaseStyle, flexDirection: 'column', gap: '0.5rem', minWidth: '180px'}}>
        <div style={labelStyle}>Buy-Ins</div>
        <div style={{...valueStyle, ...goldStyle}}>
          {formatCurrency(activeSession.total_buyins)}
        </div>
      </div>
    </>
  );
};

// 2. Session Cashes Overlay
export const SessionCashesOverlay = () => {
  const { activeSession } = useLiveData();
  
  return (
    <>
      <style>{globalStyle}</style>
      <div style={{...overlayBaseStyle, flexDirection: 'column', gap: '0.5rem', minWidth: '180px'}}>
        <div style={labelStyle}>Cashes</div>
        <div style={{...valueStyle, ...positiveStyle}}>
          {formatCurrency(activeSession.total_cashes)}
        </div>
      </div>
    </>
  );
};

// 3. Bankroll Stand Overlay
export const BankrollStandOverlay = () => {
  const { activeBankroll } = useLiveData();
  const profit = activeBankroll.current_amount - activeBankroll.starting_amount;
  const isProfit = profit >= 0;
  
  return (
    <>
      <style>{globalStyle}</style>
      <div style={{...overlayBaseStyle, flexDirection: 'column', gap: '0.5rem', minWidth: '200px'}}>
        <div style={{...labelStyle, ...goldStyle}}>{activeBankroll.name}</div>
        <div style={valueStyle}>
          {formatCurrency(activeBankroll.current_amount, activeBankroll.currency)}
        </div>
        <div style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: isProfit ? '#16a34a' : '#dc2626'
        }}>
          {isProfit ? '+' : ''}{formatCurrency(profit, activeBankroll.currency)}
        </div>
      </div>
    </>
  );
};

// 4. Anzahl Cashes Overlay
export const CashCountOverlay = () => {
  const { activeSession } = useLiveData();
  
  return (
    <>
      <style>{globalStyle}</style>
      <div style={{...overlayBaseStyle, flexDirection: 'column', gap: '0.3rem', minWidth: '120px'}}>
        <div style={{fontSize: '1.2rem'}}>🏆</div>
        <div style={{...valueStyle, ...goldStyle}}>{activeSession.cash_count}</div>
        <div style={{...labelStyle, fontSize: '0.8rem'}}>Cashes</div>
      </div>
    </>
  );
};

// Overlay Index (Optional - zum Testen)
export const OBSOverlaysIndex = () => {
  const overlays = [
    { name: 'Session Buy-Ins', path: '/obs/buyins', size: '180x80px' },
    { name: 'Session Cashes', path: '/obs/cashes', size: '180x80px' },
    { name: 'Bankroll Stand', path: '/obs/bankroll', size: '200x100px' },
    { name: 'Cash Count', path: '/obs/cash-count', size: '120x80px' }
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f0f0f 0%, #083328 100%)',
      minHeight: '100vh',
      padding: '2rem',
      color: '#ffffff',
      fontFamily: 'Segoe UI, sans-serif'
    }}>
      <h1 style={{
        background: 'linear-gradient(135deg, #fbbf24, #d4af37)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontSize: '3rem',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        🎥 BankrollGod OBS Overlays
      </h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {overlays.map((overlay, index) => (
          <div key={index} style={{
            background: 'rgba(26, 26, 26, 0.8)',
            border: '2px solid #0d5f3f',
            borderRadius: '15px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <h3 style={{color: '#fbbf24', marginBottom: '1rem'}}>{overlay.name}</h3>
            <p style={{color: '#a0a0a0', marginBottom: '1rem'}}>Größe: {overlay.size}</p>
            <div style={{
              background: '#0d5f3f',
              color: '#fbbf24',
              padding: '0.8rem',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              marginBottom: '1rem'
            }}>
              http://localhost:3000{overlay.path}
            </div>
            <a 
              href={overlay.path}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'linear-gradient(135deg, #0d5f3f, #16a34a)',
                color: '#fbbf24',
                padding: '0.8rem 1.5rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                display: 'inline-block',
                marginRight: '1rem'
              }}
            >
              🔗 Preview
            </a>
            <button 
              onClick={() => navigator.clipboard.writeText(`http://localhost:3000${overlay.path}`)}
              style={{
                background: 'rgba(251, 191, 36, 0.2)',
                color: '#fbbf24',
                border: '2px solid #fbbf24',
                padding: '0.8rem 1.5rem',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📋 Copy URL
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};