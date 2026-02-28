# FitMatch.ca — Project Knowledge

## Product Vision
FitMatch is a marketplace platform for discounted/overstock premium European 
cabinetry in the GTA, Toronto. It matches surplus cabinet inventory to customer 
opening dimensions, bundles contractors, countertops, and appliances, and 
reduces kitchen/bathroom renovation timelines by 80%.

## User Roles
There are 4 user roles with completely separate dashboards:
1. **Client** — Homeowners, landlords, flippers, DIYers who buy cabinets
2. **Contractor** — Trades (GC, plumber, electrician, drywall, cabinet 
   installer, painter, countertop installer) who do installation work
3. **Seller** — Cabinet makers, resellers, appliance vendors, countertop 
   suppliers who list products on the platform
4. **Builder** — Property developers, architects, designers who buy in volume

## Existing Codebase — DO NOT MODIFY
These files are complete and working. Do not change them unless explicitly asked:
- src/pages/Index.tsx and all src/components/landing/* files
- src/pages/Product.tsx and src/components/ProductGallery.tsx
- src/pages/Admin.tsx and all src/components/admin/* files
- src/pages/AdminLogin.tsx
- src/pages/FooterPage.tsx
- src/pages/UnderConstruction.tsx
- src/integrations/supabase/client.ts
- src/integrations/lovable/index.ts
- src/hooks/useAuth.tsx
- src/lib/analytics.ts
- index.html (contains ElevenLabs widget — keep it)

## Auth Strategy
- Supabase Auth with email/password for clients, contractors, sellers, builders
- Google OAuth remains for admin only (via lovable cloud auth)
- profiles table has user_type column: 'client' | 'contractor' | 'seller' | 'builder'
- is_admin() function checks admin_emails table (existing, keep as-is)
- New RoleGuard component wraps protected routes
- Admin panel stays at /admin with existing auth

## Design System (already configured — follow exactly)
- Font sans: Space Grotesk
- Font serif: Lora
- Font mono: Space Mono
- Theme: Monochrome black/white with hard shadows
- Border radius: 0px (sharp corners)
- Components: shadcn/ui ONLY. Do NOT add Material UI, Chakra, or others.
- Shadows: hard offset (3-24px, pure black)

## Tech Rules
- React Router v6 for all routing
- @tanstack/react-query for data fetching
- Supabase JS client for all database operations
- State: React hooks + context only. No Redux.
- File uploads: Supabase Storage
- Chat: ElevenLabs ConvAI widget (already in index.html)
- ALL API calls through src/services/ folder (create if needed)

## Critical Business Logic
- Products have dimensions: width_mm, height_mm, depth_mm
- Matching = finding products where product dimensions fit within 
  customer opening dimensions
- Every product will eventually belong to a seller (seller_id on products)
- When no products match a client's dimensions, system creates a 
  quote_request sent to all relevant sellers
- Projects link clients → products → contractors (multiple trades per project)
