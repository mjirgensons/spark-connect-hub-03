
-- Create product_reviews table
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  rating integer NOT NULL,
  title text,
  body text,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Validation trigger for rating and status
CREATE OR REPLACE FUNCTION public.validate_review_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  IF NEW.status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid review status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_review_fields
BEFORE INSERT OR UPDATE ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_review_fields();

-- Updated_at trigger
CREATE TRIGGER trg_update_review_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_reviews_product ON public.product_reviews(product_id);
CREATE INDEX idx_reviews_status ON public.product_reviews(status);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- SELECT: approved reviews visible to all, own reviews visible to author, all visible to admins
CREATE POLICY "Anyone can read approved reviews"
ON public.product_reviews FOR SELECT
USING (status = 'approved');

CREATE POLICY "Users can read own reviews"
ON public.product_reviews FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can read all reviews"
ON public.product_reviews FOR SELECT
TO authenticated
USING (public.is_admin());

-- INSERT: authenticated users only, must be own user_id
CREATE POLICY "Authenticated users can insert own reviews"
ON public.product_reviews FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: admins only
CREATE POLICY "Admins can update reviews"
ON public.product_reviews FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- DELETE: admins only
CREATE POLICY "Admins can delete reviews"
ON public.product_reviews FOR DELETE
TO authenticated
USING (public.is_admin());
