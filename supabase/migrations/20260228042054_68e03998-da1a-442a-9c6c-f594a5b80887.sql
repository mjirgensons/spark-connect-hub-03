
-- Contractor details (extends profiles)
CREATE TABLE public.contractor_details (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  trade_types TEXT[] NOT NULL DEFAULT '{}',
  service_areas TEXT[] NOT NULL DEFAULT '{}',
  years_experience INTEGER,
  portfolio_url TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT false,
  rating NUMERIC(3,2) DEFAULT 0,
  jobs_completed INTEGER DEFAULT 0
);

ALTER TABLE public.contractor_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can manage own details" ON public.contractor_details
  FOR ALL TO authenticated USING (id = auth.uid());

CREATE POLICY "Public can read contractor details" ON public.contractor_details
  FOR SELECT USING (true);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id),
  product_id UUID REFERENCES public.products(id),
  status TEXT NOT NULL DEFAULT 'draft',
  opening_width_mm INTEGER,
  opening_height_mm INTEGER,
  opening_depth_mm INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can manage own projects" ON public.projects
  FOR ALL TO authenticated USING (client_id = auth.uid());

-- Project-Contractor assignments
CREATE TABLE public.project_contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.profiles(id),
  trade_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project participants can view" ON public.project_contractors
  FOR SELECT TO authenticated
  USING (contractor_id = auth.uid() OR 
    project_id IN (SELECT id FROM public.projects WHERE client_id = auth.uid()));

-- Quote requests (when no match found)
CREATE TABLE public.quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id),
  category TEXT,
  width_mm INTEGER NOT NULL,
  height_mm INTEGER NOT NULL,
  depth_mm INTEGER NOT NULL,
  style_preference TEXT,
  budget_range TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients manage own requests" ON public.quote_requests
  FOR ALL TO authenticated USING (client_id = auth.uid());

CREATE POLICY "Sellers can read open requests" ON public.quote_requests
  FOR SELECT TO authenticated
  USING (status = 'open' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'seller'));

-- Seller quotes (responses to quote requests)
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES public.quote_requests(id),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  price NUMERIC(10,2) NOT NULL,
  lead_time_days INTEGER,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers manage own quotes" ON public.quotes
  FOR ALL TO authenticated USING (seller_id = auth.uid());

CREATE POLICY "Clients can read quotes on their requests" ON public.quotes
  FOR SELECT TO authenticated
  USING (quote_request_id IN (
    SELECT id FROM public.quote_requests WHERE client_id = auth.uid()));

-- Validation triggers for status fields
CREATE OR REPLACE FUNCTION public.validate_project_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('draft','matched','contractors_assigned','in_progress','completed','cancelled') THEN
    RAISE EXCEPTION 'Invalid project status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_project_status
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.validate_project_status();

CREATE OR REPLACE FUNCTION public.validate_project_contractor_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('pending','accepted','declined','in_progress','completed') THEN
    RAISE EXCEPTION 'Invalid contractor assignment status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_project_contractor_status
  BEFORE INSERT OR UPDATE ON public.project_contractors
  FOR EACH ROW EXECUTE FUNCTION public.validate_project_contractor_status();

CREATE OR REPLACE FUNCTION public.validate_quote_request_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('open','quoted','accepted','expired') THEN
    RAISE EXCEPTION 'Invalid quote request status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_quote_request_status
  BEFORE INSERT OR UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_quote_request_status();

CREATE OR REPLACE FUNCTION public.validate_quote_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('submitted','accepted','declined','expired') THEN
    RAISE EXCEPTION 'Invalid quote status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_quote_status
  BEFORE INSERT OR UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.validate_quote_status();
