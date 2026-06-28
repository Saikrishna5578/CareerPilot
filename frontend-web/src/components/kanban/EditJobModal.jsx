import React, { useState, useEffect } from 'react';

export default function EditJobModal({ isOpen, onClose, job, onSave }) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [applyLink, setApplyLink] = useState('');

  // Sync state with selected job
  useEffect(() => {
    if (job) {
      setTitle(job.title || '');
      setCompany(job.company || '');
      setLocation(job.location || 'Remote');
      setSalary(job.salary || 'Not disclosed');
      setApplyLink(job.apply_link || '#');
    }
  }, [job]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) {
      alert('Job Title and Company are required fields.');
      return;
    }
    onSave({
      ...job,
      title,
      company,
      location,
      salary,
      apply_link: applyLink
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>✏️ Edit Application Details</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Job Title *</label>
            <input 
              type="text" 
              className="form-input" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Company Name *</label>
            <input 
              type="text" 
              className="form-input" 
              value={company} 
              onChange={(e) => setCompany(e.target.value)} 
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Location</label>
              <input 
                type="text" 
                className="form-input" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
              />
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Salary</label>
              <input 
                type="text" 
                className="form-input" 
                value={salary} 
                onChange={(e) => setSalary(e.target.value)} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Application / Job Link</label>
            <input 
              type="url" 
              className="form-input" 
              placeholder="https://example.com/jobs/123"
              value={applyLink} 
              onChange={(e) => setApplyLink(e.target.value)} 
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
