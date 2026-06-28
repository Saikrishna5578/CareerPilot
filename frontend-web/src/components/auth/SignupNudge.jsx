import React from 'react';

export default function SignupNudge({ isOpen, featureName, onSignUp, onClose }) {
  if (!isOpen) return null;

  const featureMessages = {
    'progress': 'Track your weekly learning progress and never lose your streaks',
    'resources': 'Access curated learning paths from official docs, W3Schools, and YouTube',
    'generate': 'Let Gemini AI build a personalised 6-week roadmap from your skill gaps',
    'resume': 'Upload your master resume and get JD-alignment alerts before applying',
    'apply': 'Click through to application portals with resume-sync reminders',
    'add_job': 'Add jobs to your personal Kanban pipeline and track every stage',
    'edit_job': 'Edit application details like salary, location, and links',
    'delete_job': 'Remove applications you are no longer pursuing',
    'drag': 'Drag and drop cards to update your application stages in real-time',
    'default': 'Unlock this premium feature and supercharge your career journey'
  };

  const message = featureMessages[featureName] || featureMessages['default'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel nudge-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Lock Icon */}
        <div className="nudge-lock-icon">🔒</div>
        
        <h3 className="nudge-title">Create a Free Account</h3>
        
        <p className="nudge-message">{message}</p>
        
        {/* Benefits List */}
        <div className="nudge-benefits">
          <div className="nudge-benefit-item">
            <span className="nudge-check">✓</span>
            <span>AI-generated personalised roadmaps</span>
          </div>
          <div className="nudge-benefit-item">
            <span className="nudge-check">✓</span>
            <span>Drag-and-drop job application tracker</span>
          </div>
          <div className="nudge-benefit-item">
            <span className="nudge-check">✓</span>
            <span>Resume upload with JD alignment alerts</span>
          </div>
          <div className="nudge-benefit-item">
            <span className="nudge-check">✓</span>
            <span>Progress synced across all your devices</span>
          </div>
        </div>

        <button className="btn-primary nudge-signup-btn" onClick={onSignUp}>
          🚀 Sign Up Free — Takes 30 seconds
        </button>
        
        <button className="nudge-dismiss-btn" onClick={onClose}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
