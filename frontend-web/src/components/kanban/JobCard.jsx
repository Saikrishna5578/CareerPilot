import React, { useState } from 'react';

export default function JobCard({ job, onDragStart, onEdit, onDelete, isGuest, onAuthRequired }) {
  const [showAlert, setShowAlert] = useState(false);

  const handleApplyClick = (e) => {
    e.preventDefault();
    setShowAlert(true); // Open the custom JD-Resume Alert Modal
  };

  const proceedToApply = () => {
    setShowAlert(false);
    // Open in a new tab
    window.open(job.apply_link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="job-card"
      draggable={!isGuest}
      onDragStart={(e) => onDragStart(e, job.id)}
    >
      {/* Edit / Delete Hover Action Overlay Buttons */}
      <div className="card-actions-overlay">
        <button 
          className="card-icon-btn edit-btn" 
          title="Edit Details"
          onClick={() => onEdit(job)}
        >
          ✏️
        </button>
        <button 
          className="card-icon-btn delete-btn" 
          title="Delete Application"
          onClick={() => onDelete(job.id)}
        >
          🗑️
        </button>
      </div>

      <div className="job-card-header">
        <h4 className="job-card-title">{job.title}</h4>
      </div>
      <div className="job-company">{job.company}</div>
      
      <div className="job-meta-row">
        <div className="job-location">📍 {job.location || 'Remote'}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>💰 {job.salary || 'Not disclosed'}</div>
      </div>

      {job.apply_link && job.apply_link !== "#" ? (
        <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
          <a 
            href={job.apply_link} 
            className="apply-link-btn"
            onClick={isGuest ? (e) => { e.preventDefault(); onAuthRequired('apply'); } : handleApplyClick}
          >
            Direct Apply ↗
          </a>
        </div>
      ) : (
        <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-dark)', textAlign: 'right' }}>
          Manual Entry
        </div>
      )}

      {/* JD Custom Resume Alert Modal */}
      {showAlert && (
        <div className="modal-overlay" onClick={() => setShowAlert(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header" style={{ borderBottomColor: 'rgba(249, 115, 22, 0.2)' }}>
              <h3 style={{ color: 'var(--accent-orange)' }}>⚠️ Customise Resume for Job</h3>
            </div>
            
            <div className="modal-body" style={{ margin: '1rem 0' }}>
              <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                Before applying for <strong>{job.title}</strong> at <strong>{job.company}</strong>, check the job requirements!
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', background: 'rgba(0, 0, 0, 0.15)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid var(--accent-orange)' }}>
                💡 <strong>Architect Tip</strong>: Update your master resume to align with keywords (e.g. skills like {job.skills_required && job.skills_required.length > 0 ? job.skills_required.join(', ') : 'specific requirements'}) from the Job Description. This maximizes ATS screening success.
              </p>
            </div>

            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowAlert(false)}
                style={{ flex: 1 }}
              >
                Update Resume First
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={proceedToApply}
                style={{ flex: 1, background: 'var(--grad-orange)', boxShadow: '0 4px 14px rgba(236, 72, 153, 0.4)' }}
              >
                Proceed to Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
