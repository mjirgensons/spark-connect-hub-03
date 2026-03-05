INSERT INTO public.email_templates (
  template_key, category, customer_type, display_name, subject,
  from_email, from_name, reply_to, locale, is_active,
  requires_consent, casl_category, html_body, plain_text_body, variables_schema
) VALUES (
  'seller_registration_admin',
  'transactional',
  'all',
  'Seller Registration — Admin Notification',
  'New Seller Registration: {{company_name}}',
  'notifications@fitmatch.ca',
  'FitMatch',
  'support@fitmatch.ca',
  'en-CA',
  true,
  false,
  'transactional',
  '<h2>New Seller Registration</h2><p>A new seller has registered and is awaiting your approval.</p><table><tr><td><strong>Seller Name</strong></td><td>{{seller_name}}</td></tr><tr><td><strong>Company</strong></td><td>{{company_name}}</td></tr><tr><td><strong>Email</strong></td><td>{{seller_email}}</td></tr><tr><td><strong>Phone</strong></td><td>{{seller_phone}}</td></tr><tr><td><strong>Business Type</strong></td><td>{{business_type}}</td></tr><tr><td><strong>Website</strong></td><td>{{website}}</td></tr><tr><td><strong>Description</strong></td><td>{{description}}</td></tr><tr><td><strong>Submitted</strong></td><td>{{submitted_at}}</td></tr></table><p><a href="{{admin_review_url}}">Review in Admin Panel</a></p>',
  'New seller registration from {{seller_name}} ({{company_name}}). Email: {{seller_email}}, Phone: {{seller_phone}}, Business Type: {{business_type}}. Review at {{admin_review_url}}',
  '[{"key":"seller_name","type":"string"},{"key":"company_name","type":"string"},{"key":"seller_email","type":"string"},{"key":"seller_phone","type":"string"},{"key":"business_type","type":"string"},{"key":"website","type":"string"},{"key":"description","type":"string"},{"key":"admin_review_url","type":"string"},{"key":"submitted_at","type":"string"}]'::jsonb
) ON CONFLICT DO NOTHING;