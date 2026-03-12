
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pinecone_synced BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinecone_synced_at TIMESTAMPTZ;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS pinecone_synced BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinecone_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_pinecone
  ON public.orders(pinecone_synced)
  WHERE pinecone_synced = false;

CREATE INDEX IF NOT EXISTS idx_conversations_pinecone
  ON public.conversations(pinecone_synced)
  WHERE pinecone_synced = false;
