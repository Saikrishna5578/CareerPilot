import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabaseClient';
import { apiFetch } from './utils/api';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Import modular components
import LearningDashboard from './components/dashboard/LearningDashboard';
import KanbanBoard from './components/kanban/KanbanBoard';
import AdminPanel from './components/admin/AdminPanel';

// Import Custom Overlays (Toasts, Confirms, Prompts)
import { CustomToast, CustomConfirm, CustomPrompt } from './components/common/CustomDialogs';

// Import Auth & Guest Components
import AuthPanel from './components/auth/AuthPanel';
import SignupNudge from './components/auth/SignupNudge';
import HeroStats from './components/guest/HeroStats';
import FeatureShowcase from './components/guest/FeatureShowcase';
import FloatingCTA from './components/guest/FloatingCTA';
import BackgroundDots from './components/common/BackgroundDots';
import MissionBriefing from './components/onboarding/MissionBriefing';
import InteractiveTour from './components/onboarding/InteractiveTour';
import Footer from './components/common/Footer';

// Default static lists to make the app work out-of-the-box (even without DB keys)
const defaultSkills = ["Python", "SQL", "HTML/CSS"];
const defaultTargetRoles = ["Backend Engineer", "Software Developer"];

const initialMockRoadmap = {
  title: "No Active Roadmap",
  items: []
};

const initialMockApplications = [];

// Centralized Frontend DB Logger Post Helper
const logFrontendEvent = async (severity, message, payload = {}) => {
  try {
    await apiFetch('/api/logs', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        severity,
        service: "WEB_APP",
        message,
        payload
      })
    });
  } catch (err) {
    console.warn("Could not push log to backend gateway:", err);
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState("learning"); // 'learning' | 'kanban' | 'admin'
  const [careerGoal, setCareerGoal] = useState("Backend Engineer");
  const [language, setLanguage] = useState("Python");
  const [interests, setInterests] = useState("Web Development, Database Design");
  const [loading, setLoading] = useState(false);
  const [scraperLoading, setScraperLoading] = useState(false);
  const [activeStatusText, setActiveStatusText] = useState("Initializing Alignment Matrix...");
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('careerpilot_onboarding_done') !== 'true';
  });
  const [showTour, setShowTour] = useState(false);
  
  // ==========================================
  // Auth & User Session State
  // ==========================================
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authPanelOpen, setAuthPanelOpen] = useState(false);
  const [authPanelTab, setAuthPanelTab] = useState('signup');
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [nudgeFeature, setNudgeFeature] = useState('default');

  // Feature Flags State
  const [featureFlags, setFeatureFlags] = useState([
    { key: 'roadmap_gen', name: 'AI Roadmap Creator', description: 'Allows users to generate AI roadmaps using Gemini.', enabled: true },
    { key: 'scraper', name: 'Automated Job Scraper', description: 'Enables scraping and manual job sync buttons.', enabled: true },
    { key: 'resume_upload', name: 'Master Resume Upload', description: 'Allows users to upload their PDF resume.', enabled: true },
    { key: 'guest_lock', name: 'Enforce Guest Mode Locks', description: 'If disabled, guest users get free access to all locked features.', enabled: true }
  ]);

  // App States
  const [roadmap, setRoadmap] = useState(() => {
    const saved = localStorage.getItem("careerpilot_roadmap");
    return saved ? JSON.parse(saved) : initialMockRoadmap;
  });
  
  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem("careerpilot_applications");
    return saved ? JSON.parse(saved) : initialMockApplications;
  });

  const [jobFeed, setJobFeed] = useState([]);

  // ==========================================
  // Custom Dialog & Overlay States
  // ==========================================
  const [toasts, setToasts] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: () => {},
    onCancel: () => {}
  });
  const [promptConfig, setPromptConfig] = useState({
    isOpen: false,
    title: '',
    onSubmit: () => {},
    onCancel: () => {}
  });

  // Reusable Promise-based Custom Triggers
  const showToast = (message, type = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const triggerConfirm = (title, message, confirmText = 'Confirm', cancelText = 'Cancel') => {
    return new Promise((resolve) => {
      setConfirmConfig({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: () => {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  const triggerPrompt = (title) => {
    return new Promise((resolve) => {
      setPromptConfig({
        isOpen: true,
        title,
        onSubmit: (data) => {
          setPromptConfig(prev => ({ ...prev, isOpen: false }));
          resolve(data);
        },
        onCancel: () => {
          setPromptConfig(prev => ({ ...prev, isOpen: false }));
          resolve(null);
        }
      });
    });
  };

  // ==========================================
  // Auth Helpers
  // ==========================================
  const onAuthRequired = (featureName) => {
    setNudgeFeature(featureName);
    setNudgeOpen(true);
  };

  const openAuthPanel = (tab = 'signup') => {
    setNudgeOpen(false);
    setAuthPanelTab(tab);
    setAuthPanelOpen(true);
  };

  const handleAuthClose = (authenticatedUser) => {
    setAuthPanelOpen(false);
    if (authenticatedUser) {
      setUser(authenticatedUser);
      setIsGuest(false);
      setIsAdmin(authenticatedUser.email === 'admin@careerpilot.com' || authenticatedUser.user_metadata?.is_admin === true);
      showToast(`Welcome, ${authenticatedUser.user_metadata?.full_name || authenticatedUser.email}! 🎉`, 'success');
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('careerpilot_mock_user');
    setUser(null);
    setIsGuest(true);
    setIsAdmin(false);
    setActiveTab("learning"); // redirect away from Admin tab
    showToast('Signed out. You are now in Guest Mode.', 'info');
  };

  // Check admin status from user email or profiles table
  const checkAdminStatus = async (currentUser) => {
    if (!currentUser) {
      setIsAdmin(false);
      return;
    }
    if (currentUser.email === 'admin@careerpilot.com') {
      setIsAdmin(true);
      return;
    }
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', currentUser.id)
          .single();
        if (data) {
          setIsAdmin(!!data.is_admin);
        }
      } catch (err) {
        console.warn("Failed to check admin database status:", err);
      }
    }
  };

  useEffect(() => {
    checkAdminStatus(user);
  }, [user]);

  // Fetch feature flags on load
  const fetchFeatureFlags = async () => {
    try {
      const response = await apiFetch('/api/admin/features');
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setFeatureFlags(data);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch feature flags from server:", err);
    }
  };

  useEffect(() => {
    fetchFeatureFlags();
  }, []);

  const handleToggleFeatureFlag = async (key, enabled) => {
    // Optimistic UI update
    setFeatureFlags(prev => prev.map(f => f.key === key ? { ...f, enabled } : f));
    
    try {
      const response = await apiFetch('/api/admin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled })
      });
      if (response.ok) {
        showToast(`Feature flag updated successfully!`, 'success');
      } else {
        throw new Error("Backend flag update failed");
      }
    } catch (err) {
      showToast(`Failed to update feature flag: ${err.message}`, 'error');
      // Rollback on error
      setFeatureFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !enabled } : f));
    }
  };

  // ==========================================
  // Auth Session Initialization
  // ==========================================
  useEffect(() => {
    const initSession = async () => {
      // Check offline mock user first
      const mockUser = localStorage.getItem('careerpilot_mock_user');
      if (mockUser) {
        const parsed = JSON.parse(mockUser);
        setUser(parsed);
        setIsGuest(false);
        return;
      }

      if (!supabase) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setIsGuest(false);
          if (localStorage.getItem("careerpilot_tour_done") !== "true") {
            setShowTour(true);
          }
        }
      } catch (err) {
        console.warn('Could not restore session:', err);
      }
    };

    initSession();

    // Listen for auth state changes (Supabase)
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser(session.user);
          setIsGuest(false);
          if (localStorage.getItem("careerpilot_tour_done") !== "true") {
            setShowTour(true);
          }
        } else {
          setUser(null);
          setIsGuest(true);
          setShowTour(false);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("careerpilot_roadmap", JSON.stringify(roadmap));
  }, [roadmap]);

  useEffect(() => {
    localStorage.setItem("careerpilot_applications", JSON.stringify(applications));
  }, [applications]);

  // Catch JS Errors and report to logging table
  useEffect(() => {
    const handleError = (message, source, lineno, colno, error) => {
      logFrontendEvent("ERROR", `JS exception: ${message}`, {
        source,
        line: lineno,
        column: colno,
        stack: error?.stack
      });
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // ==========================================
  // Supabase Data Sync
  // ==========================================
  useEffect(() => {
    if (!supabase || isGuest) return;

    // Fetch initial profile/data from Supabase
    async function loadData() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return;

        // Load active roadmap safely (details column fallback if missing from DB schema)
        let rmData = null;
        try {
          const { data, error } = await supabase
            .from("roadmaps")
            .select("id, title, details, roadmap_items(*)")
            .eq("user_id", currentUser.id)
            .eq("is_active", true)
            .maybeSingle();
          if (error) throw error;
          rmData = data;
        } catch (err) {
          const { data } = await supabase
            .from("roadmaps")
            .select("id, title, roadmap_items(*)")
            .eq("user_id", currentUser.id)
            .eq("is_active", true)
            .maybeSingle();
          rmData = data;
        }
        
        if (rmData) {
          setRoadmap({
            title: rmData.title,
            details: rmData.details || {},
            items: (rmData.roadmap_items || []).sort((a, b) => a.week_number - b.week_number)
          });
        }

        // Load profile data (career_goal, language, interests)
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_skills, target_roles")
          .eq("id", currentUser.id)
          .single();
        
        if (profile) {
          if (profile.target_roles && profile.target_roles.length > 0) {
            setCareerGoal(profile.target_roles[0]);
          }
          if (profile.current_skills && profile.current_skills.length > 0) {
            setLanguage(profile.current_skills[0]);
            setInterests(profile.current_skills.slice(1).join(", "));
          }
        }

        // Load applications from backend API
        const appResponse = await apiFetch(`/api/applications?user_id=${currentUser.id}`);
        if (appResponse.ok) {
          const parsedApps = await appResponse.json();
          setApplications(parsedApps);
        }
      } catch (err) {
        console.error("Failed to query initial Supabase data:", err);
      }
    }

    loadData();

    // Realtime listener setup for updates to job applications (sync multi-clients)
    const appSubscription = supabase
      .channel('job_applications_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_applications' }, (payload) => {
        console.log('Realtime change received:', payload);
        loadData(); // Refresh list on change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(appSubscription);
    };
  }, [isGuest]);

  // ==========================================
  // Fetch Job Listings from Backend
  // ==========================================
  const fetchJobs = async (searchQuery) => {
    try {
      const url = searchQuery 
        ? `/api/jobs?query=${encodeURIComponent(searchQuery)}`
        : `/api/jobs`;
      const response = await apiFetch(url);
      if (response.ok) {
        const data = await response.json();
        setJobFeed(data || []);
        return data || [];
      }
    } catch (err) {
      console.warn("Backend API not active or offline. Falling back to mock jobs.", err);
    }
    return [];
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // ==========================================
  // AI Roadmap Generation Trigger
  // ==========================================
  const triggerRoadmapGeneration = async () => {
    const roadmapGenEnabled = featureFlags.find(f => f.key === 'roadmap_gen')?.enabled !== false;
    if (!roadmapGenEnabled) {
      showToast("AI Roadmap creation is temporarily disabled by administrator.", "warning");
      return;
    }
    setLoading(true);

    // Logging event
    logFrontendEvent("INFO", "Requested roadmap generation.", { career_goal: careerGoal, language: language, interests: interests });

    try {
      const response = await apiFetch('/api/roadmap/generate', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id || "00000000-0000-0000-0000-000000000000",
          full_name: user?.user_metadata?.full_name || "Developer Student",
          career_goal: careerGoal,
          language: language,
          interests: interests
        })
      });

      if (response.ok) {
        const data = await response.json();
        showToast(`AI generated a new path: "${data.roadmap_title}"!`, 'success');
        
        if (data.weeks && data.weeks.length > 0) {
          setRoadmap({
            title: data.roadmap_title,
            details: data.details || {},
            items: data.weeks.map((week, idx) => ({
              id: week.id || `w-${idx}-${Date.now()}`,
              week_number: week.week_number,
              topic_name: week.topic_name,
              description: week.description,
              resources: week.resources || [],
              status: week.status || "Pending"
            }))
          });
        } else {
          generateLocalRoadmapFallback();
        }
      } else {
        generateLocalRoadmapFallback();
      }
    } catch (err) {
      console.warn("Backend server not responding, generating roadmap client-side...", err);
      generateLocalRoadmapFallback();
    } finally {
      setLoading(false);
    }
  };

  const generateLocalRoadmapFallback = () => {
    logFrontendEvent("WARNING", "FastAPI backend offline. Generating roadmap locally.", { careerGoal, language });
    setRoadmap({
      title: `Pathway to ${careerGoal}`,
      details: {
        milestone_projects: "### Beginner Milestones\n* Project: CLI basic script\n* Skills: Syntax basics\n* Portfolio: Github repo setup",
        final_project: "### Final Project\n* Title: Local Text Editor\n* Tech: Python CLI\n* Resume Value: High",
        portfolio_roadmap: "### Portfolio Roadmap\n* Beginner: CLI calculator\n* Intermediate: File organizer\n* Advanced: Text Adventure Game",
        interview_prep: "### Interview prep\n* Core topics: Loops, functions, arrays\n* Coding: HackerRank Basic",
        weekly_plan: "### Weekly Plan\n* Study 5 hours a week.",
        daily_plan: "### Daily Plan\n* 45 min learning, 15 min coding.",
        next_skills: "### Next Steps\n* Git and version control."
      },
      items: [
        { id: "w1", week_number: 1, topic_name: `Bridge current skills with ${language}`, description: "Solidifying base concepts and establishing setup configurations.", resources: [], status: "Pending" },
        { id: "w2", week_number: 2, topic_name: `${language} Fundamentals`, description: "Configuring server endpoints and routing parameters.", resources: [], status: "Pending" },
        { id: "w3", week_number: 3, topic_name: "Application Structure & Logic", description: "Writing security policies and database tables.", resources: [], status: "Pending" },
        { id: "w4", week_number: 4, topic_name: "Integrating Tools & Libraries", description: "Creating async routines to pull feeds using BeautifulSoup.", resources: [], status: "Pending" },
        { id: "w5", week_number: 5, topic_name: "Testing & Debugging", description: "Ensuring offline persistence holds across browser reloads.", resources: [], status: "Pending" },
        { id: "w6", week_number: 6, topic_name: "Final Deployment Checkpoint", description: "Deploying final compiled apps to production platforms.", resources: [], status: "Pending" }
      ]
    });
    showToast("Loaded tailored path locally (Offline Mode)", "info");
  };

  // Toggle checklist status
  const toggleItemStatus = (itemId) => {
    setRoadmap(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, status: item.status === "Completed" ? "Pending" : "Completed" }
          : item
      )
    }));
  };

  // ==========================================
  const triggerScraper = async (skills, domain, experience, workMode) => {
    const scraperEnabled = featureFlags.find(f => f.key === 'scraper')?.enabled !== false;
    if (!scraperEnabled) {
      showToast("Automated Job Scraper is temporarily disabled by administrator.", "warning");
      return;
    }

    try {
      // Clear the feed immediately and show loading animation
      setJobFeed([]);
      setScraperLoading(true);

      const response = await apiFetch('/api/scraper/trigger', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: skills,
          domain: domain,
          experience: experience,
          work_mode: workMode
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const scrapedJobs = data.jobs || [];
        
        if (scrapedJobs.length > 0) {
          setJobFeed(scrapedJobs);
          showToast(`Job scraper successfully pulled ${scrapedJobs.length} listings!`, "success");
        } else {
          // Pop polished message modal advising user to modify search filters
          await triggerConfirm(
            "📡 No Openings Found",
            `We scanned the web but couldn't find any live job openings matching your preferences:
  • Skills: "${skills}"
  • Domain: "${domain}"
  • Experience: "${experience}"
  • Work Mode: "${workMode}"

Please adjust your parameters in the search form (e.g. modify required skills or broaden experience levels) and try syncing again!`
          );
        }
      } else {
        showToast("Scraper API returned an error response.", "error");
      }
      setScraperLoading(false);
    } catch (err) {
      console.warn("Job scraper failed or backend offline:", err);
      setScraperLoading(false);
      await triggerConfirm(
        "📡 No Openings Found",
        `We scanned the web but couldn't find any live job openings matching your preferences:
  • Skills: "${skills}"
  • Domain: "${domain}"
  • Experience: "${experience}"
  • Work Mode: "${workMode}"

Please adjust your parameters in the search form (e.g. modify required skills or broaden experience levels) and try syncing again!`
      );
    }
  };

  // Add job from scraper feed to application board
  const addFromFeed = async (job) => {
    // 1. Confirm they want to track it
    const wantToTrack = await triggerConfirm(
      "💼 Track Job Opening",
      `Do you want to add "${job.title}" at ${job.company} to your job tracker?`
    );
    if (!wantToTrack) return;

    // 2. Ask if application was successfully submitted
    const isApplied = await triggerConfirm(
      "📝 Application Submitted?",
      `Has your application to "${job.title}" been successfully submitted?`
    );

    const isFav = !isApplied;

    if (supabase && user) {
      try {
        const response = await apiFetch('/api/applications', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            title: job.title,
            company: job.company,
            stage: "Applied",
            location: job.location || "Remote",
            salary: job.salary || "Not disclosed",
            apply_link: job.apply_link || "",
            is_fav: isFav
          })
        });

        if (response.ok) {
          const newApp = await response.json();
          setApplications(prev => [...prev, newApp]);
          showToast(isFav ? `Saved "${job.title}" to Favorites!` : `Added "${job.title}" to Kanban under Applied!`, 'success');
        } else {
          showToast("Failed to save application via backend.", "error");
        }
      } catch (err) {
        console.error("Backend error saving job:", err);
      }
    } else {
      // Guest mode fallback
      const newApp = {
        id: `app-${Date.now()}`,
        title: job.title,
        company: job.company,
        stage: isFav ? "Favorite" : "Applied",
        location: job.location || "Remote",
        salary: job.salary || "Not disclosed",
        apply_link: job.apply_link || "",
        is_fav: isFav
      };
      setApplications(prev => [...prev, newApp]);
      showToast(isFav ? `Saved "${job.title}" to Favorites!` : `Added "${job.title}" to Kanban under Applied!`, 'success');
    }
  };

  // Add job from scraper feed directly to favorites list
  const addToFavorites = async (job) => {
    if (supabase && user) {
      try {
        const response = await apiFetch('/api/applications', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            title: job.title,
            company: job.company,
            stage: "Applied",
            location: job.location || "Remote",
            salary: job.salary || "Not disclosed",
            apply_link: job.apply_link || "",
            is_fav: true
          })
        });

        if (response.ok) {
          const newApp = await response.json();
          setApplications(prev => [...prev, newApp]);
          showToast(`Saved "${job.title}" to Favorites!`, 'info');
        } else {
          showToast("Failed to save favorite via backend.", "error");
        }
      } catch (err) {
        console.error("Backend error saving favorite:", err);
      }
    } else {
      // Guest mode fallback
      const newApp = {
        id: `app-${Date.now()}`,
        title: job.title,
        company: job.company,
        stage: "Favorite",
        location: job.location || "Remote",
        salary: job.salary || "Not disclosed",
        apply_link: job.apply_link || "",
        is_fav: true
      };
      setApplications(prev => [...prev, newApp]);
      showToast(`Saved "${job.title}" to Favorites!`, 'info');
    }
  };

  // ==========================================
  // Native HTML5 Drag & Drop Handlers
  // ==========================================
  const handleDragStart = (e, cardId) => {
    e.dataTransfer.setData("text/plain", cardId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
  };

  const handleDragEnter = (e, stage) => {
    e.preventDefault();
    setDragOverColumn(stage);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    setDragOverColumn(null);
    const cardId = e.dataTransfer.getData("text/plain");
    const draggedApp = applications.find(app => app.id === cardId);
    if (!draggedApp) return;

    let finalStage = targetStage;
    let isFav = targetStage === "Favorite";

    if (draggedApp.is_fav && targetStage !== "Favorite") {
      // Dragged from Favorite stage into active tracking pipeline!
      // 1. Confirm they want to track it
      const wantToTrack = await triggerConfirm(
        "💼 Track Job Opening",
        `Do you want to add "${draggedApp.title}" to your job tracker?`
      );
      if (!wantToTrack) return;

      // 2. Ask if application was successfully submitted
      const isApplied = await triggerConfirm(
        "📝 Application Submitted?",
        `Has your application to "${draggedApp.title}" been successfully submitted?`
      );

      if (isApplied) {
        finalStage = targetStage;
        isFav = false;
        showToast(`Added "${draggedApp.title}" to ${targetStage}!`, 'success');
      } else {
        // Keep as favorite
        finalStage = "Applied";
        isFav = true;
        showToast(`Kept "${draggedApp.title}" in Favorites!`, 'info');
        return;
      }
    } else {
      // Standard transition
      finalStage = targetStage;
      isFav = targetStage === "Favorite";
    }
    
    // Update local state first (Optimistic update)
    setApplications(prev => 
      prev.map(app => app.id === cardId ? { 
        ...app, 
        stage: isFav ? "Favorite" : finalStage, 
        is_fav: isFav 
      } : app)
    );

    logFrontendEvent("INFO", `Job application ${cardId} shifted to stage: ${finalStage}, is_fav: ${isFav}`);

    // Sync back to backend if connected
    if (supabase && user && !cardId.toString().startsWith("app-")) {
      try {
        await apiFetch(`/api/applications/${cardId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            title: draggedApp.title,
            company: draggedApp.company,
            stage: isFav ? "Applied" : finalStage,
            location: draggedApp.location || "Remote",
            salary: draggedApp.salary || "Not disclosed",
            apply_link: draggedApp.apply_link || "",
            is_fav: isFav
          })
        });
      } catch (err) {
        console.error("Failed to sync drag status to database:", err);
      }
    }
  };

  // Math Calculations for Progress metrics
  const completedCount = roadmap.items.filter(i => i.status === "Completed").length;
  const totalItems = roadmap.items.length;
  const percentage = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  // Derive user display info
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest';

  // Feature Flags calculations
  const guestLockEnabled = featureFlags.find(f => f.key === 'guest_lock')?.enabled !== false;
  const effectiveIsGuest = isGuest && guestLockEnabled;

  // Rotate status text messages during active AI generation
  useEffect(() => {
    if (!loading) return;
    
    const statuses = [
      "Initializing Career Alignment Matrix...",
      "Analyzing current skill profiles...",
      "Mapping cognitive learning pathways...",
      "Evaluating industry role demand...",
      "Synthesizing week-by-week curriculum...",
      "Calibrating high-yield learning resources...",
      "Generating dynamic duration timeline...",
      "Finalizing personalized career roadmap..."
    ];
    
    let index = 0;
    setActiveStatusText(statuses[0]);
    
    const interval = setInterval(() => {
      index = (index + 1) % statuses.length;
      setActiveStatusText(statuses[index]);
    }, 1600);
    
    return () => clearInterval(interval);
  }, [loading]);

  return (
    <div className="app-container">
      {/* Interactive Floating Dots Constellation Background */}
      <BackgroundDots />

      {/* Quantum Alignment Matrix Loader Overlay */}
      {loading && (
        <div className="quantum-loader-overlay">
          <div className="quantum-loader-container">
            <div className="quantum-loader-ring ring-outer"></div>
            <div className="quantum-loader-ring ring-middle"></div>
            <div className="quantum-loader-ring ring-inner"></div>
            <div className="quantum-loader-core"></div>
          </div>
          <div className="quantum-loader-status">
            <span className="status-pulsate" style={{ fontSize: '1.1rem', background: 'linear-gradient(90deg, #c084fc, #818cf8, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800' }}>
              {activeStatusText}
            </span>
            <span className="status-hint">Please wait while our AI Career Mentor synchronizes your path</span>
          </div>
        </div>
      )}

      {/* DB Sync Indicator Banner */}
      {!supabase && (
        <div className="offline-banner">
          ⚠️ Running in Local Mode. Register or log in to sync your career path across devices.
        </div>
      )}

      {/* Main Header */}
      <header>
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <img src="/logo.png" alt="CareerPilot Logo" style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }} />
          <h1>CareerPilot & Learn</h1>
        </div>
        <div className="nav-links">
          <button 
            className={`nav-btn nav-btn-learning ${activeTab === "learning" ? "active" : ""}`}
            onClick={() => setActiveTab("learning")}
          >
            🎓 Learning Dashboard
          </button>
          <button 
            className={`nav-btn nav-btn-kanban ${activeTab === "kanban" ? "active" : ""}`}
            onClick={() => setActiveTab("kanban")}
          >
            💼 Job Applications
          </button>
          {/* Admin panel only accessible to logged-in administrator users */}
          {isAdmin && (
            <button 
              className={`nav-btn ${activeTab === "admin" ? "active" : ""}`}
              onClick={() => setActiveTab("admin")}
              style={{ borderColor: 'rgba(236, 72, 153, 0.4)', color: 'var(--accent-pink)' }}
            >
              🛠️ Admin Panel
            </button>
          )}
        </div>

        {/* User Session Controls */}
        <div className="header-auth-area">
          {isGuest ? (
            <div className="guest-header-actions">
              <button className="btn-secondary header-auth-btn" onClick={() => openAuthPanel('signin')}>
                Sign In
              </button>
              <button className="btn-primary header-auth-btn" onClick={() => openAuthPanel('signup')}>
                Sign Up Free
              </button>
            </div>
          ) : (
            <div className="user-header-info">
              <div className="user-avatar">{displayName.charAt(0).toUpperCase()}</div>
              <span className="user-display-name">{displayName}</span>
              <button className="btn-secondary header-signout-btn" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Cinematic Mission Briefing Onboarding (Triggered only after login) */}
      {showOnboarding && !isGuest && (
        <MissionBriefing onComplete={() => {
          setShowOnboarding(false);
          localStorage.setItem('careerpilot_onboarding_done', 'true');
        }} />
      )}

      {/* Interactive Feature Tour (Triggered only after login, after onboarding ends) */}
      {showTour && !showOnboarding && !isGuest && (
        <InteractiveTour 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onClose={() => {
            setShowTour(false);
            localStorage.setItem('careerpilot_tour_done', 'true');
          }} 
        />
      )}

      {/* Hero Stats Bar (visible to guests) */}
      {effectiveIsGuest && <HeroStats />}

      {/* App Content routing layout */}
      <div className="content-area">
        {activeTab === "learning" && (
          <>
            <LearningDashboard 
              roadmap={roadmap}
              toggleItemStatus={toggleItemStatus}
              careerGoal={careerGoal}
              setCareerGoal={setCareerGoal}
              language={language}
              setLanguage={setLanguage}
              interests={interests}
              setInterests={setInterests}
              loading={loading}
              triggerRoadmapGeneration={triggerRoadmapGeneration}
              completedCount={completedCount}
              totalItems={totalItems}
              percentage={percentage}
              isGuest={effectiveIsGuest}
              onAuthRequired={onAuthRequired}
              roadmapGenEnabled={featureFlags.find(f => f.key === 'roadmap_gen')?.enabled !== false}
            />
            {/* Feature Showcase visible only to guests, below the dashboard */}
            {effectiveIsGuest && <FeatureShowcase onSignUp={() => openAuthPanel('signup')} />}
          </>
        )}

        {activeTab === "kanban" && (
          <KanbanBoard 
            applications={applications}
            setApplications={setApplications}
            jobFeed={jobFeed}
            triggerScraper={triggerScraper}
            addFromFeed={addFromFeed}
            addToFavorites={addToFavorites}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDragEnter={handleDragEnter}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            dragOverColumn={dragOverColumn}
            showToast={showToast}
            triggerConfirm={triggerConfirm}
            triggerPrompt={triggerPrompt}
            isGuest={effectiveIsGuest}
            onAuthRequired={onAuthRequired}
            scraperEnabled={featureFlags.find(f => f.key === 'scraper')?.enabled !== false}
            resumeUploadEnabled={featureFlags.find(f => f.key === 'resume_upload')?.enabled !== false}
            scraperLoading={scraperLoading}
          />
        )}

        {activeTab === "admin" && isAdmin && (
          <AdminPanel 
            featureFlags={featureFlags} 
            onToggleFeatureFlag={handleToggleFeatureFlag} 
          />
        )}
      </div>

      <Footer showToast={showToast} />

      {/* Guest Floating CTA */}
      {effectiveIsGuest && <FloatingCTA onSignUp={() => openAuthPanel('signup')} />}

      {/* Auth Panel Modal */}
      <AuthPanel 
        isOpen={authPanelOpen} 
        onClose={handleAuthClose} 
        initialTab={authPanelTab} 
      />

      {/* Signup Nudge Lock Modal */}
      <SignupNudge 
        isOpen={nudgeOpen} 
        featureName={nudgeFeature} 
        onSignUp={() => openAuthPanel('signup')}
        onClose={() => setNudgeOpen(false)} 
      />

      {/* Reusable Custom Notification Overlays */}
      <CustomToast toasts={toasts} removeToast={removeToast} />
      
      <CustomConfirm 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        onConfirm={confirmConfig.onConfirm}
        onCancel={confirmConfig.onCancel}
      />

      <CustomPrompt 
        isOpen={promptConfig.isOpen}
        title={promptConfig.title}
        onSubmit={promptConfig.onSubmit}
        onCancel={promptConfig.onCancel}
      />
    </div>
  );
}
