import React from 'react';

const features = [
  {
    icon: '🎓',
    title: 'AI-Powered Learning Paths',
    description: 'Gemini AI analyses your current skills and builds a personalised 6-week curriculum with curated resources from official docs, W3Schools, freeCodeCamp, and YouTube.',
    gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.1))',
    borderColor: 'rgba(139, 92, 246, 0.3)'
  },
  {
    icon: '💼',
    title: 'Smart Job Pipeline',
    description: 'Track every application from "Applied" to "Offer Received" on a drag-and-drop Kanban board. Our Python scraper finds live internships matched to your profile.',
    gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(16, 185, 129, 0.1))',
    borderColor: 'rgba(6, 182, 212, 0.3)'
  },
  {
    icon: '📄',
    title: 'Resume Sync & JD Alerts',
    description: 'Upload your master resume once. Before every application, we remind you to tailor it to the Job Description — maximising your ATS screening success rate.',
    gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(236, 72, 153, 0.1))',
    borderColor: 'rgba(249, 115, 22, 0.3)'
  }
];

export default function FeatureShowcase({ onSignUp }) {
  return (
    <div className="feature-showcase-section">
      <div className="showcase-header">
        <h2 className="showcase-title">Everything You Need to Land Your Dream Role</h2>
        <p className="showcase-subtitle">Built by students, for students. Zero cost. Zero friction.</p>
      </div>

      <div className="showcase-grid">
        {features.map((feat, idx) => (
          <div 
            key={idx} 
            className="showcase-card glass-panel"
            style={{ background: feat.gradient, borderColor: feat.borderColor }}
          >
            <div className="showcase-card-icon">{feat.icon}</div>
            <h3 className="showcase-card-title">{feat.title}</h3>
            <p className="showcase-card-desc">{feat.description}</p>
            <button className="showcase-unlock-btn" onClick={onSignUp}>
              Unlock Free →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
