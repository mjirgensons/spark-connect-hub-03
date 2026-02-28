
-- Drop old tables (quotes depends on quote_requests)
DROP TABLE IF EXISTS public.quotes CASCADE;
DROP TABLE IF EXISTS public.quote_requests CASCADE;

-- ============================================
-- SHIPPING ADDRESSES
-- ============================================
CREATE TABLE public.shipping_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'CA',
  phone TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own addresses"
  ON public.shipping_addresses FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_shipping_addresses_updated_at
  BEFORE UPDATE ON public.shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ORDERS (with validation trigger instead of CHECK)
-- ============================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,4) NOT NULL DEFAULT 0.13,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  shipping_name TEXT NOT NULL,
  shipping_address_line_1 TEXT NOT NULL,
  shipping_address_line_2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_province TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL DEFAULT 'CA',
  shipping_phone TEXT,
  shipping_method TEXT DEFAULT 'standard',
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  paid_at TIMESTAMPTZ,
  tracking_number TEXT,
  tracking_url TEXT,
  estimated_delivery TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_order_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('pending','confirmed','preparing','shipped','delivered','cancelled','refunded') THEN
    RAISE EXCEPTION 'Invalid order status: %', NEW.status;
  END IF;
  IF NEW.payment_status NOT IN ('unpaid','paid','refunded','failed') THEN
    RAISE EXCEPTION 'Invalid payment status: %', NEW.payment_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_order_status_trigger
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_status();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE
  date_part TEXT;
  seq_part TEXT;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  SELECT LPAD((COUNT(*) + 1)::TEXT, 4, '0')
    INTO seq_part
    FROM public.orders
    WHERE created_at::date = CURRENT_DATE;
  NEW.order_number := 'FM-' || date_part || '-' || seq_part;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION public.generate_order_number();

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT,
  product_image TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_order_item_quantity()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than 0';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_order_item_quantity_trigger
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_item_quantity();

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert order items"
  ON public.order_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all order items"
  ON public.order_items FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- QUOTE REQUESTS (new B2B RFQ schema)
-- ============================================
CREATE TABLE public.quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  company_name TEXT,
  project_type TEXT,
  project_timeline TEXT,
  delivery_address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  quoted_total NUMERIC(10,2),
  quoted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_quote_request_status_v2()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('new','reviewing','quoted','accepted','declined','expired') THEN
    RAISE EXCEPTION 'Invalid quote request status: %', NEW.status;
  END IF;
  IF NEW.project_type IS NOT NULL AND NEW.project_type NOT IN ('renovation','new_build','multi_unit','commercial','resale','other') THEN
    RAISE EXCEPTION 'Invalid project type: %', NEW.project_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_quote_request_status_v2_trigger
  BEFORE INSERT OR UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_quote_request_status_v2();

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quotes"
  ON public.quote_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create quote requests"
  ON public.quote_requests FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all quotes"
  ON public.quote_requests FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_quote_requests_updated_at
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE
  date_part TEXT;
  seq_part TEXT;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  SELECT LPAD((COUNT(*) + 1)::TEXT, 4, '0')
    INTO seq_part
    FROM public.quote_requests
    WHERE created_at::date = CURRENT_DATE;
  NEW.quote_number := 'FMQ-' || date_part || '-' || seq_part;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_quote_number
  BEFORE INSERT ON public.quote_requests
  FOR EACH ROW
  WHEN (NEW.quote_number IS NULL OR NEW.quote_number = '')
  EXECUTE FUNCTION public.generate_quote_number();

-- ============================================
-- QUOTE REQUEST ITEMS
-- ============================================
CREATE TABLE public.quote_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quote items"
  ON public.quote_request_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quote_requests
      WHERE quote_requests.id = quote_request_items.quote_request_id
      AND quote_requests.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert quote items"
  ON public.quote_request_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all quote items"
  ON public.quote_request_items FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- INTEGRATIONS
-- ============================================
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'disconnected',
  last_health_check TIMESTAMPTZ,
  last_health_status TEXT DEFAULT 'unknown',
  config JSONB NOT NULL DEFAULT '{}',
  encrypted_credentials JSONB DEFAULT '{}',
  webhook_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_integration_fields()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.category NOT IN ('email','payment','automation','chatbot','voice','analytics','marketing') THEN
    RAISE EXCEPTION 'Invalid integration category: %', NEW.category;
  END IF;
  IF NEW.status NOT IN ('connected','disconnected','error','testing') THEN
    RAISE EXCEPTION 'Invalid integration status: %', NEW.status;
  END IF;
  IF NEW.last_health_status NOT IN ('healthy','degraded','unhealthy','unknown') THEN
    RAISE EXCEPTION 'Invalid health status: %', NEW.last_health_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_integration_fields_trigger
  BEFORE INSERT OR UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.validate_integration_fields();

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage integrations"
  ON public.integrations FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- WEBHOOK LOGS
-- ============================================
CREATE TABLE public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.integrations(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  request_payload JSONB,
  response_status INT,
  response_body TEXT,
  duration_ms INT,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_webhook_log_fields()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.direction NOT IN ('outbound','inbound') THEN
    RAISE EXCEPTION 'Invalid webhook direction: %', NEW.direction;
  END IF;
  IF NEW.status NOT IN ('pending','delivered','failed','retrying') THEN
    RAISE EXCEPTION 'Invalid webhook log status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_webhook_log_fields_trigger
  BEFORE INSERT OR UPDATE ON public.webhook_logs
  FOR EACH ROW EXECUTE FUNCTION public.validate_webhook_log_fields();

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view webhook logs"
  ON public.webhook_logs FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX idx_webhook_logs_event_type ON public.webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_status ON public.webhook_logs(status);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_integration ON public.webhook_logs(integration_id);
