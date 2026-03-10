# FitMatch.ca — Full Project Audit Report

**Generated:** 2026-03-10  
**Framework:** React 18 + TypeScript + Vite 5  
**Styling:** Tailwind CSS 3 + shadcn/ui  
**Routing:** React Router v6  
**Backend:** Lovable Cloud (Supabase)  
**Live URL:** https://spark-connect-hub-03.lovable.app  

---

## 1. ROUTES & PAGES

| Path | Component | Access | Guard |
|------|-----------|--------|-------|
| `/` | `Index.tsx` (or `UnderConstruction.tsx` in prod without bypass) | Public | None (preview gate) |
| `/product/:id` | `Product.tsx` | Public | None |
| `/cart` | `Cart.tsx` | Public | None |
| `/checkout` | `Checkout.tsx` (lazy) | Public | None |
| `/order-confirmation/:orderId` | `OrderConfirmation.tsx` (lazy) | Public | None |
| `/browse` | `ProductCatalog.tsx` | Public | None |
| `/search` | `SearchResults.tsx` | Public | None |
| `/quote-request` | `QuoteRequest.tsx` (lazy) | Public | None |
| `/quote-success` | `QuoteSuccess.tsx` | Public | None |
| `/how-it-works` | `HowItWorksPage.tsx` | Public | None |
| `/for-contractors` | `ForContractorsPage.tsx` | Public | None |
| `/for-sellers` | `ForSellersPage.tsx` | Public | None |
| `/about` | `AboutPage.tsx` | Public | None |
| `/faq` | `FAQPage.tsx` (lazy) | Public | None |
| `/blog` | `BlogPage.tsx` (lazy) | Public | None |
| `/blog/:slug` | `BlogPostPage.tsx` (lazy) | Public | None |
| `/compare` | `ComparePage.tsx` (lazy) | Public | None |
| `/login` | `Login.tsx` | Public | None |
| `/register` | `Register.tsx` | Public | None |
| `/messages` | `Messages.tsx` (lazy) | Public (auth expected) | None |
| `/messages/:conversationId` | `Messages.tsx` (lazy) | Public (auth expected) | None |
| `/page/:slug` | `FooterPage.tsx` | Public | None |
| `/coming-soon` | `UnderConstruction.tsx` | Public | None |
| `/admin/login` | `AdminLogin.tsx` (lazy) | Public | None (email check inside) |
| `/admin` | `Admin.tsx` (lazy) | Protected | Internal admin_emails check |
| `/admin/webhooks/:provider/:endpointKey` | `WebhookDetail.tsx` (lazy) | Protected | Internal admin_emails check |
| `/client/dashboard` | `ClientDashboard.tsx` (lazy) | Protected | `RoleGuard(['client'])` |
| `/client/matches` | `ClientMatches.tsx` (lazy) | Protected | `RoleGuard(['client'])` |
| `/client/match/new` | `ClientNewMatch.tsx` (lazy) | Protected | `RoleGuard(['client'])` |
| `/client/projects` | `ClientProjects.tsx` (lazy) | Protected | `RoleGuard(['client'])` |
| `/client/projects/:projectId` | `ClientProjectDetail.tsx` (lazy) | Protected | `RoleGuard(['client'])` |
| `/client/messages` | `ClientMessages.tsx` (lazy) | Protected | `RoleGuard(['client'])` |
| `/client/profile` | `ClientProfile.tsx` (lazy) | Protected | `RoleGuard(['client'])` |
| `/contractor/dashboard` | `ContractorDashboard.tsx` (lazy) | Protected | `RoleGuard(['contractor'])` |
| `/contractor/jobs` | `ContractorJobs.tsx` (lazy) | Protected | `RoleGuard(['contractor'])` |
| `/contractor/jobs/:jobId` | `ContractorJobDetail.tsx` (lazy) | Protected | `RoleGuard(['contractor'])` |
| `/contractor/projects` | `ContractorProjects.tsx` (lazy) | Protected | `RoleGuard(['contractor'])` |
| `/contractor/projects/:projectId` | `ContractorProjectDetail.tsx` (lazy) | Protected | `RoleGuard(['contractor'])` |
| `/contractor/messages` | `ContractorMessages.tsx` (lazy) | Protected | `RoleGuard(['contractor'])` |
| `/contractor/profile` | `ContractorProfile.tsx` (lazy) | Protected | `RoleGuard(['contractor'])` |
| `/seller/pending` | `SellerPending.tsx` (lazy) | Public | None (static waiting page) |
| `/seller/dashboard` | `SellerDashboard.tsx` (lazy) | Protected | `SellerGuard` (approved only) |
| `/seller/products` | `SellerProducts.tsx` (lazy) | Protected | `SellerGuard` |
| `/seller/products/new` | `SellerNewProduct.tsx` (lazy) | Protected | `SellerGuard` |
| `/seller/products/:productId` | `SellerEditProduct.tsx` (lazy) | Protected | `SellerGuard` |
| `/seller/products/:id/variants` | `SellerProductVariants.tsx` (lazy) | Protected | `SellerGuard` |
| `/seller/documents` | `SellerDocuments.tsx` (lazy) | Protected | `SellerGuard` |
| `/seller/quotes` | `SellerQuotes.tsx` (lazy) | Protected | `SellerGuard` |
| `/seller/quotes/:quoteId` | `SellerQuoteDetail.tsx` (lazy) | Protected | `SellerGuard` |
| `/seller/orders` | `SellerOrders.tsx` (lazy) | Protected | `SellerGuard` |
| `/seller/analytics` | `SellerAnalytics.tsx` (lazy) | Protected | `SellerGuard` |
| `/seller/payouts` | `SellerPayouts.tsx` (lazy) | Protected | `SellerGuard` |
| `/seller/questions` | `SellerQuestions.tsx` (lazy) | Protected | `SellerGuard` |
| `/seller/messages` | `SellerMessages.tsx` (lazy) | Protected | `SellerGuard` |
| `/seller/messages/:conversationId` | `SellerMessages.tsx` (lazy) | Protected | `SellerGuard` |
| `/seller/knowledge-base` | `SellerKnowledgeBase.tsx` (lazy) | Protected | `SellerGuard` |
| `/seller/store-profile` | `SellerStoreProfile.tsx` (lazy) | Protected | `SellerGuard` |
| `/builder/dashboard` | `BuilderDashboard.tsx` (lazy) | Protected | `RoleGuard(['builder'])` |
| `/builder/projects` | `BuilderProjects.tsx` (lazy) | Protected | `RoleGuard(['builder'])` |
| `/builder/projects/new` | `BuilderNewProject.tsx` (lazy) | Protected | `RoleGuard(['builder'])` |
| `/builder/matches` | `BuilderMatches.tsx` (lazy) | Protected | `RoleGuard(['builder'])` |
| `/builder/messages` | `BuilderMessages.tsx` (lazy) | Protected | `RoleGuard(['builder'])` |
| `/builder/profile` | `BuilderProfile.tsx` (lazy) | Protected | `RoleGuard(['builder'])` |
| `/account` | `AccountOverview.tsx` (lazy) | Protected | `AccountLayout` (any auth) |
| `/account/orders` | `AccountOrders.tsx` (lazy) | Protected | `AccountLayout` |
| `/account/wishlist` | `AccountWishlist.tsx` (lazy) | Protected | `AccountLayout` |
| `/account/addresses` | `AccountAddresses.tsx` (lazy) | Protected | `AccountLayout` |
| `/account/settings` | `AccountSettings.tsx` (lazy) | Protected | `AccountLayout` |
| `*` | `NotFound.tsx` | Public | None |

---

## 2. COMPONENTS INVENTORY

### Pages (`src/pages/`)

| File | Description |
|------|-------------|
| `Index.tsx` | Landing page with hero, product showcase, benefits, trust signals |
| `Product.tsx` | Product detail page with gallery, specs, Q&A, reviews, chatbot |
| `ProductCatalog.tsx` | Browse/filter products catalog |
| `Cart.tsx` | Shopping cart view |
| `Checkout.tsx` | 2-step checkout (information → review) |
| `OrderConfirmation.tsx` | Post-order confirmation page |
| `SearchResults.tsx` | Search results listing |
| `QuoteRequest.tsx` | Multi-item quote request form |
| `QuoteSuccess.tsx` | Quote submission success page |
| `ComparePage.tsx` | Side-by-side product comparison |
| `HowItWorksPage.tsx` | How it works informational page |
| `ForContractorsPage.tsx` | Contractor-targeted marketing page |
| `ForSellersPage.tsx` | Seller-targeted marketing page |
| `AboutPage.tsx` | About the company |
| `FAQPage.tsx` | FAQ accordion page (from DB) |
| `BlogPage.tsx` | Blog listing page |
| `BlogPostPage.tsx` | Individual blog post view |
| `Login.tsx` | Login form (email/password + Google OAuth) |
| `Register.tsx` | Multi-role registration with OTP email verification |
| `Messages.tsx` | Buyer messaging inbox |
| `FooterPage.tsx` | Dynamic legal/footer pages from DB |
| `UnderConstruction.tsx` | Under construction placeholder |
| `NotFound.tsx` | 404 page |
| `Admin.tsx` | Admin panel with tabbed sidebar |
| `AdminLogin.tsx` | Admin login (Google OAuth, checks admin_emails) |
| `admin/WebhookDetail.tsx` | Webhook endpoint detail/test view |

### Pages — Client Dashboard (`src/pages/client/`)

| File | Description |
|------|-------------|
| `ClientDashboard.tsx` | Client home dashboard |
| `ClientMatches.tsx` | View matched contractors |
| `ClientNewMatch.tsx` | Create new contractor match request |
| `ClientProjects.tsx` | Client projects list |
| `ClientProjectDetail.tsx` | Individual project detail |
| `ClientMessages.tsx` | Client messaging |
| `ClientProfile.tsx` | Client profile management |

### Pages — Contractor Dashboard (`src/pages/contractor/`)

| File | Description |
|------|-------------|
| `ContractorDashboard.tsx` | Contractor home dashboard |
| `ContractorJobs.tsx` | Available/assigned jobs list |
| `ContractorJobDetail.tsx` | Individual job detail |
| `ContractorProjects.tsx` | Contractor projects list |
| `ContractorProjectDetail.tsx` | Individual project detail |
| `ContractorMessages.tsx` | Contractor messaging |
| `ContractorProfile.tsx` | Contractor profile with trades/service areas |

### Pages — Seller Dashboard (`src/pages/seller/`)

| File | Description |
|------|-------------|
| `SellerPending.tsx` | Pre-approval waiting page (public, no auth required) |
| `SellerDashboard.tsx` | Seller home with stats, Stripe status, health score |
| `SellerProducts.tsx` | Product management listing |
| `SellerNewProduct.tsx` | Create new product form |
| `SellerEditProduct.tsx` | Edit existing product |
| `SellerProductVariants.tsx` | Manage product variants/options |
| `SellerDocuments.tsx` | Business document uploads |
| `SellerQuotes.tsx` | Quote requests list |
| `SellerQuoteDetail.tsx` | Individual quote detail/response |
| `SellerOrders.tsx` | Orders management |
| `SellerPayouts.tsx` | Stripe payout history |
| `SellerAnalytics.tsx` | Seller analytics dashboard |
| `SellerQuestions.tsx` | Product Q&A management |
| `SellerMessages.tsx` | Seller messaging |
| `SellerKnowledgeBase.tsx` | Knowledge base article management |
| `SellerStoreProfile.tsx` | Store branding/profile settings |

### Pages — Builder Dashboard (`src/pages/builder/`)

| File | Description |
|------|-------------|
| `BuilderDashboard.tsx` | Builder home dashboard |
| `BuilderProjects.tsx` | Builder projects list |
| `BuilderNewProject.tsx` | Create new project |
| `BuilderMatches.tsx` | View matched contractors |
| `BuilderMessages.tsx` | Builder messaging |
| `BuilderProfile.tsx` | Builder profile management |

### Pages — Account (`src/pages/account/`)

| File | Description |
|------|-------------|
| `AccountLayout.tsx` | Account section layout wrapper |
| `AccountOverview.tsx` | Account overview/summary |
| `AccountOrders.tsx` | Order history |
| `AccountWishlist.tsx` | Saved wishlist items |
| `AccountAddresses.tsx` | Shipping addresses management |
| `AccountSettings.tsx` | Account settings (name, email, password) |

### Components — Landing (`src/components/landing/`)

| File | Description |
|------|-------------|
| `Header.tsx` | Site header/navigation with mobile menu |
| `Hero.tsx` | Landing page hero section |
| `ProductShowcase.tsx` | Featured products carousel |
| `Benefits.tsx` | Benefits/value proposition section |
| `HowItWorks.tsx` | How it works steps section |
| `OtherProducts.tsx` | Other product categories section |
| `ForContractors.tsx` | Contractor CTA section |
| `TrustSignals.tsx` | Trust badges/signals from DB |
| `CTA.tsx` | Newsletter/contact CTA with consent |
| `Footer.tsx` | Site footer with links |

### Components — Admin (`src/components/admin/`)

| File | Description |
|------|-------------|
| `AdminSidebar.tsx` | Admin panel sidebar navigation |
| `AdminDashboardTab.tsx` | Admin overview dashboard with stats |
| `AdminOrdersTab.tsx` | Order management table |
| `AdminQuotesTab.tsx` | Quote request management |
| `AdminProductsTab.tsx` | Product listing/approval management |
| `AdminProductReviewTab.tsx` | Product content review before approval |
| `AdminCustomersTab.tsx` | Customer/user management |
| `AdminReviewsTab.tsx` | Product review moderation |
| `AdminQATab.tsx` | Product Q&A moderation |
| `AdminSellersTab.tsx` | Seller management (approve/restrict) |
| `AdminSellerHealthTab.tsx` | Seller health score monitoring |
| `AdminEmailTemplatesTab.tsx` | Email template CRUD editor |
| `AdminNewsletterTab.tsx` | Newsletter subscriber management |
| `AdminBlogTab.tsx` | Blog post CRUD management |
| `AdminFAQTab.tsx` | FAQ item management |
| `AdminTrustSignalsTab.tsx` | Trust signal management |
| `AdminIntegrationsTab.tsx` | Integration status/config panel |
| `AdminWebhooksTab.tsx` | Webhook endpoint management |
| `AdminChatbotControlPanel.tsx` | Chatbot settings (delays, limits) |
| `AdminTestChatTab.tsx` | Chatbot testing interface |
| `AdminAIDescriptionsTab.tsx` | AI product description generator |
| `AdminDbInspectorTab.tsx` | Live database schema inspector |
| `AdminPlatformKBTab.tsx` | Platform knowledge base management |
| `AnalyticsDashboard.tsx` | Analytics charts and metrics |
| `SiteSettingsAdmin.tsx` | Site settings key-value editor |
| `FooterPagesAdmin.tsx` | Footer/legal page management |
| `LegalPagesAdmin.tsx` | Legal pages content management |
| `CookieCategoriesAdmin.tsx` | Cookie category management |
| `CookieRegistryAdmin.tsx` | Cookie definition registry |
| `ConsentLogsAdmin.tsx` | Consent log viewer |
| `BannerSettingsAdmin.tsx` | Cookie banner settings |
| `ProductDetailPreview.tsx` | Product detail preview in admin |
| `ImageUpload.tsx` | Image upload component for admin |
| `FileUpload.tsx` | File upload component for admin |
| `SessionHistoryTab.tsx` | Chat session history viewer |
| `EmailSettingsTab.tsx` | Email system settings (from/reply-to) |
| `EmailCommLogTab.tsx` | Email communication log viewer |
| `EmailConsentTab.tsx` | Email consent log viewer |
| `EmailTestConsoleTab.tsx` | Email send test console |
| `EmailWF8TestTab.tsx` | WF-8 email workflow test panel |
| `EmailWF9StripeTab.tsx` | WF-9 Stripe email workflow test panel |

### Components — Chat (`src/components/chat/`)

| File | Description |
|------|-------------|
| `ChatWidget.tsx` | Floating chatbot widget (buyer-facing) |
| `ChatConsentModal.tsx` | Chatbot data consent modal |
| `ChatRegistrationGate.tsx` | Email capture gate for chatbot |
| `SellerDashboardChatWidget.tsx` | Seller-specific chatbot interface |
| `VoiceLangSelector.tsx` | Voice input language selector |
| `useChatSession.ts` | Chat session management hook |
| `useVoiceInput.ts` | Speech recognition hook |

### Components — Checkout (`src/components/checkout/`)

| File | Description |
|------|-------------|
| `CheckoutStepper.tsx` | Checkout step indicator |
| `StepInformation.tsx` | Shipping/contact info form |
| `StepReview.tsx` | Order review and payment |

### Components — Seller (`src/components/seller/`)

| File | Description |
|------|-------------|
| `SellerProductForm.tsx` | Product create/edit form |
| `HardwareSection.tsx` | Hardware options section in product form |
| `AdditionalFeaturesSection.tsx` | Additional features in product form |
| `SellerAIChatbotCard.tsx` | AI chatbot opt-in card for sellers |
| `SellerAIConsentModal.tsx` | AI consent acceptance modal |
| `SellerHealthCard.tsx` | Seller health score display card |

### Components — Product (`src/components/product/`)

| File | Description |
|------|-------------|
| `ProductHero.tsx` | Product page hero with main image |
| `ProductSpecs.tsx` | Product specifications display |
| `ProductDelivery.tsx` | Delivery/shipping info section |
| `ProductAddOns.tsx` | Product add-on options |
| `ProductStickySidebar.tsx` | Sticky price/add-to-cart sidebar |

### Components — Shared (`src/components/`)

| File | Description |
|------|-------------|
| `AuthGateModal.tsx` | Modal prompting login for protected actions |
| `Breadcrumbs.tsx` | Breadcrumb navigation |
| `CompareBar.tsx` | Floating product comparison bar |
| `CompareButton.tsx` | Add-to-compare button |
| `ContactSellerButton.tsx` | Contact seller messaging button |
| `CookieConsent.tsx` | GDPR/CASL cookie consent banner |
| `DashboardLayout.tsx` | Dashboard layout with sidebar (multi-role) |
| `DimensionMatcher.tsx` | Dimension matching tool for products |
| `NavLink.tsx` | Active navigation link component |
| `NewsletterSignup.tsx` | Newsletter signup form |
| `ProductGallery.tsx` | Product image gallery with thumbnails |
| `ProductQA.tsx` | Product Q&A section |
| `ProductReviews.tsx` | Product reviews section |
| `ReportIssueDialog.tsx` | Report issue dialog |
| `RoleGuard.tsx` | Route guard checking user_type |
| `ScrollToTop.tsx` | Scroll to top on navigation |
| `SearchBar.tsx` | Search input with suggestions |
| `SellerGuard.tsx` | Route guard for approved sellers |
| `TrustBadgeBar.tsx` | Trust badge display bar |
| `WishlistButton.tsx` | Add-to-wishlist heart button |

### UI Components (`src/components/ui/`)

50+ shadcn/ui components including: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip, plus custom skeletons (order-card, product-card, product-detail).

---

## 3. EDGE FUNCTIONS

| Function | Description | Auth Method |
|----------|-------------|-------------|
| `admin-update-seller-restriction` | Update seller restriction status and hide/restore products | Dual: `x-api-secret` OR JWT + admin_emails check |
| `chatbot-proxy` | Proxy chatbot requests to AI/n8n backend | JWT (verify_jwt default) |
| `check-consent` | Check marketing consent status for an email | JWT |
| `create-checkout-session` | Create Stripe checkout session | JWT |
| `create-connect-account` | Create Stripe Connect account for sellers | JWT |
| `create-order` | Create order records in database | JWT |
| `create-wf10-test-user` | Create test user for WF-10 email workflow | JWT |
| `get-connect-status` | Get Stripe Connect account status | JWT |
| `get-deadline-orders` | Get orders approaching shipping deadlines | JWT |
| `get-order-confirmation` | Get order confirmation data | JWT |
| `get-order-notification-data` | Get data for order notification emails | JWT |
| `get-order-sellers` | Get seller info for order items | JWT |
| `get-unsynced-comms` | Get communication logs not yet synced to Pinecone | JWT |
| `get-unsynced-content` | Get KB content not yet synced to Pinecone | JWT |
| `get-wf9-order-items` | Get order items for WF-9 Stripe workflow | JWT |
| `get-wf9-order` | Get order data for WF-9 workflow | JWT |
| `log-chat-message` | Log chatbot messages to database | JWT |
| `log-communication` | Log email communications | JWT |
| `log-email-consent` | Log email consent records | JWT |
| `mark-kb-synced` | Mark KB entries as synced to Pinecone | JWT |
| `n8n-proxy` | Proxy requests to n8n webhook endpoints | JWT |
| `notify-seller-approval` | Notify seller of approval via n8n webhook | JWT |
| `notify-seller-registration` | Notify admin of new seller registration | JWT |
| `process-seller-transfers` | Process Stripe transfers to sellers | JWT |
| `save-marketing-consent` | Save marketing consent with CASL compliance | Anonymous (`verify_jwt = false`) |
| `seed-wf10-test-data` | Seed test data for WF-10 workflow testing | JWT |
| `send-verification-otp` | Send email verification OTP code | Anonymous (`verify_jwt = false`) |
| `simulate-inbound-email` | Simulate inbound email for testing | JWT |
| `stripe-webhook` | Handle Stripe webhook events | Anonymous (Stripe signature verification) |
| `stripe-webhook-test` | Test Stripe webhook handling | JWT |
| `submit-cabinet-match` | Submit cabinet dimension matching request | JWT |
| `test-integration` | Test external integration connectivity | JWT |
| `update-communication-status` | Update communication log status | JWT |
| `update-order-status` | Update order status | JWT |
| `verify-otp-code` | Verify email OTP code and create auth user | Anonymous (`verify_jwt = false`) |

---

## 4. DATABASE TABLES

| Table | ~Columns | Description |
|-------|----------|-------------|
| `admin_emails` | 3 | Admin user email whitelist |
| `analytics_events` | 17 | Page view and custom event tracking |
| `analytics_sessions` | 17 | Visitor session tracking |
| `blog_posts` | 15 | Blog articles with SEO metadata |
| `categories` | 8 | Product categories (hierarchical) |
| `chat_messages` | 10 | Chatbot conversation messages |
| `chat_sessions` | 15 | Chatbot session metadata |
| `chat_summaries` | 5 | AI-generated chat session summaries |
| `chatbot_missed_attempts` | 5 | Failed chatbot interaction attempts |
| `communication_logs` | 23 | Email send/receive audit log |
| `consent_logs` | 9 | Cookie consent audit records |
| `contractor_details` | 9 | Contractor profile extensions |
| `conversation_messages` | 6 | Buyer↔seller direct messages |
| `conversations` | 10 | Buyer↔seller conversation threads |
| `cookie_categories` | 10 | Cookie consent categories |
| `cookie_definitions` | 10 | Individual cookie definitions |
| `email_consent_log` | 11 | Email marketing consent audit |
| `email_templates` | 18 | Email template storage with HTML/text |
| `email_verification_codes` | 7 | OTP email verification codes |
| `faq_items` | 9 | FAQ questions and answers |
| `footer_pages` | 7 | Dynamic footer/legal page content |
| `integrations` | 14 | External service integration config |
| `marketing_consents` | 8 | CASL marketing consent records |
| `messages` | 10 | Legacy messaging table |
| `newsletter_subscribers` | 8 | Newsletter subscription list |
| `order_disputes` | 13 | Order dispute/complaint records |
| `order_items` | 11 | Individual order line items |
| `orders` | 44 | Orders with full lifecycle tracking |
| `platform_knowledge_base` | 8 | Platform-wide FAQ/policy KB |
| `product_compatible_appliances` | 11 | Compatible appliance specs per product |
| `product_options` | 12 | Product options/add-ons with pricing |
| `product_questions` | 15 | Buyer questions on products |
| `product_reviews` | 11 | Product ratings and reviews |
| `products` | ~30+ | Product listings (referenced extensively) |
| `profiles` | ~30 | User profiles (all roles) |
| `project_contractors` | 6 | Contractor↔project assignments |
| `projects` | ~10+ | Client/builder renovation projects |
| `quote_request_items` | 7 | Quote request line items |
| `quote_requests` | 14 | Quote request submissions |
| `seller_ai_consents` | ~6 | Seller AI feature consent records |
| `seller_knowledge_base` | 9 | Seller-specific KB articles |
| `shipping_addresses` | 13 | Saved shipping addresses |
| `site_settings` | ~5 | Key-value site configuration |
| `trust_signals` | 8 | Trust badges/signals for landing page |
| `webhook_logs` | ~10 | Webhook execution logs |
| `wishlists` | 4 | User product wishlists |

---

## 5. HOOKS & CONTEXTS

### Custom Hooks (`src/hooks/`)

| Hook | Description |
|------|-------------|
| `useAuth` | Re-exports AuthContext (auth state, session, signOut) |
| `useProfile` | Fetches current user's profile from profiles table |
| `useAnalytics` | Tracks page views and custom events to analytics_events |
| `usePageMeta` | Sets dynamic page title and meta description |
| `useProductData` | Fetches product detail with options and appliances |
| `useProductCart` | Product-specific cart add/update operations |
| `use-mobile` | Mobile breakpoint detection (responsive) |
| `use-toast` | Toast notification management |

### Chat Hooks (`src/components/chat/`)

| Hook | Description |
|------|-------------|
| `useChatSession` | Manages chatbot session creation, message history, consent |
| `useVoiceInput` | Speech recognition (Web Speech API) for chatbot |

### Contexts (`src/contexts/`)

| Context | Description |
|---------|-------------|
| `AuthContext / AuthProvider` | Supabase auth state, session management, signOut |
| `CartContext / CartProvider` | Shopping cart state (add, remove, update qty, delivery tracking) |
| `WishlistContext / WishlistProvider` | Wishlist with Supabase persistence for auth users |
| `CompareContext / CompareProvider` | Product comparison (max items, side-by-side) |
| `CheckoutContext` | Multi-step checkout flow state |

---

## 6. INTEGRATIONS

| Service | Purpose | Status |
|---------|---------|--------|
| **Supabase Auth** | Email/password + Google OAuth authentication | ✅ Connected (Lovable Cloud) |
| **Supabase Database** | PostgreSQL with RLS policies | ✅ Connected |
| **Supabase Storage** | Product images and documents (2 buckets) | ✅ Connected |
| **Supabase Edge Functions** | 35 serverless functions | ✅ Deployed |
| **Stripe Payments** | Checkout sessions, Connect accounts, webhooks | ✅ Configured (secrets set: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) |
| **n8n Webhooks** | Email sending (WF-8), order notifications, seller approval notifications | ✅ Configured (secrets: `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`) |
| **Mailgun** | Email delivery (via n8n) | ✅ Configured (from: orders@fitmatch.ca, reply-to: support@mg.fitmatch.ca) |
| **Pinecone** | Vector DB for chatbot KB sync | 🔧 Referenced in code (sync flags on tables), actual connection via n8n |
| **Google OAuth** | Admin and user login | ✅ Configured |
| **Web Speech API** | Voice input for chatbot | ✅ Browser-native |
| **Lovable AI** | AI-powered product descriptions, chatbot proxy | ✅ Available (LOVABLE_API_KEY set) |

---

## 7. RECENT CHANGES

Based on the conversation history and file structure, the most recently modified files are:

1. `src/pages/Register.tsx` — Added seller/contractor sign-out after OTP verification
2. `src/pages/seller/SellerPending.tsx` — Refactored to static page (no auth required)
3. `src/pages/seller/SellerDashboard.tsx` — Changed "Welcome back" → "Welcome"
4. `supabase/migrations/` — Added admin UPDATE policy on profiles table
5. `supabase/functions/admin-update-seller-restriction/index.ts` — Seller restriction management
6. `src/components/admin/AdminSellersTab.tsx` — Seller approval/restriction UI
7. `src/components/admin/AdminSellerHealthTab.tsx` — Seller health monitoring
8. `src/components/seller/SellerHealthCard.tsx` — Health score display
9. `src/components/admin/EmailWF8TestTab.tsx` — WF-8 email testing panel
10. `src/components/admin/EmailWF9StripeTab.tsx` — WF-9 Stripe email testing
11. `src/components/admin/EmailTestConsoleTab.tsx` — Email test console
12. `src/components/admin/EmailCommLogTab.tsx` — Communication log viewer
13. `src/components/admin/EmailConsentTab.tsx` — Email consent viewer
14. `src/components/admin/EmailSettingsTab.tsx` — Email settings
15. `src/components/chat/ChatWidget.tsx` — Chatbot with guest message limits
16. `src/components/chat/ChatRegistrationGate.tsx` — Email capture gate
17. `src/components/admin/AdminChatbotControlPanel.tsx` — Chatbot settings
18. `src/components/admin/SessionHistoryTab.tsx` — Chat session history
19. `src/components/seller/SellerAIChatbotCard.tsx` — AI chatbot opt-in
20. `src/components/admin/AdminWebhooksTab.tsx` — Webhook management

---

## 8. KNOWN ISSUES

### No TODO/FIXME Tags Found
The codebase has zero TODO, FIXME, HACK, or XXX comments.

### Observed Patterns / Potential Issues

1. **Production gate**: The landing page shows `UnderConstruction` on production domains unless `?preview=true` bypass is used. This means the live site at fitmatch.ca shows an under-construction page.

2. **Type casting**: Multiple files use `as any` type casting on Supabase queries (e.g., `site_settings`, `seller_ai_consents`), suggesting these tables may not be fully represented in the auto-generated types.

3. **`/messages` route has no auth guard**: The Messages page is listed as a public route but requires authentication to function. No route-level guard is applied.

4. **`project_contractors` table**: Missing INSERT, UPDATE, DELETE policies — contractors cannot be assigned to projects via the app.

5. **`marketing_consents` table**: Missing INSERT/UPDATE/DELETE policies for authenticated users — consent can only be written via the `save-marketing-consent` edge function (service role).

6. **`projects` table**: Referenced in `project_contractors` FK but not visible in the provided schema dump — may have limited RLS policies.

7. **Console errors**: 14 files contain `console.error` calls for error handling — these are standard try/catch logging, not bugs.

8. **Checkout flow**: No explicit auth guard on `/checkout` — guests may be able to reach checkout. The `create-order` function handles guest orders via `guest_email`.

---

## 9. SITE SETTINGS

Keys referenced in the codebase (from `site_settings` table):

### Company Info
- `company_name`
- `company_email`
- `company_phone`
- `company_address`
- `company_city`
- `company_province`
- `company_country`

### Legal & Compliance
- `copyright_text`
- `tax_notice`
- `discount_disclaimer`
- `privacy_contact_email`

### Consent Text
- `cookie_banner_text`
- `newsletter_consent_text`
- `cta_consent_text`

### Chatbot Settings
- `chatbot_auto_open_delay_seconds`
- `chatbot_consent_modal_enabled`
- `chatbot_guest_message_limit`
- `chatbot_*` (wildcard query in AdminChatbotControlPanel)

### AI Descriptions
- `ai_storefront_assistant_short_desc`
- `ai_storefront_assistant_full_desc`
- `ai_personal_assistant_short_desc`
- `ai_personal_assistant_full_desc`

### Email Settings
- `email_*` (wildcard query in EmailSettingsTab)

### WF-9 Stripe Webhook URLs
- Various WF-9 workflow URL settings (configured via AdminIntegrationsTab and EmailWF9StripeTab)

### Webhook Settings
- Provider-specific webhook endpoint URLs (configured via AdminWebhooksTab)

---

## 10. EMAIL TEMPLATES

Template keys referenced in the codebase:

| Template Key | Where Referenced |
|-------------|-----------------|
| `account_welcome` | EmailWF8TestTab (test), EmailTestConsoleTab (test) |
| `email_verification_otp` | `send-verification-otp` edge function |
| `seller_approval` | Database (updated via migration), `notify-seller-approval` edge function |
| `order_confirmation` | EmailWF9StripeTab (required template) |
| `payment_receipt` | EmailWF9StripeTab (required template) |
| `payment_failed` | EmailWF9StripeTab (required template), `seed-wf10-test-data` |
| `refund_processed` | EmailWF9StripeTab (required template) |
| `review_request` | EmailWF8TestTab (consent test) |
| `newsletter` | EmailWF8TestTab (marketing pause test) |
| `nonexistent_template_xyz_9999` | EmailWF8TestTab (error handling test — not a real template) |

**Note:** Additional templates may exist in the `email_templates` database table that are not directly referenced by template_key string literals in the frontend code. The admin panel (`AdminEmailTemplatesTab.tsx`) provides full CRUD for all templates.

---

## ARCHITECTURE SUMMARY

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React)                   │
│  Landing │ Product │ Cart │ Checkout │ Dashboards    │
│  5 roles: client, contractor, seller, builder, admin │
├─────────────────────────────────────────────────────┤
│              LOVABLE CLOUD (Supabase)                │
│  Auth │ PostgreSQL (46+ tables) │ Storage │ 35 EFs   │
├─────────────────────────────────────────────────────┤
│              EXTERNAL SERVICES                       │
│  Stripe (payments) │ n8n (automation) │ Mailgun      │
│  Pinecone (vector) │ Google OAuth                    │
└─────────────────────────────────────────────────────┘
```

---

*This is a read-only audit. No code, UI, or database changes were made.*
