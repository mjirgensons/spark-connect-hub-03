
-- Create order_disputes table
CREATE TABLE public.order_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  buyer_id UUID NULL REFERENCES public.profiles(id),
  buyer_email TEXT NOT NULL,
  dispute_type TEXT NOT NULL,
  description TEXT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  seller_response TEXT NULL,
  seller_responded_at TIMESTAMPTZ NULL,
  admin_note TEXT NULL,
  resolved_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Validation trigger for dispute_type and status
CREATE OR REPLACE FUNCTION public.validate_order_dispute_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.dispute_type NOT IN ('not_received', 'wrong_item', 'damaged', 'other') THEN
    RAISE EXCEPTION 'Invalid dispute_type: %', NEW.dispute_type;
  END IF;
  IF NEW.status NOT IN ('open', 'seller_responded', 'admin_reviewing', 'resolved', 'closed') THEN
    RAISE EXCEPTION 'Invalid dispute status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_order_dispute_fields_trigger
  BEFORE INSERT OR UPDATE ON public.order_disputes
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_dispute_fields();

-- Updated_at trigger
CREATE TRIGGER update_order_disputes_updated_at
  BEFORE UPDATE ON public.order_disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.order_disputes ENABLE ROW LEVEL SECURITY;

-- Buyers read own disputes
CREATE POLICY "Buyers can read own disputes"
  ON public.order_disputes FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

-- Sellers read disputes on their orders
CREATE POLICY "Sellers can read disputes on their orders"
  ON public.order_disputes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_disputes.order_id
        AND orders.seller_id = auth.uid()
    )
  );

-- Sellers can update disputes on their orders (for responding)
CREATE POLICY "Sellers can update disputes on their orders"
  ON public.order_disputes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_disputes.order_id
        AND orders.seller_id = auth.uid()
    )
  );

-- Authenticated can insert own disputes
CREATE POLICY "Authenticated users can insert own disputes"
  ON public.order_disputes FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- Admins full access
CREATE POLICY "Admins can manage all disputes"
  ON public.order_disputes FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
