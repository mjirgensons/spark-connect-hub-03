-- Add soft-delete column to products table
ALTER TABLE public.products ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;