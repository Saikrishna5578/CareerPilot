-- Database Schema for CareerPilot & Learn
-- Can be copied directly into the Supabase SQL Editor.

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Profiles Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    current_skills TEXT[] DEFAULT '{}',
    target_roles TEXT[] DEFAULT '{}',
    resume_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create Policies for Profiles
CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- ==========================================
-- 2. Roadmaps Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.roadmaps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roadmaps" 
    ON public.roadmaps FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roadmaps" 
    ON public.roadmaps FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roadmaps" 
    ON public.roadmaps FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roadmaps" 
    ON public.roadmaps FOR DELETE 
    USING (auth.uid() = user_id);

-- ==========================================
-- 3. Roadmap Items Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.roadmap_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE NOT NULL,
    week_number INTEGER NOT NULL,
    topic_name TEXT NOT NULL,
    description TEXT,
    resources TEXT[] DEFAULT '{}',
    status TEXT CHECK (status IN ('Pending', 'Completed')) DEFAULT 'Pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;

-- Access controlled via roadmaps table
CREATE POLICY "Users can view roadmap items of their roadmaps" 
    ON public.roadmap_items FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.roadmaps 
        WHERE public.roadmaps.id = public.roadmap_items.roadmap_id 
        AND public.roadmaps.user_id = auth.uid()
    ));

CREATE POLICY "Users can update roadmap items of their roadmaps" 
    ON public.roadmap_items FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM public.roadmaps 
        WHERE public.roadmaps.id = public.roadmap_items.roadmap_id 
        AND public.roadmaps.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert roadmap items of their roadmaps" 
    ON public.roadmap_items FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.roadmaps 
        WHERE public.roadmaps.id = roadmap_id 
        AND public.roadmaps.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete roadmap items of their roadmaps" 
    ON public.roadmap_items FOR DELETE 
    USING (EXISTS (
        SELECT 1 FROM public.roadmaps 
        WHERE public.roadmaps.id = roadmap_id 
        AND public.roadmaps.user_id = auth.uid()
    ));

-- ==========================================
-- 4. Job Listings Table (Global cache for scraper)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.job_listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    description TEXT,
    apply_link TEXT UNIQUE NOT NULL,
    source TEXT NOT NULL,
    salary TEXT,
    skills_required TEXT[] DEFAULT '{}',
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Allow all authenticated users to read job listings
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select job listings" 
    ON public.job_listings FOR SELECT 
    TO authenticated 
    USING (TRUE);

-- Only service role or backends can insert/update listings (handled outside user scope)

-- ==========================================
-- 5. Job Applications Table (Kanban Board)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    job_listing_id UUID REFERENCES public.job_listings(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    stage TEXT CHECK (stage IN ('Applied', 'First Round', 'Technical Interview', 'Offer Received')) DEFAULT 'Applied' NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL,
    notes TEXT,
    applied_date DATE DEFAULT CURRENT_DATE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications" 
    ON public.job_applications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" 
    ON public.job_applications FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" 
    ON public.job_applications FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications" 
    ON public.job_applications FOR DELETE 
    USING (auth.uid() = user_id);

-- ==========================================
-- Triggers & Helpers for updated_at Auto-Update
-- ==========================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles
CREATE TRIGGER trigger_update_profiles_timestamp
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_update_timestamp();

-- Apply trigger to roadmap_items
CREATE TRIGGER trigger_update_roadmap_items_timestamp
    BEFORE UPDATE ON public.roadmap_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_update_timestamp();

-- Apply trigger to job_applications
CREATE TRIGGER trigger_update_job_applications_timestamp
    BEFORE UPDATE ON public.job_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_update_timestamp();

-- Create Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_roadmap_items_roadmap ON public.roadmap_items(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user ON public.job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user ON public.roadmaps(user_id);

-- ==========================================
-- 6. System Logs Table (Audit logging)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'ERROR')),
    service TEXT NOT NULL,
    message TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read system logs to authenticated users" 
    ON public.system_logs FOR SELECT 
    TO authenticated 
    USING (TRUE);

-- ==========================================
-- 7. Auto Profile Creation on Auth Signup
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, current_skills, target_roles)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        '{}'::text[],
        '{}'::text[]
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 8. Feature Flags Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.feature_flags (
    key TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT TRUE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read feature flags to everyone" 
    ON public.feature_flags FOR SELECT 
    USING (TRUE);

CREATE POLICY "Admins can update feature flags" 
    ON public.feature_flags FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = auth.uid() 
        AND public.profiles.is_admin = TRUE
    ));

-- Insert default seed flags
INSERT INTO public.feature_flags (key, name, description, enabled) VALUES
('roadmap_gen', 'AI Roadmap Creator', 'Allows users to generate AI roadmaps using Gemini.', TRUE),
('scraper', 'Automated Job Scraper', 'Enables scraping and manual job sync buttons.', TRUE),
('resume_upload', 'Master Resume Upload', 'Allows users to upload their PDF resume.', TRUE),
('guest_lock', 'Enforce Guest Mode Locks', 'If disabled, guest users get free access to all locked features.', TRUE)
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- 9. API Hits Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.api_hits (
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    hit_count INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (endpoint, method)
);

ALTER TABLE public.api_hits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read api hits to authenticated users" 
    ON public.api_hits FOR SELECT 
    TO authenticated 
    USING (TRUE);

-- ==========================================
-- Existing DB upgrades
-- ==========================================
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
