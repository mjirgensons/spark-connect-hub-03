# FitMatch — Comprehensive Project State Report
**Generated: 2026-03-09**

---

## 1. ROUTES & PAGES

| Path | Component | Protection | Role Guard |
|---|---|---|---|
| `/` | `Index` (or `UnderConstruction`) | Public (production gate) | — |
| `/product/:id` | `Product` | Public | — |
| `/cart` | `Cart` | Public | — |
| `/checkout` | `Checkout` (lazy) | Public | — |
| `/order-confirmation/:orderId` | `OrderConfirmation` (lazy) | Public | — |
| `/admin/login` | `AdminLogin` (lazy) | Public | — |
| `/admin` | `Admin` (lazy) | Internal admin check | — |
| `/admin/webhooks/:provider/:endpointKey` | `WebhookDetail` (lazy) | Internal admin check | — |
| `/page/:slug` | `FooterPage` | Public | — |
| `/coming-soon` | `UnderConstruction` | Public | — |
| `/browse` | `ProductCatalog` | Public | — |
| `/search` | `SearchResults` | Public | — |
| `/quote-request` | `QuoteRequest` (lazy) | Public | — |
| `/quote-success` | `QuoteSuccess` | Public | — |
| `/how-it-works` | `HowItWorksPage` | Public | — |
| `/for-contractors` | `ForContractorsPage` | Public | — |
| `/for-sellers` | `ForSellersPage` | Public | — |
| `/about` | `AboutPage` | Public | — |
| `/faq` | `FAQPage` (lazy) | Public | — |
| `/blog` | `BlogPage` (lazy) | Public | — |
| `/blog/:slug` | `BlogPostPage` (lazy) | Public | — |
| `/compare` | `ComparePage` (lazy) | Public | — |
| `/login` | `Login` | Public | — |
| `/register` | `Register` | Public | — |
| `/messages` | `Messages` (lazy) | Public (auth-gated inside) | — |
| `/messages/:conversationId` | `Messages` (lazy) | Public (auth-gated inside) | — |
| `/client/*` | `DashboardLayout` | Protected | `RoleGuard(['client'])` |
| `/client/dashboard` | `ClientDashboard` | Protected | client |
| `/client/matches` | `ClientMatches` | Protected | client |
| `/client/match/new` | `ClientNewMatch` | Protected | client |
| `/client/projects` | `ClientProjects` | Protected | client |
| `/client/projects/:projectId` | `ClientProjectDetail` | Protected | client |
| `/client/messages` | `ClientMessages` | Protected | client |
| `/client/profile` | `ClientProfile` | Protected | client |
| `/contractor/*` | `DashboardLayout` | Protected | `RoleGuard(['contractor'])` |
| `/contractor/dashboard` | `ContractorDashboard` | Protected | contractor |
| `/contractor/jobs` | `ContractorJobs` | Protected | contractor |
| `/contractor/jobs/:jobId` | `ContractorJobDetail` | Protected | contractor |
| `/contractor/projects` | `ContractorProjects` | Protected | contractor |
| `/contractor/projects/:projectId` | `ContractorProjectDetail` | Protected | contractor |
| `/contractor/messages` | `ContractorMessages` | Protected | contractor |
| `/contractor/profile` | `ContractorProfile` | Protected | contractor |
| `/seller/pending` | `SellerPending` (lazy) | Auth-only (no guard) | — |
| `/seller/*` | `DashboardLayout` | Protected | `SellerGuard` (approved seller) |
| `/seller/dashboard` | `SellerDashboard` | Protected | seller |
| `/seller/products` | `SellerProducts` | Protected | seller |
| `/seller/products/new` | `SellerNewProduct` | Protected | seller |
| `/seller/products/:productId` | `SellerEditProduct` | Protected | seller |
| `/seller/products/:id/variants` | `SellerProductVariants` | Protected | seller |
| `/seller/documents` | `SellerDocuments` | Protected | seller |
| `/seller/quotes` | `SellerQuotes` | Protected | seller |
| `/seller/quotes/:quoteId` | `SellerQuoteDetail` | Protected | seller |
| `/seller/orders` | `SellerOrders` | Protected | seller |
| `/seller/analytics` | `SellerAnalytics` | Protected | seller |
| `/seller/payouts` | `SellerPayouts` | Protected | seller |
| `/seller/questions` | `SellerQuestions` | Protected | seller |
| `/seller/messages` | `SellerMessages` | Protected | seller |
| `/seller/messages/:conversationId` | `SellerMessages` | Protected | seller |
| `/seller/knowledge-base` | `SellerKnowledgeBase` | Protected | seller |
| `/seller/store-profile` | `SellerStoreProfile` | Protected | seller |
| `/builder/*` | `DashboardLayout` | Protected | `RoleGuard(['builder'])` |
| `/builder/dashboard` | `BuilderDashboard` | Protected | builder |
| `/builder/projects` | `BuilderProjects` | Protected | builder |
| `/builder/projects/new` | `BuilderNewProject` | Protected | builder |
| `/builder/matches` | `BuilderMatches` | Protected | builder |
| `/builder/messages` | `BuilderMessages` | Protected | builder |
| `/builder/profile` | `BuilderProfile` | Protected | builder |
| `/account` | `AccountLayout` (lazy) | Auth-gated | — |
| `/account/orders` | `AccountOrders` | Auth-gated | — |
| `/account/wishlist` | `AccountWishlist` | Auth-gated | — |
| `/account/addresses` | `AccountAddresses` | Auth-gated | — |
| `/account/settings` | `AccountSettings` | Auth-gated | — |
| `*` | `NotFound` | Public | — |

---

## 2. COMPONENTS INVENTORY

### `src/components/` (non-UI)
| File | Description |
|---|---|
| `AuthGateModal.tsx` | Modal prompting login/register when unauthenticated user tries protected action |
| `Breadcrumbs.tsx` | Breadcrumb navigation component |
| `CompareBar.tsx` | Floating bar showing products selected for comparison |
| `CompareButton.tsx` | Button to add/remove product from comparison |
| `ContactSellerButton.tsx` | Creates/opens a messaging conversation with a seller |
| `CookieConsent.tsx` | GDPR/CASL cookie consent banner |
| `DashboardLayout.tsx` | Sidebar + outlet layout for role-based dashboards |
| `DimensionMatcher.tsx` | Tool to match product dimensions to appliances |
| `NavLink.tsx` | Styled navigation link component |
| `NewsletterSignup.tsx` | Newsletter email subscription form |
| `ProductGallery.tsx` | Image gallery with thumbnails for product pages |
| `ProductQA.tsx` | Product Q&A section (ask/view questions) |
| `ProductReviews.tsx` | Product reviews display and submission |
| `ReportIssueDialog.tsx` | Dialog for reporting order issues/disputes |
| `RoleGuard.tsx` | Route guard that checks user role from profile |
| `ScrollToTop.tsx` | Scrolls to top on route change |
| `SearchBar.tsx` | Search input with autocomplete |
| `SellerGuard.tsx` | Route guard for approved sellers |
| `TrustBadgeBar.tsx` | Displays trust signal badges |
| `WishlistButton.tsx` | Heart button to add/remove from wishlist |

### `src/components/admin/`
| File | Description |
|---|---|
| `AdminAIDescriptionsTab.tsx` | Manage AI assistant description texts |
| `AdminBlogTab.tsx` | Blog post CRUD management |
| `AdminChatbotControlPanel.tsx` | Chatbot settings (limits, delays, toggles) |
| `AdminCustomersTab.tsx` | View/manage customer profiles |
| `AdminDashboardTab.tsx` | Admin overview dashboard with stats |
| `AdminDbInspectorTab.tsx` | Live database schema inspector |
| `AdminEmailTemplatesTab.tsx` | Email template CRUD editor |
| `AdminFAQTab.tsx` | FAQ item management |
| `AdminIntegrationsTab.tsx` | External service integrations (n8n, Stripe, etc.) |
| `AdminNewsletterTab.tsx` | Newsletter subscriber management |
| `AdminOrdersTab.tsx` | View/manage all orders |
| `AdminPlatformKBTab.tsx` | Platform-level knowledge base articles |
| `AdminProductReviewTab.tsx` | Moderate product reviews |
| `AdminProductsTab.tsx` | Product catalog management |
| `AdminQATab.tsx` | Moderate product Q&A |
| `AdminQuotesTab.tsx` | Quote request management |
| `AdminReviewsTab.tsx` | Review moderation (alt view) |
| `AdminSellerHealthTab.tsx` | Seller health score dashboard |
| `AdminSellersTab.tsx` | Seller approval/management |
| `AdminSidebar.tsx` | Admin panel sidebar navigation |
| `AdminTestChatTab.tsx` | Test chatbot from admin panel |
| `AdminTrustSignalsTab.tsx` | Trust signal badge management |
| `AdminWebhooksTab.tsx` | Webhook endpoint management & logs |
| `AnalyticsDashboard.tsx` | Analytics charts and metrics |
| `BannerSettingsAdmin.tsx` | Cookie banner text configuration |
| `ConsentLogsAdmin.tsx` | View cookie consent audit logs |
| `CookieCategoriesAdmin.tsx` | Cookie category management |
| `CookieRegistryAdmin.tsx` | Individual cookie definition management |
| `EmailCommLogTab.tsx` | Email communication log viewer |
| `EmailConsentTab.tsx` | Email consent audit log |
| `EmailSettingsTab.tsx` | Email service configuration (from, reply-to, CASL) |
| `EmailTestConsoleTab.tsx` | Test email sending + WF-10 simulate |
| `EmailWF8TestTab.tsx` | WF-8 email workflow diagnostics |
| `EmailWF9StripeTab.tsx` | WF-9 Stripe payment email workflow setup |
| `FileUpload.tsx` | Generic file upload to Supabase Storage |
| `FooterPagesAdmin.tsx` | Footer/legal page content editor |
| `ImageUpload.tsx` | Image upload to product-images bucket |
| `LegalPagesAdmin.tsx` | Legal page content management |
| `ProductDetailPreview.tsx` | Preview product detail page in admin |
| `SessionHistoryTab.tsx` | Chat session history viewer |
| `SiteSettingsAdmin.tsx` | General site settings key-value editor |

### `src/components/chat/`
| File | Description |
|---|---|
| `ChatConsentModal.tsx` | Consent prompt before chatbot interaction |
| `ChatRegistrationGate.tsx` | Gate that prompts registration after N messages |
| `ChatWidget.tsx` | Buyer-facing AI chatbot widget (product pages) |
| `SellerDashboardChatWidget.tsx` | Seller personal AI assistant widget |
| `VoiceLangSelector.tsx` | Language selector for voice input |
| `useChatSession.ts` | Hook managing chat state, messages, proxy calls |
| `useVoiceInput.ts` | Hook for browser speech recognition |

### `src/components/checkout/`
| File | Description |
|---|---|
| `CheckoutStepper.tsx` | Multi-step checkout progress indicator |
| `StepInformation.tsx` | Checkout shipping/contact info form |
| `StepReview.tsx` | Checkout order review & payment |

### `src/components/landing/`
| File | Description |
|---|---|
| `Benefits.tsx` | Landing page benefits section |
| `CTA.tsx` | Call-to-action section with lead capture form |
| `Footer.tsx` | Site-wide footer with links |
| `ForContractors.tsx` | Landing section for contractors |
| `Header.tsx` | Site-wide header/navigation |
| `Hero.tsx` | Landing page hero section |
| `HowItWorks.tsx` | How it works steps section |
| `OtherProducts.tsx` | Other products showcase section |
| `ProductShowcase.tsx` | Featured products section |
| `TrustSignals.tsx` | Trust signals display section |

### `src/components/product/`
| File | Description |
|---|---|
| `ProductAddOns.tsx` | Product add-on options display |
| `ProductDelivery.tsx` | Delivery info and options |
| `ProductHero.tsx` | Product page hero with image + title |
| `ProductSpecs.tsx` | Product specifications table |
| `ProductStickySidebar.tsx` | Sticky sidebar with price + CTA |

### `src/components/seller/`
| File | Description |
|---|---|
| `AdditionalFeaturesSection.tsx` | Product form additional features |
| `HardwareSection.tsx` | Product form hardware options |
| `SellerAIChatbotCard.tsx` | Card for managing AI chatbot settings |
| `SellerAIConsentModal.tsx` | AI consent acceptance modal |
| `SellerHealthCard.tsx` | Seller health score display card |
| `SellerProductForm.tsx` | Product create/edit form |

### `src/pages/` (top-level)
| File | Description |
|---|---|
| `AboutPage.tsx` | About us page |
| `Admin.tsx` | Admin dashboard container |
| `AdminLogin.tsx` | Admin Google OAuth login |
| `BlogPage.tsx` | Blog listing page |
| `BlogPostPage.tsx` | Individual blog post page |
| `Cart.tsx` | Shopping cart page |
| `Checkout.tsx` | Checkout flow page |
| `ComparePage.tsx` | Product comparison page |
| `FAQPage.tsx` | FAQ page |
| `FooterPage.tsx` | Dynamic footer/legal page |
| `ForContractorsPage.tsx` | For contractors marketing page |
| `ForSellersPage.tsx` | For sellers marketing page |
| `HowItWorksPage.tsx` | How it works page |
| `Index.tsx` | Landing/home page |
| `Login.tsx` | User login page |
| `Messages.tsx` | Messaging/conversations page |
| `NotFound.tsx` | 404 page |
| `OrderConfirmation.tsx` | Order confirmation page |
| `Product.tsx` | Product detail page |
| `ProductCatalog.tsx` | Product browse/catalog page |
| `QuoteRequest.tsx` | Quote request form page |
| `QuoteSuccess.tsx` | Quote request success page |
| `Register.tsx` | User registration page |
| `SearchResults.tsx` | Search results page |
| `UnderConstruction.tsx` | Coming soon / under construction page |

### `src/pages/account/`
| File | Description |
|---|---|
| `AccountLayout.tsx` | Account section layout with sidebar |
| `AccountOverview.tsx` | Account dashboard overview |
| `AccountOrders.tsx` | Order history for buyers |
| `AccountAddresses.tsx` | Saved shipping addresses |
| `AccountSettings.tsx` | Account settings/profile edit |
| `AccountWishlist.tsx` | Saved wishlist items |

### `src/pages/seller/`
| File | Description |
|---|---|
| `SellerDashboard.tsx` | Seller main dashboard |
| `SellerProducts.tsx` | Seller product listing |
| `SellerNewProduct.tsx` | Create new product |
| `SellerEditProduct.tsx` | Edit existing product |
| `SellerProductVariants.tsx` | Manage product variants |
| `SellerDocuments.tsx` | Seller document management |
| `SellerQuotes.tsx` | Seller quote requests listing |
| `SellerQuoteDetail.tsx` | Individual quote detail |
| `SellerOrders.tsx` | Seller order management |
| `SellerAnalytics.tsx` | Seller analytics dashboard |
| `SellerPayouts.tsx` | Seller payout tracking |
| `SellerQuestions.tsx` | Seller Q&A management |
| `SellerMessages.tsx` | Seller messaging |
| `SellerKnowledgeBase.tsx` | Seller knowledge base management |
| `SellerStoreProfile.tsx` | Seller store profile/branding |
| `SellerPending.tsx` | Pending seller approval page |

### `src/pages/client/`, `src/pages/contractor/`, `src/pages/builder/`
Mirror dashboard pages for each role (Dashboard, Projects, Messages, Profile, Matches, Jobs, etc.)

---

## 3. EDGE FUNCTIONS

| Function | Purpose | Auth |
|---|---|---|
| `admin-update-seller-restriction` | Update seller restriction status | JWT |
| `chatbot-proxy` | CORS proxy to n8n chatbot webhooks | JWT (via supabase client) |
| `check-consent` | Check marketing consent for an email | JWT |
| `create-checkout-session` | Create Stripe checkout session | JWT |
| `create-connect-account` | Create Stripe Connect account for sellers | JWT |
| `create-order` | Create order from checkout | JWT |
| `create-wf10-test-user` | Create test user for WF-10 testing | JWT |
| `get-connect-status` | Get Stripe Connect onboarding status | JWT |
| `get-deadline-orders` | Get orders approaching deadlines | JWT |
| `get-order-confirmation` | Get order confirmation details | JWT |
| `get-order-notification-data` | Get data for order notification emails | JWT |
| `get-order-sellers` | Get sellers for an order | JWT |
| `get-unsynced-comms` | Get communication logs not synced to Pinecone | JWT |
| `get-unsynced-content` | Get KB content not synced to Pinecone | JWT |
| `get-wf9-order-items` | Get order items for WF-9 workflow | JWT |
| `get-wf9-order` | Get order data for WF-9 workflow | JWT |
| `log-chat-message` | Log chat message to database | JWT |
| `log-communication` | Log email communication | JWT |
| `log-email-consent` | Log email consent event | JWT |
| `mark-kb-synced` | Mark KB articles as synced to Pinecone | JWT |
| `n8n-proxy` | General CORS proxy to n8n webhooks | JWT |
| `notify-seller-approval` | Send seller approval notification | JWT |
| `notify-seller-registration` | Send seller registration notification | JWT |
| `process-seller-transfers` | Process Stripe transfers to sellers | JWT |
| `save-marketing-consent` | Save marketing consent record | Anonymous (`verify_jwt = false`) |
| `seed-wf10-test-data` | Seed test data for WF-10 | JWT |
| `send-verification-otp` | Send email verification OTP code | Anonymous (`verify_jwt = false`) |
| `simulate-inbound-email` | Simulate inbound email for testing | JWT |
| `stripe-webhook` | Handle Stripe webhook events | x-api-secret (webhook signature) |
| `stripe-webhook-test` | Test Stripe webhook handling | JWT |
| `submit-cabinet-match` | Submit cabinet matching request | JWT |
| `test-integration` | CORS proxy for integration health checks | JWT |
| `update-communication-status` | Update email delivery status | JWT |
| `update-order-status` | Update order status | JWT |
| `verify-otp-code` | Verify email OTP code | Anonymous (`verify_jwt = false`) |

---

## 4. DATABASE TABLES

| Table | ~Columns | Description |
|---|---|---|
| `admin_emails` | 3 | Admin email whitelist for `is_admin()` checks |
| `analytics_events` | 17 | Page view and event tracking |
| `analytics_sessions` | 16 | Session-level analytics aggregation |
| `blog_posts` | 15 | Blog content management |
| `categories` | 8 | Product category hierarchy |
| `chat_messages` | 10 | Individual chatbot messages |
| `chat_sessions` | 15 | Chatbot session tracking with role/mode |
| `chat_summaries` | 5 | AI-generated chat session summaries |
| `chatbot_missed_attempts` | 5 | Tracks when users try inactive chatbots |
| `communication_logs` | 24 | Email send/receive audit trail |
| `consent_logs` | 9 | Cookie consent audit trail |
| `contractor_details` | 9 | Contractor profile extensions |
| `conversation_messages` | 6 | Direct messaging between users |
| `conversations` | 10 | Buyer-seller conversation threads |
| `cookie_categories` | 10 | Cookie consent categories |
| `cookie_definitions` | 10 | Individual cookie definitions |
| `email_consent_log` | 11 | CASL email consent audit |
| `email_templates` | 18 | Email template storage |
| `email_verification_codes` | 7 | OTP codes for email verification |
| `faq_items` | 9 | FAQ entries |
| `footer_pages` | 7 | Dynamic footer/legal pages |
| `integrations` | 14 | External service registry |
| `marketing_consents` | 8 | CASL marketing consent records |
| `messages` | 10 | Legacy messaging table |
| `newsletter_subscribers` | 8 | Newsletter subscription list |
| `order_disputes` | 13 | Order dispute tracking |
| `order_items` | 11 | Line items within orders |
| `orders` | 44 | Order management with Stripe fields |
| `platform_knowledge_base` | 7 | Platform-level KB articles |
| `product_compatible_appliances` | 11 | Appliance compatibility data |
| `product_options` | 12 | Product add-on options |
| `product_questions` | 15 | Product Q&A |
| `product_reviews` | 11 | Product reviews with moderation |
| `profiles` | 30+ | User profiles (all roles) |
| `quote_request_items` | 7 | Items within quote requests |
| `quote_requests` | 16 | Quote request management |
| `seller_knowledge_base` | 8 | Seller-specific KB articles |
| `shipping_addresses` | 13 | Saved shipping addresses |
| `site_settings` | ~5 | Global key-value configuration |
| `trust_signals` | 8 | Trust badges/signals |
| `wishlists` | 4 | User wishlists |

Additional tables referenced but not in schema dump: `seller_ai_consents`, `product_variants`, `projects`, `project_contractors`, `seller_payouts`, `stripe_events`, `webhook_logs`.

---

## 5. HOOKS & CONTEXTS

### Hooks (`src/hooks/`)
| Hook | Purpose |
|---|---|
| `useAuth.tsx` | Re-exports `useAuthContext` from AuthContext |
| `useAnalytics.ts` | Tracks page views and events to analytics_events table |
| `usePageMeta.ts` | Sets page title and meta description |
| `useProductCart.ts` | Product-specific cart operations |
| `useProductData.ts` | Fetches product data with options and reviews |
| `useProfile.tsx` | Fetches and caches current user's profile |
| `use-mobile.tsx` | Responsive breakpoint detection |
| `use-toast.ts` | Toast notification hook |

### Contexts (`src/contexts/`)
| Context | Purpose |
|---|---|
| `AuthContext.tsx` | Supabase auth session state (user, session, loading, signOut) |
| `CartContext.tsx` | Shopping cart state (items, add, remove, quantities) |
| `CheckoutContext.tsx` | Checkout flow state (shipping, payment, steps) |
| `CompareContext.tsx` | Product comparison selection state |
| `WishlistContext.tsx` | Wishlist state synced with Supabase |

### Chat-specific hooks
| Hook | Purpose |
|---|---|
| `useChatSession.ts` | Chat message state, consent, proxy calls to n8n |
| `useVoiceInput.ts` | Browser SpeechRecognition wrapper |

---

## 6. INTEGRATIONS

| Service | Status | Notes |
|---|---|---|
| **Supabase Auth** | ✅ Connected | Email/password + Google OAuth (admin). `handle_new_user` trigger creates profiles |
| **Stripe Payments** | ✅ Configured | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` set. Checkout sessions, Connect accounts, webhooks |
| **n8n Webhooks** | ✅ Configured | `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET` set. Proxied via `chatbot-proxy` and `n8n-proxy` edge functions |
| **Mailgun** | ⚙️ Via n8n | Email sending routed through n8n WF-8 workflow, not direct Mailgun SDK |
| **Pinecone** | ⚙️ Via n8n | KB sync flags in DB (`pinecone_synced`), actual sync happens in n8n workflows |
| **AI Chatbot** | ✅ Active | Uses n8n `seller-chatbot` webhook. Session tracking in `chat_sessions`/`chat_messages` |
| **Speech Recognition** | ✅ Browser API | Web Speech API for voice input in chat widgets |
| **Supabase Storage** | ✅ Connected | Buckets: `product-images` (public), `product-documents` (public) |
| **Lovable AI** | ✅ Available | `LOVABLE_API_KEY` secret set. Not currently used in frontend code directly |

---

## 7. RECENT CHANGES

Based on the conversation history and code state, the most recently modified files include:

1. `src/components/chat/useChatSession.ts` — Added top-level `user_role` to payload
2. `src/components/chat/SellerDashboardChatWidget.tsx` — Changed `userRole` to `"authenticated_seller"`
3. `src/components/chat/ChatWidget.tsx` — Buyer chatbot widget (voice, registration gate)
4. `src/components/admin/AdminChatbotControlPanel.tsx` — Chatbot settings panel
5. `src/components/admin/EmailWF9StripeTab.tsx` — Stripe payment email workflow
6. `src/components/admin/EmailWF8TestTab.tsx` — Email workflow diagnostics
7. `src/components/admin/EmailTestConsoleTab.tsx` — Email test console
8. `src/components/admin/AdminIntegrationsTab.tsx` — Integration management
9. `src/components/admin/AdminWebhooksTab.tsx` — Webhook management
10. `src/components/seller/SellerAIChatbotCard.tsx` — Seller AI chatbot settings card
11. `supabase/functions/chatbot-proxy/index.ts` — Chatbot CORS proxy
12. `src/components/admin/SiteSettingsAdmin.tsx` — Site settings editor
13. `src/components/admin/EmailSettingsTab.tsx` — Email settings
14. `src/components/admin/SessionHistoryTab.tsx` — Chat session history
15. `src/pages/seller/SellerKnowledgeBase.tsx` — Seller KB page
16. `src/components/seller/SellerAIConsentModal.tsx` — AI consent modal
17. `src/components/admin/AdminSellersTab.tsx` — Seller management
18. `src/components/admin/AdminSellerHealthTab.tsx` — Seller health scores
19. `src/pages/seller/SellerOrders.tsx` — Seller order management
20. `src/pages/Product.tsx` — Product detail page

*(Exact dates not available — no git access)*

---

## 8. KNOWN ISSUES

- **No TODO/FIXME comments found** in the codebase.
- **`console.error` patterns** are all standard error handling (auth errors, fetch failures, 404 logging) — no unhandled issues.
- **`seller_ai_consents` table** is referenced via `(supabase as any)` casting, meaning it's not in the generated types — likely added after last type generation or manually created.
- **`product_variants` table** is referenced in `SellerProductVariants.tsx` but not visible in the types file excerpt — may need type regeneration.
- **`site_settings` table** is sometimes accessed via `as any` cast — same type-gen gap.
- **`webhook_logs` and `stripe_events` tables** are referenced in admin UI but not in the provided schema types.
- **Production gate**: The app shows `UnderConstruction` on production domains unless `?preview=true` is passed.
- **Chat user_role debugging**: Recent fix added `user_role` as top-level field in payload — verify n8n is now reading it correctly.

---

## 9. SITE SETTINGS KEYS

### Company Info Group
`company_name`, `company_email`, `company_phone`, `company_address`, `company_city`, `company_province`, `company_country`

### Legal & Compliance Group
`copyright_text`, `tax_notice`, `discount_disclaimer`, `privacy_contact_email`

### Consent Text Group
`cookie_banner_text`, `newsletter_consent_text`, `cta_consent_text`

### Cookie Banner Settings
`cookie_banner_text`, `cookie_accept_text`, `cookie_reject_text`, `cookie_settings_text`, `cookie_policy_link_text`, `cookie_banner_version`

### Email Settings (`email_%` prefix)
`email_default_from_email`, `email_default_from_name`, `email_default_reply_to`, `email_casl_company_name`, `email_casl_address`, `email_casl_support_email`, `email_unsubscribe_url`, `email_pause_marketing`, `email_pause_lifecycle`

### Chatbot Settings (`chatbot_%` prefix — dynamically loaded)
`chatbot_auto_open_delay_seconds`, `chatbot_consent_modal_enabled`, `chatbot_guest_message_limit`

### AI Assistant Descriptions
`ai_storefront_assistant_short_desc`, `ai_storefront_assistant_full_desc`, `ai_personal_assistant_short_desc`, `ai_personal_assistant_full_desc`

### Stripe/WF-9 Webhook URLs
`stripe_checkout_completed_webhook_url`, `stripe_checkout_expired_webhook_url`, `stripe_charge_refunded_webhook_url`

---

## 10. EMAIL TEMPLATES

### Referenced `template_key` values in code:
| Key | Used In |
|---|---|
| `account_welcome` | EmailTestConsoleTab (WF-8 test), EmailWF8TestTab |
| `review_request` | EmailWF8TestTab (consent test scenarios) |
| `newsletter` | EmailWF8TestTab (marketing pause test) |
| `order_confirmation` | WF-9 REQUIRED_TEMPLATES |
| `payment_receipt` | WF-9 REQUIRED_TEMPLATES |
| `payment_failed` | WF-9 REQUIRED_TEMPLATES |
| `refund_processed` | WF-9 REQUIRED_TEMPLATES |

Templates are managed dynamically via `AdminEmailTemplatesTab.tsx` — additional keys may exist in the database beyond those hardcoded in the codebase.
