
-- Update handle_new_user() to read seller fields from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, user_type, full_name, email, phone, company_name,
    seller_status, business_type, gst_hst_number,
    business_address, website, bio
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'company_name',
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data->>'user_type', 'client') = 'seller' THEN 'pending'
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'business_type',
    NEW.raw_user_meta_data->>'gst_hst_number',
    CASE
      WHEN NEW.raw_user_meta_data->'business_address' IS NOT NULL
        AND jsonb_typeof(NEW.raw_user_meta_data->'business_address') = 'object'
      THEN NEW.raw_user_meta_data->'business_address'
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'website',
    NEW.raw_user_meta_data->>'bio'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;
