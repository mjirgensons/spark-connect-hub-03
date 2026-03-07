
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS must_acknowledge_by timestamptz,
  ADD COLUMN IF NOT EXISTS must_ship_by timestamptz,
  ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS preparing_at timestamptz;

-- Update validate_order_status trigger to include new statuses
CREATE OR REPLACE FUNCTION public.validate_order_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('pending','paid','confirmed','preparing','shipped','ready_for_pickup','in_transit','delivered','completed','cancelled','refunded') THEN
    RAISE EXCEPTION 'Invalid order status: %', NEW.status;
  END IF;
  IF NEW.payment_status NOT IN ('unpaid','paid','refunded','failed') THEN
    RAISE EXCEPTION 'Invalid payment status: %', NEW.payment_status;
  END IF;
  RETURN NEW;
END;
$function$;
