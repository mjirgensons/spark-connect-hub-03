
-- Add seller_id to products (nullable for now — existing admin products have no seller)
ALTER TABLE public.products ADD COLUMN seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX idx_products_seller ON public.products(seller_id);

-- Sellers can read their own products
CREATE POLICY "Sellers can read own products"
  ON public.products FOR SELECT TO authenticated
  USING (seller_id = auth.uid() OR seller_id IS NULL);

-- Sellers can insert their own products
CREATE POLICY "Sellers can insert own products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (seller_id = auth.uid());

-- Sellers can update their own products
CREATE POLICY "Sellers can update own products"
  ON public.products FOR UPDATE TO authenticated
  USING (seller_id = auth.uid());
