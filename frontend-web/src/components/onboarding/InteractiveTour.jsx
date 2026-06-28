import React, { useState, useEffect } from 'react';

const TOUR_STEPS = [
  {
    title: "🎓 Welcome to CareerPilot & Learn!",
    description: "Your personalized command center is ready. This interactive tour will show you exactly where each feature is and how it helps you accelerate your career.",
    selector: null,
    tab: "learning",
    position: "center"
  },
  {
    title: "🎯 Career Preferences Config",
    description: "Here you can set your target Career Goal, Preferred Programming Language, and Interests. Clicking 'Generate AI Roadmap' will trigger Gemini to immediately design a custom syllabus from beginner to industry-ready.",
    selector: ".onboarding-setup-card",
    tab: "learning",
    position: "left"
  },
  {
    title: "📅 Weekly Syllabus Checklist",
    description: "This is your learning path. Track your progress weekly by checking off items as you complete them. Checking items updates your curriculum progress stats dynamically.",
    selector: ".main-curriculum",
    tab: "learning",
    position: "right"
  },
  {
    title: "🏆 Milestone Projects & Routine tabs",
    description: "Switch tabs here to see your AI-generated Milestone Projects, Final Portfolio Project, Weekly Study Routine, and custom interview prep questions.",
    selector: ".dashboard-tabs",
    tab: "learning",
    position: "right"
  },
  {
    title: "📡 Smart Scraper Filters",
    description: "We've created a custom job scraper form here. Instead of matching generic job titles, type your Core Skills, select a Preferred Domain, Experience Level, and Work Mode to fetch matching listings.",
    selector: ".scraper-filters-form",
    tab: "kanban",
    position: "bottom"
  },
  {
    title: "📊 Kanban Board Tracker",
    description: "Manage your active job pipeline. Drag cards between stage columns from Applied, First Round, and Tech Interviews all the way to Offer Received.",
    selector: ".kanban-board",
    tab: "kanban",
    position: "bottom"
  },
  {
    title: "➕ Manual Application Form",
    description: "If you applied for a job outside of the automated scraper feed, click here to manually track details and place them directly on your Kanban pipeline.",
    selector: ".manual-add-card", 
    selectorFallback: ".flex-row-lower",
    tab: "kanban",
    position: "top"
  },
  {
    title: "📄 Master Resume Manager",
    description: "Upload your master PDF resume here. Our system will analyze it and display alignment alerts for tracked job listings to help you customize it before applying.",
    selector: ".resume-upload-card",
    tab: "kanban",
    position: "top"
  }
];

export default function InteractiveTour({ activeTab, setActiveTab, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState({});
  const [tooltipStyle, setTooltipStyle] = useState({ opacity: 0 });

  const step = TOUR_STEPS[currentStep];

  // 1. Ensure correct tab is active for this step
  useEffect(() => {
    if (activeTab !== step.tab) {
      setActiveTab(step.tab);
    }
  }, [currentStep, activeTab, step.tab]);

  // 2. Scroll target element into view once when step or tab matches
  useEffect(() => {
    if (activeTab !== step.tab) return;

    const timer = setTimeout(() => {
      const selector = step.selector;
      const fallback = step.selectorFallback;
      let element = selector ? document.querySelector(selector) : null;
      if (!element && fallback) {
        element = document.querySelector(fallback);
      }
      if (element) {
        element.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [currentStep, activeTab]);

  // 3. Listen to resize and scroll to ONLY update coordinate bounding boxes
  useEffect(() => {
    if (activeTab !== step.tab) return;

    const updateSpotlight = () => {
      const selector = step.selector;
      const fallback = step.selectorFallback;
      let element = selector ? document.querySelector(selector) : null;
      if (!element && fallback) {
        element = document.querySelector(fallback);
      }

      if (element) {
        const rect = element.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        setHighlightStyle({
          left: `${rect.left + scrollX - 8}px`,
          top: `${rect.top + scrollY - 8}px`,
          width: `${rect.width + 16}px`,
          height: `${rect.height + 16}px`,
          opacity: 1,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 15px 3px var(--accent-purple)'
        });

        // Position tooltip relative to highlight
        const ttWidth = 320;
        let ttLeft = rect.left + scrollX + rect.width / 2 - ttWidth / 2;
        let ttTop = rect.bottom + scrollY + 16;

        if (step.position === "left") {
          ttLeft = rect.left + scrollX - ttWidth - 24;
          ttTop = rect.top + scrollY + rect.height / 2 - 100;
        } else if (step.position === "right") {
          ttLeft = rect.right + scrollX + 24;
          ttTop = rect.top + scrollY + rect.height / 2 - 100;
        } else if (step.position === "top") {
          ttLeft = rect.left + scrollX + rect.width / 2 - ttWidth / 2;
          ttTop = rect.top + scrollY - 220;
        }

        // Bound checks to keep tooltip inside viewport bounds
        if (ttLeft < 10) ttLeft = 10;
        if (ttLeft + ttWidth > window.innerWidth - 10) {
          ttLeft = window.innerWidth - ttWidth - 10;
        }

        setTooltipStyle({
          left: `${ttLeft}px`,
          top: `${ttTop}px`,
          width: `${ttWidth}px`,
          opacity: 1
        });
      } else {
        // No element match (e.g. Welcome step) -> Render centered modal
        setHighlightStyle({
          opacity: 0,
          left: '50%',
          top: '50%',
          width: '0px',
          height: '0px',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.85)'
        });
        setTooltipStyle({
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '420px',
          position: 'fixed',
          opacity: 1,
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.35)'
        });
      }
    };

    // Delay slightly to ensure client heights/scrolling layout stabilizes
    const timer = setTimeout(updateSpotlight, 300);
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight);
    };
  }, [currentStep, activeTab]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <>
      {/* Spotlight highlight element */}
      <div 
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          borderRadius: '12px',
          border: '2px solid var(--accent-purple)',
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          zIndex: 99998,
          ...highlightStyle
        }}
      />

      {/* Floating tooltip box */}
      <div 
        style={{
          position: step.selector ? 'absolute' : 'fixed',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          padding: '1.5rem',
          zIndex: 99999,
          color: '#fff',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          textAlign: 'left',
          ...tooltipStyle
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent-purple)' }}>
            Step {currentStep + 1} of {TOUR_STEPS.length}
          </span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '0.35rem', color: '#fff' }}>{step.title}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.65rem', lineHeight: '1.5' }}>
            {step.description}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500' }}
          >
            Skip Tour
          </button>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {currentStep > 0 && (
              <button 
                onClick={handlePrev} 
                className="btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                Back
              </button>
            )}
            <button 
              onClick={handleNext} 
              className="btn-primary" 
              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
            >
              {currentStep === TOUR_STEPS.length - 1 ? "Get Started 🚀" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
