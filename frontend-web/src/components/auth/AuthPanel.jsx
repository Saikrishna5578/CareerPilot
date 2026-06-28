import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

export default function AuthPanel({ isOpen, onClose, initialTab = 'signup' }) {
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError('');
    setSuccessMsg('');
  };

  const switchTab = (newTab) => {
    resetForm();
    setTab(newTab);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // Offline simulation
    if (!supabase) {
      setLoading(true);
      setTimeout(() => {
        const mockUser = {
          id: `local-${Date.now()}`,
          email,
          user_metadata: { full_name: fullName }
        };
        localStorage.setItem('careerpilot_mock_user', JSON.stringify(mockUser));
        setLoading(false);
        setSuccessMsg('Account created! Redirecting...');
        setTimeout(() => {
          onClose(mockUser);
        }, 800);
      }, 1200);
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: undefined
        }
      });

      if (signUpError) throw signUpError;

      setSuccessMsg('Account created successfully!');
      setTimeout(() => {
        onClose(data.user);
      }, 800);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Offline simulation
    if (!supabase) {
      setLoading(true);
      const stored = localStorage.getItem('careerpilot_mock_user');
      setTimeout(() => {
        if (stored) {
          const mockUser = JSON.parse(stored);
          if (mockUser.email === email) {
            setSuccessMsg('Welcome back!');
            setTimeout(() => onClose(mockUser), 600);
          } else {
            setError('No account found with that email in offline mode.');
          }
        } else {
          // Allow any login in offline mode
          const mockUser = { id: `local-${Date.now()}`, email, user_metadata: { full_name: email.split('@')[0] } };
          localStorage.setItem('careerpilot_mock_user', JSON.stringify(mockUser));
          setSuccessMsg('Signed in (Offline Mode)');
          setTimeout(() => onClose(mockUser), 600);
        }
        setLoading(false);
      }, 1000);
      return;
    }

    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInError) throw signInError;

      setSuccessMsg('Welcome back!');
      setTimeout(() => {
        onClose(data.user);
      }, 600);
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(null)}>
      <div className="modal-content glass-panel auth-panel-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Branding */}
        <div className="auth-brand">
          <h2 className="auth-brand-title">CareerPilot & Learn</h2>
          <p className="auth-brand-sub">Your AI-powered career companion</p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} 
            onClick={() => switchTab('signup')}
          >
            Create Account
          </button>
          <button 
            className={`auth-tab ${tab === 'signin' ? 'active' : ''}`} 
            onClick={() => switchTab('signin')}
          >
            Sign In
          </button>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="auth-message auth-error">
            <span>❌</span> {error}
          </div>
        )}
        {successMsg && (
          <div className="auth-message auth-success">
            <span>✅</span> {successMsg}
          </div>
        )}

        {/* Sign Up Form */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" className="form-input" placeholder="e.g. Krishna Dev"
                value={fullName} onChange={(e) => setFullName(e.target.value)} required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" className="form-input" placeholder="you@college.edu"
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password (min 6 chars)</label>
              <input 
                type="password" className="form-input" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              />
            </div>
            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading ? <><span className="spinner"></span> Creating Account...</> : '🚀 Sign Up Free'}
            </button>
          </form>
        )}

        {/* Sign In Form */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" className="form-input" placeholder="you@college.edu"
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" className="form-input" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
            </div>
            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading ? <><span className="spinner"></span> Signing In...</> : '🔑 Sign In'}
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="auth-footer">
          {tab === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
          <button className="auth-link-btn" onClick={() => switchTab(tab === 'signup' ? 'signin' : 'signup')}>
            {tab === 'signup' ? 'Sign In' : 'Create one free'}
          </button>
        </p>

        {/* Skip / Guest mode */}
        <button className="auth-skip-btn" onClick={() => onClose(null)}>
          Continue as Guest →
        </button>
      </div>
    </div>
  );
}
