
-- Product Questions table
CREATE TABLE public.product_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  option_id UUID REFERENCES public.product_options(id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL,
  buyer_name TEXT,
  question_text TEXT NOT NULL,
  seller_response TEXT,
  response_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_product_questions_product ON public.product_questions(product_id);
CREATE INDEX idx_product_questions_status ON public.product_questions(status);
CREATE INDEX idx_product_questions_buyer ON public.product_questions(buyer_id);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_product_question_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'answered', 'hidden') THEN
    RAISE EXCEPTION 'Invalid question status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_product_question_status
  BEFORE INSERT OR UPDATE ON public.product_questions
  FOR EACH ROW EXECUTE FUNCTION public.validate_product_question_status();

-- Updated_at trigger
CREATE TRIGGER trg_update_product_questions_updated_at
  BEFORE UPDATE ON public.product_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;

-- RLS: Public can read answered+public questions
CREATE POLICY "pq_public_read" ON public.product_questions
  FOR SELECT USING (is_public = true AND status = 'answered');

-- RLS: Authenticated users can read their own questions (any status)
CREATE POLICY "pq_own_read" ON public.product_questions
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid());

-- RLS: Authenticated users can insert their own questions
CREATE POLICY "pq_insert" ON public.product_questions
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- RLS: Seller can read all questions for their products
CREATE POLICY "pq_seller_read" ON public.product_questions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = product_questions.product_id
    AND products.seller_id = auth.uid()
  ));

-- RLS: Seller can update responses on their product questions
CREATE POLICY "pq_seller_update" ON public.product_questions
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = product_questions.product_id
    AND products.seller_id = auth.uid()
  ));

-- RLS: Admin full access
CREATE POLICY "pq_admin" ON public.product_questions
  FOR ALL USING (is_admin());
