
CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlists_user ON public.wishlists(user_id);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wishlist"
ON public.wishlists FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can read all wishlists"
ON public.wishlists FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can insert own wishlist items"
ON public.wishlists FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own wishlist items"
ON public.wishlists FOR DELETE
TO authenticated
USING (user_id = auth.uid());
