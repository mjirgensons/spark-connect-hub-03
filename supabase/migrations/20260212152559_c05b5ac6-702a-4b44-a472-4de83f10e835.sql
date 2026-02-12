
-- Drop the overly permissive SELECT policy on admin_emails
DROP POLICY IF EXISTS "Authenticated users can read admin_emails" ON public.admin_emails;

-- Only admins can read admin_emails (is_admin() is SECURITY DEFINER so it bypasses RLS)
CREATE POLICY "Only admins can read admin_emails"
  ON public.admin_emails FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Only admins can insert into admin_emails
CREATE POLICY "Only admins can insert admin_emails"
  ON public.admin_emails FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Only admins can update admin_emails
CREATE POLICY "Only admins can update admin_emails"
  ON public.admin_emails FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- Only admins can delete from admin_emails
CREATE POLICY "Only admins can delete admin_emails"
  ON public.admin_emails FOR DELETE
  TO authenticated
  USING (public.is_admin());
