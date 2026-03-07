
-- Table 1: chat_sessions
CREATE TABLE public.chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  seller_id TEXT,
  buyer_id UUID,
  buyer_email TEXT,
  user_role TEXT DEFAULT 'guest',
  chatbot_mode TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT,
  consent_given BOOLEAN DEFAULT FALSE,
  consent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_chat_sessions_seller_id ON public.chat_sessions(seller_id);
CREATE INDEX idx_chat_sessions_status ON public.chat_sessions(status);
CREATE INDEX idx_chat_sessions_buyer_id ON public.chat_sessions(buyer_id);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seller_read_own_sessions" ON public.chat_sessions FOR SELECT TO authenticated USING (seller_id = auth.uid()::text);
CREATE POLICY "buyer_read_own_sessions" ON public.chat_sessions FOR SELECT TO authenticated USING (buyer_id = auth.uid());
CREATE POLICY "service_role_full_access_sessions" ON public.chat_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Validation trigger for user_role
CREATE OR REPLACE FUNCTION public.validate_chat_session_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.user_role NOT IN ('guest', 'email_captured', 'registered', 'contractor', 'seller') THEN
    RAISE EXCEPTION 'Invalid user_role: %', NEW.user_role;
  END IF;
  IF NEW.chatbot_mode NOT IN ('buyer_inquiry', 'product_search', 'general') THEN
    RAISE EXCEPTION 'Invalid chatbot_mode: %', NEW.chatbot_mode;
  END IF;
  IF NEW.status NOT IN ('active', 'escalated', 'closed', 'expired') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_chat_session
BEFORE INSERT OR UPDATE ON public.chat_sessions
FOR EACH ROW EXECUTE FUNCTION public.validate_chat_session_fields();

-- Table 2: chat_messages
CREATE TABLE public.chat_messages (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.chat_sessions(session_id) ON DELETE CASCADE,
  message_type TEXT NOT NULL,
  content TEXT NOT NULL,
  token_count INT,
  retrieved_doc_ids TEXT[],
  confidence_score FLOAT,
  was_cached BOOLEAN DEFAULT FALSE,
  latency_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seller_read_own_messages" ON public.chat_messages FOR SELECT TO authenticated USING (session_id IN (SELECT session_id FROM public.chat_sessions WHERE seller_id = auth.uid()::text));
CREATE POLICY "buyer_read_own_messages" ON public.chat_messages FOR SELECT TO authenticated USING (session_id IN (SELECT session_id FROM public.chat_sessions WHERE buyer_id = auth.uid()));
CREATE POLICY "service_role_full_access_messages" ON public.chat_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Validation trigger for message_type
CREATE OR REPLACE FUNCTION public.validate_chat_message_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.message_type NOT IN ('user', 'assistant', 'system', 'escalation') THEN
    RAISE EXCEPTION 'Invalid message_type: %', NEW.message_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_chat_message
BEFORE INSERT OR UPDATE ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.validate_chat_message_fields();

-- Table 3: chat_summaries
CREATE TABLE public.chat_summaries (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.chat_sessions(session_id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  messages_covered INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_summaries_session_id ON public.chat_summaries(session_id);

ALTER TABLE public.chat_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seller_read_own_summaries" ON public.chat_summaries FOR SELECT TO authenticated USING (session_id IN (SELECT session_id FROM public.chat_sessions WHERE seller_id = auth.uid()::text));
CREATE POLICY "service_role_full_access_summaries" ON public.chat_summaries FOR ALL TO service_role USING (true) WITH CHECK (true);
