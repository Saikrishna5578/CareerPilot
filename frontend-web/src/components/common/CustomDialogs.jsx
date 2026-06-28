import React, { useState, useEffect } from 'react';

// ==========================================
// 1. Toast Notification Component
// ==========================================
export function CustomToast({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto close after 4s
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`toast-item glass-panel toast-${toast.type || 'info'}`}>
      <span className="toast-icon">{getIcon(toast.type)}</span>
      <div className="toast-content">
        <p className="toast-message">{toast.message}</p>
      </div>
      <button className="toast-close" onClick={onClose}>&times;</button>
    </div>
  );
}

// ==========================================
// 2. Custom Confirmation Modal
// ==========================================
export function CustomConfirm({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', padding: '2rem' }}>
        <div className="modal-header">
          <h3>{title || 'Confirm Action'}</h3>
          <button className="modal-close-btn" onClick={onCancel}>&times;</button>
        </div>
        <div className="modal-body" style={{ margin: '1rem 0', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
          {message}
        </div>
        <div className="modal-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button className="btn-secondary" onClick={onCancel} style={{ flex: 1 }}>{cancelText}</button>
          <button 
            className="btn-primary" 
            onClick={onConfirm} 
            style={{ flex: 1, background: 'var(--grad-orange)', boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. Custom Prompt Form Modal
// ==========================================
export function CustomPrompt({ isOpen, title, onSubmit, onCancel }) {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('Remote');
  const [salary, setSalary] = useState('Not disclosed');
  const [link, setLink] = useState('');

  useEffect(() => {
    if (isOpen) {
      setJobTitle('');
      setCompany('');
      setLocation('Remote');
      setSalary('Not disclosed');
      setLink('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jobTitle.trim() || !company.trim()) {
      alert('Job Title and Company are required.');
      return;
    }
    onSubmit({
      title: jobTitle,
      company,
      location,
      salary,
      apply_link: link || '#'
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '2rem' }}>
        <div className="modal-header">
          <h3>{title || 'Add New Application'}</h3>
          <button className="modal-close-btn" onClick={onCancel}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Job Title *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Software Engineer Intern"
              value={jobTitle} 
              onChange={(e) => setJobTitle(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Company *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Supabase"
              value={company} 
              onChange={(e) => setCompany(e.target.value)} 
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Location</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Remote / New York"
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Salary</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. $40/hr"
                value={salary} 
                onChange={(e) => setSalary(e.target.value)} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Application URL</label>
            <input 
              type="url" 
              className="form-input" 
              placeholder="https://example.com/apply"
              value={link} 
              onChange={(e) => setLink(e.target.value)} 
            />
          </div>

          <div className="modal-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Create Application</button>
          </div>
        </form>
      </div>
    </div>
  );
}
