
-- Drop the status validation trigger to allow flexible status values
DROP TRIGGER IF EXISTS validate_order_status_trigger ON orders;

-- Add new columns for shipping tracking and cancellation
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_reason text;
