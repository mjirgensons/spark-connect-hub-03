
ALTER TABLE public.webhook_logs
  ADD COLUMN IF NOT EXISTS provider text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS endpoint_key text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS event_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_replay boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider_endpoint ON public.webhook_logs (provider, endpoint_key);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON public.webhook_logs (event_id);
