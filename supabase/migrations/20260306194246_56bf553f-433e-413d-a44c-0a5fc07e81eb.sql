
-- FIX-1: Add pinecone_synced columns
ALTER TABLE public.product_questions ADD COLUMN IF NOT EXISTS pinecone_synced BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.product_questions ADD COLUMN IF NOT EXISTS pinecone_synced_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_product_questions_pinecone ON public.product_questions(pinecone_synced) WHERE pinecone_synced = false;

-- FIX-3: Add seller_id for query efficiency
ALTER TABLE public.product_questions ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id);

-- Auto-populate seller_id on INSERT
CREATE OR REPLACE FUNCTION public.set_question_seller_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  SELECT seller_id INTO NEW.seller_id FROM public.products WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_question_seller_id
  BEFORE INSERT ON public.product_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_question_seller_id();

-- Backfill existing rows
UPDATE public.product_questions pq
SET seller_id = p.seller_id
FROM public.products p
WHERE pq.product_id = p.id AND pq.seller_id IS NULL;

-- FIX-4: Add direct seller_id RLS policies
CREATE POLICY "pq_seller_read_direct" ON public.product_questions
  FOR SELECT TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "pq_seller_update_direct" ON public.product_questions
  FOR UPDATE TO authenticated
  USING (seller_id = auth.uid());

-- Create index on seller_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_product_questions_seller ON public.product_questions(seller_id);
