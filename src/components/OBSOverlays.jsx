// src/components/OBSOverlays.jsx
// Production-ready OBS Browser Overlays für BankrollGod - TRANSPARENT VERSION

import React, { useState, useEffect } from 'react';

// Environment-spezifische API URL
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  } else {
    // Production API URL - mit den neuen OBS-Endpunkten
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

// ✅ TRANSPARENT STYLES: Keine Hintergründe, für OBS optimiert
const overlayBaseStyle = {
  background: 'transparent', // ✅ Komplett transparent
  border: 'none', // ✅ Keine Rahmen
  borderRadius: '0',
  padding: '8px 12px',
  color: '#ffffff',
  fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  fontWeight: '700',
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)', // ✅ Schatten für Lesbarkeit
  display: 'flex',
  alignItems: 'flex-start', // ✅ Links oben ausrichten
  justifyContent: 'flex-start',
  textAlign: 'left',
  width: 'auto',
  height: 'auto',
  margin: '0',
  overflow: 'visible',
  position: 'absolute',
  top: '10px', // ✅ Links oben positioniert
  left: '10px'
};

const overlayContainerStyle = {
  margin: '0',
  padding: '0',
  width: '100vw',
  height: '100vh',
  backgroundColor: 'transparent', // ✅ Transparent
  display: 'block',
  position: 'absolute',
  top: '0',
  left: '0',
  overflow: 'hidden'
};

const valueStyle = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#ffffff',
  margin: '0',
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
};

const labelStyle = {
  fontSize: '12px',
  color: '#cccccc',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: '2px',
  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
};

const positiveStyle = { color: '#00ff88' };
const goldStyle = { color: '#fbbf24' };
const negativeStyle = { color: '#ff6666' };

// ✅ TRANSPARENT CSS: Entfernt alle Hintergründe komplett
const globalCSS = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body, html { 
    margin: 0; 
    padding: 0; 
    overflow: hidden; 
    background: transparent !important;
  }
  
  /* ✅ HEADER VERSTECKEN */
  .header, .nav, .navigation, .navbar, .top-bar, .app-header, nav,
  [class*="header"], [class*="nav"] {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
  }
  
  /* ✅ ALLE HINTERGRÜNDE ENTFERNEN */
  .card, .panel, .widget, .box, .container,
  div[class*="bg-"], div[class*="background"],
  [style*="background"], [style*="Background"] {
    background: transparent !important;
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }
`;

// ✅ UPDATED HOOK: Verwendet neue OBS API-Endpunkte
const useLiveData = (bankrollId) => {
  const [data, setData] = useState({
    activeSession: {
      total_buyins: 0,
      total_cashes: 0,
      cash_count: 0,
      session_name: "Lädt...",
      profit: 0
    },
    activeBankroll: {
      name: "Lädt...",
      current_amount: 0,
      starting_amount: 0,
      currency: "EUR"
    },
    isLoading: true,
    lastUpdate: null
  });
  
  useEffect(() => {
    const apiBaseUrl = getApiBaseUrl();
    
    const fetchBankrollData = async () => {
      try {
        if (bankrollId && apiBaseUrl) {
          console.log(`🔧 Fetching OBS data for bankroll ${bankrollId}`);
          
          // ✅ NEUE OBS-ENDPUNKTE verwenden
          const [bankrollResponse, sessionResponse] = await Promise.all([
            fetch(`${apiBaseUrl}/api/obs/bankroll/${bankrollId}`),
            fetch(`${apiBaseUrl}/api/obs/session/${bankrollId}/active`)
          ]);
          
          if (bankrollResponse.ok && sessionResponse.ok) {
            const bankrollResult = await bankrollResponse.json();
            const sessionResult = await sessionResponse.json();
            
            if (bankrollResult.success && sessionResult.success) {
              const bankrollData = bankrollResult.data;
              const sessionData = sessionResult.data;
              
              setData({
                activeSession: {
                  total_buyins: sessionData.total_buyins || 0,
                  total_cashes: sessionData.total_cashes || 0,
                  cash_count: sessionData.cash_count || 0,
                  session_name: sessionData.session_name || "Aktive Session",
                  profit: sessionData.profit || 0
                },
                activeBankroll: {
                  name: bankrollData.name,
                  current_amount: bankrollData.current_amount,
                  starting_amount: bankrollData.initial_amount || bankrollData.starting_amount,
                  currency: bankrollData.currency || 'EUR'
                },
                isLoading: false,
                lastUpdate: new Date().toLocaleTimeString()
              });
              
              console.log('✅ OBS Data loaded:', {
                bankroll: bankrollData.current_amount,
                buyins: sessionData.total_buyins,
                cashes: sessionData.total_cashes,
                profit: sessionData.profit
              });
            }
          } else {
            throw new Error(`OBS API error: ${bankrollResponse.status}/${sessionResponse.status}`);
          }
        } else {
          // Fallback Demo-Daten
          const demoData = {
            activeSession: {
              total_buyins: 60.00,
              total_cashes: 0.00,
              cash_count: 0,
              session_name: "Demo Session",
              profit: -60.00
            },
            activeBankroll: {
              name: "Demo Bankroll",
              current_amount: 681.00,
              starting_amount: 0.00,
              currency: "EUR"
            },
            isLoading: false,
            lastUpdate: new Date().toLocaleTimeString()
          };
          
          setData(demoData);
          console.log('📊 Using OBS demo data');
        }
      } catch (error) {
        console.error('❌ OBS API fetch error:', error);
        
        // Fallback bei API-Fehlern
        setData({
          activeSession: {
            total_buyins: 60.00,
            total_cashes: 0.00,
            cash_count: 0,
            session_name: "Demo (API Offline)",
            profit: -60.00
          },
          activeBankroll: {
            name: "Demo Bankroll",
            current_amount: 681.00,
            starting_amount: 0.00,
            currency: "EUR"
          },
          isLoading: false,
          lastUpdate: new Date().toLocaleTimeString()
        });
      }
    };

    // Sofort laden
    fetchBankrollData();
    
    // ✅ Update alle 3 Sekunden für OBS
    const interval = setInterval(fetchBankrollData, 3000);
    
    return () => clearInterval(interval);
  }, [bankrollId]);

  return data;
};

// ✅ 1. Session Buy-Ins Overlay - TRANSPARENT VERSION
export const SessionBuyInsOverlay = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bankrollId = urlParams.get('bankroll');
  
  const { activeSession, isLoading } = useLiveData(bankrollId);
  
  return (
    <div style={overlayContainerStyle}>
      <style>{globalCSS}</style>
      <div style={{
        ...overlayBaseStyle,
        flexDirection: 'column',
        gap: '4px',
        opacity: isLoading ? 0.7 : 1
      }}>
        <div style={labelStyle}>BUY-INS</div>
        <div style={{...valueStyle, ...goldStyle}}>
          {formatCurrency(activeSession.total_buyins)}
        </div>
      </div>
    </div>
  );
};

// ✅ 2. Session Cashes Overlay - TRANSPARENT VERSION
export const SessionCashesOverlay = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bankrollId = urlParams.get('bankroll');
  
  const { activeSession, isLoading } = useLiveData(bankrollId);
  
  return (
    <div style={overlayContainerStyle}>
      <style>{globalCSS}</style>
      <div style={{
        ...overlayBaseStyle,
        flexDirection: 'column',
        gap: '4px',
        opacity: isLoading ? 0.7 : 1
      }}>
        <div style={labelStyle}>CASHES</div>
        <div style={{...valueStyle, ...positiveStyle}}>
          {formatCurrency(activeSession.total_cashes)}
        </div>
      </div>
    </div>
  );
};

// ✅ 3. Bankroll Stand Overlay - TRANSPARENT VERSION
export const BankrollStandOverlay = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bankrollId = urlParams.get('bankroll');
  
  const { activeBankroll, isLoading } = useLiveData(bankrollId);
  const profit = activeBankroll.current_amount - activeBankroll.starting_amount;
  const isProfit = profit >= 0;
  
  return (
    <div style={overlayContainerStyle}>
      <style>{globalCSS}</style>
      <div style={{
        ...overlayBaseStyle,
        flexDirection: 'column',
        gap: '4px',
        opacity: isLoading ? 0.7 : 1
      }}>
        <div style={{...labelStyle, color: goldStyle.color}}>
          {activeBankroll.name}
        </div>
        <div style={{...valueStyle, fontSize: '26px'}}>
          {formatCurrency(activeBankroll.current_amount, activeBankroll.currency)}
        </div>
        <div style={{
          fontSize: '18px',
          fontWeight: '600',
          color: isProfit ? positiveStyle.color : negativeStyle.color,
          margin: '0',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
        }}>
          {isProfit ? '+' : ''}{formatCurrency(profit, activeBankroll.currency)}
        </div>
      </div>
    </div>
  );
};

// ✅ 4. Cash Count Overlay - TRANSPARENT VERSION
export const CashCountOverlay = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bankrollId = urlParams.get('bankroll');
  
  const { activeSession, isLoading } = useLiveData(bankrollId);
  
  return (
    <div style={overlayContainerStyle}>
      <style>{globalCSS}</style>
      <div style={{
        ...overlayBaseStyle,
        flexDirection: 'column',
        gap: '4px',
        opacity: isLoading ? 0.7 : 1
      }}>
        <div style={{...valueStyle, ...goldStyle, fontSize: '32px'}}>
          {activeSession.cash_count}
        </div>
        <div style={labelStyle}>CASHES</div>
      </div>
    </div>
  );
};

// ✅ 5. Session Profit Overlay - TRANSPARENT VERSION
export const SessionProfitOverlay = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bankrollId = urlParams.get('bankroll');
  
  const { activeSession, activeBankroll, isLoading } = useLiveData(bankrollId);
  const sessionProfit = activeSession.profit || (activeSession.total_cashes - activeSession.total_buyins);
  const isProfit = sessionProfit >= 0;
  
  return (
    <div style={overlayContainerStyle}>
      <style>{globalCSS}</style>
      <div style={{
        ...overlayBaseStyle,
        flexDirection: 'column',
        gap: '4px',
        opacity: isLoading ? 0.7 : 1
      }}>
        <div style={labelStyle}>SESSION P/L</div>
        <div style={{
          ...valueStyle, 
          color: isProfit ? positiveStyle.color : negativeStyle.color,
          fontSize: '22px'
        }}>
          {isProfit ? '+' : ''}{formatCurrency(sessionProfit, activeBankroll.currency)}
        </div>
      </div>
    </div>
  );
};

// ✅ Overlay Index - MINIMAL VERSION (entfernt komplexe UI)
export const OBSOverlaysIndex = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const overlayType = urlParams.get('type') || 'bankroll';
  const bankrollId = urlParams.get('bankroll');

  // ✅ DIREKTE WEITERLEITUNG zu entsprechendem Overlay basierend auf Type
  switch (overlayType) {
    case 'buyins':
      return <SessionBuyInsOverlay />;
    case 'cashes':
      return <SessionCashesOverlay />;
    case 'bankroll':
      return <BankrollStandOverlay />;
    case 'profit':
      return <SessionProfitOverlay />;
    case 'cash-count':
      return <CashCountOverlay />;
    default:
      return <BankrollStandOverlay />;
  }
};

// ✅ LEGACY SUPPORT: Alternative Namen falls verwendet
export const OBSBankrollOverlay = BankrollStandOverlay;
export const BankrollBalanceOverlay = BankrollStandOverlay;