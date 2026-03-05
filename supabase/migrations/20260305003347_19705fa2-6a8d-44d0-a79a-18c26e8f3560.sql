
-- NEW TABLE: seller_payouts
CREATE TABLE seller_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  gross_amount_cents INTEGER NOT NULL DEFAULT 0,
  platform_fee_cents INTEGER NOT NULL DEFAULT 0,
  stripe_fee_cents INTEGER NOT NULL DEFAULT 0,
  seller_payout_cents INTEGER NOT NULL DEFAULT 0,
  hst_on_commission_cents INTEGER NOT NULL DEFAULT 0,
  stripe_transfer_id TEXT,
  payout_status TEXT NOT NULL DEFAULT 'pending',
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sp_seller ON seller_payouts(seller_id);
CREATE INDEX idx_sp_order ON seller_payouts(order_id);

ALTER TABLE seller_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sp_seller_read" ON seller_payouts FOR SELECT USING (seller_id=auth.uid());
CREATE POLICY "sp_admin" ON seller_payouts FOR ALL USING (public.is_admin());

-- NEW TABLE: stripe_events
CREATE TABLE stripe_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB,
  order_id UUID REFERENCES orders(id)
);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "se_admin" ON stripe_events FOR ALL USING (public.is_admin());

-- MODIFY profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS seller_status TEXT,
  ADD COLUMN IF NOT EXISTS seller_tier TEXT DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_status TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS gst_hst_number TEXT,
  ADD COLUMN IF NOT EXISTS business_number TEXT,
  ADD COLUMN IF NOT EXISTS business_type TEXT,
  ADD COLUMN IF NOT EXISTS business_address JSONB,
  ADD COLUMN IF NOT EXISTS seller_branding_visible BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT;

-- MODIFY products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS wall_a_length_mm INTEGER,
  ADD COLUMN IF NOT EXISTS wall_b_length_mm INTEGER,
  ADD COLUMN IF NOT EXISTS wall_c_length_mm INTEGER,
  ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'NEW',
  ADD COLUMN IF NOT EXISTS condition_notes TEXT,
  ADD COLUMN IF NOT EXISTS construction_type TEXT,
  ADD COLUMN IF NOT EXISTS door_style TEXT,
  ADD COLUMN IF NOT EXISTS door_material TEXT,
  ADD COLUMN IF NOT EXISTS finish_type TEXT,
  ADD COLUMN IF NOT EXISTS hinge_brand TEXT,
  ADD COLUMN IF NOT EXISTS hinge_model TEXT,
  ADD COLUMN IF NOT EXISTS slide_brand TEXT,
  ADD COLUMN IF NOT EXISTS slide_model TEXT,
  ADD COLUMN IF NOT EXISTS lead_time_days INTEGER,
  ADD COLUMN IF NOT EXISTS is_custom_order BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS technical_drawings_url TEXT,
  ADD COLUMN IF NOT EXISTS measurement_standard TEXT DEFAULT 'metric';

-- MODIFY categories
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS layout_type TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES categories(id),
  ADD COLUMN IF NOT EXISTS icon TEXT;

-- MODIFY orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS stripe_transfer_group TEXT,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT,
  ADD COLUMN IF NOT EXISTS platform_fee_cents INTEGER,
  ADD COLUMN IF NOT EXISTS seller_payout_cents INTEGER,
  ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS funds_released_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);

-- Insert new category rows
INSERT INTO categories (name, slug, description, layout_type) VALUES
  ('Straight Kitchen', 'straight-kitchen', 'One-wall linear kitchen layout', 'straight'),
  ('L-Shape Kitchen', 'l-shape-kitchen', 'L-shaped corner kitchen layout', 'l_shape'),
  ('U-Shape Kitchen', 'u-shape-kitchen', 'U-shaped three-wall kitchen layout', 'u_shape'),
  ('Kitchen Island', 'kitchen-island', 'Standalone kitchen island cabinets', 'standard'),
  ('Vanity Cabinet', 'vanity-cabinet', 'Bathroom vanity cabinets', 'standard'),
  ('Medicine Cabinet', 'medicine-cabinet', 'Bathroom medicine cabinets', 'standard'),
  ('TV Unit', 'tv-unit', 'Entertainment and TV stand cabinets', 'standard'),
  ('Bar Cabinet', 'bar-cabinet', 'Bar and beverage cabinets', 'standard')
ON CONFLICT (name) DO NOTHING;
