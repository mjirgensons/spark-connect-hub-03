ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS first_response_at timestamptz,
ADD COLUMN IF NOT EXISTS response_time_seconds integer;