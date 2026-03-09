
-- Replace the kb_type validation: drop old trigger if exists, update function
CREATE OR REPLACE FUNCTION public.validate_kb_type()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.kb_type NOT IN ('product_faq', 'policy', 'installation_guide', 'lead_times', 'custom', 'internal_note', 'process_guide', 'reference') THEN
    RAISE EXCEPTION 'Invalid kb_type: %', NEW.kb_type;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop old trigger if it exists, then create
DROP TRIGGER IF EXISTS trg_validate_kb_type ON public.seller_knowledge_base;
CREATE TRIGGER trg_validate_kb_type
  BEFORE INSERT OR UPDATE ON public.seller_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.validate_kb_type();
