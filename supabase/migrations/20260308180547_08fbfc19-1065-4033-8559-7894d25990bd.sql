
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seller_ai_consent_accepted boolean DEFAULT false;

UPDATE public.profiles SET ai_chatbot_enabled = false, seller_ai_consent_accepted = false WHERE id = '2bde57a1-c549-4dbf-b793-753ed552962b';
