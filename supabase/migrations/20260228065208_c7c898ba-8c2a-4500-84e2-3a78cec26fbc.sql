
-- Cookie Categories
CREATE TABLE public.cookie_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cookie_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cookie categories are publicly readable"
  ON public.cookie_categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage cookie categories"
  ON public.cookie_categories FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_cookie_categories_updated_at
  BEFORE UPDATE ON public.cookie_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed
INSERT INTO public.cookie_categories (name, slug, description, is_required, is_default, sort_order) VALUES
  ('Essential', 'essential', 'These cookies are necessary for the website to function and cannot be disabled. They include session management, authentication, and security features.', true, true, 1),
  ('Analytics', 'analytics', 'These cookies help us understand how visitors use our website by collecting anonymous usage data. This helps us improve our site and your experience.', false, false, 2),
  ('Functional', 'functional', 'These cookies enable enhanced features like our voice chat assistant and remember your preferences such as filter settings and sort order.', false, false, 3);

-- Cookie Definitions
CREATE TABLE public.cookie_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.cookie_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT '',
  purpose TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT 'Session',
  type TEXT NOT NULL DEFAULT 'First-party',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cookie_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cookie definitions are publicly readable"
  ON public.cookie_definitions FOR SELECT USING (true);

CREATE POLICY "Admins can manage cookie definitions"
  ON public.cookie_definitions FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_cookie_definitions_updated_at
  BEFORE UPDATE ON public.cookie_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed cookies
INSERT INTO public.cookie_definitions (category_id, name, provider, purpose, duration, type) VALUES
  ((SELECT id FROM public.cookie_categories WHERE slug = 'essential'),
   'sb-auth-token', 'Supabase', 'Stores your authentication session so you stay logged in while browsing.', 'Session', 'First-party'),
  ((SELECT id FROM public.cookie_categories WHERE slug = 'essential'),
   'sb-auth-token-code-verifier', 'Supabase', 'Verifies the authentication flow using PKCE for security.', 'Session', 'First-party'),
  ((SELECT id FROM public.cookie_categories WHERE slug = 'essential'),
   'fm_cookie_consent', 'FitMatch', 'Remembers your cookie consent preferences so the banner is not shown again.', '1 year', 'First-party'),
  ((SELECT id FROM public.cookie_categories WHERE slug = 'analytics'),
   'fm_session_id', 'FitMatch', 'Anonymous session identifier used for aggregated site usage analytics.', 'Session', 'First-party'),
  ((SELECT id FROM public.cookie_categories WHERE slug = 'analytics'),
   'fm_page_views', 'FitMatch', 'Tracks pages visited during your session for usage analytics.', 'Session', 'First-party'),
  ((SELECT id FROM public.cookie_categories WHERE slug = 'functional'),
   'elevenlabs_widget', 'ElevenLabs', 'Stores voice chat assistant state and conversation history.', 'Session', 'Third-party'),
  ((SELECT id FROM public.cookie_categories WHERE slug = 'functional'),
   'fm_preferences', 'FitMatch', 'Remembers your UI preferences such as catalog filter and sort settings.', '30 days', 'First-party');

-- Consent Logs (append-only audit trail)
CREATE TABLE public.consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  ip_hash TEXT,
  action TEXT NOT NULL,
  categories JSONB NOT NULL DEFAULT '{}',
  user_agent TEXT,
  page_url TEXT,
  banner_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert consent logs"
  ON public.consent_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read consent logs"
  ON public.consent_logs FOR SELECT TO authenticated
  USING (public.is_admin());
