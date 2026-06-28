import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

export default function ResumeUpload({ showToast, triggerConfirm, isGuest, onAuthRequired, resumeUploadEnabled = true }) {
  const [uploading, setUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(() => {
    return localStorage.getItem('careerpilot_resume_url') || '';
  });
  const [fileName, setFileName] = useState(() => {
    return localStorage.getItem('careerpilot_resume_name') || '';
  });

  // Check Supabase database link on load
  useEffect(() => {
    if (!supabase) return;

    async function fetchProfileResume() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('resume_url')
          .eq('id', user.id)
          .single();

        if (data && data.resume_url) {
          setResumeUrl(data.resume_url);
          const name = data.resume_url.substring(data.resume_url.lastIndexOf('/') + 1);
          setFileName(decodeURIComponent(name));
        }
      } catch (err) {
        console.warn("Could not retrieve resume from Supabase profile:", err);
      }
    }

    fetchProfileResume();
  }, []);

  // Handle local storage updates
  useEffect(() => {
    if (resumeUrl) {
      localStorage.setItem('careerpilot_resume_url', resumeUrl);
      localStorage.setItem('careerpilot_resume_name', fileName);
    } else {
      localStorage.removeItem('careerpilot_resume_url');
      localStorage.removeItem('careerpilot_resume_name');
    }
  }, [resumeUrl, fileName]);

  const handleFileUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      // Limit file type to PDF
      if (file.type !== 'application/pdf') {
        showToast('Please upload PDF files only.', 'warning');
        return;
      }

      // Offline mode check
      if (!supabase) {
        // Simulated local fallback
        console.log("Simulating file upload locally...");
        setTimeout(() => {
          setResumeUrl(`file:///mock_uploads/${file.name}`);
          setFileName(file.name);
          setUploading(false);
          showToast(`Successfully uploaded "${file.name}" locally!`, 'success');
        }, 1200);
        return;
      }

      // Supabase Storage upload
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('You must be logged in to sync resumes with Supabase storage.', 'warning');
        setUploading(false);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const cleanFileName = `resume_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${cleanFileName}`;

      // Upload file to the 'resumes' bucket
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Generate Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      // Save public URL to profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ resume_url: publicUrl, updated_at: new Date() })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setResumeUrl(publicUrl);
      setFileName(file.name);
      showToast('Resume uploaded successfully and synced!', 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast(`Upload failed: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    const confirmed = await triggerConfirm(
      "📄 Remove Resume",
      "Are you sure you want to remove your current resume? This will clear it from your cloud profile."
    );
    if (confirmed) {
      if (supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('profiles')
              .update({ resume_url: null, updated_at: new Date() })
              .eq('id', user.id);
          }
        } catch (err) {
          console.warn("Failed to remove resume from Supabase database:", err);
        }
      }
      setResumeUrl('');
      setFileName('');
      showToast("Resume removed successfully.", "info");
    }
  };

  return (
    <div className="glass-panel resume-upload-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem', padding: '1.5rem 2rem' }}>
      <div style={{ flex: '1 1 300px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📄 Master Resume Upload
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
          Keep a single master resume updated. We will alert you to customize it for individual applications.
        </p>
      </div>

      <div style={{ flex: '1 1 300px', maxWidth: '500px', width: '100%' }}>
        {!resumeUploadEnabled ? (
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.08)',
            color: 'var(--text-muted)'
          }}>
            <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.25rem' }}>🚫</span>
            <p style={{ fontSize: '0.8rem', fontWeight: '600', margin: 0 }}>Resume Upload disabled by admin.</p>
          </div>
        ) : isGuest ? (
          <div className="resume-guest-teaser" onClick={() => onAuthRequired('resume')} style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
              <div className="teaser-icon" style={{ fontSize: '1.75rem', margin: 0 }}>📄</div>
              <div>
                <p className="teaser-title" style={{ fontSize: '0.95rem', margin: 0, fontWeight: '700' }}>Upload & Sync Resume</p>
                <p className="teaser-desc" style={{ fontSize: '0.75rem', margin: 0 }}>Sign up free to customize for JDs & sync.</p>
              </div>
            </div>
            <button className="btn-primary teaser-cta-btn" style={{ padding: '0.4rem 0.8rem !important', fontSize: '0.8rem !important', whiteSpace: 'nowrap' }}>🔒 Unlock</button>
          </div>
        ) : resumeUrl ? (
          <div className="resume-info-box" style={{ padding: '0.75rem 1rem' }}>
            <div className="resume-meta" style={{ marginBottom: '0.5rem', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="resume-file-icon" style={{ fontSize: '1.4rem' }}>📁</span>
                <div className="resume-details">
                  <span className="resume-name" title={fileName} style={{ fontSize: '0.85rem', maxWidth: '180px' }}>{fileName}</span>
                  <span className="resume-status-tag" style={{ fontSize: '0.65rem' }}>Connected</span>
                </div>
              </div>
              <div className="resume-actions-row" style={{ border: 'none', padding: 0, margin: 0, gap: '0.75rem' }}>
                <a 
                  href={resumeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', textDecoration: 'none', display: 'inline-block' }}
                >
                  👁️ View
                </a>
                <button 
                  className="delete-card-btn" 
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-orange)', cursor: 'pointer', fontSize: '0.75rem' }} 
                  onClick={handleRemove}
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="upload-dropzone" style={{ padding: '1rem' }}>
            <label className="upload-label" style={{ flexDirection: 'row', justifyContent: 'center', gap: '1rem' }}>
              <span className="upload-icon" style={{ fontSize: '1.5rem', margin: 0 }}>📤</span>
              <div style={{ textAlign: 'left' }}>
                <span className="upload-text-primary" style={{ fontSize: '0.85rem', display: 'block' }}>Upload PDF Resume</span>
                <span className="upload-text-secondary" style={{ fontSize: '0.7rem' }}>Max size: 5MB</span>
              </div>
              <input 
                type="file" 
                className="file-input-hidden" 
                accept=".pdf" 
                onChange={handleFileUpload} 
                disabled={uploading}
              />
            </label>
            {uploading && (
              <div className="uploading-overlay" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.9)' }}>
                <div className="document-scan-animation"></div>
                <span className="pulsing-text" style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', fontWeight: '600' }}>Parsing Resume Data...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
