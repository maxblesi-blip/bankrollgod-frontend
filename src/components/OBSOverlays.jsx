import React, { useState, useEffect } from 'react';
import './OBSOverlays.css';

// ✅ MINIMAL OBS COMPONENT: Kein Header, transparent, links oben
const OBSOverlay = () => {
  const [data, setData] = useState({
    bankroll: 0,
    cashes: 0,
    buyins: 0,
    profit: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get bankroll ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const bankrollId = urlParams.get('bankroll') || 'b7bdfe6c-5d02-4f33-8901-272a71087010';
  const overlayType = urlParams.get('type') || 'bankroll'; // bankroll, cashes, buyins, profit

  useEffect(() => {
    fetchData();
    
    // Update every 3 seconds
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [bankrollId]);

  const fetchData = async () => {
    try {
      setError(null);

      // Fetch bankroll data
      const bankrollResponse = await fetch(
        `https://bankrollgod-backend.onrender.com/api/obs/bankroll/${bankrollId}`
      );
      const bankrollResult = await bankrollResponse.json();

      // Fetch session data
      const sessionResponse = await fetch(
        `https://bankrollgod-backend.onrender.com/api/obs/session/${bankrollId}/active`
      );
      const sessionResult = await sessionResponse.json();

      if (bankrollResult.success && sessionResult.success) {
        const bankrollData = bankrollResult.data;
        const sessionData = sessionResult.data;

        setData({
          bankroll: parseFloat(bankrollData.current_amount || 0),
          cashes: parseFloat(sessionData.total_cashes || 0),
          buyins: parseFloat(sessionData.total_buyins || 0),
          profit: parseFloat(sessionData.profit || 0)
        });
      } else {
        setError('Daten konnten nicht geladen werden');
      }

      setLoading(false);
    } catch (err) {
      console.error('OBS Fetch Error:', err);
      setError('Verbindungsfehler');
      setLoading(false);
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="obs-overlay">
        <div className="obs-value">Lädt...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="obs-overlay">
        <div className="obs-value error">{error}</div>
      </div>
    );
  }

  // Render specific overlay based on type
  const renderOverlay = () => {
    switch (overlayType) {
      case 'bankroll':
        return (
          <div className="obs-bankroll">
            <div className="obs-label">BANKROLL</div>
            <div className="obs-value">{formatCurrency(data.bankroll)}</div>
          </div>
        );

      case 'cashes':
        return (
          <div className="obs-cashes">
            <div className="obs-label">CASHES</div>
            <div className="obs-value">{formatCurrency(data.cashes)}</div>
          </div>
        );

      case 'buyins':
        return (
          <div className="obs-buyins">
            <div className="obs-label">BUY-INS</div>
            <div className="obs-value">{formatCurrency(data.buyins)}</div>
          </div>
        );

      case 'profit':
        const isPositive = data.profit >= 0;
        return (
          <div className="obs-session">
            <div className="obs-label">SESSION P/L</div>
            <div className={`obs-value ${isPositive ? 'profit' : 'loss'}`}>
              {isPositive ? '+' : ''}{formatCurrency(data.profit)}
            </div>
          </div>
        );

      default:
        return (
          <div className="obs-bankroll">
            <div className="obs-label">BANKROLL</div>
            <div className="obs-value">{formatCurrency(data.bankroll)}</div>
          </div>
        );
    }
  };

  return (
    <div className="obs-overlay-container">
      {/* ✅ KEIN HEADER - Direkt zum Overlay */}
      {renderOverlay()}
    </div>
  );
};

export default OBSOverlay;