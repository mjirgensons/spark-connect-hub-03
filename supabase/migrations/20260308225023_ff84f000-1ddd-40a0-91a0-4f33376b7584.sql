CREATE TABLE public.email_verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_evc_email_code ON public.email_verification_codes (email, code);
CREATE INDEX idx_evc_expires ON public.email_verification_codes (expires_at);