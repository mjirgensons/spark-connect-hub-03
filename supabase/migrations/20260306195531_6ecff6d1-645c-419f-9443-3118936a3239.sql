
-- Add resubmission tracking columns to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS resubmission_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS previous_rejection_reason TEXT;
