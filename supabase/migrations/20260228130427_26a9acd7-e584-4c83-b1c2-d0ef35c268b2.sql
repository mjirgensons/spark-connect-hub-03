
INSERT INTO public.integrations (service_name, display_name, category, config) VALUES
  ('mailgun', 'Mailgun', 'email', '{"domain": "fitmatch.ca", "region": "US", "from_email": "orders@fitmatch.ca", "from_name": "FitMatch"}'),
  ('stripe', 'Stripe', 'payment', '{"currency": "CAD", "webhook_events": ["checkout.session.completed","checkout.session.expired","payment_intent.succeeded","payment_intent.payment_failed","charge.refunded"]}'),
  ('n8n', 'n8n Automation', 'automation', '{"base_url": "", "instance_type": "cloud"}'),
  ('chatbot_b2c', 'AI Chatbot (Customer)', 'chatbot', '{"model": "gpt-4o-mini", "provider": "openai", "vector_store": "pinecone"}'),
  ('chatbot_b2b', 'AI Chatbot (B2B/Contractor)', 'chatbot', '{"model": "gpt-4o-mini", "provider": "openai", "vector_store": "pinecone"}'),
  ('elevenlabs_voice', 'ElevenLabs Voice Agent', 'voice', '{"agent_id": "", "voice_id": ""}'),
  ('n8n_marketing', 'Marketing Automations (n8n)', 'marketing', '{"workflows": ["abandoned_cart","restock_alert","newsletter","promotional"]}')
ON CONFLICT (service_name) DO NOTHING;
