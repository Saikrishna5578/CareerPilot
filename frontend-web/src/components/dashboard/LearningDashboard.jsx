import React, { useState } from 'react';
import LearningAccordion from './LearningAccordion';

const getProgressColor = (pct) => {
  if (pct === 100) return 'var(--accent-green)'; // Complete
  if (pct >= 70) return 'var(--accent-cyan)';    // High
  if (pct >= 40) return 'var(--accent-purple)';  // Medium
  if (pct >= 15) return 'var(--accent-orange)';  // Low
  return 'var(--accent-pink)';                    // Just starting
};

const getProgressReaction = (pct) => {
  if (pct === 100) return { emoji: "🏆", text: "Curriculum Mastered!" };
  if (pct >= 75) return { emoji: "🧠", text: "Almost a pro!" };
  if (pct >= 45) return { emoji: "💪", text: "Building expertise" };
  if (pct >= 15) return { emoji: "📚", text: "Learning & growing" };
  return { emoji: "🚀", text: "Starting out" };
};

// ============================================================
// Robust Markdown Renderer — handles headings, bold, italic,
// inline code, fenced code blocks, numbered lists, nested lists
// ============================================================
const formatInline = (text) => {
  if (!text) return text;
  const parts = [];
  // Process inline formatting: **bold**, *italic*, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;
  let keyIdx = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={`b-${keyIdx}`} style={{ color: 'var(--text-main)', fontWeight: '700' }}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={`i-${keyIdx}`} style={{ color: 'var(--accent-cyan)', fontStyle: 'italic' }}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(<code key={`c-${keyIdx}`} style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple)', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.82rem', fontFamily: "'JetBrains Mono', monospace" }}>{match[4]}</code>);
    }
    lastIndex = match.index + match[0].length;
    keyIdx++;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
};

export const MarkdownRenderer = ({ content }) => {
  if (!content) return <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>No detailed sections found. Click generate to build them.</p>;
  
  const cleanContent = content.replace(/\\n/g, '\n');
  const lines = cleanContent.split('\n');
  const elements = [];
  let listItems = [];
  let inList = false;
  let listType = 'ul'; // 'ul' or 'ol'
  let codeBlock = null;

  const flushList = (index) => {
    if (listItems.length > 0) {
      if (listType === 'ol') {
        elements.push(<ol key={`ol-${index}`} style={{ paddingLeft: '1.5rem', margin: '0.5rem 0', color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.55' }}>{listItems}</ol>);
      } else {
        elements.push(<ul key={`ul-${index}`} style={{ paddingLeft: '1.25rem', margin: '0.5rem 0', listStyleType: 'disc', color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.55' }}>{listItems}</ul>);
      }
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Fenced code block
    if (trimmed.startsWith('```')) {
      if (codeBlock !== null) {
        // Close code block
        elements.push(
          <pre key={`code-${index}`} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '1rem', overflowX: 'auto', margin: '0.75rem 0', fontSize: '0.82rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-cyan)', lineHeight: '1.5' }}>
            <code>{codeBlock.join('\n')}</code>
          </pre>
        );
        codeBlock = null;
      } else {
        flushList(index);
        codeBlock = [];
      }
      return;
    }

    if (codeBlock !== null) {
      codeBlock.push(line);
      return;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      flushList(index);
      elements.push(<h4 key={index} style={{ color: 'var(--text-main)', marginTop: '1.2rem', marginBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.2rem', fontSize: '0.95rem', fontWeight: '700' }}>{formatInline(trimmed.slice(4))}</h4>);
    } else if (trimmed.startsWith('## ')) {
      flushList(index);
      elements.push(<h3 key={index} style={{ color: 'var(--text-main)', marginTop: '1.5rem', marginBottom: '0.6rem', fontSize: '1.1rem', fontWeight: '800' }}>{formatInline(trimmed.slice(3))}</h3>);
    } else if (trimmed.startsWith('# ')) {
      flushList(index);
      elements.push(<h2 key={index} style={{ color: 'var(--accent-blue)', marginTop: '1.75rem', marginBottom: '0.8rem', fontSize: '1.25rem', fontWeight: '900' }}>{formatInline(trimmed.slice(2))}</h2>);
    }
    // Numbered list
    else if (/^\d+[\.\)]\s/.test(trimmed)) {
      if (!inList || listType !== 'ol') {
        flushList(index);
        listType = 'ol';
      }
      inList = true;
      const text = trimmed.replace(/^\d+[\.\)]\s/, '');
      listItems.push(<li key={index} style={{ marginBottom: '0.3rem' }}>{formatInline(text)}</li>);
    }
    // Unordered list
    else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      if (!inList || listType !== 'ul') {
        flushList(index);
        listType = 'ul';
      }
      inList = true;
      listItems.push(<li key={index} style={{ marginBottom: '0.3rem' }}>{formatInline(trimmed.substring(2))}</li>);
    }
    // Indented sub-list
    else if (/^\s+([-*]|\d+[\.\)])\s/.test(line)) {
      if (inList) {
        const subText = line.trim().replace(/^[-*]\s|^\d+[\.\)]\s/, '');
        listItems.push(<li key={index} style={{ marginLeft: '1rem', marginBottom: '0.2rem', listStyleType: 'circle', fontSize: '0.85rem' }}>{formatInline(subText)}</li>);
      }
    }
    // Empty line
    else if (trimmed === '') {
      flushList(index);
      elements.push(<div key={index} style={{ height: '0.4rem' }}></div>);
    }
    // Paragraph
    else {
      flushList(index);
      elements.push(<p key={index} style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '0.6rem', lineHeight: '1.55' }}>{formatInline(trimmed)}</p>);
    }
  });

  flushList('final');

  return <div style={{ textAlign: 'left', padding: '0.3rem 0' }}>{elements}</div>;
};

// ============================================================
// Condensed Markdown Renderer — shows first ~4 content lines
// with an "Expand Full Details" toggle button
// ============================================================
export const CondensedMarkdownRenderer = ({ content }) => {
  const [expanded, setExpanded] = useState(false);

  if (!content) return <MarkdownRenderer content={content} />;

  const cleanContent = content.replace(/\\n/g, '\n');
  const lines = cleanContent.split('\n').filter(l => l.trim() !== '');
  const isLong = lines.length > 5;

  if (!isLong || expanded) {
    return (
      <div>
        <MarkdownRenderer content={cleanContent} />
        {isLong && (
          <button
            onClick={() => setExpanded(false)}
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '6px',
              color: 'var(--accent-blue)',
              padding: '0.35rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '0.75rem',
              transition: 'all 0.2s ease'
            }}
          >
            ▲ Collapse Details
          </button>
        )}
      </div>
    );
  }

  const previewLines = lines.slice(0, 4).join('\n');

  return (
    <div>
      <MarkdownRenderer content={previewLines} />
      <button
        onClick={() => setExpanded(true)}
        style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '6px',
          color: 'var(--accent-blue)',
          padding: '0.35rem 0.85rem',
          fontSize: '0.78rem',
          fontWeight: '600',
          cursor: 'pointer',
          marginTop: '0.75rem',
          transition: 'all 0.2s ease'
        }}
      >
        🔍 Expand Full Details ({lines.length - 4} more lines)
      </button>
    </div>
  );
};

export default function LearningDashboard({
  roadmap,
  toggleItemStatus,
  careerGoal,
  setCareerGoal,
  language,
  setLanguage,
  interests,
  setInterests,
  loading,
  triggerRoadmapGeneration,
  completedCount,
  totalItems,
  percentage,
  isGuest,
  onAuthRequired,
  roadmapGenEnabled = true
}) {
  const progressColor = getProgressColor(percentage);
  const reaction = getProgressReaction(percentage);
  const [dashboardTab, setDashboardTab] = useState("curriculum"); // "curriculum" | "projects" | "plans" | "prep"
  const details = roadmap.details || {};

  return (
    <div className="dashboard-grid">
      
      {/* Learning Timeline (Accordion Curriculum) */}
      <div className="glass-panel main-curriculum">
        <div className="flex-header" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 className="glass-title">{roadmap.title}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Tailored learning schedule designed to close your skill gaps
            </p>
          </div>
        </div>

        {/* Tabbed Navigation Bar */}
        <div className="dashboard-tabs" style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.25rem', paddingBottom: '0.25rem', overflowX: 'auto' }}>
          {[
            { key: 'curriculum', label: '📅 Weekly Syllabus', color: 'var(--accent-blue)' },
            { key: 'projects', label: '🏆 Projects & Milestones', color: 'var(--accent-cyan)' },
            { key: 'plans', label: '⏱️ Study Routine', color: 'var(--accent-purple)' },
            { key: 'prep', label: '💼 Interview Prep', color: 'var(--accent-orange)' }
          ].map(tab => (
            <button 
              key={tab.key}
              className={`tab-link ${dashboardTab === tab.key ? 'active' : ''}`} 
              onClick={() => setDashboardTab(tab.key)}
              style={{ 
                background: 'none', 
                border: 'none', 
                borderBottom: dashboardTab === tab.key ? `2px solid ${tab.color}` : '2px solid transparent',
                color: dashboardTab === tab.key ? tab.color : 'var(--text-muted)', 
                cursor: 'pointer', 
                fontWeight: '600',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {dashboardTab === 'curriculum' && (
          <LearningAccordion 
            items={roadmap.items} 
            toggleItemStatus={toggleItemStatus}
            isGuest={isGuest}
            onAuthRequired={onAuthRequired}
          />
        )}

        {dashboardTab === 'projects' && (
          <div className="tab-container" style={{ padding: '0.5rem' }}>
            <h3 style={{ color: 'var(--accent-cyan)', fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.75rem' }}>Milestone Projects</h3>
            <MarkdownRenderer content={details.milestone_projects} />
            <div style={{ height: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '1.25rem 0' }}></div>
            <h3 style={{ color: 'var(--accent-cyan)', fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.75rem' }}>Final Industry-Level Project</h3>
            <MarkdownRenderer content={details.final_project} />
            <div style={{ height: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '1.25rem 0' }}></div>
            <h3 style={{ color: 'var(--accent-cyan)', fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.75rem' }}>Portfolio Roadmap</h3>
            <MarkdownRenderer content={details.portfolio_roadmap} />
          </div>
        )}

        {dashboardTab === 'plans' && (
          <div className="tab-container" style={{ padding: '0.5rem' }}>
            <h3 style={{ color: 'var(--accent-purple)', fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.75rem' }}>Weekly Study Schedule</h3>
            <MarkdownRenderer content={details.weekly_plan} />
            <div style={{ height: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '1.25rem 0' }}></div>
            <h3 style={{ color: 'var(--accent-purple)', fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.75rem' }}>Daily Routine</h3>
            <MarkdownRenderer content={details.daily_plan} />
          </div>
        )}

        {dashboardTab === 'prep' && (
          <div className="tab-container" style={{ padding: '0.5rem' }}>
            <h3 style={{ color: 'var(--accent-orange)', fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.75rem' }}>Interview Preparation</h3>
            <MarkdownRenderer content={details.interview_prep} />
            <div style={{ height: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '1.25rem 0' }}></div>
            <h3 style={{ color: 'var(--accent-orange)', fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.75rem' }}>Next Core Skills</h3>
            <MarkdownRenderer content={details.next_skills} />
          </div>
        )}

      </div>

      {/* Profile Config & Analytics Sidebar — FIXED WIDTH */}
      <div className="sidebar-group" style={{ width: '320px', minWidth: '320px', maxWidth: '320px' }}>
        
        {/* Career Preferences — NOW ON TOP */}
        <div className="glass-panel onboarding-setup-card">
          <h3 className="sidebar-section-title">Career Preferences</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Modify your career goal, preferred language, and interests to let Gemini AI regenerate your path.
          </p>

          <div className="form-group">
            <label className="form-label">Career Goal</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Data Scientist, Frontend Engineer"
              value={careerGoal} 
              onChange={(e) => setCareerGoal(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Programming Language</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Python, JavaScript, Go"
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Interests & Domains</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Machine Learning, Web App Development"
              value={interests} 
              onChange={(e) => setInterests(e.target.value)}
            />
          </div>

          <button 
            className="btn-primary generate-roadmap-btn" 
            style={{ 
              width: "100%", 
              marginTop: "0.5rem",
              ...(roadmapGenEnabled ? {} : { opacity: 0.55, cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)', borderColor: 'transparent' }) 
            }}
            disabled={loading || !roadmapGenEnabled}
            onClick={isGuest ? () => onAuthRequired('generate') : triggerRoadmapGeneration}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span className="spinner"></span> Analyzing Gaps...
              </span>
            ) : !roadmapGenEnabled ? (
              "🚫 AI Generation Disabled"
            ) : (
              "⚡ Generate AI Roadmap"
            )}
          </button>
        </div>

        {/* Progress Circle — NOW BELOW (Sticky) */}
        <div className="glass-panel progress-stats-card" style={{ position: 'sticky', top: '1.5rem', zIndex: 10 }}>
          <h3 className="sidebar-section-title">Curriculum Progress</h3>
          
          <div className={isGuest ? 'guest-blur-content' : ''}>
            <div className="progress-radial-container">
              <div className="svg-wrapper">
                <svg width="120" height="120" className="svg-circle">
                  <circle className="circle-bg" cx="60" cy="60" r="45" />
                  <circle 
                    className="circle-progress" 
                    cx="60" 
                    cy="60" 
                    r="45" 
                    strokeDasharray={2 * Math.PI * 45}
                    strokeDashoffset={2 * Math.PI * 45 - (percentage / 100) * (2 * Math.PI * 45)}
                    style={{ stroke: progressColor }}
                  />
                </svg>
                <div className="radial-inner-label">
                  <span className="percentage-number" style={{ color: progressColor }}>{percentage}%</span>
                  <span className="percentage-sub">Done</span>
                </div>
              </div>
              
              <div className="progress-stats-text">
                <p className="stats-main">{completedCount} of {totalItems} Weeks Completed</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', fontSize: '0.9rem', fontWeight: '600', color: progressColor }}>
                  <span style={{ fontSize: '1.25rem' }}>{reaction.emoji}</span>
                  <span>{reaction.text}</span>
                </div>
                <p className="stats-sub" style={{ marginTop: '0.5rem' }}>🎯 Automated reminders checking hourly</p>
              </div>
            </div>
          </div>

          {isGuest && (
            <div className="guest-lock-overlay" onClick={() => onAuthRequired('progress')}>
              <span className="guest-lock-icon">🔒</span>
              <span className="guest-lock-text">Sign up to track progress</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
