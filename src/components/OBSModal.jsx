// src/components/OBSModal.jsx
import React from 'react';
import './OBSModal.css';

const OBSModal = ({ bankroll, onClose }) => {
  const baseURL = window.location.origin;
  
  const obsURLs = [
    {
      name: '💰 Session Buy-Ins',
      url: `${baseURL}/obs/buyins?bankroll=${bankroll.id}`,
      size: '180x80px',
      description: 'Zeigt Buy-Ins der aktuellen Session'
    },
    {
      name: '🏆 Session Cashes', 
      url: `${baseURL}/obs/cashes?bankroll=${bankroll.id}`,
      size: '180x80px',
      description: 'Zeigt Cashes der aktuellen Session'
    },
    {
      name: '💎 Bankroll Balance',
      url: `${baseURL}/obs/bankroll?bankroll=${bankroll.id}`,
      size: '200x100px',
      description: 'Aktuelle Balance mit Profit/Loss'
    },
    {
      name: '📊 Cash Count',
      url: `${baseURL}/obs/cash-count?bankroll=${bankroll.id}`,
      size: '120x80px',
      description: 'Anzahl Cashes der Session'
    }
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    console.log('URL kopiert:', text);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content obs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            🎥 OBS Integration - {bankroll.name}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="obs-modal-body">
          <div className="obs-info">
            <p>Browser Sources für <strong>{bankroll.name}</strong> in OBS Studio:</p>
          </div>

          <div className="obs-urls-grid">
            {obsURLs.map((overlay, index) => (
              <div key={index} className="obs-url-card">
                <div className="obs-card-header">
                  <span className="obs-name">{overlay.name}</span>
                  <span className="obs-size-badge">{overlay.size}</span>
                </div>
                
                <p className="obs-description">{overlay.description}</p>
                
                <div className="obs-url-display">
                  <code className="obs-url">{overlay.url}</code>
                  <button 
                    className="copy-url-btn"
                    onClick={() => copyToClipboard(overlay.url)}
                    title="URL kopieren"
                  >
                    📋
                  </button>
                </div>
                
                <div className="obs-card-actions">
                  <a 
                    href={overlay.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="preview-btn"
                  >
                    👁️ Preview
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="obs-setup-hint">
            <h4>🎯 Setup in OBS:</h4>
            <ol>
              <li>Source hinzufügen → Browser Source</li>
              <li>URL kopieren und einfügen</li>
              <li>Größe entsprechend Badge einstellen</li>
              <li>"Refresh when scene becomes active" aktivieren</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OBSModal;