
-- Create footer_pages table to store content for each footer link page
CREATE TABLE public.footer_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  section TEXT NOT NULL, -- 'company', 'services', 'resources'
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.footer_pages ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Footer pages are publicly readable"
  ON public.footer_pages FOR SELECT
  USING (true);

-- Admin-only write access
CREATE POLICY "Only admins can insert footer pages"
  ON public.footer_pages FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update footer pages"
  ON public.footer_pages FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Only admins can delete footer pages"
  ON public.footer_pages FOR DELETE
  USING (public.is_admin());

-- Timestamp trigger
CREATE TRIGGER update_footer_pages_updated_at
  BEFORE UPDATE ON public.footer_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default content for all 12 footer pages
INSERT INTO public.footer_pages (slug, title, section, content) VALUES
('about-us', 'About Us', 'company', 'Fit-Match is the Greater Toronto Area''s premier luxury cabinet exchange. We connect homeowners and contractors with premium European cabinetry at prices that make luxury accessible to everyone.

Founded with a simple mission — to bridge the gap between high-end cabinet manufacturers and Canadian homeowners — we''ve grown into a trusted partner for thousands of renovation projects across the GTA.

Our team brings decades of combined experience in kitchen design, cabinet manufacturing, and home renovation. We personally inspect every cabinet set that enters our exchange, ensuring it meets our rigorous quality standards before it reaches your home.

We believe that beautiful, well-crafted cabinetry shouldn''t come with an astronomical price tag. By working directly with European manufacturers and leveraging our unique exchange model, we pass significant savings on to you.'),

('our-story', 'Our Story', 'company', 'Fit-Match began in 2020 when our founders noticed a significant gap in the Canadian cabinetry market. Premium European cabinets were available, but at prices that put them out of reach for most homeowners.

After years of working in the kitchen renovation industry, we saw an opportunity: manufacturers often had surplus inventory of exceptional quality cabinets — overstock from large orders, display models, and production overruns — that needed new homes.

We created the Fit-Match exchange model to connect these surplus cabinets with homeowners looking for premium quality at reasonable prices. What started as a small operation in a Toronto warehouse has grown into the GTA''s most trusted luxury cabinet exchange.

Today, we serve hundreds of customers annually, helping them achieve their dream kitchens without compromising on quality or breaking the bank.'),

('careers', 'Careers', 'company', 'Join the Fit-Match team and help us revolutionize the way Canadians buy luxury cabinetry.

We''re always looking for passionate individuals who share our vision of making premium home design accessible. Whether you''re experienced in sales, logistics, design, or customer service, we''d love to hear from you.

**Current Openings:**

• Kitchen Design Consultant — GTA Region
• Warehouse & Logistics Coordinator — Mississauga
• Digital Marketing Specialist — Remote/Hybrid
• Customer Experience Associate — Toronto

**Why Work With Us:**
• Competitive compensation and benefits
• Flexible work arrangements
• Employee discount on all products
• A collaborative, growth-oriented culture
• The chance to be part of a rapidly growing company

To apply, send your resume and cover letter to careers@fitmatchcabinets.ca.'),

('press', 'Press', 'company', 'Fit-Match has been featured in leading home design and business publications across Canada.

**Media Coverage:**

• "How Fit-Match is Disrupting the Luxury Cabinet Market" — Toronto Star, 2025
• "Top 10 Home Renovation Companies in the GTA" — HomeStars Magazine, 2025
• "Making European Luxury Accessible" — Canadian Interiors, 2024
• "The Rise of the Cabinet Exchange Model" — Globe and Mail, 2024

**Press Kit:**
For media inquiries, interviews, or press materials, please contact our communications team at press@fitmatchcabinets.ca.

**Brand Assets:**
Download our logo, product photography, and brand guidelines from our press kit. Please contact us for access.'),

('for-homeowners', 'For Homeowners', 'services', 'Transform your kitchen with premium European cabinets at a fraction of the typical cost.

**Why Choose Fit-Match?**

• **Save 40-70%** on luxury European cabinetry
• **Premium Quality** — Every cabinet is inspected by our expert team
• **Professional Guidance** — Our design consultants help you find the perfect match
• **Hassle-Free Process** — From selection to delivery, we handle everything

**How It Works for Homeowners:**

1. **Browse Our Collection** — Explore our curated selection of premium cabinets online or visit our showroom
2. **Get Matched** — Tell us about your space and style preferences, and we''ll find the perfect fit
3. **Professional Measurement** — Our team visits your home to ensure a perfect fit
4. **Delivery & Installation** — We coordinate delivery and can connect you with trusted installers

**Financing Available:**
We offer flexible financing options to make your dream kitchen even more accessible. Ask about our 0% financing for qualified buyers.'),

('for-contractors', 'For Contractors', 'services', 'Partner with Fit-Match to offer your clients premium cabinetry at competitive prices.

**Contractor Benefits:**

• **Wholesale Pricing** — Access our trade pricing for significant savings
• **Priority Access** — Get first look at new inventory arrivals
• **Volume Discounts** — Additional savings on large orders
• **Dedicated Account Manager** — Personal support for your projects
• **Fast Turnaround** — Most orders ship within 5-7 business days

**Trade Program Features:**

• Net-30 payment terms for qualified contractors
• Free delivery on orders over $5,000
• Sample program for client presentations
• Co-marketing opportunities
• Technical support and installation resources

**Getting Started:**
Register for our Trade Program by contacting trade@fitmatchcabinets.ca or calling (416) 555-0123. Provide your business license and we''ll set up your trade account within 24 hours.'),

('for-designers', 'For Designers', 'services', 'Elevate your design projects with Fit-Match''s curated collection of luxury European cabinetry.

**Designer Program Benefits:**

• **Exclusive Access** — Preview new collections before public release
• **Designer Pricing** — Special rates for design professionals
• **3D Rendering Support** — We provide CAD files and 3D models for your designs
• **Sample Library** — Borrow door samples, finish swatches, and hardware samples
• **Project Consultation** — Our experts collaborate with you on specifications

**Portfolio Partnership:**
We love showcasing beautiful work. Submit your completed Fit-Match projects for a chance to be featured on our website and social media, with full credit to your design firm.

**How to Join:**
Email your portfolio and business credentials to designers@fitmatchcabinets.ca. We''ll review your application and set up your designer account within 48 hours.'),

('trade-program', 'Trade Program', 'services', 'The Fit-Match Trade Program is designed for construction professionals, renovators, and property managers who need reliable access to premium cabinetry.

**Program Tiers:**

**Silver (0-10 orders/year)**
• 15% off retail pricing
• Standard delivery
• Email support

**Gold (11-25 orders/year)**
• 25% off retail pricing
• Priority delivery
• Dedicated account manager
• Net-15 payment terms

**Platinum (26+ orders/year)**
• 35% off retail pricing
• Express delivery included
• Dedicated account manager
• Net-30 payment terms
• Custom order capabilities
• Co-branded marketing materials

**Application Requirements:**
• Valid business license
• Proof of insurance
• Trade references (2 minimum)
• Completed trade application form

Contact trade@fitmatchcabinets.ca to apply.'),

('how-it-works', 'How It Works', 'resources', 'The Fit-Match process is designed to make buying luxury cabinets simple, transparent, and enjoyable.

**Step 1: Explore**
Browse our online catalog or visit our GTA showroom. Filter by style, color, material, and dimensions to find cabinets that match your vision.

**Step 2: Get Matched**
Use our Cabinet Match tool to submit your project details. Our team will curate a personalized selection based on your kitchen layout, style preferences, and budget.

**Step 3: Consult**
Schedule a free consultation with one of our kitchen design experts. We''ll review your selections, discuss options, and ensure everything fits your space perfectly.

**Step 4: Order**
Place your order with confidence. Every Fit-Match cabinet comes with our quality guarantee and transparent pricing — no hidden fees.

**Step 5: Receive**
We coordinate delivery to your home or job site. Our logistics team ensures your cabinets arrive safely and on schedule.

**Satisfaction Guaranteed:**
We stand behind every cabinet we sell. If you''re not completely satisfied, contact us within 7 days of delivery for a resolution.'),

('blog', 'Blog', 'resources', 'Welcome to the Fit-Match blog — your source for kitchen design inspiration, renovation tips, and industry insights.

**Recent Articles:**

**"5 Kitchen Trends Dominating 2026"** — January 2026
From warm wood tones to integrated smart storage, discover the trends shaping modern kitchen design this year.

**"Shaker vs. Flat Panel: Choosing the Right Cabinet Style"** — December 2025
A comprehensive comparison to help you decide which cabinet style best suits your home and lifestyle.

**"How to Measure Your Kitchen for New Cabinets"** — November 2025
A step-by-step guide to getting accurate measurements before ordering your new cabinetry.

**"European vs. North American Cabinets: What''s the Difference?"** — October 2025
Understanding the construction, material, and quality differences between European and domestic cabinetry.

**"Maximizing Storage in a Small Kitchen"** — September 2025
Creative solutions and cabinet configurations for making the most of limited kitchen space.

Check back regularly for new content, or subscribe to our newsletter for updates.'),

('faq', 'FAQ', 'resources', 'Find answers to our most commonly asked questions below.

**Q: How are your prices so much lower than retail?**
A: We source premium European cabinets through our unique exchange model — working with manufacturer surplus, overstock, and production overruns. This allows us to offer 40-70% savings without compromising quality.

**Q: Are the cabinets new or used?**
A: All our cabinets are brand new. They may come from overstock, display sets, or production surplus, but they are never used or refurbished.

**Q: Do you offer installation services?**
A: While we don''t install directly, we have a network of trusted, licensed installers we can recommend. Many of our contractor partners also offer installation services.

**Q: What areas do you serve?**
A: We primarily serve the Greater Toronto Area, including Toronto, Mississauga, Brampton, Vaughan, Markham, Richmond Hill, and surrounding areas. Contact us for delivery options outside the GTA.

**Q: Can I return my cabinets?**
A: We accept returns within 7 days of delivery, provided the cabinets are in their original condition and packaging. A restocking fee may apply.

**Q: Do you offer financing?**
A: Yes! We offer flexible financing options including 0% interest for qualified buyers. Contact us for details.

**Q: How long does delivery take?**
A: Most in-stock orders ship within 5-7 business days. Custom or special orders may take 2-4 weeks.'),

('support', 'Support', 'resources', 'We''re here to help. Reach out to our support team through any of the channels below.

**Contact Information:**

📍 **Address:** Greater Toronto Area, Ontario
📞 **Phone:** (416) 555-0123
📧 **Email:** support@fitmatchcabinets.ca
🕐 **Hours:** Monday–Friday, 9:00 AM – 6:00 PM EST | Saturday, 10:00 AM – 4:00 PM EST

**Common Support Topics:**

• **Order Status** — Track your order by contacting us with your order confirmation number
• **Delivery Questions** — Scheduling, rescheduling, or delivery area inquiries
• **Product Information** — Specifications, dimensions, materials, and compatibility
• **Returns & Exchanges** — Initiate a return within 7 days of delivery
• **Warranty Claims** — Report manufacturing defects or quality concerns
• **Account Issues** — Trade program account management and billing

**Showroom Visits:**
Visit our GTA showroom to see our cabinets in person. No appointment necessary during business hours, but we recommend booking a consultation for personalized attention.

For urgent matters outside business hours, email urgent@fitmatchcabinets.ca and we''ll respond within 4 hours.');
