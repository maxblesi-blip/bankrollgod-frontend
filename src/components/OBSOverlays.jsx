// src/components/OBSOverlays.jsx
// KORRIGIERTE VERSION - Production-ready OBS Browser Overlays für BankrollGod

import React, { useState, useEffect } from 'react';

// Environment-spezifische API URL
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  } else {
    // Production API URL - ersetze mit deiner echten Backend URL
    return process.env.REACT_APP_BACKEND_URL || 'https://bankrollgod-backend.onrender.com';
  }
};

// Utility Functions
const formatCurrency = (amount, currency = 'EUR') => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
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
const negativeStyle = { color: '#dc2626' };

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
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
`;

// ✅ KORRIGIERTE Live-Daten Hook
const useLiveData = (bankrollId) => {
  const [data, setData] = useState({
    activeSession: {
      total_buyins: 0,
      total_cashes: 0,
      cash_count: 0,
      session_name: "Lädt...",
      profit: 0,
      games_count: 0,
      status: 'inactive'
    },
    activeBankroll: {
      name: "Lädt...",
      current_amount: 0,
      starting_amount: 0,
      total_profit: 0,
      currency: "EUR"
    },
    isLoading: true,
    lastUpdate: null,
    error: null
  });
  
  useEffect(() => {
    const apiBaseUrl = getApiBaseUrl();
    
    const fetchBankrollData = async () => {
      try {
        if (!bankrollId || !apiBaseUrl) {
          throw new Error('Bankroll ID oder API URL fehlt');
        }

        console.log(`🎥 Fetching OBS data for bankroll ${bankrollId} from ${apiBaseUrl}`);
        
        // ✅ KORRIGIERTE API-Aufrufe mit den neuen OBS-Endpunkten
        const [bankrollResponse, sessionResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/obs/bankroll/${bankrollId}`),
          fetch(`${apiBaseUrl}/api/obs/session/${bankrollId}/active`)
        ]);
        
        if (bankrollResponse.ok && sessionResponse.ok) {
          const bankrollResult = await bankrollResponse.json();
          const sessionResult = await sessionResponse.json();
          
          if (bankrollResult.success && sessionResult.success) {
            console.log('✅ OBS Data loaded successfully');
            console.log('📊 Session Data:', sessionResult.data);
            console.log('💰 Bankroll Data:', bankrollResult.data);
            
            setData({
              activeSession: {
                ...sessionResult.data,
                // ✅ WICHTIG: Buy-ins kommen bereits korrekt berechnet vom Backend
                total_buyins: sessionResult.data.total_buyins || 0,
                total_cashes: sessionResult.data.total_cashes || 0,
                cash_count: sessionResult.data.cash_count || 0,
                profit: sessionResult.data.profit || 0,
                session_name: sessionResult.data.session_name || 'Keine aktive Session',
                games_count: sessionResult.data.games_count || 0,
                status: sessionResult.data.status || 'inactive'
              },
              activeBankroll: {
                ...bankrollResult.data,
                // ✅ Bankroll-Daten kommen korrekt vom Backend
                current_amount: bankrollResult.data.current_amount || 0,
                starting_amount: bankrollResult.data.starting_amount || 0,
                total_profit: bankrollResult.data.total_profit || 0,
                name: bankrollResult.data.name || 'Unbekannte Bankroll',
                currency: bankrollResult.data.currency || 'EUR'
              },
              isLoading: false,
              lastUpdate: new Date().toLocaleTimeString(),
              error: null
            });
            return;
          }
        }
        
        throw new Error(`API Error: Bankroll ${bankrollResponse.status}, Session ${sessionResponse.status}`);
        
      } catch (error) {
        console.error('❌ OBS API Error:', error);
        
        // ✅ Bessere Fehlerbehandlung
        setData(prevData => ({
          activeSession: {
            total_buyins: 0,
            total_cashes: 0,
            cash_count: 0,
            session_name: `Offline (Error: ${error.message})`,
            profit: 0,
            games_count: 0,
            status: 'error'
          },
          activeBankroll: {
            name: `Bankroll ${bankrollId} (Offline)`,
            current_amount: 0,
            starting_amount: 0,
            total_profit: 0,
            currency: "EUR"
          },
          isLoading: false,
          lastUpdate: new Date().toLocaleTimeString(),
          error: error.message
        }));
      }
    };

    // Sofort laden
    fetchBankrollData();
    
    // ✅ Update alle 3 Sekunden für schnellere Live-Daten
    const interval = setInterval(fetchBankrollData, 3000);
    
    return () => clearInterval(interval);
  }, [bankrollId]);

  return data;
};

// ✅ KORRIGIERTE Session Buy-Ins Overlay
export const SessionBuyInsOverlay = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bankrollId = urlParams.get('bankroll');
  
  const { activeSession, activeBankroll, isLoading, error } = useLiveData(bankrollId);
  
  return (
    <div style={overlayContainerStyle}>
      <style>{globalCSS}</style>
      <div style={{
        ...overlayBaseStyle, 
        flexDirection: 'column', 
        gap: '8px', 
        width: '180px',
        height: '80px',
        opacity: isLoading ? 0.7 : 1,
        borderColor: error ? '#dc2626' : '#0d5f3f'
      }}>
        <div style={labelStyle}>
          {error ? 'ERROR' : 'Buy-Ins'}
        </div>
        <div style={{...valueStyle, ...goldStyle}}>
          {error 
            ? 'N/A' 
            : formatCurrency(activeSession.total_buyins, activeBankroll.currency)
          }
        </div>
        {bankrollId && !error && (
          <div style={{...labelStyle, fontSize: '0.7rem', opacity: 0.6}}>
            {activeSession.games_count} Games
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ KORRIGIERTE Session Cashes Overlay
export const SessionCashesOverlay = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bankrollId = urlParams.get('bankroll');
  
  const { activeSession, activeBankroll, isLoading, error } = useLiveData(bankrollId);
  
  return (
    <div style={overlayContainerStyle}>
      <style>{globalCSS}</style>
      <div style={{
        ...overlayBaseStyle, 
        flexDirection: 'column', 
        gap: '8px', 
        width: '180px',
        height: '80px',
        opacity: isLoading ? 0.7 : 1,
        borderColor: error ? '#dc2626' : '#0d5f3f'
      }}>
        <div style={labelStyle}>
          {error ? 'ERROR' : 'Cashes'}
        </div>
        <div style={{...valueStyle, ...positiveStyle}}>
          {error 
            ? 'N/A'
            : formatCurrency(activeSession.total_cashes, activeBankroll.currency)
          }
        </div>
        {bankrollId && !error && (
          <div style={{...labelStyle, fontSize: '0.7rem', opacity: 0.6}}>
            {activeSession.cash_count} Wins
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ KORRIGIERTE Bankroll Balance Overlay
export const BankrollBalanceOverlay = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bankrollId = urlParams.get('bankroll');
  
  const { activeBankroll, isLoading, error } = useLiveData(bankrollId);
  
  const isProfit = activeBankroll.total_profit >= 0;
  
  return (
    <div style={overlayContainerStyle}>
      <style>{globalCSS}</style>
      <div style={{
        ...overlayBaseStyle, 
        flexDirection: 'column', 
        gap: '6px', 
        width: '220px',
        height: '100px',
        opacity: isLoading ? 0.7 : 1,
        borderColor: error ? '#dc2626' : '#0d5f3f'
      }}>
        <div style={{...labelStyle, fontSize: '0.8rem'}}>
          {error ? 'ERROR' : activeBankroll.name}
        </div>
        <div style={{...valueStyle, fontSize: '2rem'}}>
          {error 
            ? 'N/A'
            : formatCurrency(activeBankroll.current_amount, activeBankroll.currency)
          }
        </div>
        {!error && (
          <div style={{
            ...labelStyle,
            color: isProfit ? positiveStyle.color : negativeStyle.color,
            fontSize: '0.9rem'
          }}>
            {isProfit ? '+' : ''}{formatCurrency(activeBankroll.total_profit, activeBankroll.currency)} Total
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ KORRIGIERTE Cash Count Overlay
export const CashCountOverlay = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bankrollId = urlParams.get('bankroll');
  
  const { activeSession, isLoading, error } = useLiveData(bankrollId);
  
  return (
    <div style={overlayContainerStyle}>
      <style>{globalCSS}</style>
      <div style={{
        ...overlayBaseStyle, 
        flexDirection: 'column', 
        gap: '4px', 
        width: '120px',
        height: '80px',
        opacity: isLoading ? 0.7 : 1,
        borderColor: error ? '#dc2626' : '#0d5f3f'
      }}>
        <div style={{fontSize: '1.2rem', margin: '0'}}>🏆</div>
        <div style={{...valueStyle, ...goldStyle, fontSize: '2rem'}}>
          {error ? '?' : activeSession.cash_count}
        </div>
        <div style={{...labelStyle, fontSize: '0.8rem'}}>
          {error ? 'ERROR' : 'Cashes'}
        </div>
      </div>
    </div>
  );
};

// ✅ KORRIGIERTE Session Profit Overlay
export const SessionProfitOverlay = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bankrollId = urlParams.get('bankroll');
  
  const { activeSession, activeBankroll, isLoading, error } = useLiveData(bankrollId);
  
  const sessionProfit = activeSession.profit;
  const isProfit = sessionProfit >= 0;
  
  return (
    <div style={overlayContainerStyle}>
      <style>{globalCSS}</style>
      <div style={{
        ...overlayBaseStyle, 
        flexDirection: 'column', 
        gap: '6px', 
        width: '160px',
        height: '80px',
        opacity: isLoading ? 0.7 : 1,
        borderColor: error ? '#dc2626' : (isProfit ? '#16a34a' : '#dc2626'),
        background: error 
          ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(153, 27, 27, 0.9) 100%)'
          : isProfit 
            ? 'linear-gradient(135deg, rgba(22, 163, 74, 0.9) 0%, rgba(13, 95, 63, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(153, 27, 27, 0.9) 100%)'
      }}>
        <div style={labelStyle}>
          {error ? 'ERROR' : 'Session P/L'}
        </div>
        <div style={{
          ...valueStyle, 
          color: error ? '#ffffff' : (isProfit ? '#ffffff' : '#ffffff'),
          fontSize: '1.4rem'
        }}>
          {error 
            ? 'N/A'
            : `${isProfit ? '+' : ''}${formatCurrency(sessionProfit, activeBankroll.currency)}`
          }
        </div>
      </div>
    </div>
  );
};

// Overlay Index (für Testing und Setup)
export const OBSOverlaysIndex = () => {
  const overlays = [
    { name: 'Session Buy-Ins', path: '/obs/buyins', size: '180x80px', description: '✅ KORRIGIERT: Total Buy-Ins (buy_in × entries) der aktuellen Session' },
    { name: 'Session Cashes', path: '/obs/cashes', size: '180x80px', description: '✅ KORRIGIERT: Total Cash-Outs der aktuellen Session' },
    { name: 'Bankroll Balance', path: '/obs/bankroll', size: '220x100px', description: '✅ KORRIGIERT: Aktuelle Bankroll mit korrektem Gesamtprofit aus Backend' },
    { name: 'Cash Count', path: '/obs/cash-count', size: '120x80px', description: 'Anzahl erfolgreicher Cash-Outs' },
    { name: 'Session Profit/Loss', path: '/obs/session-profit', size: '160x80px', description: '✅ KORRIGIERT: Profit/Verlust (Cashes - Buy-ins)' }
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
        marginBottom: '1rem'
      }}>
        🎥 BankrollGod OBS Overlays - KORRIGIERT
      </h1>
      
      <p style={{
        textAlign: 'center',
        color: '#a0a0a0',
        marginBottom: '1rem',
        fontSize: '1.1rem'
      }}>
        Live-Updates alle 3 Sekunden • Buy-ins = buy_in × entries • Bankroll aus Backend
      </p>

      <div style={{
        background: 'rgba(22, 163, 74, 0.1)',
        border: '2px solid #16a34a',
        borderRadius: '12px',
        padding: '1rem',
        margin: '0 auto 3rem',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <h3 style={{color: '#16a34a', margin: '0 0 0.5rem 0'}}>✅ PROBLEME BEHOBEN</h3>
        <ul style={{color: '#a0a0a0', textAlign: 'left', margin: '0', paddingLeft: '1.5rem'}}>
          <li>Buy-ins werden jetzt korrekt als <strong>buy_in × entries</strong> berechnet</li>
          <li>Bankroll-Information kommt direkt aus dem Backend</li>
          <li>Bessere Fehlerbehandlung bei API-Problemen</li>
          <li>Schnellere Updates (3 Sekunden statt 5)</li>
        </ul>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '2rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {overlays.map((overlay, index) => (
          <div key={index} style={{
            background: 'rgba(26, 26, 26, 0.8)',
            border: '2px solid #0d5f3f',
            borderRadius: '15px',
            padding: '2rem',
            textAlign: 'center',
            transition: 'transform 0.3s ease, border-color 0.3s ease'
          }}>
            <h3 style={{color: '#fbbf24', marginBottom: '0.5rem', fontSize: '1.4rem'}}>
              {overlay.name}
            </h3>
            <p style={{color: '#a0a0a0', marginBottom: '0.5rem', fontSize: '0.9rem'}}>
              {overlay.description}
            </p>
            <span style={{
              background: '#0d5f3f',
              color: '#fbbf24',
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}>
              {overlay.size}
            </span>
            
            {/* Live Preview */}
            <div style={{
              background: '#000',
              borderRadius: '12px',
              margin: '1.5rem 0',
              height: '100px',
              overflow: 'hidden',
              border: '2px solid #0d5f3f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <iframe 
                src={`${overlay.path}?bankroll=demo`}
                width="100%" 
                height="100"
                frameBorder="0"
                title={overlay.name}
                style={{border: 'none', transform: 'scale(0.8)'}}
              />
            </div>
            
            <div style={{
              background: 'rgba(13, 95, 63, 0.2)',
              color: '#fbbf24',
              padding: '1rem',
              borderRadius: '10px',
              fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              wordBreak: 'break-all',
              border: '1px solid #0d5f3f'
            }}>
              {window.location.origin}{overlay.path}?bankroll=YOUR_BANKROLL_ID
            </div>
            
            <div style={{display: 'flex', gap: '0.75rem'}}>
              <a 
                href={`${overlay.path}?bankroll=demo`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #0d5f3f, #16a34a)',
                  color: '#fbbf24',
                  padding: '0.8rem 1.2rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  flex: '1',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0px)'}
              >
                👁️ Preview Demo
              </a>
              <button 
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}${overlay.path}?bankroll=YOUR_BANKROLL_ID`)}
                style={{
                  background: 'rgba(251, 191, 36, 0.1)',
                  color: '#fbbf24',
                  border: '2px solid #fbbf24',
                  padding: '0.8rem 1.2rem',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(251, 191, 36, 0.2)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(251, 191, 36, 0.1)';
                  e.target.style.transform = 'translateY(0px)';
                }}
              >
                📋 Copy URL
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{
        maxWidth: '800px',
        margin: '4rem auto 0',
        padding: '2rem',
        background: 'rgba(26, 26, 26, 0.6)',
        border: '2px solid #0d5f3f',
        borderRadius: '15px'
      }}>
        <h3 style={{color: '#fbbf24', textAlign: 'center', marginBottom: '1.5rem'}}>
          🎯 Setup in OBS Studio
        </h3>
        <ol style={{
          color: '#a0a0a0',
          paddingLeft: '1.5rem',
          lineHeight: '1.8',
          fontSize: '1rem'
        }}>
          <li><strong>Source hinzufügen</strong> → Browser Source</li>
          <li><strong>URL einfügen</strong> (ersetze YOUR_BANKROLL_ID mit echter Bankroll ID)</li>
          <li><strong>Größe einstellen</strong> entsprechend Badge (z.B. 180x80 für Buy-ins)</li>
          <li><strong>"Refresh when scene becomes active"</strong> aktivieren</li>
          <li><strong>Backend API:</strong> Stelle sicher dass /api/obs/ Routen verfügbar sind</li>
        </ol>
        
        <div style={{
          background: 'rgba(22, 163, 74, 0.1)',
          border: '1px solid #16a34a',
          borderRadius: '8px',
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <p style={{color: '#16a34a', margin: '0', fontSize: '0.9rem'}}>
            ℹ️ <strong>Backend-Setup erforderlich:</strong> Stelle sicher, dass die neue obs.js Route in deinem Express-Server eingebunden ist!
          </p>
        </div>
      </div>
    </div>
  );
};