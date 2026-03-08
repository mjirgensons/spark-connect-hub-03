INSERT INTO public.site_settings (key, value, description) VALUES
  ('chatbot_guest_message_limit', '3', 'Number of free AI responses before email gate appears (Tier 0)'),
  ('chatbot_email_gate_dismiss_extra', '2', 'Additional messages allowed after dismissing email gate'),
  ('chatbot_email_gate_hard_limit', '5', 'Total messages before hard email gate (no dismiss)'),
  ('chatbot_email_tier_session_limit', '8', 'AI responses per session after email captured (Tier 1)'),
  ('chatbot_registered_per_seller_limit', '50', 'Registered buyer messages per seller per day'),
  ('chatbot_registered_total_daily_limit', '200', 'Registered buyer total messages per day'),
  ('chatbot_marketing_checkbox_default', 'false', 'Marketing opt-in checkbox default state (CASL: must be false)'),
  ('chatbot_consent_modal_enabled', 'true', 'Show PIPEDA consent modal before first chat'),
  ('chatbot_voice_input_enabled', 'true', 'Enable microphone/voice input in chat widget'),
  ('chatbot_auto_open_delay_seconds', '30', 'Seconds before floating chat button appears on page')
ON CONFLICT (key) DO NOTHING;