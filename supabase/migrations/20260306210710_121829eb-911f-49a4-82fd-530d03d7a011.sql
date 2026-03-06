
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS delivery_option TEXT DEFAULT 'pickup_only',
  ADD COLUMN IF NOT EXISTS delivery_price NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_zone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS delivery_prep_days INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS pickup_available BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS pickup_address TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS pickup_city TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS pickup_province TEXT DEFAULT 'Ontario',
  ADD COLUMN IF NOT EXISTS pickup_postal_code TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS pickup_phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS pickup_prep_days INTEGER DEFAULT 5;

-- Validation trigger for delivery_option
CREATE OR REPLACE FUNCTION public.validate_delivery_option()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.delivery_option NOT IN ('delivery', 'pickup_only', 'both') THEN
    RAISE EXCEPTION 'Invalid delivery_option: %', NEW.delivery_option;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_delivery_option
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_delivery_option();
