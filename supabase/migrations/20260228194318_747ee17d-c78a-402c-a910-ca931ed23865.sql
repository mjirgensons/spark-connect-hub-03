
-- Create trust_signals table
CREATE TABLE public.trust_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  icon_name text NOT NULL,
  title text NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trust_signals ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Trust signals are publicly readable"
  ON public.trust_signals FOR SELECT
  USING (true);

-- Admin write
CREATE POLICY "Only admins can insert trust signals"
  ON public.trust_signals FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update trust signals"
  ON public.trust_signals FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Only admins can delete trust signals"
  ON public.trust_signals FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Updated_at trigger
CREATE TRIGGER update_trust_signals_updated_at
  BEFORE UPDATE ON public.trust_signals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
