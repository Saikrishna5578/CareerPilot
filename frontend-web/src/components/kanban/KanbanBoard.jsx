import React, { useState } from 'react';
import JobCard from './JobCard';
import EditJobModal from './EditJobModal';
import ResumeUpload from './ResumeUpload';
import { supabase } from '../../utils/supabaseClient';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const STAGES = ["Favorite", "Applied", "First Round", "Technical Interview", "Offer Received"];

export default function KanbanBoard({
  applications,
  setApplications,
  jobFeed,
  triggerScraper,
  addFromFeed,
  addToFavorites,
  handleDragStart,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  dragOverColumn,
  showToast,
  triggerConfirm,
  triggerPrompt,
  isGuest,
  onAuthRequired,
  scraperEnabled = true,
  resumeUploadEnabled = true,
  scraperLoading
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [scraperSkills, setScraperSkills] = useState("Python");
  const [scraperDomain, setScraperDomain] = useState("Backend");
  const [scraperExperience, setScraperExperience] = useState("internship");
  const [scraperWorkMode, setScraperWorkMode] = useState("Remote");
  const [kanbanGuideVisible, setKanbanGuideVisible] = useState(() => {
    return localStorage.getItem('careerpilot_kanban_guide_dismissed') !== 'true';
  });

  const dismissGuide = () => {
    setKanbanGuideVisible(false);
    localStorage.setItem('careerpilot_kanban_guide_dismissed', 'true');
  };

  // Edit Triggered from Card
  const handleEdit = (job) => {
    setSelectedJob(job);
    setIsEditModalOpen(true);
  };

  // Delete Triggered from Card
  const handleDelete = async (jobId) => {
    const confirmed = await triggerConfirm(
      "🗑️ Delete Application",
      "Are you sure you want to remove this job application? This action cannot be undone."
    );

    if (confirmed) {
      // Optimistic update
      setApplications(prev => prev.filter(app => app.id !== jobId));

      // Database sync
      if (supabase && !jobId.toString().startsWith("app-")) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await fetch(`${API}/api/applications/${jobId}?user_id=${user.id}`, {
              method: "DELETE"
            });
          }
        } catch (err) {
          console.error("Failed to delete application via backend:", err);
        }
      }
      showToast("Application deleted.", "info");
    }
  };

  // Save changes from Edit Modal
  const handleSave = async (updatedJob) => {
    setIsEditModalOpen(false);

    // Update state locally
    setApplications(prev => 
      prev.map(app => app.id === updatedJob.id ? updatedJob : app)
    );

    // Database Sync
    if (supabase && !updatedJob.id.toString().startsWith("app-")) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await fetch(`${API}/api/applications/${updatedJob.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: user.id,
              title: updatedJob.title,
              company: updatedJob.company,
              stage: updatedJob.is_fav ? "Applied" : updatedJob.stage,
              location: updatedJob.location || "Remote",
              salary: updatedJob.salary || "Not disclosed",
              apply_link: updatedJob.apply_link || "",
              is_fav: updatedJob.is_fav || false
            })
          });
        }
      } catch (err) {
        console.error("Failed to update application via backend:", err);
      }
    }
    showToast("Application details updated.", "success");
  };

  return (
    <div className="kanban-page-container">

      {/* ======== SCRAPER SECTION (ON TOP) ======== */}
      <div className="glass-panel" style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem' }}>
              📡 Sourced Opportunities (Python Scraper Feed)
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
              Search live software roles. Click track to push to your pipeline.
            </p>
          </div>
          <button 
            className="btn-secondary" 
            style={{ 
              alignSelf: 'center',
              ...(scraperEnabled ? {} : { opacity: 0.55, cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)', borderColor: 'transparent' })
            }}
            disabled={!scraperEnabled}
            onClick={isGuest ? () => onAuthRequired('add_job') : () => triggerScraper(scraperSkills, scraperDomain, scraperExperience, scraperWorkMode)}
          >
            {scraperEnabled ? "🔄 Sync Scraper Openings" : "🚫 Scraper Disabled"}
          </button>
        </div>

        {/* Custom Scraper Filters Form */}
        <div className="scraper-filters-form" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'left' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Required Skills</label>
            <input 
              type="text" 
              placeholder="e.g. Python, SQL" 
              value={scraperSkills} 
              onChange={(e) => setScraperSkills(e.target.value)} 
              style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.45rem 0.75rem', color: '#fff', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'left' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Preferred Domain</label>
            <select 
              value={scraperDomain} 
              onChange={(e) => setScraperDomain(e.target.value)} 
              style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.45rem 0.75rem', color: '#fff', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
            >
              <option value="Backend" style={{ background: '#0f172a', color: '#fff' }}>Backend Engineering</option>
              <option value="Frontend" style={{ background: '#0f172a', color: '#fff' }}>Frontend Engineering</option>
              <option value="Full Stack" style={{ background: '#0f172a', color: '#fff' }}>Full Stack Development</option>
              <option value="Data Science" style={{ background: '#0f172a', color: '#fff' }}>Data Science</option>
              <option value="Data Engineer" style={{ background: '#0f172a', color: '#fff' }}>Data Engineering</option>
              <option value="Machine Learning" style={{ background: '#0f172a', color: '#fff' }}>AI / Machine Learning</option>
              <option value="DevOps" style={{ background: '#0f172a', color: '#fff' }}>DevOps / Cloud</option>
            </select>
          </div>
          <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'left' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Experience Level</label>
            <select 
              value={scraperExperience} 
              onChange={(e) => setScraperExperience(e.target.value)} 
              style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.45rem 0.75rem', color: '#fff', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
            >
              <option value="internship" style={{ background: '#0f172a', color: '#fff' }}>Internship</option>
              <option value="entry" style={{ background: '#0f172a', color: '#fff' }}>Entry Level</option>
              <option value="mid" style={{ background: '#0f172a', color: '#fff' }}>Mid Level</option>
              <option value="senior" style={{ background: '#0f172a', color: '#fff' }}>Senior Level</option>
            </select>
          </div>
          <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'left' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Work Mode</label>
            <select 
              value={scraperWorkMode} 
              onChange={(e) => setScraperWorkMode(e.target.value)} 
              style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.45rem 0.75rem', color: '#fff', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
            >
              <option value="Remote" style={{ background: '#0f172a', color: '#fff' }}>Remote</option>
              <option value="Hybrid" style={{ background: '#0f172a', color: '#fff' }}>Hybrid</option>
              <option value="On-site" style={{ background: '#0f172a', color: '#fff' }}>On-site</option>
              <option value="Any" style={{ background: '#0f172a', color: '#fff' }}>Any Mode</option>
            </select>
          </div>
        </div>

        <div className="feed-panel">
          {scraperLoading ? (
            <div className="scraper-loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '1rem' }}>
              <div className="radar-spinner"></div>
              <span className="pulsing-text" style={{ color: 'var(--accent-blue)', fontWeight: '600' }}>Scanning the web for new opportunities...</span>
            </div>
          ) : jobFeed.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "2rem" }}>
              No scraper jobs found. Click "Sync Scraper Openings" above to scan boards.
            </p>
          ) : (
            jobFeed.map((job) => (
              <div key={job.id} className="feed-item">
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: "600", display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {job.title}
                    {job.is_new === false ? (
                      <span style={{ 
                        fontSize: '0.65rem', 
                        background: 'rgba(249, 115, 22, 0.15)', 
                        color: 'var(--accent-orange)', 
                        padding: '0.1rem 0.35rem', 
                        borderRadius: '4px',
                        border: '1px solid rgba(249, 115, 22, 0.25)',
                        fontWeight: '600'
                      }}>Older</span>
                    ) : job.is_new === true ? (
                      <span style={{ 
                        fontSize: '0.65rem', 
                        background: 'rgba(16, 185, 129, 0.15)', 
                        color: 'var(--accent-green)', 
                        padding: '0.1rem 0.35rem', 
                        borderRadius: '4px',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        fontWeight: '600'
                      }}>New</span>
                    ) : null}
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--accent-cyan)", marginTop: '0.15rem' }}>
                    {job.company} — <span style={{ color: "var(--text-muted)" }}>{job.location}</span>
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <a href={job.apply_link} target="_blank" rel="noopener noreferrer" className="apply-link-btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>View Details</a>
                  <button className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => isGuest ? onAuthRequired('add_job') : addToFavorites(job)}>
                    ⭐ Favorite
                  </button>
                  <button className="btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => isGuest ? onAuthRequired('add_job') : addFromFeed(job)}>
                    Track Application
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ======== KANBAN SECTION (BELOW) ======== */}

      {/* Dismissible Usage Guide */}
      {kanbanGuideVisible && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.06)',
          border: '1px solid rgba(59, 130, 246, 0.15)',
          borderRadius: '10px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <p style={{ color: 'var(--accent-blue)', fontSize: '0.85rem', margin: 0, lineHeight: '1.45' }}>
            <strong>💡 How to use:</strong> Drag and drop job cards between columns to update their status. Click <strong>"Track Application"</strong> on jobs above to add them to your pipeline. Use <strong>"➕ Add Application Manual"</strong> for custom entries.
          </p>
          <button
            onClick={dismissGuide}
            style={{
              background: 'none',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '6px',
              color: 'var(--accent-blue)',
              padding: '0.25rem 0.65rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              opacity: 0.7,
              transition: 'opacity 0.2s'
            }}
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Kanban Header */}
      <div className="glass-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 className="glass-title">Applications Kanban</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: '0.25rem' }}>
            Drag and drop job cards to update pipeline stages. Automatically synchronised across devices.
          </p>
        </div>
      </div>

      {/* Interactive Kanban Board columns */}
      {applications.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed rgba(255, 255, 255, 0.06)',
          color: 'var(--text-muted)',
          marginBottom: '2.5rem'
        }}>
          <span style={{ fontSize: '2.2rem', display: 'block', marginBottom: '0.75rem' }}>💼</span>
          <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: '700', marginBottom: '0.4rem' }}>No Applications Tracked Yet</h4>
          <p style={{ fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto', lineHeight: '1.4' }}>
            Click "➕ Add Application Manual" above to add jobs manually, or search for openings in the Scraper feed and click "Track Application" to start your board!
          </p>
        </div>
      )}
      <div className="kanban-board">
        {STAGES.map((stage) => {
          const stageJobs = applications.filter(app => {
            if (stage === "Favorite") {
              return app.is_fav === true;
            } else {
              return app.stage === stage && !app.is_fav;
            }
          });
          return (
            <div 
              key={stage} 
              className={`kanban-column ${dragOverColumn === stage ? "drag-over" : ""} ${isGuest ? 'guest-locked-column' : ''}`}
              onDragOver={(e) => isGuest ? e.preventDefault() : handleDragOver(e, stage)}
              onDragEnter={(e) => isGuest ? null : handleDragEnter(e, stage)}
              onDragLeave={isGuest ? undefined : handleDragLeave}
              onDrop={(e) => { e.preventDefault(); if (isGuest) { onAuthRequired('drag'); return; } handleDrop(e, stage); }}
            >
              <div className="kanban-column-header">
                <span className="column-title">{stage === "Favorite" ? "⭐ Saved Favorites" : stage}</span>
                <span className="column-count">{stageJobs.length}</span>
              </div>

              <div className="card-container">
                {stageJobs.map((app) => (
                  <JobCard 
                    key={app.id} 
                    job={app} 
                    onDragStart={isGuest ? (e) => { e.preventDefault(); onAuthRequired('drag'); } : handleDragStart} 
                    onEdit={isGuest ? () => onAuthRequired('edit_job') : handleEdit}
                    onDelete={isGuest ? () => onAuthRequired('delete_job') : handleDelete}
                    isGuest={isGuest}
                    onAuthRequired={onAuthRequired}
                  />
                ))}
                {stageJobs.length === 0 && (
                  <div className="empty-column-placeholder">
                    Drop cards here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lower Row: Manual Add & Resume Upload side-by-side */}
      <div className="flex-row-lower" style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
        
        {/* Left Side: Manual Application Card */}
        <div className="glass-panel manual-add-card" style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', boxSizing: 'border-box' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left' }}>
              ➕ Manual Application
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: '1.4', textAlign: 'left' }}>
              Track custom job opportunities that aren't listed in the scraper feed. Add details manually to place them directly onto your Kanban pipeline.
            </p>
          </div>
          <button 
            className="btn-primary"
            style={{ width: '100%', padding: '0.65rem' }}
            onClick={async () => {
              if (isGuest) { onAuthRequired('add_job'); return; }
              const jobData = await triggerPrompt("Create Manual Application");
              if (jobData) {
                const notesPayload = JSON.stringify({
                  is_fav: false,
                  location: jobData.location || "Remote",
                  salary: jobData.salary || "Not disclosed",
                  apply_link: jobData.apply_link || "",
                  user_notes: ""
                });

                // Sync to backend
                if (supabase) {
                  supabase.auth.getUser().then(async ({ data: { user } }) => {
                    if (user) {
                      try {
                        const response = await fetch(`${API}/api/applications`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            user_id: user.id,
                            title: jobData.title,
                            company: jobData.company,
                            stage: "Applied",
                            location: jobData.location || "Remote",
                            salary: jobData.salary || "Not disclosed",
                            apply_link: jobData.apply_link || "",
                            is_fav: false
                          })
                        });

                        if (response.ok) {
                          const newApp = await response.json();
                          setApplications(prev => [...prev, newApp]);
                          showToast(`Added manual entry: "${jobData.title}"`, 'success');
                        } else {
                          showToast("Failed to save manual application via backend.", "error");
                        }
                      } catch (err) {
                        console.error("Error inserting manual entry via backend:", err);
                      }
                    }
                  });
                } else {
                  const newApp = {
                    id: `app-${Date.now()}`,
                    title: jobData.title,
                    company: jobData.company,
                    stage: "Applied",
                    notes: notesPayload,
                    location: jobData.location,
                    salary: jobData.salary,
                    apply_link: jobData.apply_link,
                    is_fav: false
                  };
                  setApplications(prev => [...prev, newApp]);
                  showToast(`Added manual entry: "${jobData.title}"`, 'success');
                }
              }
            }}
          >
            Create Manual Entry
          </button>
        </div>

        {/* Right Side: Master Resume Upload Card */}
        <div style={{ flex: '1 1 350px', display: 'flex' }}>
          <ResumeUpload 
            showToast={showToast} 
            triggerConfirm={triggerConfirm} 
            isGuest={isGuest} 
            onAuthRequired={onAuthRequired} 
            resumeUploadEnabled={resumeUploadEnabled}
          />
        </div>
      </div>

      {/* Edit Job Modal */}
      <EditJobModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        job={selectedJob}
        onSave={handleSave}
      />
    </div>
  );
}
