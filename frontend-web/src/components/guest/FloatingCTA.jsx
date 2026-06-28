import React, { useState } from 'react';

export default function FloatingCTA({ onSignUp }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="floating-cta-bar">
      <div className="cta-content">
        <span className="cta-emoji">🚀</span>
        <span className="cta-text">
          <strong>Join 500+ students</strong> tracking their career growth — completely free
        </span>
        <button className="cta-signup-btn" onClick={onSignUp}>
          Sign Up Free
        </button>
        <button className="cta-dismiss-btn" onClick={() => setDismissed(true)} aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}
