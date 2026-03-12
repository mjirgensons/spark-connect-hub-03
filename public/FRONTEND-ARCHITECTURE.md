# FitMatch — Frontend Architecture Reference

> **Generated:** 2026-03-12  
> **Purpose:** Internal onboarding document for developers and AI assistants.  
> **Stack:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui  

---

## Table of Contents

1. [Application Bootstrap](#1-application-bootstrap)
2. [Design System](#2-design-system)
3. [Routing Map](#3-routing-map)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Global Providers & Context](#5-global-providers--context)
6. [Shared Components](#6-shared-components)
7. [Hooks](#7-hooks)
8. [Utility Libraries](#8-utility-libraries)
9. [Landing Page (Public)](#9-landing-page-public)
10. [Product Detail Page](#10-product-detail-page)
11. [Product Catalog & Search](#11-product-catalog--search)
12. [Cart & Checkout Flow](#12-cart--checkout-flow)
13. [Account Pages](#13-account-pages)
14. [Client Dashboard](#14-client-dashboard)
15. [Contractor Dashboard](#15-contractor-dashboard)
16. [Seller Dashboard](#16-seller-dashboard)
17. [Builder Dashboard](#17-builder-dashboard)
18. [Admin Panel](#18-admin-panel)
19. [Static / Content Pages](#19-static--content-pages)
20. [Chat System](#20-chat-system)
21. [Analytics & Cookie Consent](#21-analytics--cookie-consent)
22. [Edge Function Mapping](#22-edge-function-mapping)
23. [Third-Party Integrations](#23-third-party-integrations)
24. [File & Image Handling](#24-file--image-handling)
25. [SEO Strategy](#25-seo-strategy)
26. [Key Architectural Decisions](#26-key-architectural-decisions)

---

## 1. Application Bootstrap

### Entry Point

```
src/main.tsx → renders <App /> into #root
src/App.tsx  → provider tree + router
```

### Provider Hierarchy (outermost → innermost)

```
AuthProvider
  QueryClientProvider (@tanstack/react-query)
    TooltipProvider
      CompareProvider
        CartProvider
          WishlistProvider
            BrowserRouter
              <Routes />
```

### Global Overlays (rendered outside Routes)

| Component | File | Purpose |
|-----------|------|---------|
| `ScrollToTop` | `src/components/ScrollToTop.tsx` | Resets scroll on route change |
| `AnalyticsTracker` | Inline in App.tsx | Calls `useAnalytics()` hook |
| `CookieConsent` | `src/components/CookieConsent.tsx` | GDPR/CASL cookie banner |
| `CompareBar` | `src/components/CompareBar.tsx` | Sticky product comparison tray |
| `GlobalChatWidget` | `src/components/chat/GlobalChatWidget.tsx` | Platform AI chatbot (hidden on admin/seller/product pages) |
| `Toaster` (shadcn) | Two instances: `@/components/ui/toaster` + `sonner` | Toast notifications |

### Production vs Preview Gate

```typescript
const PRODUCTION_DOMAINS = ["fitmatch.ca", "www.fitmatch.ca", "spark-connect-hub-03.lovable.app"];
const isProduction = PRODUCTION_DOMAINS.includes(window.location.hostname);
// ?preview=true bypasses the UnderConstruction gate
```

The root route `/` renders `<Index />` in preview mode and `<UnderConstruction />` in production.

### Lazy Loading Strategy

All pages except the landing page, Product, Cart, NotFound, FooterPage, UnderConstruction, ProductCatalog, and static info pages are lazy-loaded with `React.lazy()`. A shared `<PageLoader />` spinner is displayed via `<Suspense>`.

---

## 2. Design System

### Typography

| Token | Font | Usage |
|-------|------|-------|
| `font-sans` | Space Grotesk | Body text, UI elements, buttons |
| `font-serif` | Lora | Headings (h1–h6 via `@layer base`) |
| `font-mono` | Space Mono | Code blocks, technical values |

### Color Palette

Monochrome black/white theme using CSS custom properties:

| Token | Light | Dark |
|-------|-------|------|
| `--background` | `0 0% 100%` (white) | `0 0% 0%` (black) |
| `--foreground` | `0 0% 0%` (black) | `0 0% 100%` (white) |
| `--primary` | `0 0% 0%` | `0 0% 100%` |
| `--primary-foreground` | `0 0% 100%` | `0 0% 0%` |
| `--muted` | `0 0% 96%` | `0 0% 15%` |
| `--accent` | `0 0% 90%` | `0 0% 15%` |
| `--destructive` | `0 84% 60%` | `0 62% 30%` |

Custom tokens: `--gold`, `--gold-light`, `--charcoal`, `--cream`.

### Shadows (Hard Offset — Neo-Brutalist)

```css
--shadow-2xs: 1px 1px 0px 0px #000000;
--shadow-xs:  2px 2px 0px 0px #000000;
--shadow-sm:  3px 3px 0px 0px #000000;
--shadow:     5px 5px 0px 0px #000000;
--shadow-md:  8px 8px 0px 0px #000000;
--shadow-lg:  12px 12px 0px 0px #000000;
--shadow-xl:  16px 16px 0px 0px #000000;
--shadow-2xl: 24px 24px 0px 0px #000000;
```

In dark mode, shadow color inverts to `#ffffff`.

### Border Radius

`--radius: 0rem` — All corners are sharp. No rounding anywhere.

### Design Rules

- **Components:** shadcn/ui exclusively. No Material UI, Chakra, or other component libraries.
- **Colors:** Always use design tokens (`bg-primary`, `text-foreground`, etc.). Never hardcode hex/rgb values.
- **Borders:** 1–2px solid black, using `border-foreground`.
- **Shadows on cards/panels:** Applied via inline `style` or Tailwind shadow utilities mapped to CSS vars.
- **Shadows on buttons:** Removed globally — buttons have no hard-offset shadows.

### Button Variants

Defined in `src/components/ui/button.tsx`:

| Variant | Visual |
|---------|--------|
| `default` | Black bg, white text |
| `destructive` | Red bg |
| `outline` | Bordered, transparent bg |
| `secondary` | Light gray bg |
| `ghost` | No bg, hover accent |
| `link` | Underlined text |
| `hero` | Bold black, tracking-wide |
| `heroOutline` | Bordered, backdrop-blur |
| `gold` | Gradient gold → black |

Sizes: `default` (h-10), `sm` (h-9), `lg` (h-11), `xl` (h-14), `icon` (h-10 w-10).

---

## 3. Routing Map

### Public Routes (No Auth Required)

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/` | `Index` (or `UnderConstruction`) | Landing page |
| `/browse` | `ProductCatalog` | Filterable product catalog |
| `/product/:id` | `Product` | Product detail page |
| `/search` | `SearchResults` | Text/dimension search results |
| `/cart` | `Cart` | Shopping cart |
| `/checkout` | `Checkout` (lazy) | Multi-step checkout |
| `/order-confirmation/:orderId` | `OrderConfirmation` (lazy) | Post-purchase confirmation |
| `/quote-request` | `QuoteRequest` (lazy) | Custom quote form |
| `/quote-success` | `QuoteSuccess` | Quote submission confirmation |
| `/compare` | `ComparePage` (lazy) | Side-by-side product comparison |
| `/how-it-works` | `HowItWorksPage` | Info page |
| `/for-contractors` | `ForContractorsPage` | Contractor landing |
| `/for-sellers` | `ForSellersPage` | Seller landing |
| `/about` | `AboutPage` | About page |
| `/faq` | `FAQPage` (lazy) | FAQ (data from `faq_items` table) |
| `/blog` | `BlogPage` (lazy) | Blog listing |
| `/blog/:slug` | `BlogPostPage` (lazy) | Individual blog post |
| `/page/:slug` | `FooterPage` | Dynamic CMS pages (legal, etc.) |
| `/coming-soon` | `UnderConstruction` | Placeholder |
| `/login` | `Login` | Email/password login |
| `/register` | `Register` | Multi-role registration with OTP |
| `*` | `NotFound` | 404 page |

### Auth Routes

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/login` | `Login` | Supabase email/password sign-in |
| `/register` | `Register` | Role-based registration (client, contractor, seller, builder) with email OTP verification |
| `/admin/login` | `AdminLogin` (lazy) | Google OAuth admin login |

### Client Routes (`/client/*`)

**Guard:** `RoleGuard` with `allowedRoles={['client']}` → `DashboardLayout role="client"`

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/client/dashboard` | `ClientDashboard` | KPI cards + quick dimension matcher |
| `/client/matches` | `ClientMatches` | Dimension match results |
| `/client/match/new` | `ClientNewMatch` | New dimension match form |
| `/client/projects` | `ClientProjects` | Project list |
| `/client/projects/:projectId` | `ClientProjectDetail` | Single project view |
| `/client/messages` | `Messages` | Messaging (shared component) |
| `/client/messages/:conversationId` | `Messages` | Specific conversation |
| `/client/profile` | `ClientProfile` | Profile editor |

### Contractor Routes (`/contractor/*`)

**Guard:** `RoleGuard` with `allowedRoles={['contractor']}` → `DashboardLayout role="contractor"`

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/contractor/dashboard` | `ContractorDashboard` | KPI cards (static placeholders) |
| `/contractor/jobs` | `ContractorJobs` | Job listings |
| `/contractor/jobs/:jobId` | `ContractorJobDetail` | Job detail |
| `/contractor/projects` | `ContractorProjects` | Active projects |
| `/contractor/projects/:projectId` | `ContractorProjectDetail` | Project detail |
| `/contractor/messages` | `ContractorMessages` | Messages |
| `/contractor/profile` | `ContractorProfile` | Profile editor |

### Seller Routes (`/seller/*`)

**Guard:** `SellerGuard` → `DashboardLayout role="seller"`  
SellerGuard additionally checks `seller_status === 'approved'` and supports admin impersonation via `?adminView=sellerId`.

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/seller/pending` | `SellerPending` | Waiting-for-approval page (no guard) |
| `/seller/dashboard` | `SellerDashboard` | KPIs, Stripe onboarding, health card, AI chatbot card |
| `/seller/products` | `SellerProducts` | Product table with bulk actions, soft-delete, AI descriptions |
| `/seller/products/new` | `SellerNewProduct` | Product creation form |
| `/seller/products/:productId` | `SellerEditProduct` | Product editor |
| `/seller/products/:id/variants` | `SellerProductVariants` | Variant management |
| `/seller/documents` | `SellerDocuments` | Document uploads |
| `/seller/quotes` | `SellerQuotes` | Incoming quote requests |
| `/seller/quotes/:quoteId` | `SellerQuoteDetail` | Quote detail |
| `/seller/orders` | `SellerOrders` | Order management |
| `/seller/analytics` | `SellerAnalytics` | Analytics dashboard |
| `/seller/payouts` | `SellerPayouts` | Stripe Connect payouts |
| `/seller/questions` | `SellerQuestions` | Product Q&A responses |
| `/seller/messages` | `SellerMessages` | Buyer conversations |
| `/seller/messages/:conversationId` | `SellerMessages` | Specific conversation |
| `/seller/knowledge-base` | `SellerKnowledgeBase` | AI chatbot training docs |
| `/seller/store-profile` | `SellerStoreProfile` | Public store profile editor |

### Builder Routes (`/builder/*`)

**Guard:** `RoleGuard` with `allowedRoles={['builder']}` → `DashboardLayout role="builder"`

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/builder/dashboard` | `BuilderDashboard` | KPIs + volume match form |
| `/builder/projects` | `BuilderProjects` | Project list |
| `/builder/projects/new` | `BuilderNewProject` | New project wizard |
| `/builder/matches` | `BuilderMatches` | Dimension matching |
| `/builder/messages` | `BuilderMessages` | Messages |
| `/builder/profile` | `BuilderProfile` | Profile editor |

### Account Routes (`/account/*`)

**Guard:** Auth check in `AccountLayout` (redirects to `/login` if not authenticated).  
**Layout:** `AccountLayout` — sidebar with avatar, nav links, sign-out.

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/account` | `AccountOverview` | Account summary |
| `/account/orders` | `AccountOrders` | Order history |
| `/account/wishlist` | `AccountWishlist` | Saved products |
| `/account/addresses` | `AccountAddresses` | Address CRUD |
| `/account/settings` | `AccountSettings` | Password change, preferences |

### Admin Routes

| Route | Page Component | Guard |
|-------|---------------|-------|
| `/admin/login` | `AdminLogin` | None (public) |
| `/admin` | `Admin` | Email whitelist (`admin_emails` table) |
| `/admin/webhooks/:provider/:endpointKey` | `WebhookDetail` | Same as Admin |

---

## 4. Authentication & Authorization

### Auth Flow

```
AuthContext (src/contexts/AuthContext.tsx)
  └── Wraps entire app
  └── Provides: user, session, loading, signOut
  └── Uses supabase.auth.onAuthStateChange() + getSession()

useAuth() hook (src/hooks/useAuth.tsx)
  └── Re-exports useAuthContext()

useProfile() hook (src/hooks/useProfile.tsx)
  └── Fetches profiles table row for current user
  └── Returns: profile, loading
  └── 5-minute stale time
```

### User Types

Stored in `profiles.user_type`: `'client' | 'contractor' | 'seller' | 'builder'`

### Route Guards

| Guard | File | Logic |
|-------|------|-------|
| `RoleGuard` | `src/components/RoleGuard.tsx` | Checks `session` exists + `profile.user_type` in `allowedRoles`. Redirects unauthenticated to `/login`, wrong-role to `/{role}/dashboard`. |
| `SellerGuard` | `src/components/SellerGuard.tsx` | Extends RoleGuard: additionally checks `seller_status === 'approved'`. Supports admin bypass via `?adminView=sellerId` (checks `admin_emails` table). Redirects unapproved sellers to `/seller/pending`. |
| `AccountLayout` | `src/pages/account/AccountLayout.tsx` | Simple auth check — redirects to `/login` if no user. |
| `Admin` | `src/pages/Admin.tsx` | Checks user email against `admin_emails` table. Shows "Access Denied" if not admin. |

### Registration Flow

`src/pages/Register.tsx` (548 lines):
1. User selects role (Client, Contractor, Seller, Builder)
2. Fills email, password, name, phone
3. Seller/Contractor get extra fields (company, trade types, service areas, etc.)
4. Email OTP verification via `send-verification-otp` edge function
5. On OTP success → `supabase.auth.signUp()` with `user_metadata: { user_type, full_name }`
6. DB trigger `handle_new_user` auto-creates `profiles` row
7. Sellers get `seller_status = 'pending'` → redirected to `/seller/pending`
8. Seller registration triggers `notify-seller-registration` edge function

### Admin Auth

Separate flow via `AdminLogin.tsx` using `@lovable.dev/cloud-auth-js` (Google OAuth). Access is validated against `admin_emails` table.

---

## 5. Global Providers & Context

### CartContext (`src/contexts/CartContext.tsx`)

| Feature | Detail |
|---------|--------|
| State management | `useReducer` with actions: ADD_ITEM, REMOVE_ITEM, UPDATE_QUANTITY, CLEAR_CART, HYDRATE |
| Persistence | `localStorage` key `fm_cart` |
| Item types | `main`, `addon`, `delivery` |
| Add logic | Adding a main product removes old main + its add-ons, then inserts fresh. Add-ons are appended if not duplicate. |
| Exports | `useCart()` → `{ items, itemCount, subtotal, dispatch, getItemQuantity }` |
| Delivery fields | Each CartItem carries `deliveryChoice`, `deliveryPrice`, `deliveryPrepDays`, `pickupAddress`, etc. |

### CheckoutContext (`src/contexts/CheckoutContext.tsx`)

Lightweight multi-step checkout state: `step` (number) and `info` (shipping details). No persistence.

### CompareContext (`src/contexts/CompareContext.tsx`)

- Max 4 products
- `sessionStorage` key `fitmatch_compare`
- Exports: `addToCompare`, `removeFromCompare`, `isInCompare`, `clearCompare`, `compareCount`

### WishlistContext (`src/contexts/WishlistContext.tsx`)

| State | Guest | Authenticated |
|-------|-------|---------------|
| Storage | `localStorage` key `fitmatch_wishlist` | `wishlists` table in DB |
| Login merge | — | Local items merged to DB on login, localStorage cleared |
| Toggle | Optimistic UI update | Optimistic + DB insert/delete |

---

## 6. Shared Components

### Layout Components

| Component | File | Used By |
|-----------|------|---------|
| `DashboardLayout` | `src/components/DashboardLayout.tsx` | All role dashboards (client, contractor, seller, builder) |
| `AccountLayout` | `src/pages/account/AccountLayout.tsx` | Account pages |
| `Header` | `src/components/landing/Header.tsx` | Public pages |
| `Footer` | `src/components/landing/Footer.tsx` | Public pages |

### DashboardLayout Features

- Role-parameterized sidebar navigation (`navConfig` record per role)
- Mobile hamburger overlay
- Admin impersonation banner (`?adminView=sellerId`)
- Seller unread message badge (polled every 30s)
- `<Outlet context={{ adminViewSellerId }}>` passes admin context to child routes
- Seller AI chat widget rendered when `role === "seller"`

### Reusable UI Components

| Component | File | Purpose |
|-----------|------|---------|
| `Breadcrumbs` | `src/components/Breadcrumbs.tsx` | Breadcrumb nav with JSON-LD structured data |
| `SearchBar` | `src/components/SearchBar.tsx` | Modal search with text + dimension modes, autocomplete |
| `AuthGateModal` | `src/components/AuthGateModal.tsx` | "Sign in to continue" dialog for guest actions |
| `CompareButton` | `src/components/CompareButton.tsx` | Add-to-compare toggle |
| `CompareBar` | `src/components/CompareBar.tsx` | Sticky bottom bar showing compared products |
| `WishlistButton` | `src/components/WishlistButton.tsx` | Heart icon toggle |
| `ContactSellerButton` | `src/components/ContactSellerButton.tsx` | Opens buyer → seller conversation |
| `DimensionMatcher` | `src/components/DimensionMatcher.tsx` | Dimension input form for matching |
| `NewsletterSignup` | `src/components/NewsletterSignup.tsx` | Email signup with CASL consent |
| `TrustBadgeBar` | `src/components/TrustBadgeBar.tsx` | Trust/security badges strip |
| `ReportIssueDialog` | `src/components/ReportIssueDialog.tsx` | Bug/issue report form |
| `ProductQA` | `src/components/ProductQA.tsx` | Product Q&A section |
| `ProductReviews` | `src/components/ProductReviews.tsx` | Product reviews display |
| `ProductGallery` | `src/components/ProductGallery.tsx` | Image gallery with thumbnails |

### Seller-Specific Components

| Component | File | Purpose |
|-----------|------|---------|
| `SellerProductForm` | `src/components/seller/SellerProductForm.tsx` | Full product creation/edit form |
| `SellerHealthCard` | `src/components/seller/SellerHealthCard.tsx` | Seller health score widget |
| `SellerAIChatbotCard` | `src/components/seller/SellerAIChatbotCard.tsx` | AI chatbot status card |
| `SellerAIConsentModal` | `src/components/seller/SellerAIConsentModal.tsx` | Consent for AI features |
| `HardwareSection` | `src/components/seller/HardwareSection.tsx` | Hardware details in product form |
| `AdditionalFeaturesSection` | `src/components/seller/AdditionalFeaturesSection.tsx` | Extra product features |
| `ConversationList` | `src/components/seller/messages/ConversationList.tsx` | Seller message inbox |
| `ConversationThread` | `src/components/seller/messages/ConversationThread.tsx` | Message thread view |
| `ReplyComposer` | `src/components/seller/messages/ReplyComposer.tsx` | Message reply input |

---

## 7. Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useAuth` | `src/hooks/useAuth.tsx` | Re-exports `useAuthContext()` — user, session, loading, signOut |
| `useProfile` | `src/hooks/useProfile.tsx` | Fetches `profiles` row for current user via react-query (5min stale) |
| `useProductData` | `src/hooks/useProductData.ts` | Fetches product + options + appliances + related products. Sets document title/meta. |
| `useProductCart` | `src/hooks/useProductCart.ts` | Cart add logic with add-on management, delivery choice, grand total calc |
| `usePageMeta` | `src/hooks/usePageMeta.ts` | Sets document title, meta description, OG tags, canonical. Cleans up on unmount. |
| `useAnalytics` | `src/hooks/useAnalytics.ts` | Tracks page views on route changes (skips `/admin`). Initializes session. |
| `use-mobile` | `src/hooks/use-mobile.tsx` | `useIsMobile()` — responsive breakpoint detection |
| `use-toast` | `src/hooks/use-toast.ts` | shadcn toast hook |

---

## 8. Utility Libraries

| Module | File | Purpose |
|--------|------|---------|
| `utils` | `src/lib/utils.ts` | `cn()` — clsx + tailwind-merge |
| `productHelpers` | `src/lib/productHelpers.ts` | `fmtDim()` mm↔inch, `fmt2()` number format, `getOptPrice()`, `isDeliveryOption()` |
| `analytics` | `src/lib/analytics.ts` | Session tracking, page views, UTM parsing. Respects cookie consent. Writes to `analytics_events` + `analytics_sessions` tables. |
| `optimizeImage` | `src/lib/optimizeImage.ts` | Client-side image resize + WebP conversion via Canvas API (max 1200px, 0.82 quality) |
| `webhookDispatcher` | `src/lib/webhookDispatcher.ts` | Dispatches outbound webhooks to n8n. Reads URL from `integrations` table. Logs to `webhook_logs`. Non-blocking. |

---

## 9. Landing Page (Public)

**Route:** `/`  
**Page:** `src/pages/Index.tsx`  
**Components:** All in `src/components/landing/`

| Section | Component | Description |
|---------|-----------|-------------|
| Navigation | `Header.tsx` | Sticky nav with links, search, cart, wishlist, auth dropdown |
| Hero | `Hero.tsx` | Full-width hero with CTAs |
| Product Showcase | `ProductShowcase.tsx` | Featured cabinet grid (anchor: `#cabinets`) |
| Other Products | `OtherProducts.tsx` | Non-cabinet products (anchor: `#other-products`) |
| How It Works | `HowItWorks.tsx` | Step-by-step process |
| Benefits | `Benefits.tsx` | Value propositions (anchor: `#benefits`) |
| For Contractors | `ForContractors.tsx` | Contractor-focused section |
| Trust Signals | `TrustSignals.tsx` | Social proof |
| CTA | `CTA.tsx` | Final call-to-action (anchor: `#contact`) |
| Footer | `Footer.tsx` | Links, newsletter signup |

### Header Navigation

```typescript
const navLinks = [
  { label: "Browse", type: "route", to: "/browse" },
  { label: "Cabinets", type: "anchor", href: "#cabinets" },
  { label: "More Products", type: "anchor", href: "#other-products" },
  { label: "How It Works", type: "route", to: "/how-it-works" },
  { label: "Blog", type: "route", to: "/blog" },
  { label: "Benefits", type: "anchor", href: "#benefits" },
  { label: "For Contractors", type: "route", to: "/for-contractors" },
  { label: "For Sellers", type: "route", to: "/for-sellers" },
  { label: "Contact", type: "anchor", href: "#contact" },
];
```

Anchor links smooth-scroll on homepage; cross-page navigation returns to homepage with anchor.

### Header Auth States

| State | Renders |
|-------|---------|
| Guest | "Sign In" button + "Get Started" button |
| Authenticated | User icon dropdown → Dashboard (role-based), Orders, Sign Out |

---

## 10. Product Detail Page

**Route:** `/product/:id`  
**Page:** `src/pages/Product.tsx`  
**Data Hook:** `useProductData(id)`

### Sub-Components

| Component | File | Purpose |
|-----------|------|---------|
| `ProductHero` | `src/components/product/ProductHero.tsx` | Title, badges, price |
| `ProductGallery` | `src/components/ProductGallery.tsx` | Image gallery |
| `ProductSpecs` | `src/components/product/ProductSpecs.tsx` | Dimensions, materials, specs table |
| `ProductAddOns` | `src/components/product/ProductAddOns.tsx` | Optional add-ons with checkboxes |
| `ProductDelivery` | `src/components/product/ProductDelivery.tsx` | Delivery/pickup options |
| `ProductStickySidebar` | `src/components/product/ProductStickySidebar.tsx` | Sticky price + add-to-cart |
| `ProductQA` | `src/components/ProductQA.tsx` | Questions & answers |
| `ProductReviews` | `src/components/ProductReviews.tsx` | Reviews |

### Data Queries (via `useProductData`)

1. Product row from `products` table (with category join)
2. `product_options` ordered by `sort_order`
3. `product_compatible_appliances` ordered by `sort_order`
4. Related products (same category, max 6)

### Cart Integration (via `useProductCart`)

- Manages checked add-ons state
- Delivery choice (delivery vs pickup)
- Calculates grand total (product + add-ons)
- Dispatches `ADD_ITEM` for main product + each selected add-on

---

## 11. Product Catalog & Search

### Product Catalog

**Route:** `/browse`  
**Page:** `src/pages/ProductCatalog.tsx` (heavily featured, ~300+ lines)

Features:
- Category filter (from `categories` table)
- Price range filter
- Style/color/material filters
- Sort by: featured, price asc/desc, newest, discount
- Pagination
- Mobile filter sheet
- Grid/list view toggle

### Search

**Component:** `src/components/SearchBar.tsx`

Two modes:
1. **Text search** — debounced autocomplete against product names, navigates to `/search?q=...`
2. **Dimension search** — width × depth × height with tolerance in inches, navigates to `/search?mode=dimension&w=...&h=...&d=...&tol=...`

**Results Page:** `src/pages/SearchResults.tsx`

---

## 12. Cart & Checkout Flow

### Cart (`/cart`)

**Page:** `src/pages/Cart.tsx`

- Line items with quantity controls
- Main products show their add-ons grouped below
- Per-product delivery info display
- Subtotal, delivery fees, tax calculation
- Trust badges
- "Proceed to Checkout" CTA

### Checkout (`/checkout`)

**Page:** `src/pages/Checkout.tsx`  
**Context:** `CheckoutProvider` wraps checkout page internally

Two steps:
1. **Information** (`StepInformation.tsx`) — Shipping form with address autocomplete, saved address loading
2. **Review** (`StepReview.tsx`) — Order summary, Stripe checkout session creation

### Order Flow

1. `StepReview` calls `create-checkout-session` edge function → Stripe hosted checkout
2. Stripe webhook (`stripe-webhook`) processes payment → calls `create-order` edge function
3. Order created in `orders` + `order_items` tables
4. User redirected to `/order-confirmation/:orderId`

### Order Confirmation (`/order-confirmation/:orderId`)

**Page:** `src/pages/OrderConfirmation.tsx`

Fetches order via `get-order-confirmation` edge function. Displays order number, items, shipping, status.

---

## 13. Account Pages

**Layout:** `AccountLayout` (sidebar + content area, max-width 4xl)

| Page | Component | Features |
|------|-----------|----------|
| Overview | `AccountOverview` | Profile summary, quick links |
| Orders | `AccountOrders` | Order history with status badges |
| Wishlist | `AccountWishlist` | Saved products grid |
| Addresses | `AccountAddresses` | CRUD address management |
| Settings | `AccountSettings` | Password change, notification preferences |

---

## 14. Client Dashboard

**Layout:** `DashboardLayout role="client"` with sidebar nav

| Page | Key Features |
|------|-------------|
| `ClientDashboard` | KPI cards (saved products, projects, savings) + quick dimension matcher form |
| `ClientMatches` | Dimension match results from products table |
| `ClientNewMatch` | Full dimension match form |
| `ClientProjects` | Project list (links clients → products → contractors) |
| `ClientProjectDetail` | Single project view |
| `ClientMessages` | Uses shared `Messages` component |
| `ClientProfile` | Profile edit form |

---

## 15. Contractor Dashboard

**Layout:** `DashboardLayout role="contractor"` with sidebar nav

| Page | Key Features |
|------|-------------|
| `ContractorDashboard` | Static KPI placeholders (Available Jobs, Active Projects, Completed, Rating) |
| `ContractorJobs` | Job listings |
| `ContractorJobDetail` | Single job view |
| `ContractorProjects` | Active project list |
| `ContractorProjectDetail` | Single project view |
| `ContractorMessages` | Messaging |
| `ContractorProfile` | Profile + trade types, service areas |

**Note:** Contractor dashboard is largely placeholder — no `contractor_status` column or approval flow exists yet.

---

## 16. Seller Dashboard

**Layout:** `DashboardLayout role="seller"` with 11 nav items  
**Guard:** `SellerGuard` (checks `seller_status === 'approved'`)

### Dashboard (`SellerDashboard`)

~450 lines. Features:
- **Stripe Connect** onboarding status + link
- **KPI cards:** Total products, active listings, total orders, revenue, pending orders, avg response time
- **Top products** table with category, price, stock, availability
- **Quick actions:** Add product, view orders, view quotes
- **SellerHealthCard:** Seller health score
- **SellerAIChatbotCard:** AI chatbot activation status

### Products (`SellerProducts`)

~820 lines. Features:
- Product table with sorting (name, price, status, stock)
- Bulk actions (delete, status change)
- Search and filter by listing status
- AI description generation
- Soft delete (sets `deleted_at`)
- Image optimization status display
- Inline quick-edit for price
- Duplicate product action

### Other Seller Pages

| Page | Features |
|------|----------|
| `SellerNewProduct` | Full product form via `SellerProductForm` |
| `SellerEditProduct` | Edit mode of same form |
| `SellerProductVariants` | Variant management (color, finish, material) |
| `SellerDocuments` | Document upload to Supabase Storage |
| `SellerQuotes` | Quote request list + respond |
| `SellerQuoteDetail` | Single quote with response form |
| `SellerOrders` | Order management with status transitions |
| `SellerAnalytics` | Sales analytics (recharts) |
| `SellerPayouts` | Stripe Connect payout history |
| `SellerQuestions` | Product Q&A responses |
| `SellerMessages` | Conversation list + thread (uses seller message components) |
| `SellerKnowledgeBase` | AI chatbot training documents |
| `SellerStoreProfile` | Public-facing store profile editor |

---

## 17. Builder Dashboard

**Layout:** `DashboardLayout role="builder"` with sidebar nav

| Page | Key Features |
|------|-------------|
| `BuilderDashboard` | KPIs (projects, units matched, volume tier) + dimension match with quantity |
| `BuilderProjects` | Project list |
| `BuilderNewProject` | New project form |
| `BuilderMatches` | Dimension matching results |
| `BuilderMessages` | Messaging |
| `BuilderProfile` | Profile editor |

**Note:** Builder dashboard is partially scaffolded — similar to contractor, some features are placeholder.

---

## 18. Admin Panel

**Route:** `/admin` (single page with tab-based navigation)  
**Guard:** Email checked against `admin_emails` table  
**State:** Active tab stored in URL `?tab=` parameter  

### Layout

```
┌─────────────────────────────────────────┐
│ Header: "FitMatch Admin" + email + sign out │
├──────────┬──────────────────────────────┤
│ Sidebar  │  Main Content Area           │
│ (240px)  │  (max-width varies by tab)   │
│          │                              │
│ Sections │  Title + Tab Component       │
│ grouped  │                              │
│ by:      │                              │
│ - Content│                              │
│ - System │                              │
└──────────┴──────────────────────────────┘
```

Width constraints:
- **Wide tabs** (1200px): dashboard, orders, quotes, customers, sellers, seller-health, product-review, email, email-test-console, webhooks, cookie-manager
- **Narrow tabs** (700px): all other form-based tabs
- **No wrap**: test-chat, ai-chatbot

### Admin Tabs

#### Content & Operations Group

| Tab ID | Component | Description |
|--------|-----------|-------------|
| `dashboard` | `AdminDashboardTab` | KPI overview, recent orders, quick actions |
| `orders` | `AdminOrdersTab` | Order management with sortable table, status filters |
| `quotes` | `AdminQuotesTab` | Quote request management |
| `sellers` | `AdminSellersTab` | Seller approval, restriction, impersonation links |
| `seller-health` | `AdminSellerHealthTab` | Seller health scores across platform |
| `product-review` | `AdminProductReviewTab` | Product moderation queue with pending count badge |
| `qa-overview` | `AdminQATab` | Platform-wide Q&A moderation |
| `customers` | `AdminCustomersTab` | Customer list with sortable columns |
| `reviews` | `AdminReviewsTab` | Review moderation |
| `email` | `AdminEmailTemplatesTab` | 34+ email templates (6 sub-tabs: Templates, Communication Log, Consent, Settings, WF-8, WF-9) |
| `email-test-console` | `EmailTestConsoleTab` | Send test emails |
| `content` | Composite | FooterPagesAdmin + LegalPagesAdmin + AdminAIDescriptionsTab + AnalyticsDashboard |
| `trust-signals` | `AdminTrustSignalsTab` | Trust badge management |
| `faq` | `AdminFAQTab` | FAQ CRUD |
| `blog` | `AdminBlogTab` | Blog post CRUD with rich editor |
| `newsletter` | `AdminNewsletterTab` | Newsletter subscriber management |
| `cookie-manager` | Composite | BannerSettingsAdmin + CookieCategoriesAdmin + CookieRegistryAdmin + ConsentLogsAdmin |

#### System & Developer Group

| Tab ID | Component | Description |
|--------|-----------|-------------|
| `integrations` | `AdminIntegrationsTab` | External service configurations (n8n, Stripe, Mailgun, etc.) |
| `ai-chatbot` | `AdminChatbotControlPanel` | Chatbot settings, mode toggles |
| `platform-kb` | `AdminPlatformKBTab` | Platform knowledge base for AI |
| `webhooks` | `AdminWebhooksTab` | Webhook endpoint management + logs |
| `test-chat` | `AdminTestChatTab` | Live chatbot test console |
| `settings` | Composite | Database Inspector (collapsible) + SiteSettingsAdmin |

### Admin Sidebar (`AdminSidebar.tsx`)

- Collapsible (desktop) / hamburger overlay (mobile)
- Pending product review badge count (polled every 30s)
- Two groups: "Content & Operations" and "System & Developer"

---

## 19. Static / Content Pages

| Route | Page | Data Source |
|-------|------|------------|
| `/how-it-works` | `HowItWorksPage` | Hardcoded content |
| `/for-contractors` | `ForContractorsPage` | Hardcoded content |
| `/for-sellers` | `ForSellersPage` | Hardcoded content |
| `/about` | `AboutPage` | Hardcoded content |
| `/faq` | `FAQPage` | `faq_items` table |
| `/blog` | `BlogPage` | `blog_posts` table |
| `/blog/:slug` | `BlogPostPage` | `blog_posts` table by slug |
| `/page/:slug` | `FooterPage` | `footer_pages` table by slug |
| `/coming-soon` | `UnderConstruction` | Hardcoded |
| `*` | `NotFound` | Hardcoded 404 |

---

## 20. Chat System

### Architecture

Three chat contexts:

| Context | Widget | Where | Mode |
|---------|--------|-------|------|
| Platform-wide | `GlobalChatWidget` → `ChatWidget` | All public pages (except admin/seller/product) | `platform` |
| Product-specific | `ChatWidget` (in Product.tsx) | `/product/:id` | `seller` (if seller has AI enabled) |
| Seller dashboard | `SellerDashboardChatWidget` | `/seller/*` | `seller-dashboard` |

### Chat Components

| Component | File | Purpose |
|-----------|------|---------|
| `GlobalChatWidget` | `src/components/chat/GlobalChatWidget.tsx` | Visibility logic, consent check |
| `ChatWidget` | `src/components/chat/ChatWidget.tsx` | Main chat UI (bubble + panel) |
| `ChatConsentModal` | `src/components/chat/ChatConsentModal.tsx` | CASL consent before chat |
| `ChatRegistrationGate` | `src/components/chat/ChatRegistrationGate.tsx` | Prompt guest to register |
| `SellerDashboardChatWidget` | `src/components/chat/SellerDashboardChatWidget.tsx` | Seller-side AI assistant |
| `VoiceLangSelector` | `src/components/chat/VoiceLangSelector.tsx` | Language selection for voice |

### Chat Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useChatSession` | `src/components/chat/useChatSession.ts` | Session management, message sending, history |
| `useVoiceInput` | `src/components/chat/useVoiceInput.ts` | Web Speech API integration |

### Chat Data Flow

1. User message → `chatbot-proxy` edge function → AI model
2. Messages logged via `log-chat-message` edge function to `chat_messages` table
3. Sessions tracked in `chat_sessions` table
4. Escalations create conversations via `create-escalation-conversation` edge function

### ElevenLabs Widget

Embedded directly in `index.html` as a script — provides voice-based conversational AI.

---

## 21. Analytics & Cookie Consent

### Analytics (`src/lib/analytics.ts`)

- Checks cookie consent before tracking (`fm_cookie_consent` localStorage)
- Session ID via `sessionStorage` key `fm_session_id`
- Tracks: page views, UTM params, referrer, screen dimensions, user agent
- Writes to: `analytics_events` and `analytics_sessions` tables
- Skip condition: `/admin` routes are never tracked

### Cookie Consent (`src/components/CookieConsent.tsx`)

- Fetches categories from `cookie_categories` table
- Fetches cookie definitions from `cookie_definitions` table
- Granular category toggles (required cookies can't be disabled)
- Consent logged to `consent_logs` table
- Preferences stored in `localStorage` key `fm_cookie_consent`
- Banner settings from `site_settings` table

---

## 22. Edge Function Mapping

### Called from Frontend

| Edge Function | Called From | Trigger |
|---------------|------------|---------|
| `send-verification-otp` | `Register.tsx` | Email OTP during registration |
| `verify-otp-code` | `Register.tsx` | OTP code verification |
| `create-checkout-session` | `StepReview.tsx` | Stripe checkout initiation |
| `create-connect-account` | `SellerDashboard.tsx` | Stripe Connect onboarding |
| `get-connect-status` | `SellerDashboard.tsx` | Stripe Connect status check |
| `get-order-confirmation` | `OrderConfirmation.tsx` | Order details fetch |
| `chatbot-proxy` | `ChatWidget.tsx` | AI chat message proxy |
| `log-chat-message` | `useChatSession.ts` | Chat message logging |
| `check-consent` | `ChatWidget.tsx` | Check user chat consent |
| `create-escalation-conversation` | `ChatWidget.tsx` | Escalate chat to human |
| `notify-conversation-reply` | `ReplyComposer.tsx` | Email notification on reply |
| `submit-cabinet-match` | `DimensionMatcher.tsx` | Dimension match request |
| `notify-seller-registration` | `Register.tsx` | Seller registration notification |
| `update-order-status` | `SellerOrders.tsx` | Order status change |
| `admin-update-seller-restriction` | `AdminSellersTab.tsx` | Toggle seller restriction |
| `notify-seller-approval` | `AdminSellersTab.tsx` | Email on seller approval |
| `save-marketing-consent` | `NewsletterSignup.tsx` | CASL marketing consent |
| `log-email-consent` | `Register.tsx` | Email consent audit log |

### Called from n8n (External Workflows)

| Edge Function | Purpose |
|---------------|---------|
| `get-unsynced-orders` | Fetch orders not synced to Pinecone |
| `get-unsynced-comms` | Fetch unsynced communication logs |
| `get-unsynced-content` | Fetch unsynced KB content |
| `mark-kb-synced` | Mark content as synced |
| `log-communication` | Log email send events |
| `update-communication-status` | Update email delivery status |
| `get-deadline-orders` | Fetch orders approaching deadlines |
| `get-order-notification-data` | Order data for notification templates |
| `get-order-sellers` | Get sellers for a given order |
| `process-seller-transfers` | Stripe Connect transfer processing |
| `simulate-inbound-email` | Test inbound email handling |
| `n8n-proxy` | Generic n8n → Supabase proxy |

### Called from Stripe (Webhook)

| Edge Function | Trigger |
|---------------|---------|
| `stripe-webhook` | Stripe payment events |
| `create-order` | Called by stripe-webhook on successful payment |

### Test/Dev Only

| Edge Function | Purpose |
|---------------|---------|
| `stripe-webhook-test` | Test Stripe webhook locally |
| `test-integration` | Integration health check |
| `create-wf10-test-user` | Test user creation |
| `seed-wf10-test-data` | Seed test data |

---

## 23. Third-Party Integrations

| Service | Purpose | Integration Point |
|---------|---------|------------------|
| **Stripe** | Payments, Connect (seller payouts) | Edge functions: `create-checkout-session`, `stripe-webhook`, `create-connect-account`, `get-connect-status`, `process-seller-transfers` |
| **ElevenLabs** | Voice AI conversational widget | `index.html` script tag |
| **n8n** | Workflow automation (emails, syncs, notifications) | `webhookDispatcher.ts` + multiple edge functions |
| **Mailgun** | Email delivery | Via n8n workflows, tracked in `communication_logs` |
| **Pinecone** | Vector search for AI chatbot | Via n8n sync workflows |
| **Google OAuth** | Admin authentication | `@lovable.dev/cloud-auth-js` in `AdminLogin.tsx` |

---

## 24. File & Image Handling

### Image Optimization

`src/lib/optimizeImage.ts`:
- Client-side resize to max 1200×1200px
- Converts to WebP at 0.82 quality
- Used before upload in seller product forms

### Image Upload Component

`src/components/admin/ImageUpload.tsx`:
- Drag-and-drop + click upload
- Uploads to Supabase Storage
- Returns public URL

### File Upload Component

`src/components/admin/FileUpload.tsx`:
- Generic file upload to Supabase Storage
- Used in seller document management

### Static Assets

Located in `src/assets/`:
- Cabinet product images (cabinet-*.jpg)
- Hero image (hero-kitchen.jpg)
- Product category images (product-*.jpg)

---

## 25. SEO Strategy

### Page-Level SEO

Via `usePageMeta()` hook:
- Sets `<title>` with `— FitMatch` suffix
- Sets `<meta name="description">`
- Sets OG tags (title, description, image, type, url)
- Sets `<link rel="canonical">`
- Cleans up on unmount

### Defaults

```
Title: "FitMatch — Premium European Cabinetry at 50-80% Off | GTA"
Description: "Shop premium European kitchen and bathroom cabinets at 50-80% off retail. 
              Free quotes, local delivery in the Greater Toronto Area."
```

### Structured Data

- `Breadcrumbs` component outputs JSON-LD `BreadcrumbList`
- Product pages set meta description from product data

### Technical SEO

- `public/robots.txt` — allow all
- `public/sitemap.xml` — static sitemap
- `public/og-image.jpg` — default OG image
- Semantic HTML throughout
- Lazy loading on images

---

## 26. Key Architectural Decisions

### State Management

- **React Context** for global state (Auth, Cart, Wishlist, Compare, Checkout)
- **@tanstack/react-query** for all server state (products, orders, profiles, etc.)
- **No Redux** — hooks + context only

### Data Fetching

- All DB operations via `supabase` client from `@/integrations/supabase/client`
- react-query for caching, refetch, and loading states
- Edge functions called via `supabase.functions.invoke()` or direct `fetch()`

### Routing

- React Router v6 with nested routes
- Layout routes for dashboards (`DashboardLayout` wraps child `<Outlet>`)
- Lazy loading for all dashboard and heavy pages

### Performance

- Code splitting via `React.lazy()` + `Suspense`
- Image optimization before upload (client-side WebP conversion)
- 30s polling intervals for real-time-ish data (seller unread count, pending product count)
- 5-minute stale time on profile queries

### Security

- RLS policies on all database tables
- Admin verified server-side via `admin_emails` table
- Seller status checked in guard component
- No client-side role storage — always fetched from DB
- OTP email verification on registration
- CASL compliance for marketing emails and cookies

---

## Appendix: File Index

### Pages (`src/pages/`)

```
Index.tsx                          Landing page
Product.tsx                        Product detail
ProductCatalog.tsx                 Browse/catalog
Cart.tsx                           Shopping cart
Checkout.tsx                       Multi-step checkout
OrderConfirmation.tsx              Post-purchase
QuoteRequest.tsx                   Custom quote form
QuoteSuccess.tsx                   Quote confirmation
ComparePage.tsx                    Side-by-side compare
SearchResults.tsx                  Search results
Login.tsx                          Sign in
Register.tsx                       Registration (548 lines)
Admin.tsx                          Admin panel (260 lines)
AdminLogin.tsx                     Admin Google OAuth
Messages.tsx                       Shared messaging
HowItWorksPage.tsx                 Info page
ForContractorsPage.tsx             Info page
ForSellersPage.tsx                 Info page
AboutPage.tsx                      Info page
FAQPage.tsx                        FAQ (DB-driven)
BlogPage.tsx                       Blog listing
BlogPostPage.tsx                   Blog post
FooterPage.tsx                     CMS pages
UnderConstruction.tsx              Placeholder
NotFound.tsx                       404

account/
  AccountLayout.tsx                Account sidebar layout
  AccountOverview.tsx              Account home
  AccountOrders.tsx                Order history
  AccountWishlist.tsx              Saved products
  AccountAddresses.tsx             Address CRUD
  AccountSettings.tsx              Settings

client/
  ClientDashboard.tsx              Client home
  ClientMatches.tsx                Match results
  ClientNewMatch.tsx               New match form
  ClientProjects.tsx               Project list
  ClientProjectDetail.tsx          Project detail
  ClientMessages.tsx               Messages
  ClientProfile.tsx                Profile

contractor/
  ContractorDashboard.tsx          Contractor home
  ContractorJobs.tsx               Job list
  ContractorJobDetail.tsx          Job detail
  ContractorProjects.tsx           Project list
  ContractorProjectDetail.tsx      Project detail
  ContractorMessages.tsx           Messages
  ContractorProfile.tsx            Profile

seller/
  SellerPending.tsx                Awaiting approval
  SellerDashboard.tsx              Seller home (452 lines)
  SellerProducts.tsx               Product management (819 lines)
  SellerNewProduct.tsx             New product form
  SellerEditProduct.tsx            Edit product
  SellerProductVariants.tsx        Variant management
  SellerDocuments.tsx              Document uploads
  SellerQuotes.tsx                 Quote list
  SellerQuoteDetail.tsx            Quote detail
  SellerOrders.tsx                 Order management
  SellerAnalytics.tsx              Analytics
  SellerPayouts.tsx                Stripe payouts
  SellerQuestions.tsx              Q&A responses
  SellerMessages.tsx               Messages
  SellerKnowledgeBase.tsx          AI KB management
  SellerStoreProfile.tsx           Store profile

builder/
  BuilderDashboard.tsx             Builder home
  BuilderProjects.tsx              Project list
  BuilderNewProject.tsx            New project
  BuilderMatches.tsx               Match results
  BuilderMessages.tsx              Messages
  BuilderProfile.tsx               Profile

admin/
  WebhookDetail.tsx                Webhook endpoint detail
```

### Admin Components (`src/components/admin/`)

```
AdminSidebar.tsx                   Tab navigation sidebar
AdminDashboardTab.tsx              Dashboard overview
AdminOrdersTab.tsx                 Order management
AdminQuotesTab.tsx                 Quote management
AdminSellersTab.tsx                Seller approval/management
AdminSellerHealthTab.tsx           Seller health scores
AdminProductReviewTab.tsx          Product moderation
AdminQATab.tsx                     Q&A overview
AdminCustomersTab.tsx              Customer management
AdminReviewsTab.tsx                Review moderation
AdminEmailTemplatesTab.tsx         Email template CRUD (6 sub-tabs)
EmailTestConsoleTab.tsx            Email testing
AdminIntegrationsTab.tsx           Integration settings
AdminWebhooksTab.tsx               Webhook management
AdminChatbotControlPanel.tsx       AI chatbot settings
AdminPlatformKBTab.tsx             Platform knowledge base
AdminTestChatTab.tsx               Live chat tester
AdminTrustSignalsTab.tsx           Trust badges
AdminFAQTab.tsx                    FAQ CRUD
AdminBlogTab.tsx                   Blog CRUD
AdminNewsletterTab.tsx             Newsletter management
AdminAIDescriptionsTab.tsx         AI product descriptions
AdminDbInspectorTab.tsx            Database schema export tool
AnalyticsDashboard.tsx             Analytics visualization
SiteSettingsAdmin.tsx              Site configuration
FooterPagesAdmin.tsx               Footer page CRUD
LegalPagesAdmin.tsx                Legal page management
BannerSettingsAdmin.tsx            Cookie banner config
CookieCategoriesAdmin.tsx          Cookie category CRUD
CookieRegistryAdmin.tsx            Cookie definition CRUD
ConsentLogsAdmin.tsx               Consent audit log viewer
EmailCommLogTab.tsx                Communication log viewer
EmailConsentTab.tsx                Email consent management
EmailSettingsTab.tsx               Email configuration
EmailWF8TestTab.tsx                WF-8 email dispatcher test
EmailWF9StripeTab.tsx              WF-9 Stripe email test
SessionHistoryTab.tsx              Chat session history
ImageUpload.tsx                    Image upload component
FileUpload.tsx                     File upload component
ProductDetailPreview.tsx           Product preview in admin
SortableTableHead.tsx              Reusable sortable table headers
```

---

*End of document.*
