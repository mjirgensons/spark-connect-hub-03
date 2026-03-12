
-- PART 1: Add pinecone_synced_at columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pinecone_synced_at timestamptz DEFAULT null;
ALTER TABLE public.seller_knowledge_base ADD COLUMN IF NOT EXISTS pinecone_synced_at timestamptz DEFAULT null;

-- PART 2: Partial indexes for unsynced row queries
CREATE INDEX IF NOT EXISTS idx_products_pinecone ON public.products(pinecone_synced) WHERE pinecone_synced = false;
CREATE INDEX IF NOT EXISTS idx_seller_kb_pinecone ON public.seller_knowledge_base(pinecone_synced) WHERE pinecone_synced = false;
CREATE INDEX IF NOT EXISTS idx_platform_kb_pinecone ON public.platform_knowledge_base(pinecone_synced) WHERE pinecone_synced = false;

-- PART 3: Reset triggers

-- Products trigger
CREATE OR REPLACE FUNCTION public.reset_products_pinecone_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.product_name IS DISTINCT FROM NEW.product_name
    OR OLD.short_description IS DISTINCT FROM NEW.short_description
    OR OLD.long_description IS DISTINCT FROM NEW.long_description
    OR OLD.material IS DISTINCT FROM NEW.material
    OR OLD.style IS DISTINCT FROM NEW.style
    OR OLD.color IS DISTINCT FROM NEW.color
    OR OLD.door_style IS DISTINCT FROM NEW.door_style
    OR OLD.finish_type IS DISTINCT FROM NEW.finish_type
    OR OLD.construction_type IS DISTINCT FROM NEW.construction_type
    OR OLD.width_mm IS DISTINCT FROM NEW.width_mm
    OR OLD.height_mm IS DISTINCT FROM NEW.height_mm
    OR OLD.depth_mm IS DISTINCT FROM NEW.depth_mm
    OR OLD.price_retail_usd IS DISTINCT FROM NEW.price_retail_usd
    OR OLD.price_discounted_usd IS DISTINCT FROM NEW.price_discounted_usd
    OR OLD.delivery_option IS DISTINCT FROM NEW.delivery_option
    OR OLD.delivery_price IS DISTINCT FROM NEW.delivery_price
    OR OLD.listing_status IS DISTINCT FROM NEW.listing_status
  THEN
    NEW.pinecone_synced := false;
    NEW.pinecone_synced_at := null;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reset_products_pinecone_sync
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_products_pinecone_sync();

-- Seller knowledge base trigger
CREATE OR REPLACE FUNCTION public.reset_seller_kb_pinecone_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.title IS DISTINCT FROM NEW.title
    OR OLD.content IS DISTINCT FROM NEW.content
  THEN
    NEW.pinecone_synced := false;
    NEW.pinecone_synced_at := null;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reset_seller_kb_pinecone_sync
  BEFORE UPDATE ON public.seller_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_seller_kb_pinecone_sync();

-- Orders trigger
CREATE OR REPLACE FUNCTION public.reset_orders_pinecone_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status
    OR OLD.tracking_number IS DISTINCT FROM NEW.tracking_number
    OR OLD.tracking_url IS DISTINCT FROM NEW.tracking_url
    OR OLD.estimated_delivery IS DISTINCT FROM NEW.estimated_delivery
    OR OLD.notes IS DISTINCT FROM NEW.notes
    OR OLD.shipped_at IS DISTINCT FROM NEW.shipped_at
    OR OLD.delivered_at IS DISTINCT FROM NEW.delivered_at
    OR OLD.cancelled_at IS DISTINCT FROM NEW.cancelled_at
  THEN
    NEW.pinecone_synced := false;
    NEW.pinecone_synced_at := null;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reset_orders_pinecone_sync
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_orders_pinecone_sync();

-- Conversations trigger
CREATE OR REPLACE FUNCTION public.reset_conversations_pinecone_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.last_message_at IS DISTINCT FROM NEW.last_message_at
    OR OLD.status IS DISTINCT FROM NEW.status
  THEN
    NEW.pinecone_synced := false;
    NEW.pinecone_synced_at := null;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reset_conversations_pinecone_sync
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_conversations_pinecone_sync();
