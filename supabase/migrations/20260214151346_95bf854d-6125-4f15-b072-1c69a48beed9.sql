
-- Analytics events table for tracking all user interactions
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'click', 'scroll', 'form_view', 'form_submit', 'page_view', 'product_view'
  event_category TEXT, -- 'cta', 'navigation', 'product', 'form', 'section'
  event_label TEXT, -- specific identifier like button text, product id, section name
  event_value NUMERIC, -- optional numeric value (scroll depth %, time on section, etc.)
  page_path TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  user_agent TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Analytics sessions table for tracking visitor sessions
CREATE TABLE public.analytics_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  first_page TEXT,
  last_page TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  user_agent TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  page_count INTEGER DEFAULT 1,
  event_count INTEGER DEFAULT 0,
  is_bounce BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_seconds INTEGER DEFAULT 0
);

-- Indexes for fast querying
CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_events_category ON public.analytics_events(event_category);
CREATE INDEX idx_analytics_sessions_started ON public.analytics_sessions(started_at);
CREATE INDEX idx_analytics_sessions_source ON public.analytics_sessions(utm_source);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (anonymous tracking)
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events FOR INSERT
WITH CHECK (true);

-- Only admins can read events
CREATE POLICY "Only admins can read analytics events"
ON public.analytics_events FOR SELECT
USING (is_admin());

-- Only admins can delete events
CREATE POLICY "Only admins can delete analytics events"
ON public.analytics_events FOR DELETE
USING (is_admin());

-- Anyone can insert sessions
CREATE POLICY "Anyone can insert analytics sessions"
ON public.analytics_sessions FOR INSERT
WITH CHECK (true);

-- Anyone can update sessions (for updating last_activity)
CREATE POLICY "Anyone can update analytics sessions"
ON public.analytics_sessions FOR UPDATE
USING (true);

-- Only admins can read sessions
CREATE POLICY "Only admins can read analytics sessions"
ON public.analytics_sessions FOR SELECT
USING (is_admin());

-- Only admins can delete sessions
CREATE POLICY "Only admins can delete analytics sessions"
ON public.analytics_sessions FOR DELETE
USING (is_admin());
