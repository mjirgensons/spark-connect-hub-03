
-- Create platform_knowledge_base table
CREATE TABLE public.platform_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  kb_type TEXT NOT NULL DEFAULT 'general_faq',
  pinecone_synced BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Validation trigger for kb_type
CREATE OR REPLACE FUNCTION public.validate_platform_kb_type()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.kb_type NOT IN ('general_faq', 'shipping_policy', 'return_policy', 'payment_info', 'platform_guide') THEN
    RAISE EXCEPTION 'Invalid platform kb_type: %', NEW.kb_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_platform_kb_type
  BEFORE INSERT OR UPDATE ON public.platform_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.validate_platform_kb_type();

-- updated_at trigger
CREATE TRIGGER update_platform_kb_updated_at
  BEFORE UPDATE ON public.platform_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reset pinecone_synced on title/content change
CREATE OR REPLACE FUNCTION public.reset_platform_kb_pinecone_sync()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.title IS DISTINCT FROM NEW.title OR OLD.content IS DISTINCT FROM NEW.content THEN
    NEW.pinecone_synced := false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reset_platform_kb_pinecone_sync
  BEFORE UPDATE ON public.platform_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.reset_platform_kb_pinecone_sync();

-- RLS
ALTER TABLE public.platform_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active platform KB"
  ON public.platform_knowledge_base
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can read all platform KB"
  ON public.platform_knowledge_base
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert platform KB"
  ON public.platform_knowledge_base
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update platform KB"
  ON public.platform_knowledge_base
  FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete platform KB"
  ON public.platform_knowledge_base
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Seed data
INSERT INTO public.platform_knowledge_base (title, content, kb_type) VALUES
  ('What is FitMatch?', 'FitMatch is a marketplace for premium European cabinetry serving the Greater Toronto Area. We connect buyers with cabinet manufacturers and resellers, offering 50-80% off retail pricing on surplus and overstock inventory.', 'general_faq'),
  ('How does ordering work?', 'Browse products, add to cart, and checkout with Stripe. After payment, the seller has 24 hours to acknowledge your order. They will prepare and ship within their listed prep time. You will receive email updates at every step.', 'general_faq'),
  ('Shipping and Delivery', 'Delivery options vary by seller. Each product listing shows available delivery methods (delivery, pickup, or both), estimated prep days, and delivery pricing. Sellers set their own delivery zones and pricing.', 'shipping_policy'),
  ('Returns and Disputes', 'If you have an issue with your order, use the Report Issue button on your order page. The seller will respond within 48 hours. If unresolved, our admin team reviews the dispute. All sales are subject to the individual seller''s return policy listed on their product page.', 'return_policy'),
  ('Payment and Security', 'All payments are processed securely through Stripe. We accept major credit cards. Seller payouts are handled through Stripe Connect. FitMatch holds funds until order fulfillment to protect buyers.', 'payment_info');
