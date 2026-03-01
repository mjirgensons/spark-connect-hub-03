CREATE POLICY "service_role_select_email_consent_log"
ON public.email_consent_log
FOR SELECT
TO service_role
USING (true);