
-- Create admin_emails whitelist table
CREATE TABLE public.admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on admin_emails (only admins can manage it)
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read (needed for client-side UX checks)
CREATE POLICY "Authenticated users can read admin_emails"
  ON public.admin_emails FOR SELECT
  TO authenticated
  USING (true);

-- No insert/update/delete via client — managed via SQL only initially

-- Seed the first admin
INSERT INTO public.admin_emails (email) VALUES ('martin.jirgenson@gmail.com');

-- Create is_admin() security definer function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails
    WHERE email = (auth.jwt()->>'email')
  )
$$;

-- ============ UPDATE PRODUCTS POLICIES ============
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
CREATE POLICY "Admin users can insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
CREATE POLICY "Admin users can update products"
  ON public.products FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
CREATE POLICY "Admin users can delete products"
  ON public.products FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============ UPDATE CATEGORIES POLICIES ============
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
CREATE POLICY "Admin users can insert categories"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;
CREATE POLICY "Admin users can update categories"
  ON public.categories FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.categories;
CREATE POLICY "Admin users can delete categories"
  ON public.categories FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============ UPDATE STORAGE POLICIES ============
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Admin users can upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
CREATE POLICY "Admin users can update product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
CREATE POLICY "Admin users can delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can upload product documents" ON storage.objects;
CREATE POLICY "Admin users can upload product documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-documents' AND public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can update product documents" ON storage.objects;
CREATE POLICY "Admin users can update product documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-documents' AND public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can delete product documents" ON storage.objects;
CREATE POLICY "Admin users can delete product documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-documents' AND public.is_admin());
