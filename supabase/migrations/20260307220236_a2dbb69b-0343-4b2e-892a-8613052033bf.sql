
-- 1a. Create seller_knowledge_base table
CREATE TABLE public.seller_knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  kb_type TEXT NOT NULL CHECK (kb_type IN ('product_faq', 'policy', 'installation_guide', 'lead_times', 'custom')),
  pinecone_synced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.seller_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seller_kb_select" ON public.seller_knowledge_base FOR SELECT USING (seller_id = auth.uid()::text);
CREATE POLICY "seller_kb_insert" ON public.seller_knowledge_base FOR INSERT WITH CHECK (seller_id = auth.uid()::text);
CREATE POLICY "seller_kb_update" ON public.seller_knowledge_base FOR UPDATE USING (seller_id = auth.uid()::text);
CREATE POLICY "seller_kb_delete" ON public.seller_knowledge_base FOR DELETE USING (seller_id = auth.uid()::text);

CREATE TRIGGER update_seller_kb_updated_at
  BEFORE UPDATE ON public.seller_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 1b. Create marketing_consents table
CREATE TABLE public.marketing_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('implied_inquiry', 'express_marketing')),
  consent_source TEXT DEFAULT 'chatbot_gate',
  consent_at TIMESTAMPTZ DEFAULT NOW(),
  implied_expires_at TIMESTAMPTZ,
  express_withdrawn_at TIMESTAMPTZ,
  casl_proof JSONB DEFAULT '{}'
);

ALTER TABLE public.marketing_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mc_authenticated_read_own" ON public.marketing_consents FOR SELECT TO authenticated USING (email = auth.jwt() ->> 'email');

-- 1c. Add ai_chatbot_enabled to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_chatbot_enabled BOOLEAN DEFAULT FALSE;
