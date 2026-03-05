
CREATE TABLE product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  option_type TEXT NOT NULL,
  option_name TEXT NOT NULL,
  inclusion_status TEXT NOT NULL DEFAULT 'not_included',
  price_retail NUMERIC DEFAULT 0,
  price_discounted NUMERIC DEFAULT 0,
  description TEXT,
  specifications JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_po_product ON product_options(product_id);
CREATE INDEX idx_po_type ON product_options(option_type);

CREATE TABLE product_compatible_appliances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  appliance_type TEXT NOT NULL,
  brand TEXT,
  model_number TEXT,
  model_name TEXT,
  dimensions JSONB DEFAULT '{}',
  notes TEXT,
  reference_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pca_product ON product_compatible_appliances(product_id);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  color TEXT,
  material TEXT,
  finish TEXT,
  price_retail NUMERIC,
  price_discounted NUMERIC,
  main_image_url TEXT,
  additional_image_urls TEXT[] DEFAULT '{}',
  stock_level INTEGER DEFAULT 0,
  availability_status TEXT DEFAULT 'In Stock',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pv_product ON product_variants(product_id);

CREATE TABLE seller_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agreement_type TEXT NOT NULL,
  agreement_version TEXT NOT NULL DEFAULT '1.0',
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_sa_seller ON seller_agreements(seller_id);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  related_order_id UUID REFERENCES orders(id),
  related_product_id UUID REFERENCES products(id),
  message_body TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'general',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_msg_convo ON messages(conversation_id);
CREATE INDEX idx_msg_sender ON messages(sender_id);
CREATE INDEX idx_msg_recipient ON messages(recipient_id);

ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_compatible_appliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "po_read" ON product_options FOR SELECT USING (true);
CREATE POLICY "po_seller" ON product_options FOR ALL USING (EXISTS(SELECT 1 FROM products WHERE products.id=product_id AND products.seller_id=auth.uid()));
CREATE POLICY "po_admin" ON product_options FOR ALL USING (public.is_admin());

CREATE POLICY "pca_read" ON product_compatible_appliances FOR SELECT USING (true);
CREATE POLICY "pca_seller" ON product_compatible_appliances FOR ALL USING (EXISTS(SELECT 1 FROM products WHERE products.id=product_id AND products.seller_id=auth.uid()));
CREATE POLICY "pca_admin" ON product_compatible_appliances FOR ALL USING (public.is_admin());

CREATE POLICY "pv_read" ON product_variants FOR SELECT USING (true);
CREATE POLICY "pv_seller" ON product_variants FOR ALL USING (EXISTS(SELECT 1 FROM products WHERE products.id=product_id AND products.seller_id=auth.uid()));
CREATE POLICY "pv_admin" ON product_variants FOR ALL USING (public.is_admin());

CREATE POLICY "sa_read" ON seller_agreements FOR SELECT USING (seller_id=auth.uid());
CREATE POLICY "sa_insert" ON seller_agreements FOR INSERT WITH CHECK (seller_id=auth.uid());
CREATE POLICY "sa_admin" ON seller_agreements FOR ALL USING (public.is_admin());

CREATE POLICY "msg_read" ON messages FOR SELECT USING (sender_id=auth.uid() OR recipient_id=auth.uid());
CREATE POLICY "msg_send" ON messages FOR INSERT WITH CHECK (sender_id=auth.uid());
CREATE POLICY "msg_update" ON messages FOR UPDATE USING (sender_id=auth.uid() OR recipient_id=auth.uid());
CREATE POLICY "msg_admin" ON messages FOR ALL USING (public.is_admin());
