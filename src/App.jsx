// src/App.jsx
// Updated App.jsx with Compact Login Modal and ProfileSettings Integration + OBS Routes + OBS DOCS

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, ProtectedRoute, BackendStatus } from './context/AuthContext';
import CompactLoginModal from './components/CompactLoginModal'; // Neue kompakte Version
import ProfileSettings from './components/ProfileSettings'; 
import Dashboard from './components/Dashboard';
import OBSDocumentation from './components/OBSDocumentation';  // ← NEU: OBS DOCS
import './App.css';

// ✅ NEU: Einfache OBS Overlay Imports
import {
  OBSOverlaysIndex,
  SessionBuyInsOverlay,
  SessionCashesOverlay,
  BankrollStandOverlay,
  CashCountOverlay
} from './components/OBSOverlays';

// Clean Unicode-based card suit icons
const SpadeIcon = () => (
  <span style={{ fontSize: '20px', lineHeight: '20px' }}>♠</span>
);

const DiamondIcon = () => (
  <span style={{ fontSize: '20px', lineHeight: '20px' }}>♦</span>
);

const HeartIcon = () => (
  <span style={{ fontSize: '20px', lineHeight: '20px' }}>♥</span>
);

const ClubIcon = () => (
  <span style={{ fontSize: '20px', lineHeight: '20px' }}>♣</span>
);

// Enhanced Header with Compact Login Button and ProfileSettings
const Header = () => {
  const { isAuthenticated, user, logout, backendConnected } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  // Display-Logik Funktionen
  const getDisplayName = () => {
    if (user?.nickname) return user.nickname;
    if (user?.first_name) return user.first_name;
    if (user?.username) return user.username;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getAvatarInitial = () => {
    if (user?.nickname) return user.nickname[0].toUpperCase();
    if (user?.first_name) return user.first_name[0].toUpperCase();
    if (user?.username) return user.username[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const handleProfileSettingsClick = () => {
    setShowProfileSettings(true);
    setShowUserMenu(false);
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
  };

  return (
    <>
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            <SpadeIcon />
            <span className="logo-text">BankrollGod</span>
            <DiamondIcon />
          </Link>
          
          <nav className="nav-menu">
            {isAuthenticated() && (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <Link to="/obs-docs" className="nav-link">🎥 OBS Integration</Link>  {/* ← NEU */}
              </>
            )}
            {!isAuthenticated() && (
              <>
                <a href="#features" className="nav-link">Features</a>
                <a href="#about" className="nav-link">Über uns</a>
                <a href="#pricing" className="nav-link">Preise</a>
              </>
            )}
          </nav>
          
          <div className="header-actions">
            
            {isAuthenticated() ? (
              <div className="user-menu-container">
                <button 
                  className="user-menu-trigger"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="user-avatar">
                    {getAvatarInitial()}
                  </div>
                  <span className="user-name">
                    {getDisplayName()}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 10l5 5 5-5z"/>
                  </svg>
                </button>
                
                {showUserMenu && (
                  <div className="user-menu-dropdown">
                    <div className="user-info">
                      <div className="user-name-full">
                        {user?.first_name && user?.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user?.username || 'User'
                        }
                      </div>
                      <div className="user-email">{user?.email}</div>
                      {user?.nickname && (
                        <div className="user-nickname-badge">
                          🎮 {user.nickname}
                        </div>
                      )}
                    </div>
                    <div className="menu-divider"></div>
                    
                    <button className="menu-item" onClick={handleProfileSettingsClick}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                      </svg>
                      Profile Settings
                    </button>
                    
                    <button className="menu-item logout" onClick={handleLogout}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="login-btn" onClick={handleLoginClick}>
                <span>Login</span>
                <SpadeIcon />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Compact Login Modal */}
      <CompactLoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <ProfileSettings 
          onClose={() => setShowProfileSettings(false)} 
        />
      )}
    </>
  );
};

// Clean Landing Page
const LandingPage = () => {
  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="poker-cards-bg">
          <div className="card card-1">A<SpadeIcon /></div>
          <div className="card card-2">K<HeartIcon /></div>
          <div className="card card-3">Q<DiamondIcon /></div>
          <div className="card card-4">J<ClubIcon /></div>
        </div>
        
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="title-line">Meistere deine</span>
            <span className="title-highlight">Bankroll</span>
            <span className="title-line">wie ein Profi</span>
          </h1>
          
          <p className="hero-subtitle">
            Professionelles Multi-User Bankroll Management für Live und Online Poker
          </p>
          
          <div className="feature-grid" id="features">
            <div className="feature-card">
              <SpadeIcon />
              <h3>Multi-User System</h3>
              <p>Sichere persönliche Accounts mit Datentrennung</p>
            </div>
            <div className="feature-card">
              <DiamondIcon />
              <h3>Cloud Synchronisation</h3>
              <p>Deine Daten überall verfügbar, sicher gespeichert</p>
            </div>
            <div className="feature-card">
              <HeartIcon />
              <h3>Two-Level Tracking</h3>
              <p>Sessions & Games mit professioneller Analyse</p>
            </div>
            <div className="feature-card">
              <ClubIcon />
              <h3>Enterprise-Grade</h3>
              <p>Production-ready mit JWT Authentication</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* About Section */}
      <div className="about-section" id="about">
        <div className="section-content">
          <h2>Warum BankrollGod?</h2>
          <p>
            Baue deine Poker-Bankroll systematisch auf und behalte die volle Kontrolle über deine Finanzen. 
            Mit präzisen Analytics und professionellem Session-Tracking entwickelst du die finanzielle Disziplin, 
            die erfolgreiche Spieler auszeichnet.
          </p>
          
          <div className="benefits-grid">
            <div className="benefit-item">
              <h4>📊 Advanced Analytics</h4>
              <p>Detaillierte Statistiken und Trends deiner Bankroll-Entwicklung mit ROI-Berechnung und Gewinn-/Verlustanalyse</p>
            </div>
            <div className="benefit-item">
              <h4>🎯 Session Tracking</h4>
              <p>Erfasse jede Poker-Session mit allen wichtigen Kennzahlen: Buy-Ins, Cash-Outs, Spielzeit und Notizen</p>
            </div>
            <div className="benefit-item">
              <h4>💻 Desktop Solution</h4>
              <p>Vollwertige Desktop-Anwendung für professionelles Bankroll-Management am PC mit optimierter Performance</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Pricing Section */}
      <div className="pricing-section" id="pricing">
        <div className="section-content">
          <h2>Professional Poker Tracking</h2>
          <div className="pricing-cards">
            <div className="pricing-card">
              <h3>Starter</h3>
              <div className="price">Kostenlos</div>
              <ul>
                <li>Persönlicher Account</li>
                <li>Unbegrenzte Bankrolls</li>
                <li>Cloud Synchronisation</li>
                <li>Basic Analytics</li>
              </ul>
              <button className="pricing-btn">Jetzt starten</button>
            </div>
            <div className="pricing-card featured">
              <h3>Professional</h3>
              <div className="price">€9.99/Monat</div>
              <ul>
                <li>Alles aus Starter</li>
                <li>Advanced Session Analytics</li>
                <li>Export-Funktionen</li>
                <li>Premium Support</li>
                <li>API Access</li>
              </ul>
              <button className="pricing-btn">Pro werden</button>
            </div>
            <div className="pricing-card">
              <h3>Enterprise</h3>
              <div className="price">€29.99/Monat</div>
              <ul>
                <li>Alles aus Professional</li>
                <li>Team-Management</li>
                <li>White-Label Option</li>
                <li>Custom Integrations</li>
                <li>Priority Support</li>
              </ul>
              <button className="pricing-btn">Enterprise</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Router
const AppRouter = () => {
  const { isAuthenticated, loading } = useAuth();

  return (
    <div className="app multi-user">
      <Header />
      
      <main className="main-content">
        <Routes>
          {/* Landing Page */}
          <Route 
            path="/" 
            element={
              isAuthenticated() ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LandingPage />
              )
            } 
          />
          
          {/* Protected Dashboard Route */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute fallback={<Navigate to="/" replace />}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* ✅ NEU: OBS DOKUMENTATION ROUTE - Geschützt für authentifizierte User */}
          <Route 
            path="/obs-docs" 
            element={
              <ProtectedRoute fallback={<Navigate to="/" replace />}>
                <OBSDocumentation />
              </ProtectedRoute>
            } 
          />
          
          {/* ✅ NEU: OBS OVERLAY ROUTES - Nicht geschützt, da für OBS Browser-Quellen */}
          {/* ✅ OBS OVERLAY ROUTES - Einfache Browser Sources */}
<Route path="/obs" element={<OBSOverlaysIndex />} />
<Route path="/obs/buyins" element={<SessionBuyInsOverlay />} />
<Route path="/obs/cashes" element={<SessionCashesOverlay />} />
<Route path="/obs/bankroll" element={<BankrollStandOverlay />} />
<Route path="/obs/cash-count" element={<CashCountOverlay />} />
          
          {/* Legacy redirects */}
          <Route path="/app" element={<Navigate to="/dashboard" replace />} />
          <Route path="/bankrolls" element={<Navigate to="/dashboard" replace />} />
          <Route path="/sessions" element={<Navigate to="/dashboard" replace />} />
          <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRouter />
      </Router>
    </AuthProvider>
  );
};

export default App;