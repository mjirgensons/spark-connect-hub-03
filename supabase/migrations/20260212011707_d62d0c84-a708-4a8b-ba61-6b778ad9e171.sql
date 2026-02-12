
ALTER TABLE public.products
  ADD COLUMN countertop_option text DEFAULT 'no',
  ADD COLUMN countertop_material text DEFAULT NULL,
  ADD COLUMN countertop_thickness text DEFAULT NULL,
  ADD COLUMN countertop_finish text DEFAULT NULL,
  ADD COLUMN countertop_stock integer DEFAULT 0,
  ADD COLUMN countertop_included boolean DEFAULT false,
  ADD COLUMN countertop_price_retail numeric DEFAULT 0,
  ADD COLUMN countertop_price_discounted numeric DEFAULT 0,
  ADD COLUMN countertop_discount_percentage numeric DEFAULT 0;
