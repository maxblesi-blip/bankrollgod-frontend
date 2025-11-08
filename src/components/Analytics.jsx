import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import './Analytics.css';

const Analytics = ({ sessions = [], bankrolls = [] }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedBankroll, setSelectedBankroll] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Sample data - würde normalerweise aus der Datenbank kommen
  const [analyticsData] = useState({
    sessions: [
      { date: '2024-03-01', profit: 250, cumulative: 250, hands: 312, winrate: 8.2 },
      { date: '2024-03-02', profit: -150, cumulative: 100, hands: 280, winrate: -5.4 },
      { date: '2024-03-03', profit: 480, cumulative: 580, hands: 425, winrate: 11.3 },
      { date: '2024-03-04', profit: 120, cumulative: 700, hands: 190, winrate: 6.3 },
      { date: '2024-03-05', profit: -200, cumulative: 500, hands: 350, winrate: -5.7 },
      { date: '2024-03-06', profit: 650, cumulative: 1150, hands: 510, winrate: 12.7 },
      { date: '2024-03-07', profit: 300, cumulative: 1450, hands: 280, winrate: 10.7 },
    ]
  });

  // Berechnete Metriken
  const calculateMetrics = () => {
    const totalSessions = analyticsData.sessions.length;
    const totalProfit = analyticsData.sessions.reduce((sum, s) => sum + s.profit, 0);
    const totalHands = analyticsData.sessions.reduce((sum, s) => sum + s.hands, 0);
    const winningSessions = analyticsData.sessions.filter(s => s.profit > 0).length;
    const avgProfit = totalProfit / totalSessions;
    const winRate = (winningSessions / totalSessions) * 100;
    
    // Varianz und Standardabweichung
    const variance = analyticsData.sessions.reduce((sum, s) => {
      return sum + Math.pow(s.profit - avgProfit, 2);
    }, 0) / totalSessions;
    const stdDev = Math.sqrt(variance);
    
    // Max Drawdown
    let maxDrawdown = 0;
    let peak = 0;
    analyticsData.sessions.forEach(s => {
      if (s.cumulative > peak) peak = s.cumulative;
      const drawdown = peak - s.cumulative;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    
    // Risk of Ruin (vereinfacht)
    const edge = avgProfit / 100; // Vereinfachte Edge
    const bankroll = 5000; // Beispiel-Bankroll
    const riskOfRuin = Math.exp(-2 * edge * bankroll / variance) * 100;
    
    return {
      totalSessions,
      totalProfit,
      totalHands,
      avgProfit,
      winRate,
      stdDev,
      maxDrawdown,
      riskOfRuin,
      avgWinrate: totalProfit / totalHands * 100, // bb/100
      sharpeRatio: avgProfit / stdDev,
      kellyFraction: edge / (variance / avgProfit),
      itm: 45.3, // Beispielwerte für Turniere
      roi: 18.5,
      abi: 125
    };
  };

  const metrics = calculateMetrics();

  // Diagramm-Farben
  const COLORS = ['#16a34a', '#dc2626', '#fbbf24', '#60a5fa', '#a78bfa'];

  // Stakes Distribution für Pie Chart
  const stakesDistribution = [
    { name: 'NL50', value: 25 },
    { name: 'NL100', value: 35 },
    { name: 'NL200', value: 30 },
    { name: 'NL500', value: 10 }
  ];

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Poker Analytics Dashboard</h1>
        <div className="filter-controls">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-filter"
          >
            <option value="all">Alle Zeit</option>
            <option value="month">Dieser Monat</option>
            <option value="week">Diese Woche</option>
            <option value="year">Dieses Jahr</option>
          </select>
          
          <select 
            value={selectedBankroll}
            onChange={(e) => setSelectedBankroll(e.target.value)}
            className="bankroll-filter"
          >
            <option value="all">Alle Bankrolls</option>
            <option value="online">Online</option>
            <option value="live">Live</option>
          </select>
        </div>
      </div>

      <div className="analytics-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Übersicht
        </button>
        <button 
          className={activeTab === 'performance' ? 'active' : ''}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button 
          className={activeTab === 'risk' ? 'active' : ''}
          onClick={() => setActiveTab('risk')}
        >
          Risk & Varianz
        </button>
        <button 
          className={activeTab === 'advanced' ? 'active' : ''}
          onClick={() => setActiveTab('advanced')}
        >
          Erweiterte Metriken
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="analytics-content">
          {/* Key Metrics Grid */}
          <div className="metrics-grid">
            <div className="metric-card highlight">
              <h3>Gesamt Profit</h3>
              <p className={`metric-value ${metrics.totalProfit >= 0 ? 'positive' : 'negative'}`}>
                ${metrics.totalProfit.toFixed(2)}
              </p>
              <span className="metric-subtitle">über {metrics.totalSessions} Sessions</span>
            </div>
            
            <div className="metric-card">
              <h3>Win Rate</h3>
              <p className="metric-value">{metrics.winRate.toFixed(1)}%</p>
              <span className="metric-subtitle">Gewinnende Sessions</span>
            </div>
            
            <div className="metric-card">
              <h3>bb/100</h3>
              <p className={`metric-value ${metrics.avgWinrate >= 0 ? 'positive' : 'negative'}`}>
                {metrics.avgWinrate.toFixed(2)}
              </p>
              <span className="metric-subtitle">Durchschnittliche Winrate</span>
            </div>
            
            <div className="metric-card">
              <h3>Hände Gesamt</h3>
              <p className="metric-value">{metrics.totalHands}</p>
              <span className="metric-subtitle">Sample Size</span>
            </div>
          </div>

          {/* Profit Chart */}
          <div className="chart-section">
            <h2>Bankroll Entwicklung</h2>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={analyticsData.sessions}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
                  labelStyle={{ color: '#888' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#16a34a" 
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stakes Distribution */}
          <div className="chart-row">
            <div className="chart-section half">
              <h2>Stakes Verteilung</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stakesDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stakesDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-section half">
              <h2>Session Profit Verteilung</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.sessions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
                  />
                  <Bar dataKey="profit" fill="#fbbf24" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="analytics-content">
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>ROI</h3>
              <p className="metric-value">{metrics.roi}%</p>
              <span className="metric-subtitle">Return on Investment</span>
            </div>
            
            <div className="metric-card">
              <h3>ITM%</h3>
              <p className="metric-value">{metrics.itm}%</p>
              <span className="metric-subtitle">In the Money</span>
            </div>
            
            <div className="metric-card">
              <h3>ABI</h3>
              <p className="metric-value">${metrics.abi}</p>
              <span className="metric-subtitle">Average Buy-In</span>
            </div>
            
            <div className="metric-card">
              <h3>$/Stunde</h3>
              <p className="metric-value">$32.50</p>
              <span className="metric-subtitle">Stundensatz</span>
            </div>
          </div>

          <div className="performance-stats">
            <h2>Erweiterte Performance Metriken</h2>
            <div className="stats-table">
              <div className="stat-row">
                <span>VPIP</span>
                <span>22.5%</span>
              </div>
              <div className="stat-row">
                <span>PFR</span>
                <span>18.3%</span>
              </div>
              <div className="stat-row">
                <span>3-Bet</span>
                <span>7.2%</span>
              </div>
              <div className="stat-row">
                <span>WTSD</span>
                <span>28.4%</span>
              </div>
              <div className="stat-row">
                <span>W$SD</span>
                <span>52.1%</span>
              </div>
              <div className="stat-row">
                <span>Agg%</span>
                <span>35.6%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'risk' && (
        <div className="analytics-content">
          <div className="metrics-grid">
            <div className="metric-card warning">
              <h3>Risk of Ruin</h3>
              <p className="metric-value">{metrics.riskOfRuin.toFixed(2)}%</p>
              <span className="metric-subtitle">Wahrscheinlichkeit Bankroll-Verlust</span>
            </div>
            
            <div className="metric-card">
              <h3>Standardabweichung</h3>
              <p className="metric-value">${metrics.stdDev.toFixed(2)}</p>
              <span className="metric-subtitle">Volatilität</span>
            </div>
            
            <div className="metric-card">
              <h3>Max Drawdown</h3>
              <p className="metric-value negative">${metrics.maxDrawdown.toFixed(2)}</p>
              <span className="metric-subtitle">Größter Verlust vom Peak</span>
            </div>
            
            <div className="metric-card">
              <h3>Sharpe Ratio</h3>
              <p className="metric-value">{metrics.sharpeRatio.toFixed(3)}</p>
              <span className="metric-subtitle">Risk-adjusted Return</span>
            </div>
          </div>

          <div className="risk-analysis">
            <h2>Bankroll Empfehlungen</h2>
            <div className="bankroll-recommendations">
              <div className="recommendation-card">
                <h3>Konservativ</h3>
                <p className="rec-value">100 Buy-Ins</p>
                <span>Empfohlen: $5,000</span>
              </div>
              <div className="recommendation-card">
                <h3>Standard</h3>
                <p className="rec-value">50 Buy-Ins</p>
                <span>Empfohlen: $2,500</span>
              </div>
              <div className="recommendation-card">
                <h3>Aggressiv</h3>
                <p className="rec-value">30 Buy-Ins</p>
                <span>Empfohlen: $1,500</span>
              </div>
            </div>

            <div className="kelly-section">
              <h3>Kelly-Kriterium</h3>
              <p>Optimaler Einsatz: <strong>{(metrics.kellyFraction * 100).toFixed(1)}%</strong> der Bankroll</p>
              <p className="kelly-note">Empfehlung: Verwende 25% des Kelly-Bruchteils für konservatives Bankroll Management</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'advanced' && (
        <div className="analytics-content">
          <div className="advanced-metrics">
            <h2>EV & ICM Analyse</h2>
            
            <div className="ev-section">
              <div className="metric-card">
                <h3>All-in EV</h3>
                <p className="metric-value">$1,285</p>
                <span className="metric-subtitle">Expected Value</span>
              </div>
              
              <div className="metric-card">
                <h3>Actual Winnings</h3>
                <p className="metric-value">$1,450</p>
                <span className="metric-subtitle">Run Good: +$165</span>
              </div>
              
              <div className="metric-card">
                <h3>$EV ROI</h3>
                <p className="metric-value">22.3%</p>
                <span className="metric-subtitle">ICM adjusted</span>
              </div>
              
              <div className="metric-card">
                <h3>cEV/Turnier</h3>
                <p className="metric-value">3,250</p>
                <span className="metric-subtitle">Chip EV</span>
              </div>
            </div>

            <div className="confidence-intervals">
              <h3>95% Konfidenzintervalle</h3>
              <div className="interval-display">
                <div className="interval-row">
                  <span>Winrate (bb/100)</span>
                  <div className="interval-bar">
                    <div className="interval-range" style={{left: '30%', width: '40%'}}>
                      <span className="lower">3.2</span>
                      <span className="actual">{metrics.avgWinrate.toFixed(2)}</span>
                      <span className="upper">12.5</span>
                    </div>
                  </div>
                </div>
                
                <div className="interval-row">
                  <span>ROI</span>
                  <div className="interval-bar">
                    <div className="interval-range" style={{left: '25%', width: '50%'}}>
                      <span className="lower">8.5%</span>
                      <span className="actual">18.5%</span>
                      <span className="upper">28.5%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="formulas-section">
              <h3>Verwendete Formeln</h3>
              <div className="formula-grid">
                <div className="formula-card">
                  <h4>Risk of Ruin</h4>
                  <code>RoR ≈ e^(-2 × Edge × BR / σ²)</code>
                </div>
                <div className="formula-card">
                  <h4>Kelly-Kriterium</h4>
                  <code>f* = (p × b - q) / b</code>
                </div>
                <div className="formula-card">
                  <h4>Konfidenzintervall</h4>
                  <code>CI = μ ± 1.96 × (σ / √n)</code>
                </div>
                <div className="formula-card">
                  <h4>Sharpe Ratio</h4>
                  <code>SR = (μ - rf) / σ</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;