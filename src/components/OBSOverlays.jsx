// src/components/OBSOverlays.jsx
// Production-ready OBS Browser Overlays für BankrollGod

import React, { useState, useEffect } from 'react';

// Utility Functions
const formatCurrency = (amount, currency = 'EUR') => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Production-ready Styles (ohne CSS-Variablen)
const overlayBaseStyle = {
  background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(13, 95, 63, 0.9) 100%)',
  border: '2px solid #0d5f3f',
  borderRadius: '12px',
  padding: '16px',
  color: '#ffffff',
  fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  fontWeight: '600',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  width: '100%',
  height: '80px',
  margin: '0',
  overflow: 'hidden',
  animation: 'fadeIn 0.5s ease-out'
};

const overlayContainerStyle = {
  margin: '0',
  padding: '0',
  width: '100vw',
  height: '100vh',
  backgroundColor: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden'
};

const valueStyle = {
  fontSize: '1.8rem',
  fontWeight: '700',
  color: '#ffffff',
  margin: '0'
};

const labelStyle = {
  fontSize: '0.9rem',
  color: '#a0a0a0',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '4px'
};

const positiveStyle = { color: '#16a34a' };
const goldStyle = { color: '#fbbf24' };

// CSS für Animationen
const globalCSS = `
  body { 
    margin: 0; 
    padding: 0; 
    overflow: hidden; 
    background: transparent; 
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
`;

// Hook für Live-Daten mit Bankroll-Parameter
const useLiveData = (bankrollId) => {
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
    const fetchBankrollData = async () => {
      try {
        if (bankrollId) {
          // Spezifische Bankroll laden
          const bankrollResponse = await fetch(`http://localhost:3001/api/bankrolls/${bankrollId}`);
          const bankroll = await bankrollResponse.json();
          
          // Aktive Session der Bankroll laden
          const sessionResponse = await fetch(`http://localhost:3001/api/bankrolls/${bankrollId}/sessions/active`);
          const session = sessionResponse.ok ? await sessionResponse.json() : null;
          
          setData({
            activeSession: session ? {
              total_buyins: session.total_buyins || 0,
              total_cashes: session.total_cashes || 0,
              cash_count: session.cash_count || 0,
              session_name: session.name || "Aktive Session"
            } : {
              total_buyins: 0,
              total_cashes: 0,
              cash_count: 0,
              session_name: "Keine aktive Session"
            },
            activeBankroll: {
              name: bankroll.name,
              current_amount: bankroll.current_amount,
              starting_amount: bankroll.starting_amount,
              currency: bankroll.currency
            }
          });
        } else {
          // Fallback zu Mock-Daten wenn keine Bankroll-ID
          setData({
            activeSession: {
              total_buyins: 150.00,
              total_cashes: 280.00,
              cash_count: 3,
              session_name: "Demo Session"
            },
            activeBankroll: {
              name: "Demo Bankroll",
              current_amount: 850.00,
              starting_amount: 700.00,
              currency: "EUR"
            }
          });
        }
      } catch (error) {
        console.error('Bankroll data fetch error:', error);
        // Fallback zu Demo-Daten bei API-Fehlern
        setData({
          activeSession: {
            total_buyins: 150.00,
            total_cashes: 280.00,
            cash_count: 3,
            session_name: "Demo Session (API Fehler)"
          },
          activeBankroll: {
            name: "Demo Bankroll (Offline)",
            current_amount: 850.00,
            starting_amount: 700.00,
            currency: "EUR"
          }
        });
      }
    };

    // Sofort laden
    fetchBankrollData();
    
    // Update alle 10 Sekunden
    const interval = setInterval(fetchBankrollData, 10000);
    
    return () => clearInterval(interval);
  }, [bankrollId]);

  return data;
};

// 1. Session Buy-Ins Overlay
export const SessionBuyInsOverlay = () => {
  // URL-Parameter auslesen
  const urlParams = new URLSearchParams(window.location.search);
  const bankrollId = urlParams.get('bankroll');
  
  const { activeSession } = useLiveData(bankrollId);
  
  return (
    <div style={overlayContainerStyle}>
      <style>{globalCSS}</style>
      <div style={{
        ...overlayBaseStyle, 
        flexDirection: 'column', 
        gap: '8px', 
        width: '180px',
        height: '80px'
      }}>
        <div style={labelStyle}>Buy-Ins</div>
        <div style={{...valueStyle, ...goldStyle}}>
          {formatCurrency(activeSession.total_buyins)}
        </div>
      </div>
    </div>
  );
};

// 2. Session Cashes Overlay
export const SessionCashesOverlay = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bankrollId = urlParams.get('bankroll');
  
  const { activeSession } = useLiveData(bankrollId);
  
  return (
    <div style={overlayContainerStyle}>
      <style>{globalCSS}</style>
      <div style={{
        ...overlayBaseStyle, 
        flexDirection: 'column', 
        gap: '8px', 
        width: '180px',
        height: '80px'
      }}>
        <div style={labelStyle}>Cashes</div>
        <div style={{...valueStyle, ...positiveStyle}}>
          {formatCurrency(activeSession.total_cashes)}
        </div>
      </div>
    </div>
  );
};

// 3. Bankroll Stand Overlay
export const BankrollStandOverlay = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bankrollId = urlParams.get('bankroll');
  
  const { activeBankroll } = useLiveData(bankrollId);
  const profit = activeBankroll.current_amount - activeBankroll.starting_amount;
  const isProfit = profit >= 0;
  
  return (
    <div style={overlayContainerStyle}>
      <style>{globalCSS}</style>
      <div style={{
        ...overlayBaseStyle, 
        flexDirection: 'column', 
        gap: '4px', 
        width: '200px',
        height: '100px'
      }}>
        <div style={{...labelStyle, ...goldStyle}}>{activeBankroll.name}</div>
        <div style={{...valueStyle, fontSize: '1.6rem'}}>
          {formatCurrency(activeBankroll.current_amount, activeBankroll.currency)}
        </div>
        <div style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: isProfit ? '#16a34a' : '#dc2626',
          margin: '0'
        }}>
          {isProfit ? '+' : ''}{formatCurrency(profit, activeBankroll.currency)}
        </div>
      </div>
    </div>
  );
};

// 4. Cash Count Overlay
export const CashCountOverlay = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bankrollId = urlParams.get('bankroll');
  
  const { activeSession } = useLiveData(bankrollId);
  
  return (
    <div style={overlayContainerStyle}>
      <style>{globalCSS}</style>
      <div style={{
        ...overlayBaseStyle, 
        flexDirection: 'column', 
        gap: '4px', 
        width: '120px',
        height: '80px'
      }}>
        <div style={{fontSize: '1.2rem', margin: '0'}}>🏆</div>
        <div style={{...valueStyle, ...goldStyle, fontSize: '2rem'}}>
          {activeSession.cash_count}
        </div>
        <div style={{...labelStyle, fontSize: '0.8rem'}}>Cashes</div>
      </div>
    </div>
  );
};

// Overlay Index (für Testing)
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
        gridTemplateColumns: 'repeat(auto-fit, minmin(300px, 1fr))',
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
            
            {/* Live Preview */}
            <div style={{
              background: '#000',
              borderRadius: '8px',
              margin: '1rem 0',
              height: '80px',
              overflow: 'hidden',
              border: '1px solid #0d5f3f'
            }}>
              <iframe 
                src={overlay.path}
                width="100%" 
                height="80"
                frameBorder="0"
                title={overlay.name}
                style={{border: 'none'}}
              />
            </div>
            
            <div style={{
              background: '#0d5f3f',
              color: '#fbbf24',
              padding: '0.8rem',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              marginBottom: '1rem',
              wordBreak: 'break-all'
            }}>
              {window.location.origin}{overlay.path}
            </div>
            
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <a 
                href={overlay.path}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #0d5f3f, #16a34a)',
                  color: '#fbbf24',
                  padding: '0.8rem 1rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  flex: '1',
                  textAlign: 'center'
                }}
              >
                🔗 Preview
              </a>
              <button 
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}${overlay.path}`)}
                style={{
                  background: 'rgba(251, 191, 36, 0.2)',
                  color: '#fbbf24',
                  border: '2px solid #fbbf24',
                  padding: '0.8rem 1rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                📋 Copy URL
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};