
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_expected_by TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS deadline_notifications_sent JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS delivery_check_sent_at TIMESTAMPTZ NULL;
