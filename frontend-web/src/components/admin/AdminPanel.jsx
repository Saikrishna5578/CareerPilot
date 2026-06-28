import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { apiFetch } from '../../utils/api';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminPanel({ featureFlags, onToggleFeatureFlag }) {
  const [stats, setStats] = useState({
    total_users: 0,
    total_roadmaps: 0,
    total_jobs: 0,
    gemini_requests: 0,
    api_hits: []
  });
  const [logs, setLogs] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await apiFetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.warn("Failed to fetch admin stats, using local mock data:", err);
      // Local Mock fallback
      setStats({
        total_users: 2,
        total_roadmaps: 4,
        total_jobs: 8,
        gemini_requests: 5,
        api_hits: [
          { method: "GET", endpoint: "/api/jobs", hit_count: 24 },
          { method: "POST", endpoint: "/api/roadmap/generate", hit_count: 5 },
          { method: "POST", endpoint: "/api/logs", hit_count: 12 },
          { method: "GET", endpoint: "/api/admin/stats", hit_count: 6 }
        ]
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    if (!supabase) {
      // Mock logs fallback
      setTimeout(() => {
        setLogs([
          { id: '1', severity: 'INFO', service: 'API_GATEWAY', message: 'Successfully connected to database.', created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: '2', severity: 'INFO', service: 'ROADMAP_GEN', message: 'Generating learning roadmap for student: admin@careerpilot.com', created_at: new Date(Date.now() - 3400000).toISOString() },
          { id: '3', severity: 'WARNING', service: 'SCRAPER', message: 'Adzuna API keys missing. Generating mock job listings.', created_at: new Date(Date.now() - 3000000).toISOString() },
          { id: '4', severity: 'INFO', service: 'SCRAPER', message: 'Scraper sync completed. Saved 4 opportunities.', created_at: new Date(Date.now() - 2900000).toISOString() },
          { id: '5', severity: 'ERROR', service: 'FRONTEND:APP', message: 'TypeError: Cannot read properties of null (reading "map")', created_at: new Date(Date.now() - 1000000).toISOString() }
        ]);
        setLoadingLogs(false);
      }, 300);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.warn("Failed to fetch cloud system logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLogs();
  }, []);

  const handleRefreshAll = () => {
    fetchStats();
    fetchLogs();
  };

  // Filter logs locally
  const filteredLogs = logs.filter(log => {
    const matchesSeverity = filterSeverity === 'ALL' || log.severity === filterSeverity;
    const matchesSearch = 
      (log.service || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.message || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'ERROR': return 'log-badge-error';
      case 'WARNING': return 'log-badge-warning';
      case 'INFO': return 'log-badge-info';
      default: return 'log-badge-generic';
    }
  };

  return (
    <div className="admin-panel-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Admin Panel Header */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.5rem 2rem' }}>
        <div>
          <h2 className="glass-title">🛠️ Administrator Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Monitor real-time Gemini AI usage, view API endpoints hits counters, and control feature visibility flags.
          </p>
        </div>
        <button className="btn-primary" onClick={handleRefreshAll} disabled={loadingStats || loadingLogs}>
          {loadingStats || loadingLogs ? 'Refreshing Data...' : '🔄 Refresh Dashboard'}
        </button>
      </div>

      {/* Stats Counter Cards Grid */}
      <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        
        <div className="glass-panel admin-stat-card" style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
          <span style={{ fontSize: '2rem' }}>🤖</span>
          <h3 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.5rem 0 0.2rem', color: 'var(--accent-purple)' }}>
            {stats.gemini_requests}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Gemini Requests</p>
        </div>

        <div className="glass-panel admin-stat-card" style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
          <span style={{ fontSize: '2rem' }}>👤</span>
          <h3 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.5rem 0 0.2rem', color: 'var(--accent-cyan)' }}>
            {stats.total_users}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Registered Users</p>
        </div>

        <div className="glass-panel admin-stat-card" style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
          <span style={{ fontSize: '2rem' }}>📋</span>
          <h3 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.5rem 0 0.2rem', color: 'var(--accent-green)' }}>
            {stats.total_roadmaps}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Roadmaps Created</p>
        </div>

        <div className="glass-panel admin-stat-card" style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
          <span style={{ fontSize: '2rem' }}>💼</span>
          <h3 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.5rem 0 0.2rem', color: 'var(--accent-orange)' }}>
            {stats.total_jobs}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Scraped Jobs</p>
        </div>

      </div>

      {/* Feature Flags and API Hits - Grid Layout */}
      <div className="admin-split-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
        
        {/* Feature Flags Toggles */}
        <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
          <h3 className="glass-title" style={{ fontSize: '1.15rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🚩 Active Feature Controls
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Toggle features on or off in real-time. Changes affect all end-user interfaces immediately.
          </p>

          <div className="feature-flags-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {featureFlags.map((flag) => (
              <div 
                key={flag.key} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)'
                }}
              >
                <div style={{ flex: 1, paddingRight: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{flag.name}</span>
                    <span 
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.15rem 0.4rem', 
                        borderRadius: '6px', 
                        fontWeight: '700',
                        color: '#fff',
                        background: flag.enabled ? 'var(--accent-green)' : 'var(--text-dark)'
                      }}
                    >
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{flag.description}</p>
                </div>
                
                {/* Modern Toggle Switch */}
                <label className="switch-toggle" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px', flexShrink: 0 }}>
                  <input 
                    type="checkbox" 
                    checked={flag.enabled} 
                    onChange={(e) => onToggleFeatureFlag(flag.key, e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span className={`slider-toggle-round ${flag.enabled ? 'checked' : ''}`} style={{
                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: flag.enabled ? 'var(--accent-purple)' : 'rgba(255,255,255,0.1)',
                    borderRadius: '34px', transition: '0.3s'
                  }}>
                    <span className="slider-knob" style={{
                      position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
                      backgroundColor: 'white', borderRadius: '50%', transition: '0.3s',
                      transform: flag.enabled ? 'translateX(22px)' : 'none'
                    }} />
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* API Hits Counter */}
        <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
          <h3 className="glass-title" style={{ fontSize: '1.15rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📈 API Hit Counters
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Tracks how many times each backend API endpoint is requested through this project.
          </p>

          <div className="api-hits-terminal" style={{ maxHeight: '275px', overflowY: 'auto', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
            {stats.api_hits && stats.api_hits.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-dark)', fontWeight: '600' }}>Method</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-dark)', fontWeight: '600' }}>Endpoint</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-dark)', fontWeight: '600', textAlign: 'right' }}>Hits</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.api_hits.map((hit, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', hover: { background: 'rgba(255,255,255,0.01)' } }}>
                      <td style={{ padding: '0.65rem 1rem' }}>
                        <span style={{ 
                          fontWeight: '700', 
                          color: hit.method === 'POST' ? 'var(--accent-cyan)' : 'var(--accent-purple)',
                          fontSize: '0.75rem',
                          background: hit.method === 'POST' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                          padding: '0.15rem 0.35rem',
                          borderRadius: '4px'
                        }}>
                          {hit.method}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 1rem', fontFamily: 'monospace', color: 'var(--text-main)' }}>{hit.endpoint}</td>
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: '700', color: 'var(--accent-pink)' }}>
                        {hit.hit_count.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No API hits recorded yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* Audit Logs Section */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 className="glass-title" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🛡️ System Logs & Audit Trails
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Inspect central database log tables for system errors, background triggers, and user activity.
            </p>
          </div>
          <button className="btn-secondary" onClick={fetchLogs} disabled={loadingLogs} style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}>
            {loadingLogs ? 'Loading...' : '🔄 Refresh Logs'}
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
            <select 
              className="form-input" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              value={filterSeverity} 
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search logs by service or message content..."
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Logs Terminal Box */}
        <div className="logs-terminal-box">
          {filteredLogs.length > 0 ? (
            <div className="logs-table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table className="logs-table">
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>Timestamp</th>
                    <th style={{ width: '100px' }}>Severity</th>
                    <th style={{ width: '150px' }}>Service</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="log-time">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td>
                        <span className={`log-badge ${getSeverityBadgeClass(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="log-service">{log.service}</td>
                      <td className="log-message">
                        {log.message}
                        {log.payload && Object.keys(log.payload).length > 0 && (
                          <pre className="log-payload-raw" style={{ fontSize: '0.75rem', marginTop: '0.4rem', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              🚫 No system logs found. Check back later or hit Refresh.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
