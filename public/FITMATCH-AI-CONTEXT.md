# FitMatch.ca — Full Project Context for AI Assistants

> **Generated**: 2026-03-04
> **Purpose**: Feed this file to any AI model (Perplexity, ChatGPT, Claude, Gemini, etc.) to give it full context about this project.

---

## 1. Product Vision

**FitMatch** is a marketplace platform for discounted/overstock premium European cabinetry in the GTA (Greater Toronto Area), Canada. It matches surplus cabinet inventory to customer opening dimensions, bundles contractors, countertops, and appliances, and reduces kitchen/bathroom renovation timelines by ~80%.

**Live URL**: https://spark-connect-hub-03.lovable.app
**Production domain**: fitmatch.ca

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Routing | React Router v6 |
| Data Fetching | @tanstack/react-query v5 |
| Backend | Supabase (Lovable Cloud) |
| Auth | Supabase Auth (email/password for users, Google OAuth for admin) |
| Payments | Stripe (via Edge Functions) |
| Email | Mailgun (via n8n workflows WF-8, WF-9, WF-10, WF-11) |
| Voice Chat | ElevenLabs ConvAI widget (embedded in index.html) |
| State Management | React hooks + Context (no Redux) |
| Forms | react-hook-form + zod |
| Charts | Recharts |

---

## 3. User Roles

There are **4 user roles** with completely separate dashboards:

| Role | Description | Route Prefix |
|------|-------------|-------------|
| **Client** | Homeowners, landlords, flippers, DIYers who buy cabinets | `/client/*` |
| **Contractor** | Trades (GC, plumber, electrician, drywall, cabinet installer, painter, countertop installer) | `/contractor/*` |
| **Seller** | Cabinet makers, resellers, appliance vendors, countertop suppliers who list products | `/seller/*` |
| **Builder** | Property developers, architects, designers who buy in volume | `/builder/*` |
| **Admin** | Internal admin panel (separate auth via admin_emails table) | `/admin` |

Roles are stored in `profiles.user_type` column: `'client' | 'contractor' | 'seller' | 'builder'`
Admin access is determined by the `admin_emails` table + `is_admin()` database function.

---

## 4. Design System

| Property | Value |
|----------|-------|
| Font Sans | Space Grotesk |
| Font Serif | Lora |
| Font Mono | Space Mono |
| Theme | Monochrome black/white with hard shadows |
| Border Radius | 0px (sharp corners everywhere) |
| Shadows | Hard offset (3–24px, pure black) |
| Component Library | shadcn/ui ONLY |
| Color System | HSL-based CSS custom properties |

**Color tokens** (light mode):
- `--background`: white `0 0% 100%`
- `--foreground`: black `0 0% 0%`
- `--primary`: black `0 0% 0%`
- `--secondary`: light gray `0 0% 96%`
- `--muted-foreground`: mid gray `0 0% 45%`
- `--border`: black `0 0% 0%`
- `--destructive`: red `0 84% 60%`

---

## 5. Route Map

### Public Routes
| Path | Page |
|------|------|
| `/` | Landing page (Index) |
| `/browse` | Product catalog with filters |
| `/product/:id` | Product detail page |
| `/cart` | Shopping cart |
| `/checkout` | Checkout flow |
| `/order-confirmation/:orderId` | Order confirmation |
| `/quote-request` | Request a quote |
| `/quote-success` | Quote submitted confirmation |
| `/search` | Search results |
| `/how-it-works` | How It Works page |
| `/for-contractors` | Contractor landing page |
| `/for-sellers` | Seller landing page |
| `/about` | About page |
| `/faq` | FAQ page |
| `/blog` | Blog listing |
| `/blog/:slug` | Blog post detail |
| `/compare` | Product comparison |
| `/login` | User login |
| `/register` | User registration |
| `/page/:slug` | Dynamic footer/legal pages |

### Client Dashboard (`/client/*`)
dashboard, matches, match/new, projects, projects/:projectId, messages, profile

### Contractor Dashboard (`/contractor/*`)
dashboard, jobs, jobs/:jobId, projects, projects/:projectId, messages, profile

### Seller Dashboard (`/seller/*`)
dashboard, products, products/new, products/:productId, documents, quotes, quotes/:quoteId, orders, analytics, messages, store-profile

### Builder Dashboard (`/builder/*`)
dashboard, projects, projects/new, matches, messages, profile

### Account Pages (`/account/*`)
overview, orders, wishlist, addresses, settings

### Admin (`/admin`)
Single-page admin panel with sidebar navigation: Dashboard, Orders, Quotes, Products, Customers, Reviews, Email, Email Test Console, Content, Trust Signals, FAQ, Blog, Newsletter, Cookie Manager, Integrations, Webhooks & Events, System Settings

---

## 6. Database Schema (30 Tables)

### Core Business Tables
| Table | Purpose |
|-------|---------|
| `products` | Cabinet/product listings with dimensions (width_mm, height_mm, depth_mm), pricing, images, seller_id |
| `categories` | Product categories |
| `orders` | Customer orders with Stripe integration |
| `order_items` | Line items per order |
| `quote_requests` | Quote requests from customers |
| `quote_request_items` | Items within a quote request |
| `projects` | Links clients → products → contractors, stores opening dimensions |
| `project_contractors` | Many-to-many: projects ↔ contractors with trade_type |

### User & Auth Tables
| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (id, email, full_name, user_type, company_name, phone, location) |
| `admin_emails` | Whitelist of admin email addresses |
| `contractor_details` | Extended contractor info (trade_types[], service_areas[], rating, etc.) |
| `shipping_addresses` | Saved shipping addresses per user |
| `wishlists` | User wishlist items |

### Content & Marketing Tables
| Table | Purpose |
|-------|---------|
| `blog_posts` | Blog content with SEO fields |
| `faq_items` | FAQ entries grouped by category |
| `footer_pages` | Dynamic footer/legal page content |
| `trust_signals` | Trust badges shown on the site |
| `product_reviews` | Product reviews with moderation |
| `newsletter_subscribers` | Newsletter signups with CASL consent |
| `site_settings` | Key-value site configuration |

### Email & Communication Tables
| Table | Purpose |
|-------|---------|
| `email_templates` | Email templates with CASL compliance |
| `communication_logs` | Full email audit trail (inbound/outbound, Mailgun IDs, status tracking) |
| `email_consent_log` | CASL email consent records |

### Analytics & Tracking Tables
| Table | Purpose |
|-------|---------|
| `analytics_events` | Frontend analytics events |
| `analytics_sessions` | Session tracking |
| `consent_logs` | Cookie consent audit trail |
| `cookie_categories` | Cookie consent categories |
| `cookie_definitions` | Individual cookie definitions |

### Integration Tables
| Table | Purpose |
|-------|---------|
| `integrations` | Third-party integration configs (Mailgun, Stripe, n8n, etc.) |
| `webhook_logs` | Webhook event audit trail with retry logic |

### Database Functions
| Function | Purpose |
|----------|---------|
| `is_admin()` | Returns boolean — checks if current user's email is in admin_emails |
| `get_full_schema_dump()` | Returns full database schema as text for dev tools |

---

## 7. Edge Functions (14 Functions)

| Function | Purpose |
|----------|---------|
| `check-consent` | Check user consent status |
| `create-checkout-session` | Create Stripe checkout session |
| `create-wf10-test-user` | Create test user for WF-10 email testing |
| `get-wf9-order` | Fetch order data for WF-9 Stripe email workflow |
| `get-wf9-order-items` | Fetch order items for WF-9 |
| `log-communication` | Log email communication to communication_logs |
| `log-email-consent` | Record email consent per CASL |
| `seed-wf10-test-data` | Seed test data for WF-10 testing |
| `simulate-inbound-email` | Simulate Mailgun inbound email for WF-10 testing |
| `stripe-webhook` | Handle Stripe webhook events |
| `stripe-webhook-test` | Test Stripe webhook processing |
| `submit-cabinet-match` | Submit cabinet dimension match request |
| `test-integration` | Test third-party integration connectivity |
| `update-communication-status` | Update email delivery status |

---

## 8. Email Workflow Architecture

| Workflow | Name | Purpose |
|----------|------|---------|
| WF-8 | Email Dispatcher | Sends outbound emails via Mailgun, logs to communication_logs |
| WF-9 | Stripe Email Router | Handles Stripe webhook events → email notifications |
| WF-10 | Inbound Email Handler | Processes inbound customer replies via Mailgun webhooks |
| WF-11 | Mailgun Event Receiver | Processes Mailgun delivery/bounce/open/click events |

All workflows are orchestrated via **n8n** (external automation platform) and connected through webhooks.

---

## 9. Critical Business Logic

### Cabinet Dimension Matching
- Products have dimensions: `width_mm`, `height_mm`, `depth_mm` (also `width_inches`, `height_inches`, `depth_inches`)
- **Matching** = finding products where product dimensions fit within customer opening dimensions
- Projects store customer openings: `opening_width_mm`, `opening_height_mm`, `opening_depth_mm`
- When no products match, system creates a `quote_request` sent to relevant sellers

### Pricing
- `price_retail_usd` — original retail price
- `price_discounted_usd` — FitMatch discounted price
- `discount_percentage` — calculated discount
- Optional countertop bundle pricing fields

### Product Ownership
- `seller_id` on products references `profiles.id`
- Each seller manages their own product listings

---

## 10. File Structure

```
├── public/                          # Static assets
├── src/
│   ├── assets/                      # Images (cabinets, products, hero)
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components (50+ files)
│   │   ├── admin/                   # Admin panel tabs (31 files)
│   │   ├── landing/                 # Landing page sections (10 files)
│   │   ├── checkout/                # Checkout flow steps (4 files)
│   │   ├── Breadcrumbs.tsx
│   │   ├── CompareBar.tsx
│   │   ├── CookieConsent.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── DimensionMatcher.tsx
│   │   ├── ProductGallery.tsx
│   │   ├── ProductReviews.tsx
│   │   ├── RoleGuard.tsx
│   │   ├── SearchBar.tsx
│   │   └── ...
│   ├── contexts/                    # Cart, Checkout, Compare, Wishlist
│   ├── hooks/                       # useAuth, useProfile, useAnalytics, etc.
│   ├── integrations/supabase/       # Auto-generated client & types
│   ├── lib/                         # Utils, analytics, webhook dispatcher
│   ├── pages/
│   │   ├── account/                 # Account management (6 files)
│   │   ├── admin/                   # WebhookDetail
│   │   ├── builder/                 # Builder dashboard (6 files)
│   │   ├── client/                  # Client dashboard (7 files)
│   │   ├── contractor/              # Contractor dashboard (7 files)
│   │   ├── seller/                  # Seller dashboard (11 files)
│   │   └── [top-level pages]        # 20+ page components
│   ├── App.tsx                      # Main app with all routes
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Design system tokens
├── supabase/
│   ├── config.toml                  # Supabase configuration
│   └── functions/                   # 14 Edge Functions
├── .lovable/system.md               # Project knowledge for Lovable AI
└── package.json
```

---

## 11. Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.3 | UI framework |
| react-router-dom | 6.30 | Client-side routing |
| @supabase/supabase-js | 2.95 | Backend client |
| @tanstack/react-query | 5.83 | Data fetching & caching |
| tailwindcss | 3.4 | Utility CSS |
| shadcn/ui (radix-ui) | various | Component library |
| react-hook-form | 7.61 | Form management |
| zod | 3.25 | Schema validation |
| recharts | 2.15 | Charts & analytics |
| lucide-react | 0.462 | Icons |
| date-fns | 3.6 | Date utilities |
| stripe | (via Edge Functions) | Payments |

---

## 12. Auth Strategy

- **Regular users**: Supabase Auth with email/password → sign up selects user_type → profile created in `profiles` table
- **Admin**: Google OAuth, verified against `admin_emails` table via `is_admin()` function
- **Route protection**: `RoleGuard` component wraps dashboard routes, checks `profiles.user_type`
- **Admin panel**: Separate auth check at `/admin`, redirects to `/admin/login` if not authenticated

---

## 13. Contexts (Global State)

| Context | Purpose |
|---------|---------|
| `CartContext` | Shopping cart state (add, remove, update quantity, totals) |
| `WishlistContext` | Product wishlist (persisted to Supabase for logged-in users) |
| `CompareContext` | Product comparison (up to N products side-by-side) |
| `CheckoutContext` | Multi-step checkout flow state |

---

## 14. Canadian Compliance (CASL)

The platform is built for Canada and implements **CASL** (Canada's Anti-Spam Legislation):
- Email consent tracking in `email_consent_log`
- Cookie consent with categories in `cookie_categories` / `cookie_definitions`
- Consent audit trail in `consent_logs`
- Newsletter subscribers require explicit consent text
- Email templates have `requires_consent` and `casl_category` fields

---

## 15. External Integrations

| Service | Purpose | Connection Method |
|---------|---------|------------------|
| Stripe | Payments | Edge Functions (`create-checkout-session`, `stripe-webhook`) |
| Mailgun | Email delivery | Via n8n workflows (WF-8 through WF-11) |
| n8n | Workflow automation | Webhooks connecting to Edge Functions |
| ElevenLabs | Voice AI chat widget | Embedded script in index.html |
| Google Analytics | (via custom analytics) | Custom analytics_events table |

---

*End of context file. This document gives any AI model comprehensive understanding of the FitMatch.ca project architecture, database, routes, business logic, and technical decisions.*
