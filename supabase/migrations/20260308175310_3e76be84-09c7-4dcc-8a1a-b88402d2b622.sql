CREATE POLICY "Public can read seller profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (user_type = 'seller');