CREATE OR REPLACE FUNCTION public.validate_chat_session_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.user_role NOT IN ('guest', 'buyer', 'seller', 'authenticated_seller', 'email_captured', 'registered', 'contractor', 'builder') THEN
    RAISE EXCEPTION 'Invalid user_role: %', NEW.user_role;
  END IF;
  IF NEW.chatbot_mode NOT IN ('buyer_inquiry', 'product_search', 'general', 'product_support') THEN
    RAISE EXCEPTION 'Invalid chatbot_mode: %', NEW.chatbot_mode;
  END IF;
  IF NEW.status NOT IN ('active', 'escalated', 'closed', 'expired') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$;