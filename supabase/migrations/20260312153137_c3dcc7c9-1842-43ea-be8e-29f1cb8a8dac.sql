
ALTER TABLE public.conversation_messages
  ADD COLUMN IF NOT EXISTS pinecone_synced BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinecone_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_conversation_messages_pinecone
  ON public.conversation_messages(pinecone_synced)
  WHERE pinecone_synced = false;
