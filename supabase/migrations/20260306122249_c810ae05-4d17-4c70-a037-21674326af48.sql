
-- Add listing_status and listing_rejection_reason columns
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS listing_status TEXT NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS listing_rejection_reason TEXT;

-- Set all existing legacy products (no seller) to approved
UPDATE public.products SET listing_status = 'approved' WHERE seller_id IS NULL;
