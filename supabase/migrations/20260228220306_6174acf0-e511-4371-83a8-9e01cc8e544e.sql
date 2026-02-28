
-- ═══════════════════════════════════════════
-- TABLE 1: email_templates
-- ═══════════════════════════════════════════
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'transactional',
  customer_type TEXT NOT NULL DEFAULT 'client',
  display_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  plain_text_body TEXT,
  from_email TEXT DEFAULT 'orders@fitmatch.ca',
  from_name TEXT DEFAULT 'FitMatch',
  reply_to TEXT DEFAULT 'support@fitmatch.ca',
  locale TEXT DEFAULT 'en-CA',
  variables_schema JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  requires_consent BOOLEAN DEFAULT false,
  casl_category TEXT DEFAULT 'transactional',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validation trigger for email_templates
CREATE OR REPLACE FUNCTION public.validate_email_template_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.category NOT IN ('transactional', 'lifecycle', 'marketing', 'operational') THEN
    RAISE EXCEPTION 'Invalid email template category: %', NEW.category;
  END IF;
  IF NEW.customer_type NOT IN ('client', 'contractor', 'seller', 'builder', 'all') THEN
    RAISE EXCEPTION 'Invalid customer_type: %', NEW.customer_type;
  END IF;
  IF NEW.casl_category NOT IN ('transactional', 'implied', 'express') THEN
    RAISE EXCEPTION 'Invalid casl_category: %', NEW.casl_category;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_email_template
  BEFORE INSERT OR UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.validate_email_template_fields();

-- updated_at trigger
CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates"
  ON public.email_templates FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Active templates are publicly readable"
  ON public.email_templates FOR SELECT
  USING (is_active = true);

-- ═══════════════════════════════════════════
-- TABLE 2: communication_logs
-- ═══════════════════════════════════════════
CREATE TABLE public.communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  user_email TEXT NOT NULL,
  user_type TEXT,
  template_key TEXT,
  subject TEXT NOT NULL,
  html_body TEXT,
  plain_text_body TEXT,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  reply_to TEXT,
  mailgun_message_id TEXT,
  status TEXT DEFAULT 'queued',
  metadata JSONB DEFAULT '{}'::jsonb,
  related_entity_type TEXT,
  related_entity_id UUID,
  locale TEXT DEFAULT 'en-CA',
  pinecone_synced BOOLEAN DEFAULT false,
  error_message TEXT,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validation trigger for communication_logs
CREATE OR REPLACE FUNCTION public.validate_communication_log_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.direction NOT IN ('outbound', 'inbound') THEN
    RAISE EXCEPTION 'Invalid communication direction: %', NEW.direction;
  END IF;
  IF NEW.status NOT IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'blocked_no_consent') THEN
    RAISE EXCEPTION 'Invalid communication status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_communication_log
  BEFORE INSERT OR UPDATE ON public.communication_logs
  FOR EACH ROW EXECUTE FUNCTION public.validate_communication_log_fields();

CREATE INDEX idx_comm_logs_user ON public.communication_logs(user_id);
CREATE INDEX idx_comm_logs_entity ON public.communication_logs(related_entity_type, related_entity_id);
CREATE INDEX idx_comm_logs_pinecone ON public.communication_logs(pinecone_synced) WHERE pinecone_synced = false;
CREATE INDEX idx_comm_logs_status ON public.communication_logs(status);

-- RLS
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all communication logs"
  ON public.communication_logs FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can read own communication logs"
  ON public.communication_logs FOR SELECT
  USING (user_id = auth.uid());

-- ═══════════════════════════════════════════
-- TABLE 3: email_consent_log (append-only)
-- ═══════════════════════════════════════════
CREATE TABLE public.email_consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  email TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  consent_category TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  consent_text TEXT NOT NULL,
  source TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validation trigger for email_consent_log
CREATE OR REPLACE FUNCTION public.validate_email_consent_log_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.consent_type NOT IN ('express', 'implied_purchase', 'implied_inquiry') THEN
    RAISE EXCEPTION 'Invalid consent_type: %', NEW.consent_type;
  END IF;
  IF NEW.consent_category NOT IN ('marketing', 'newsletter', 'product_updates', 'transactional') THEN
    RAISE EXCEPTION 'Invalid consent_category: %', NEW.consent_category;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_email_consent_log
  BEFORE INSERT OR UPDATE ON public.email_consent_log
  FOR EACH ROW EXECUTE FUNCTION public.validate_email_consent_log_fields();

-- RLS (append-only: insert allowed, no update/delete for users)
ALTER TABLE public.email_consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all email consent logs"
  ON public.email_consent_log FOR SELECT
  USING (is_admin());

CREATE POLICY "Users can read own consent logs"
  ON public.email_consent_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can insert consent logs"
  ON public.email_consent_log FOR INSERT
  WITH CHECK (true);
