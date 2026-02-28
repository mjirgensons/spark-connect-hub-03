
CREATE TABLE public.faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL,
  group_title text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FAQ items are publicly readable"
  ON public.faq_items FOR SELECT USING (true);

CREATE POLICY "Only admins can insert faq items"
  ON public.faq_items FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update faq items"
  ON public.faq_items FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Only admins can delete faq items"
  ON public.faq_items FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE TRIGGER update_faq_items_updated_at
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
