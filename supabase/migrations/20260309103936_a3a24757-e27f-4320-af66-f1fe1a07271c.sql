
-- 1. Add kb_scope column to seller_knowledge_base
ALTER TABLE public.seller_knowledge_base
  ADD COLUMN kb_scope TEXT NOT NULL DEFAULT 'storefront';

-- Add validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_kb_scope()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.kb_scope NOT IN ('storefront', 'personal') THEN
    RAISE EXCEPTION 'Invalid kb_scope: %', NEW.kb_scope;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_kb_scope
  BEFORE INSERT OR UPDATE ON public.seller_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.validate_kb_scope();

-- 2. Add personal_assistant_enabled to profiles
ALTER TABLE public.profiles
  ADD COLUMN personal_assistant_enabled BOOLEAN DEFAULT FALSE;

-- 3. Create seller_ai_consents table
CREATE TABLE public.seller_ai_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  consent_given BOOLEAN DEFAULT FALSE,
  consent_at TIMESTAMPTZ,
  consent_text TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (seller_id, consent_type)
);

-- Validation trigger for consent_type
CREATE OR REPLACE FUNCTION public.validate_seller_ai_consent_type()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.consent_type NOT IN ('storefront_assistant', 'personal_assistant') THEN
    RAISE EXCEPTION 'Invalid consent_type: %', NEW.consent_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_seller_ai_consent_type
  BEFORE INSERT OR UPDATE ON public.seller_ai_consents
  FOR EACH ROW EXECUTE FUNCTION public.validate_seller_ai_consent_type();

-- RLS for seller_ai_consents
ALTER TABLE public.seller_ai_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers read own consents"
  ON public.seller_ai_consents
  FOR SELECT
  TO authenticated
  USING (seller_id = (auth.uid())::text);

CREATE POLICY "Sellers insert own consents"
  ON public.seller_ai_consents
  FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = (auth.uid())::text);

CREATE POLICY "Sellers update own consents"
  ON public.seller_ai_consents
  FOR UPDATE
  TO authenticated
  USING (seller_id = (auth.uid())::text);

CREATE POLICY "Admins manage all consents"
  ON public.seller_ai_consents
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
