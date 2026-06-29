import React, { useState } from 'react';
import { CondensedMarkdownRenderer } from './LearningDashboard';

// Dynamic Curated Learning Platform Resource Mapper
const getCuratedResources = (topicName, defaultResources) => {
  const normalized = (topicName || "").toLowerCase();
  
  const resourcesList = [];

  // 1. Python Foundations
  if (normalized.includes("python") || normalized.includes("foundations")) {
    resourcesList.push({
      label: "Official Python Documentation",
      url: "https://docs.python.org/3/",
      platform: "documentation"
    });
    resourcesList.push({
      label: "Python Basics - W3Schools",
      url: "https://www.w3schools.com/python/",
      platform: "w3schools"
    });
    resourcesList.push({
      label: "Full Python Programming Course - freeCodeCamp",
      url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
      platform: "freecodecamp"
    });
  }

  // 2. Git & Version Control
  if (normalized.includes("git") || normalized.includes("github") || normalized.includes("vcs")) {
    resourcesList.push({
      label: "Pro Git E-Book",
      url: "https://git-scm.com/book/en/v2",
      platform: "documentation"
    });
    resourcesList.push({
      label: "GitHub Interactive Learning Course",
      url: "https://skills.github.com/",
      platform: "interactive"
    });
    resourcesList.push({
      label: "Git & GitHub Crash Course - YouTube",
      url: "https://www.youtube.com/watch?v=RGOj5yH7evk",
      platform: "youtube"
    });
  }

  // 3. APIs, Servers & FastAPI
  if (normalized.includes("api") || normalized.includes("fastapi") || normalized.includes("server")) {
    resourcesList.push({
      label: "FastAPI Tutorial - Official",
      url: "https://fastapi.tiangolo.com/tutorial/",
      platform: "documentation"
    });
    resourcesList.push({
      label: "REST API Basics - MDN Web Docs",
      url: "https://developer.mozilla.org/en-US/docs/Glossary/REST",
      platform: "mdn"
    });
    resourcesList.push({
      label: "Build a Python REST API in 2 Hours - YouTube",
      url: "https://www.youtube.com/watch?v=0sOvCWFmrtA",
      platform: "youtube"
    });
  }

  // 4. SQL, Databases & Supabase
  if (normalized.includes("database") || normalized.includes("sql") || normalized.includes("postgres") || normalized.includes("supabase")) {
    resourcesList.push({
      label: "PostgreSQL Database Guides - Supabase",
      url: "https://supabase.com/docs/guides/database",
      platform: "supabase"
    });
    resourcesList.push({
      label: "SQL Tutorial - W3Schools",
      url: "https://www.w3schools.com/sql/",
      platform: "w3schools"
    });
    resourcesList.push({
      label: "Database Schema Design Basics - YouTube",
      url: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
      platform: "youtube"
    });
  }

  // 5. Real-time WebSockets & CDC
  if (normalized.includes("realtime") || normalized.includes("websocket") || normalized.includes("synchronization")) {
    resourcesList.push({
      label: "WebSockets API Developer Guide - MDN",
      url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API",
      platform: "mdn"
    });
    resourcesList.push({
      label: "Supabase Realtime API Docs",
      url: "https://supabase.com/docs/guides/realtime",
      platform: "supabase"
    });
  }

  // 6. Testing, Pytest & Jest
  if (normalized.includes("testing") || normalized.includes("pytest") || normalized.includes("jest")) {
    resourcesList.push({
      label: "Writing Tests with Pytest - Official Guide",
      url: "https://docs.pytest.org/",
      platform: "documentation"
    });
    resourcesList.push({
      label: "Python Testing with Pytest Tutorial - YouTube",
      url: "https://www.youtube.com/watch?v=cHYq1uxVMxs",
      platform: "youtube"
    });
  }

  // 7. Deployments, Docker & Vercel
  if (normalized.includes("deploy") || normalized.includes("docker") || normalized.includes("vercel")) {
    resourcesList.push({
      label: "Deploying Single Page Web Apps - Vercel",
      url: "https://vercel.com/docs/deployments/overview",
      platform: "vercel"
    });
    resourcesList.push({
      label: "Docker Containerization Course - freeCodeCamp",
      url: "https://www.youtube.com/watch?v=3c-iKn5qK70",
      platform: "freecodecamp"
    });
  }

  // Fallback: If no custom mapping matched, map default string resources to YouTube or Google Search
  if (resourcesList.length === 0) {
    if (defaultResources && defaultResources.length > 0) {
      defaultResources.forEach((res) => {
        const isUrl = res.startsWith("http://") || res.startsWith("https://");
        
        let platform = "youtube";
        const lowerRes = res.toLowerCase();
        if (lowerRes.includes("w3schools.com")) platform = "w3schools";
        else if (lowerRes.includes("freecodecamp.org")) platform = "freecodecamp";
        else if (lowerRes.includes("mozilla.org") || lowerRes.includes("mdn")) platform = "mdn";
        else if (lowerRes.includes("vercel.com")) platform = "vercel";
        else if (lowerRes.includes("supabase.com")) platform = "supabase";
        else if (isUrl && !lowerRes.includes("youtube.com") && !lowerRes.includes("youtu.be")) platform = "documentation";

        resourcesList.push({
          label: res,
          url: isUrl ? res : `https://www.youtube.com/results?search_query=${encodeURIComponent(res + " tutorial")}`,
          platform: platform
        });
      });
    } else {
      resourcesList.push({
        label: "Search Google Devs",
        url: `https://www.google.com/search?q=${encodeURIComponent(topicName + " development resource")}`,
        platform: "documentation"
      });
    }
  }

  return resourcesList;
};

// Platform-Specific Icon / Style Resolver
const getPlatformPillClass = (platform) => {
  switch (platform) {
    case 'documentation': return 'platform-docs';
    case 'w3schools': return 'platform-w3s';
    case 'freecodecamp': return 'platform-fcc';
    case 'youtube': return 'platform-yt';
    case 'mdn': return 'platform-mdn';
    case 'supabase': return 'platform-supabase';
    case 'vercel': return 'platform-vercel';
    default: return 'platform-generic';
  }
};

const getPlatformIcon = (platform) => {
  switch (platform) {
    case 'documentation': return '📖';
    case 'w3schools': return '🟢';
    case 'freecodecamp': return '🔥';
    case 'youtube': return '▶️';
    case 'mdn': return '🦊';
    case 'supabase': return '⚡';
    case 'vercel': return '▲';
    default: return '🔗';
  }
};

export default function LearningAccordion({ items, toggleItemStatus, isGuest, onAuthRequired }) {
  const [expandedWeeks, setExpandedWeeks] = useState({ 1: true }); // Week 1 open by default

  const toggleWeek = (weekNum) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekNum]: !prev[weekNum]
    }));
  };

  if (!items || items.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3.5rem 2rem',
        color: 'var(--text-muted)',
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px dashed rgba(255, 255, 255, 0.06)',
        borderRadius: '12px',
        margin: '1rem 0'
      }}>
        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>🎓</span>
        <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem' }}>No Active Roadmap Generated</h4>
        <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto', lineHeight: '1.4' }}>
          Please configure your **Career Preferences** (Current Skills & Target Roles) in the sidebar on the right, then click **⚡ Generate AI Roadmap** to create your customized learning path.
        </p>
      </div>
    );
  }

  return (
    <div className="learning-accordion">
      {items.map((week) => {
        const isOpen = !!expandedWeeks[week.week_number];
        const curatedRes = getCuratedResources(week.topic_name, week.resources);
        
        return (
          <div key={week.id || week.week_number} className={`accordion-item ${week.status} ${isOpen ? 'open' : ''}`}>
            
            {/* Header Accordion Toggle */}
            <div className="accordion-header" onClick={() => toggleWeek(week.week_number)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                
                {/* Complete / Pending Checkbox */}
                <label className="checkbox-container" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={week.status === "Completed"}
                    onChange={() => isGuest ? onAuthRequired('progress') : toggleItemStatus(week.id)}
                  />
                  <span className="checkmark"></span>
                </label>

                <div className="header-meta">
                  <span className="week-badge-mini">Week {week.week_number}</span>
                  <h3 className="accordion-title-text">{week.topic_name}</h3>
                </div>
              </div>

              {/* Status & Caret Indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`status-pill ${week.status.toLowerCase()}`}>{week.status}</span>
                <span className="accordion-arrow">{isOpen ? '▼' : '▶'}</span>
              </div>
            </div>

            {/* Expandable Body content */}
            {isOpen && (
              <div className="accordion-body">
                <div className="accordion-desc">
                  <CondensedMarkdownRenderer content={week.description} />
                </div>
                
                <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🎯 Recommended Learning Paths (Curated)
                </h4>
                
                <div className="resources-accordion-grid">
                  {curatedRes.map((res, index) => (
                    isGuest ? (
                      <button
                        key={index}
                        className={`resource-pill ${getPlatformPillClass(res.platform)} guest-locked-pill`}
                        onClick={() => onAuthRequired('resources')}
                      >
                        <span className="platform-icon">{getPlatformIcon(res.platform)}</span>
                        <span className="resource-pill-label">{res.label}</span>
                        <span className="pill-lock-icon">🔒</span>
                      </button>
                    ) : (
                      <a 
                        key={index} 
                        href={res.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`resource-pill ${getPlatformPillClass(res.platform)}`}
                      >
                        <span className="platform-icon">{getPlatformIcon(res.platform)}</span>
                        <span className="resource-pill-label">{res.label}</span>
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
