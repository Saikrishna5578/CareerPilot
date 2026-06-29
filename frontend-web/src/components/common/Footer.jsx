import React from 'react';

export default function Footer({ showToast }) {
  const shareUrl = "https://career-pilot-wheat.vercel.app/";
  const shareText = "Check out CareerPilot & Learn! It builds personalized AI coding roadmaps and tracks your job applications in an interactive Kanban board.";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        if (showToast) {
          showToast("Referral link copied to clipboard! Share it with your friends! 🚀", "success");
        }
      })
      .catch(err => {
        console.error("Could not copy text: ", err);
      });
  };

  return (
    <footer className="glass-panel global-footer" style={{ marginTop: '3.5rem', padding: '2rem 1.5rem', textAlign: 'center' }}>
      <div className="footer-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        
        <div className="footer-promo" style={{ maxWidth: '600px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--accent-purple)' }}>
            🚀 Share the Journey!
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
            Enjoying CareerPilot & Learn? Help your developer friends, classmates, and colleagues accelerate their career growth by sharing the platform. Let's build the future together!
          </p>
        </div>

        <div className="footer-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            className="btn-primary" 
            onClick={handleCopyLink}
            style={{ fontSize: '0.8rem', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
          >
            🔗 Copy Share Link
          </button>

          <a 
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.55rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
          >
            💬 WhatsApp
          </a>

          <a 
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.55rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', color: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.4)' }}
          >
            🐦 Share on X
          </a>
        </div>

        <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.5rem 0' }}></div>

        <div className="footer-copyright" style={{ color: 'var(--text-dark)', fontSize: '0.75rem', fontWeight: '500' }}>
          © 2026 CareerPilot & Learn by Krishna
        </div>
      </div>
    </footer>
  );
}
