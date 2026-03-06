ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hardware_details jsonb DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS additional_features jsonb DEFAULT NULL;