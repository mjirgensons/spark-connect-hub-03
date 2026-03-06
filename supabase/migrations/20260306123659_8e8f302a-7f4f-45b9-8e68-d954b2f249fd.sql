
-- Create conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id),
  buyer_id uuid NOT NULL REFERENCES public.profiles(id),
  seller_id uuid NOT NULL REFERENCES public.profiles(id),
  subject text,
  last_message_at timestamptz DEFAULT now(),
  buyer_unread_count int DEFAULT 0,
  seller_unread_count int DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, buyer_id, seller_id)
);

-- Create conversation_messages table (avoiding conflict with existing messages table)
CREATE TABLE public.conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_conversations_buyer_id ON public.conversations(buyer_id);
CREATE INDEX idx_conversations_seller_id ON public.conversations(seller_id);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX idx_conversation_messages_conversation_created ON public.conversation_messages(conversation_id, created_at);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- RLS for conversations
CREATE POLICY "conv_select" ON public.conversations FOR SELECT USING (
  buyer_id = auth.uid() OR seller_id = auth.uid() OR is_admin()
);
CREATE POLICY "conv_insert" ON public.conversations FOR INSERT WITH CHECK (
  auth.uid() = buyer_id
);
CREATE POLICY "conv_update" ON public.conversations FOR UPDATE USING (
  buyer_id = auth.uid() OR seller_id = auth.uid() OR is_admin()
);

-- RLS for conversation_messages
CREATE POLICY "cmsg_select" ON public.conversation_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_messages.conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid() OR is_admin())
  )
);
CREATE POLICY "cmsg_insert" ON public.conversation_messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_messages.conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);
CREATE POLICY "cmsg_update" ON public.conversation_messages FOR UPDATE USING (
  sender_id = auth.uid()
);

-- Enable realtime for conversation_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
