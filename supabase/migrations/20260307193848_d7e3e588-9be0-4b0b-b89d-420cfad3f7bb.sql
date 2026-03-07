
CREATE OR REPLACE FUNCTION public.calculate_seller_health_score(p_seller_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total_orders INT;
  v_on_time_shipped INT;
  v_late_shipped INT;
  v_not_yet_shipped INT;
  v_on_time_rate NUMERIC;
  v_consecutive_overdue INT := 0;
  v_health_status TEXT;
  v_order RECORD;
BEGIN
  -- Total orders for this seller in last 90 days (excluding pending/cancelled)
  SELECT COUNT(*) INTO v_total_orders
  FROM orders
  WHERE seller_id = p_seller_id
    AND created_at >= NOW() - INTERVAL '90 days'
    AND status NOT IN ('pending', 'cancelled');

  -- On-time shipped
  SELECT COUNT(*) INTO v_on_time_shipped
  FROM orders
  WHERE seller_id = p_seller_id
    AND created_at >= NOW() - INTERVAL '90 days'
    AND status NOT IN ('pending', 'cancelled')
    AND shipped_at IS NOT NULL
    AND must_ship_by IS NOT NULL
    AND shipped_at <= must_ship_by;

  -- Late shipped
  SELECT COUNT(*) INTO v_late_shipped
  FROM orders
  WHERE seller_id = p_seller_id
    AND created_at >= NOW() - INTERVAL '90 days'
    AND status NOT IN ('pending', 'cancelled')
    AND shipped_at IS NOT NULL
    AND must_ship_by IS NOT NULL
    AND shipped_at > must_ship_by;

  -- Not yet shipped but overdue
  SELECT COUNT(*) INTO v_not_yet_shipped
  FROM orders
  WHERE seller_id = p_seller_id
    AND created_at >= NOW() - INTERVAL '90 days'
    AND status IN ('paid', 'preparing')
    AND must_ship_by IS NOT NULL
    AND must_ship_by < NOW();

  -- On-time rate
  IF v_total_orders = 0 THEN
    v_on_time_rate := 100;
  ELSE
    v_on_time_rate := ROUND((v_on_time_shipped::NUMERIC / v_total_orders) * 100, 1);
  END IF;

  -- Consecutive overdue (from newest)
  FOR v_order IN
    SELECT
      shipped_at,
      must_ship_by,
      status
    FROM orders
    WHERE seller_id = p_seller_id
      AND created_at >= NOW() - INTERVAL '90 days'
      AND status NOT IN ('pending', 'cancelled')
      AND must_ship_by IS NOT NULL
    ORDER BY created_at DESC
  LOOP
    IF (v_order.shipped_at IS NOT NULL AND v_order.shipped_at > v_order.must_ship_by)
       OR (v_order.status IN ('paid', 'preparing') AND v_order.must_ship_by < NOW()) THEN
      v_consecutive_overdue := v_consecutive_overdue + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- Health status
  IF v_total_orders = 0 THEN
    v_health_status := 'good';
  ELSIF v_on_time_rate < 60 OR v_consecutive_overdue >= 3 THEN
    v_health_status := 'restricted';
  ELSIF v_on_time_rate < 75 THEN
    v_health_status := 'at_risk';
  ELSIF v_on_time_rate < 90 THEN
    v_health_status := 'warning';
  ELSE
    v_health_status := 'good';
  END IF;

  RETURN jsonb_build_object(
    'total_orders', v_total_orders,
    'on_time_shipped', v_on_time_shipped,
    'late_shipped', v_late_shipped,
    'not_yet_shipped', v_not_yet_shipped,
    'on_time_rate', v_on_time_rate,
    'consecutive_overdue', v_consecutive_overdue,
    'health_status', v_health_status
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.calculate_seller_health_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_seller_health_score(UUID) TO service_role;
