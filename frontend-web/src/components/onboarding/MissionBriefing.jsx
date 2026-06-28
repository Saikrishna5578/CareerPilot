import React, { useState, useEffect } from 'react';

const MissionBriefing = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [slideKey, setSlideKey] = useState(0);

  const totalSlides = 4;

  const goToSlide = (index) => {
    if (transitioning || index === currentSlide) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setSlideKey((k) => k + 1);
      setTransitioning(false);
    }, 400);
  };

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    }
  };

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (currentSlide >= totalSlides - 1) return;
    const timer = setTimeout(() => {
      nextSlide();
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentSlide, transitioning]);

  // Generate static star positions once
  const [stars] = useState(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2,
    }))
  );

  return (
    <>
      <style>{`
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        @keyframes radarPulse {
          0% {
            transform: translate(-50%, -50%) scale(0.2);
            opacity: 0.7;
            border-color: rgba(0, 255, 170, 0.6);
          }
          100% {
            transform: translate(-50%, -50%) scale(2.5);
            opacity: 0;
            border-color: rgba(0, 255, 170, 0);
          }
        }

        @keyframes scanLine {
          0% { top: -2px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        @keyframes cardFlyInLeft {
          0% {
            transform: translateX(-120%) rotate(-8deg);
            opacity: 0;
          }
          60% {
            transform: translateX(5%) rotate(1deg);
            opacity: 1;
          }
          100% {
            transform: translateX(0) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes cardFlyInRight {
          0% {
            transform: translateX(120%) rotate(8deg);
            opacity: 0;
          }
          60% {
            transform: translateX(-5%) rotate(-1deg);
            opacity: 1;
          }
          100% {
            transform: translateX(0) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes cardDrop {
          0% {
            transform: translateY(-60px);
            opacity: 0;
          }
          70% {
            transform: translateY(4px);
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 255, 170, 0.3), 0 0 40px rgba(0, 255, 170, 0.15), 0 0 60px rgba(0, 255, 170, 0.05);
          }
          50% {
            box-shadow: 0 0 30px rgba(0, 255, 170, 0.5), 0 0 60px rgba(0, 255, 170, 0.3), 0 0 100px rgba(0, 255, 170, 0.1);
          }
        }

        @keyframes fadeSlideUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes starTwinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }

        @keyframes dashboardReveal {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(20px);
            filter: blur(6px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0);
          }
        }

        @keyframes fieldFill {
          0% { width: 0; }
          100% { width: 100%; }
        }

        @keyframes progressBar {
          0% { width: 0%; }
          100% { width: var(--target-width, 100%); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideExit {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-20px); }
        }

        @keyframes borderGlow {
          0%, 100% { border-color: rgba(0, 255, 170, 0.2); }
          50% { border-color: rgba(0, 255, 170, 0.5); }
        }

        @keyframes crosshairSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes scanLineHoriz {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .mb-overlay {
          position: fixed;
          inset: 0;
          z-index: 100000;
          background: radial-gradient(ellipse at center, #0a0e1a 0%, #020408 70%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
          color: #e0e6f0;
          overflow: hidden;
          user-select: none;
        }

        .mb-stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .mb-star {
          position: absolute;
          border-radius: 50%;
          background: #ffffff;
          animation: starTwinkle var(--dur) ease-in-out infinite;
          animation-delay: var(--delay);
        }

        .mb-grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0, 255, 170, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 170, 0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        .mb-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.6) 100%);
          pointer-events: none;
        }

        .mb-skip-btn {
          position: absolute;
          top: 28px;
          right: 36px;
          background: none;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.35);
          font-family: inherit;
          font-size: 12px;
          padding: 6px 16px;
          cursor: pointer;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          border-radius: 4px;
          transition: all 0.3s ease;
          z-index: 10;
        }

        .mb-skip-btn:hover {
          color: rgba(255, 255, 255, 0.7);
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.05);
        }

        .mb-slide-container {
          position: relative;
          width: 100%;
          max-width: 800px;
          min-height: 440px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          z-index: 2;
        }

        .mb-slide {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          animation: fadeSlideUp 0.6s ease-out forwards;
        }

        .mb-slide.exiting {
          animation: slideExit 0.4s ease-in forwards;
        }

        /* ========== SLIDE 0 ========== */
        .mb-radar-container {
          position: relative;
          width: 220px;
          height: 220px;
          margin-bottom: 20px;
        }

        .mb-radar-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200px;
          height: 200px;
          border: 2px solid rgba(0, 255, 170, 0.4);
          border-radius: 50%;
          animation: radarPulse 2.8s ease-out infinite;
        }

        .mb-radar-ring:nth-child(2) {
          animation-delay: 0.9s;
        }

        .mb-radar-ring:nth-child(3) {
          animation-delay: 1.8s;
        }

        .mb-crosshair {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 60px;
          height: 60px;
          border: 2px solid rgba(0, 255, 170, 0.25);
          border-radius: 50%;
          animation: crosshairSpin 8s linear infinite;
        }

        .mb-crosshair::before,
        .mb-crosshair::after {
          content: '';
          position: absolute;
          background: rgba(0, 255, 170, 0.3);
        }

        .mb-crosshair::before {
          width: 1px;
          height: 100%;
          left: 50%;
          top: 0;
        }

        .mb-crosshair::after {
          width: 100%;
          height: 1px;
          top: 50%;
          left: 0;
        }

        .mb-radar-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          background: #00ffaa;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 12px #00ffaa, 0 0 24px rgba(0, 255, 170, 0.4);
        }

        .mb-title-typewriter {
          font-size: 42px;
          font-weight: 700;
          color: #00ffaa;
          text-shadow: 0 0 30px rgba(0, 255, 170, 0.4), 0 0 60px rgba(0, 255, 170, 0.15);
          letter-spacing: 4px;
          text-transform: uppercase;
          overflow: hidden;
          white-space: nowrap;
          border-right: 3px solid #00ffaa;
          animation: typewriter 1.2s steps(16) 0.3s forwards, blink 0.7s step-end infinite;
          width: 0;
          margin-bottom: 16px;
        }

        .mb-subtitle {
          font-size: 16px;
          color: rgba(0, 255, 170, 0.7);
          letter-spacing: 2px;
          margin-bottom: 28px;
          animation: fadeSlideUp 0.8s ease-out 1s both;
        }

        .mb-body-text {
          font-size: 14px;
          line-height: 1.8;
          color: rgba(224, 230, 240, 0.65);
          max-width: 540px;
          animation: fadeSlideUp 0.8s ease-out 1.4s both;
        }

        /* ========== SLIDE 1 ========== */
        .mb-scan-area {
          position: relative;
          width: 100%;
          max-width: 480px;
          min-height: 200px;
          border: 1px solid rgba(0, 255, 170, 0.15);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 28px;
          background: rgba(0, 255, 170, 0.02);
          padding: 28px 24px;
          animation: borderGlow 3s ease-in-out infinite;
        }

        .mb-scan-bar {
          position: absolute;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 170, 0.6), transparent);
          animation: scanLine 2.5s ease-in-out infinite;
          box-shadow: 0 0 15px rgba(0, 255, 170, 0.3);
        }

        .mb-scan-bar:nth-child(2) {
          animation-delay: 1.25s;
          opacity: 0.5;
        }

        .mb-field-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
          animation: fadeSlideUp 0.5s ease-out both;
        }

        .mb-field-row:nth-child(3) { animation-delay: 0.8s; }
        .mb-field-row:nth-child(4) { animation-delay: 1.2s; }
        .mb-field-row:nth-child(5) { animation-delay: 1.6s; }

        .mb-field-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: rgba(0, 255, 170, 0.5);
          min-width: 110px;
          text-align: left;
        }

        .mb-field-input {
          flex: 1;
          height: 34px;
          border: 1px solid rgba(0, 255, 170, 0.2);
          border-radius: 4px;
          background: rgba(0, 20, 10, 0.4);
          position: relative;
          overflow: hidden;
        }

        .mb-field-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          display: flex;
          align-items: center;
          padding: 0 10px;
          font-size: 13px;
          color: #00ffaa;
          white-space: nowrap;
          overflow: hidden;
          animation: fieldFill 1.5s ease-out forwards;
        }

        .mb-field-fill.d1 { animation-delay: 1.2s; width: 0; }
        .mb-field-fill.d2 { animation-delay: 1.8s; width: 0; }
        .mb-field-fill.d3 { animation-delay: 2.4s; width: 0; }

        .mb-slide-title {
          font-size: 32px;
          font-weight: 700;
          color: #00ffaa;
          text-shadow: 0 0 20px rgba(0, 255, 170, 0.3);
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 12px;
          animation: fadeSlideUp 0.6s ease-out 0.1s both;
        }

        .mb-slide-body {
          font-size: 14px;
          line-height: 1.8;
          color: rgba(224, 230, 240, 0.65);
          max-width: 520px;
          margin-bottom: 28px;
          animation: fadeSlideUp 0.6s ease-out 0.3s both;
        }

        /* ========== SLIDE 2 ========== */
        .mb-kanban {
          display: flex;
          gap: 14px;
          margin-bottom: 28px;
          animation: fadeIn 0.6s ease-out 0.4s both;
        }

        .mb-kanban-col {
          width: 130px;
          min-height: 160px;
          background: rgba(0, 255, 170, 0.03);
          border: 1px solid rgba(0, 255, 170, 0.12);
          border-radius: 8px;
          padding: 10px 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mb-kanban-col-title {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: rgba(0, 255, 170, 0.6);
          text-align: center;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0, 255, 170, 0.1);
          margin-bottom: 4px;
        }

        .mb-kanban-card {
          background: rgba(0, 255, 170, 0.06);
          border: 1px solid rgba(0, 255, 170, 0.15);
          border-radius: 6px;
          padding: 8px;
          font-size: 10px;
          color: rgba(224, 230, 240, 0.7);
          animation: cardDrop 0.6s ease-out both;
        }

        .mb-kanban-card:nth-child(2) { animation-delay: 0.8s; }
        .mb-kanban-card:nth-child(3) { animation-delay: 1.2s; }
        .mb-kanban-card:nth-child(4) { animation-delay: 1.6s; }

        .mb-kanban-col:nth-child(1) .mb-kanban-card { animation-name: cardFlyInLeft; }
        .mb-kanban-col:nth-child(3) .mb-kanban-card { animation-name: cardFlyInRight; }

        .mb-card-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin-right: 6px;
        }

        .mb-card-dot.green { background: #00ffaa; }
        .mb-card-dot.cyan { background: #00d4ff; }
        .mb-card-dot.yellow { background: #ffd000; }
        .mb-card-dot.purple { background: #b06cff; }

        /* ========== SLIDE 3 ========== */
        .mb-dashboard-preview {
          width: 100%;
          max-width: 520px;
          border: 1px solid rgba(0, 255, 170, 0.15);
          border-radius: 12px;
          background: rgba(0, 255, 170, 0.02);
          padding: 24px;
          margin-bottom: 32px;
          animation: dashboardReveal 1s ease-out 0.3s both;
        }

        .mb-dash-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .mb-dash-card {
          flex: 1;
          background: rgba(0, 255, 170, 0.04);
          border: 1px solid rgba(0, 255, 170, 0.1);
          border-radius: 8px;
          padding: 14px 12px;
          text-align: left;
          animation: fadeSlideUp 0.5s ease-out both;
        }

        .mb-dash-card:nth-child(1) { animation-delay: 0.8s; }
        .mb-dash-card:nth-child(2) { animation-delay: 1s; }
        .mb-dash-card:nth-child(3) { animation-delay: 1.2s; }

        .mb-dash-label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: rgba(0, 255, 170, 0.45);
          margin-bottom: 6px;
        }

        .mb-dash-value {
          font-size: 22px;
          font-weight: 700;
          color: #00ffaa;
        }

        .mb-dash-bar-container {
          height: 4px;
          background: rgba(0, 255, 170, 0.08);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 8px;
        }

        .mb-dash-bar {
          height: 100%;
          background: linear-gradient(90deg, #00ffaa, #00d4ff);
          border-radius: 2px;
          animation: progressBar 1.5s ease-out 1.4s both;
        }

        .mb-dash-icon {
          font-size: 18px;
          margin-bottom: 6px;
        }

        .mb-launch-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 48px;
          background: linear-gradient(135deg, rgba(0, 255, 170, 0.15), rgba(0, 212, 255, 0.1));
          border: 2px solid rgba(0, 255, 170, 0.5);
          border-radius: 12px;
          color: #00ffaa;
          font-family: inherit;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          cursor: pointer;
          animation: glowPulse 2s ease-in-out infinite, fadeSlideUp 0.6s ease-out 1.6s both;
          transition: all 0.3s ease;
        }

        .mb-launch-btn:hover {
          background: linear-gradient(135deg, rgba(0, 255, 170, 0.25), rgba(0, 212, 255, 0.2));
          border-color: #00ffaa;
          transform: scale(1.04);
        }

        .mb-launch-btn:active {
          transform: scale(0.98);
        }

        /* ========== NAVIGATION ========== */
        .mb-nav {
          position: absolute;
          bottom: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          z-index: 5;
        }

        .mb-dots {
          display: flex;
          gap: 10px;
        }

        .mb-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(0, 255, 170, 0.2);
          cursor: pointer;
          transition: all 0.35s ease;
        }

        .mb-dot.active {
          background: #00ffaa;
          box-shadow: 0 0 10px rgba(0, 255, 170, 0.5);
          border-color: #00ffaa;
          transform: scale(1.2);
        }

        .mb-dot:hover:not(.active) {
          background: rgba(0, 255, 170, 0.3);
          border-color: rgba(0, 255, 170, 0.4);
        }

        .mb-next-btn {
          padding: 10px 36px;
          background: rgba(0, 255, 170, 0.08);
          border: 1px solid rgba(0, 255, 170, 0.3);
          border-radius: 8px;
          color: #00ffaa;
          font-family: inherit;
          font-size: 13px;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .mb-next-btn:hover {
          background: rgba(0, 255, 170, 0.15);
          border-color: rgba(0, 255, 170, 0.5);
        }

        /* ========== CORNER DECORATIONS ========== */
        .mb-corner {
          position: absolute;
          width: 40px;
          height: 40px;
          border-color: rgba(0, 255, 170, 0.15);
          border-style: solid;
          pointer-events: none;
        }

        .mb-corner.tl { top: 20px; left: 20px; border-width: 2px 0 0 2px; }
        .mb-corner.tr { top: 20px; right: 20px; border-width: 2px 2px 0 0; }
        .mb-corner.bl { bottom: 20px; left: 20px; border-width: 0 0 2px 2px; }
        .mb-corner.br { bottom: 20px; right: 20px; border-width: 0 2px 2px 0; }

        .mb-status-bar {
          position: absolute;
          top: 28px;
          left: 36px;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(0, 255, 170, 0.3);
          z-index: 5;
        }

        .mb-status-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #00ffaa;
          border-radius: 50%;
          margin-right: 8px;
          animation: blink 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="mb-overlay">
        {/* Stars */}
        <div className="mb-stars">
          {stars.map((star) => (
            <div
              key={star.id}
              className="mb-star"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                '--delay': `${star.delay}s`,
                '--dur': `${star.duration}s`,
              }}
            />
          ))}
        </div>

        {/* Grid overlay */}
        <div className="mb-grid-overlay" />
        <div className="mb-vignette" />

        {/* Corner decorations */}
        <div className="mb-corner tl" />
        <div className="mb-corner tr" />
        <div className="mb-corner bl" />
        <div className="mb-corner br" />

        {/* Status bar */}
        <div className="mb-status-bar">
          <span className="mb-status-dot" />
          Mission Briefing &mdash; Slide {currentSlide + 1} / {totalSlides}
        </div>

        {/* Skip button */}
        <button className="mb-skip-btn" onClick={onComplete}>
          Skip Briefing &rarr;
        </button>

        {/* Slide content */}
        <div className="mb-slide-container">
          <div
            className={`mb-slide ${transitioning ? 'exiting' : ''}`}
            key={slideKey}
          >
            {/* ===== SLIDE 0 — Mission Accepted ===== */}
            {currentSlide === 0 && (
              <>
                <div className="mb-radar-container">
                  <div className="mb-radar-ring" />
                  <div className="mb-radar-ring" />
                  <div className="mb-radar-ring" />
                  <div className="mb-crosshair" />
                  <div className="mb-radar-dot" />
                </div>
                <div className="mb-title-typewriter">Mission Accepted</div>
                <div className="mb-subtitle">
                  Welcome, Agent. Your career mission starts now.
                </div>
                <div className="mb-body-text">
                  We&rsquo;ll guide you through every step &mdash; from learning
                  new skills to landing your dream job.
                </div>
              </>
            )}

            {/* ===== SLIDE 1 — Intelligence Gathering ===== */}
            {currentSlide === 1 && (
              <>
                <div className="mb-slide-title">Intelligence Gathering</div>
                <div className="mb-slide-body">
                  Tell us your career goal, preferred programming language, and
                  interests. Our AI mentor will build a personalized learning
                  roadmap from zero to industry-ready.
                </div>
                <div className="mb-scan-area">
                  <div className="mb-scan-bar" />
                  <div className="mb-scan-bar" />
                  <div className="mb-field-row">
                    <span className="mb-field-label">Career Goal</span>
                    <div className="mb-field-input">
                      <div className="mb-field-fill d1">
                        Full-Stack Developer
                      </div>
                    </div>
                  </div>
                  <div className="mb-field-row">
                    <span className="mb-field-label">Language</span>
                    <div className="mb-field-input">
                      <div className="mb-field-fill d2">
                        JavaScript / React
                      </div>
                    </div>
                  </div>
                  <div className="mb-field-row">
                    <span className="mb-field-label">Interests</span>
                    <div className="mb-field-input">
                      <div className="mb-field-fill d3">
                        AI, Web3, Cloud
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ===== SLIDE 2 — Field Operations ===== */}
            {currentSlide === 2 && (
              <>
                <div className="mb-slide-title">Field Operations</div>
                <div className="mb-slide-body">
                  Search for live job opportunities using our smart scraper.
                  Track your applications across stages &mdash; from Applied to
                  Offer &mdash; with a drag-and-drop Kanban board.
                </div>
                <div className="mb-kanban">
                  <div className="mb-kanban-col">
                    <div className="mb-kanban-col-title">Applied</div>
                    <div className="mb-kanban-card">
                      <span className="mb-card-dot green" />
                      Frontend Dev
                    </div>
                    <div className="mb-kanban-card">
                      <span className="mb-card-dot cyan" />
                      React Engineer
                    </div>
                  </div>
                  <div className="mb-kanban-col">
                    <div className="mb-kanban-col-title">Interview</div>
                    <div className="mb-kanban-card">
                      <span className="mb-card-dot yellow" />
                      SDE Intern
                    </div>
                    <div className="mb-kanban-card">
                      <span className="mb-card-dot purple" />
                      Full-Stack
                    </div>
                  </div>
                  <div className="mb-kanban-col">
                    <div className="mb-kanban-col-title">Offer</div>
                    <div className="mb-kanban-card">
                      <span className="mb-card-dot green" />
                      Cloud Eng
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ===== SLIDE 3 — Mission Control Ready ===== */}
            {currentSlide === 3 && (
              <>
                <div className="mb-slide-title">Mission Control Ready</div>
                <div className="mb-slide-body">
                  Everything you need in one place. Learning roadmaps, job
                  tracking, resume management, and AI-powered insights.
                </div>
                <div className="mb-dashboard-preview">
                  <div className="mb-dash-row">
                    <div className="mb-dash-card">
                      <div className="mb-dash-icon">📚</div>
                      <div className="mb-dash-label">Roadmaps</div>
                      <div className="mb-dash-value">3</div>
                      <div className="mb-dash-bar-container">
                        <div
                          className="mb-dash-bar"
                          style={{ '--target-width': '65%' }}
                        />
                      </div>
                    </div>
                    <div className="mb-dash-card">
                      <div className="mb-dash-icon">💼</div>
                      <div className="mb-dash-label">Applications</div>
                      <div className="mb-dash-value">12</div>
                      <div className="mb-dash-bar-container">
                        <div
                          className="mb-dash-bar"
                          style={{ '--target-width': '45%' }}
                        />
                      </div>
                    </div>
                    <div className="mb-dash-card">
                      <div className="mb-dash-icon">🤖</div>
                      <div className="mb-dash-label">AI Insights</div>
                      <div className="mb-dash-value">8</div>
                      <div className="mb-dash-bar-container">
                        <div
                          className="mb-dash-bar"
                          style={{ '--target-width': '80%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <button className="mb-launch-btn" onClick={onComplete}>
                  🚀 Launch Mission
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-nav">
          <div className="mb-dots">
            {Array.from({ length: totalSlides }, (_, i) => (
              <div
                key={i}
                className={`mb-dot ${i === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(i)}
              />
            ))}
          </div>
          {currentSlide < totalSlides - 1 && (
            <button className="mb-next-btn" onClick={nextSlide}>
              Next &rarr;
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default MissionBriefing;
