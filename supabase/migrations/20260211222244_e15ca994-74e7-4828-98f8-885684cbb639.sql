
-- Categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);

-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  product_code TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  style TEXT NOT NULL,
  color TEXT NOT NULL,
  material TEXT NOT NULL,
  width_mm INTEGER NOT NULL,
  height_mm INTEGER NOT NULL,
  depth_mm INTEGER NOT NULL,
  price_retail_usd NUMERIC(10,2) NOT NULL,
  price_discounted_usd NUMERIC(10,2) NOT NULL,
  discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  short_description TEXT,
  long_description TEXT,
  main_image_url TEXT,
  additional_image_urls TEXT[] DEFAULT '{}',
  stock_level INTEGER NOT NULL DEFAULT 0,
  availability_status TEXT NOT NULL DEFAULT 'In Stock' CHECK (availability_status IN ('In Stock', 'Low Stock', 'Out of Stock')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  compatible_kitchen_layouts TEXT[] DEFAULT '{}',
  installation_instructions_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);

-- Index for common queries
CREATE INDEX idx_products_featured ON public.products (is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_category ON public.products (category_id);
CREATE INDEX idx_products_style ON public.products (style);
CREATE INDEX idx_products_availability ON public.products (availability_status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed categories
INSERT INTO public.categories (name, slug, description) VALUES
  ('Base Cabinets', 'base-cabinets', 'Standard base kitchen cabinets'),
  ('Wall Cabinets', 'wall-cabinets', 'Upper wall-mounted kitchen cabinets'),
  ('Tall Cabinets', 'tall-cabinets', 'Full-height pantry and utility cabinets'),
  ('Kitchen Islands', 'kitchen-islands', 'Freestanding kitchen island units'),
  ('Vanity Cabinets', 'vanity-cabinets', 'Bathroom vanity cabinetry'),
  ('Storage & Organization', 'storage-organization', 'Specialty storage solutions');
