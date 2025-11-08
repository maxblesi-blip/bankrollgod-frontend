// src/components/OBSDocumentation.jsx
import React, { useState } from 'react';
import './OBSDocumentation.css';

const OBSDocumentation = () => {
  const [activeTab, setActiveTab] = useState('browser-sources');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard:', text);
    });
  };

  const overlays = [
    {
      name: '💰 Session Buy-Ins',
      url: 'http://localhost:3000/obs/buyins',
      path: '/obs/buyins',
      size: '180x80px',
      description: 'Zeigt die gesamten Buy-Ins der aktuellen Session',
      color: '#fbbf24'
    },
    {
      name: '🏆 Session Cashes',  
      url: 'http://localhost:3000/obs/cashes',
      path: '/obs/cashes',
      size: '180x80px',
      description: 'Zeigt die gesamten Cashes der aktuellen Session',
      color: '#16a34a'
    },
    {
      name: '💎 Bankroll Stand',
      url: 'http://localhost:3000/obs/bankroll', 
      path: '/obs/bankroll',
      size: '200x100px',
      description: 'Aktuelle Bankroll Balance mit Profit/Loss',
      color: '#0d5f3f'
    },
    {
      name: '📊 Cash Count',
      url: 'http://localhost:3000/obs/cash-count',
      path: '/obs/cash-count', 
      size: '120x80px',
      description: 'Anzahl der Cashes in der aktuellen Session',
      color: '#fbbf24'
    }
  ];

  const TabButton = ({ id, children, icon, active, onClick }) => (
    <button
      className={`obs-tab-btn ${active ? 'active' : ''}`}
      onClick={() => onClick(id)}
    >
      {icon} {children}
    </button>
  );

  return (
    <div className="obs-documentation">
  
      {/* Preview Section */}
<div className="obs-preview-section" style={{paddingTop: '2rem'}}>
        <div className="container">
          <h2>🎥 Deine 4 Stream Overlays</h2>
          <div className="overlay-previews">
            {overlays.map((overlay, index) => (
              <div key={index} className="overlay-preview">
                <div className="preview-header">
                  <span className="preview-name">{overlay.name}</span>
                  <span className="preview-size">{overlay.size}</span>
                </div>
                <div className="preview-iframe">
                  <iframe 
                    src={overlay.path}
                    width="100%" 
                    height="80"
                    frameBorder="0"
                    title={overlay.name}
                  />
                </div>
                <div className="preview-actions">
                  <button 
                    className="preview-btn copy-btn"
                    onClick={() => copyToClipboard(overlay.url)}
                  >
                    📋 URL kopieren
                  </button>
                  <a 
                    href={overlay.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="preview-btn open-btn"
                  >
                    🔗 Öffnen
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="obs-nav-tabs">
        <div className="container">
          <div className="obs-tab-buttons">
            <TabButton 
              id="browser-sources" 
              icon="🌐" 
              active={activeTab === 'browser-sources'}
              onClick={setActiveTab}
            >
              Browser Sources
            </TabButton>
            <TabButton 
              id="obs-setup" 
              icon="🎬" 
              active={activeTab === 'obs-setup'}
              onClick={setActiveTab}
            >
              OBS Setup
            </TabButton>
            <TabButton 
              id="troubleshooting" 
              icon="🔧" 
              active={activeTab === 'troubleshooting'}
              onClick={setActiveTab}
            >
              Hilfe
            </TabButton>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="obs-content">
        <div className="container">
          
          {/* BROWSER SOURCES TAB */}
          {activeTab === 'browser-sources' && (
            <div className="obs-tab-content">
              <h2>🌐 Browser Sources für OBS Studio</h2>
              
              <div className="info-box success">
                <strong>✅ Ready to Stream!</strong> Alle 4 Overlays sind sofort einsatzbereit für OBS Browser Sources.
              </div>

              <div className="overlays-grid">
                {overlays.map((overlay, index) => (
                  <div key={index} className="overlay-card">
                    <div className="overlay-card-header">
                      <h3>{overlay.name}</h3>
                      <span className="overlay-size-badge" style={{backgroundColor: overlay.color}}>
                        {overlay.size}
                      </span>
                    </div>
                    
                    <p className="overlay-description">{overlay.description}</p>
                    
                    <div className="overlay-url">
                      <code>{overlay.url}</code>
                      <button 
                        className="url-copy-btn"
                        onClick={() => copyToClipboard(overlay.url)}
                      >
                        📋
                      </button>
                    </div>

                    <div className="overlay-card-actions">
                      <a 
                        href={overlay.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="overlay-action-btn preview"
                      >
                        👁️ Preview
                      </a>
                      <button 
                        className="overlay-action-btn copy"
                        onClick={() => copyToClipboard(overlay.url)}
                      >
                        📋 Copy URL
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="setup-info">
                <h3>🎯 So verwendest du die URLs in OBS:</h3>
                <ol className="setup-steps">
                  <li>OBS Studio öffnen</li>
                  <li>Source hinzufügen → <strong>Browser Source</strong></li>
                  <li>URL von oben kopieren und einfügen</li>
                  <li>Empfohlene Größe einstellen (siehe Badge)</li>
                  <li>✅ <strong>"Refresh when scene becomes active"</strong> aktivieren</li>
                </ol>
              </div>
            </div>
          )}

          {/* OBS SETUP TAB */}
          {activeTab === 'obs-setup' && (
            <div className="obs-tab-content">
              <h2>🎬 OBS Studio Setup Anleitung</h2>
              
              <div className="setup-guide">
                <div className="setup-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Browser Source hinzufügen</h4>
                    <p>Rechtsklick in <strong>Sources</strong> → <strong>Add</strong> → <strong>Browser Source</strong></p>
                  </div>
                </div>

                <div className="setup-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>URL konfigurieren</h4>
                    <p>URL von oben kopieren und in das <strong>URL</strong> Feld einfügen</p>
                  </div>
                </div>

                <div className="setup-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Größe einstellen</h4>
                    <p>Width & Height entsprechend der empfohlenen Größe setzen</p>
                  </div>
                </div>

                <div className="setup-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>Auto-Refresh aktivieren</h4>
                    <p>☑️ <strong>"Refresh browser when scene becomes active"</strong> aktivieren</p>
                  </div>
                </div>
              </div>

              <div className="layout-examples">
                <h3>🎨 Stream Layout Beispiele</h3>
                
                <div className="layout-grid">
                  <div className="layout-example">
                    <h4>💰 Cash Game Layout</h4>
                    <div className="layout-mockup">
                      <div className="mockup-element bankroll">💎 Bankroll</div>
                      <div className="mockup-element game-area">[Poker Table]</div>
                      <div className="mockup-element buyins">💰 Buy-Ins</div>
                      <div className="mockup-element cashes">🏆 Cashes</div>
                    </div>
                  </div>

                  <div className="layout-example">
                    <h4>🏆 Tournament Layout</h4>
                    <div className="layout-mockup">
                      <div className="mockup-element stats-bar">💰 $150 | 🏆 $280 | 📊 3</div>
                      <div className="mockup-element game-area">[Tournament Lobby]</div>
                      <div className="mockup-element bankroll-corner">💎 $850</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TROUBLESHOOTING TAB */}
          {activeTab === 'troubleshooting' && (
            <div className="obs-tab-content">
              <h2>🔧 Hilfe & Troubleshooting</h2>
              
              <div className="faq-section">
                <div className="faq-item">
                  <h4>❓ Overlay lädt nicht in OBS</h4>
                  <div className="faq-answer">
                    <p><strong>Lösung:</strong></p>
                    <ul>
                      <li>URL korrekt kopiert? → <code>http://localhost:3000/obs/...</code></li>
                      <li>React App läuft? → Browser öffnen und URL testen</li>
                      <li>OBS Browser Source Cache leeren → Properties → Refresh</li>
                    </ul>
                  </div>
                </div>

                <div className="faq-item">
                  <h4>❓ Daten werden nicht angezeigt</h4>
                  <div className="faq-answer">
                    <p><strong>Lösung:</strong></p>
                    <ul>
                      <li>Momentan werden Test-Daten angezeigt</li>
                      <li>Für echte Daten: API-Integration in <code>useLiveData()</code> Hook</li>
                      <li>Aktive Session in BankrollGod starten</li>
                    </ul>
                  </div>
                </div>

                <div className="faq-item">
                  <h4>❓ Overlay zu groß/klein</h4>
                  <div className="faq-answer">
                    <p><strong>Lösung:</strong></p>
                    <ul>
                      <li>OBS Browser Source → Properties → Width/Height anpassen</li>
                      <li>Empfohlene Größen siehe Badge bei jedem Overlay</li>
                      <li>Transform & Crop für feine Anpassungen nutzen</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="contact-section">
                <h3>💬 Weitere Hilfe benötigt?</h3>
                <div className="contact-options">
                  <div className="contact-option">
                    <h4>🐛 Bug Report</h4>
                    <p>Fehler gefunden? Erstelle ein GitHub Issue mit Screenshots.</p>
                  </div>
                  <div className="contact-option">
                    <h4>💡 Feature Request</h4>
                    <p>Idee für neue Overlays? Teile sie in der Community!</p>
                  </div>
                  <div className="contact-option">
                    <h4>🤝 Support</h4>
                    <p>BankrollGod Discord für direkte Hilfe von anderen Streamern.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default OBSDocumentation;