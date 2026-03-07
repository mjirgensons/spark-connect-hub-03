
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS seller_restriction_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS seller_restriction_reason TEXT NULL,
ADD COLUMN IF NOT EXISTS seller_restricted_at TIMESTAMPTZ NULL;
