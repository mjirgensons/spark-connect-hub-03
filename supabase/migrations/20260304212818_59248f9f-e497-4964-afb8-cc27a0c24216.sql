
-- pinecone_synced already exists as nullable boolean; make it NOT NULL
ALTER TABLE public.communication_logs
  ALTER COLUMN pinecone_synced SET NOT NULL,
  ALTER COLUMN pinecone_synced SET DEFAULT false;

-- Add pinecone_synced_at column
ALTER TABLE public.communication_logs
  ADD COLUMN IF NOT EXISTS pinecone_synced_at timestamptz;
