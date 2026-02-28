import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { HideChatOnAdmin } from "./components/HideChatOnAdmin";
import CookieConsent from "./components/CookieConsent";
import { useAnalytics } from "@/hooks/useAnalytics";
import "./App.css";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import Index from "./pages/Index";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import NotFound from "./pages/NotFound";
import FooterPage from "./pages/FooterPage";
import UnderConstruction from "./pages/UnderConstruction";
import ProductCatalog from "./pages/ProductCatalog";
import HowItWorksPage from "./pages/HowItWorksPage";
import ForContractorsPage from "./pages/ForContractorsPage";
import ForSellersPage from "./pages/ForSellersPage";
import AboutPage from "./pages/AboutPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SearchResults from "./pages/SearchResults";
import QuoteSuccess from "./pages/QuoteSuccess";
import RoleGuard from "./components/RoleGuard";
import DashboardLayout from "./components/DashboardLayout";

// Lazy-loaded: Admin
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Admin = lazy(() => import("./pages/Admin"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));

// Lazy-loaded: Client dashboard
const ClientDashboard = lazy(() => import("./pages/client/ClientDashboard"));
const ClientMatches = lazy(() => import("./pages/client/ClientMatches"));
const ClientNewMatch = lazy(() => import("./pages/client/ClientNewMatch"));
const ClientProjects = lazy(() => import("./pages/client/ClientProjects"));
const ClientProjectDetail = lazy(() => import("./pages/client/ClientProjectDetail"));
const ClientMessages = lazy(() => import("./pages/client/ClientMessages"));
const ClientProfile = lazy(() => import("./pages/client/ClientProfile"));

// Lazy-loaded: Contractor dashboard
const ContractorDashboard = lazy(() => import("./pages/contractor/ContractorDashboard"));
const ContractorJobs = lazy(() => import("./pages/contractor/ContractorJobs"));
const ContractorJobDetail = lazy(() => import("./pages/contractor/ContractorJobDetail"));
const ContractorProjects = lazy(() => import("./pages/contractor/ContractorProjects"));
const ContractorProjectDetail = lazy(() => import("./pages/contractor/ContractorProjectDetail"));
const ContractorMessages = lazy(() => import("./pages/contractor/ContractorMessages"));
const ContractorProfile = lazy(() => import("./pages/contractor/ContractorProfile"));

// Lazy-loaded: Seller dashboard
const SellerDashboard = lazy(() => import("./pages/seller/SellerDashboard"));
const SellerProducts = lazy(() => import("./pages/seller/SellerProducts"));
const SellerNewProduct = lazy(() => import("./pages/seller/SellerNewProduct"));
const SellerEditProduct = lazy(() => import("./pages/seller/SellerEditProduct"));
const SellerDocuments = lazy(() => import("./pages/seller/SellerDocuments"));
const SellerQuotes = lazy(() => import("./pages/seller/SellerQuotes"));
const SellerQuoteDetail = lazy(() => import("./pages/seller/SellerQuoteDetail"));
const SellerOrders = lazy(() => import("./pages/seller/SellerOrders"));
const SellerAnalytics = lazy(() => import("./pages/seller/SellerAnalytics"));
const SellerMessages = lazy(() => import("./pages/seller/SellerMessages"));
const SellerStoreProfile = lazy(() => import("./pages/seller/SellerStoreProfile"));

// Lazy-loaded: Builder dashboard
const BuilderDashboard = lazy(() => import("./pages/builder/BuilderDashboard"));
const BuilderProjects = lazy(() => import("./pages/builder/BuilderProjects"));
const BuilderNewProject = lazy(() => import("./pages/builder/BuilderNewProject"));
const BuilderMatches = lazy(() => import("./pages/builder/BuilderMatches"));
const BuilderMessages = lazy(() => import("./pages/builder/BuilderMessages"));
const BuilderProfile = lazy(() => import("./pages/builder/BuilderProfile"));

// Lazy-loaded: Account pages
const AccountLayout = lazy(() => import("./pages/account/AccountLayout"));
const AccountOverview = lazy(() => import("./pages/account/AccountOverview"));
const AccountOrders = lazy(() => import("./pages/account/AccountOrders"));
const AccountAddresses = lazy(() => import("./pages/account/AccountAddresses"));
const AccountSettings = lazy(() => import("./pages/account/AccountSettings"));
const AccountWishlist = lazy(() => import("./pages/account/AccountWishlist"));

// Lazy-loaded: Heavy pages
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const QuoteRequest = lazy(() => import("./pages/QuoteRequest"));

const PRODUCTION_DOMAINS = ["fitmatch.ca", "www.fitmatch.ca", "spark-connect-hub-03.lovable.app"];
const isProduction = PRODUCTION_DOMAINS.includes(window.location.hostname);
const isPreview = !isProduction;

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin" />
  </div>
);

const AnalyticsTracker = () => {
  useAnalytics();
  return null;
};

// Cart provider wraps all routes for global cart state
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
      <WishlistProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <HideChatOnAdmin />
        <AnalyticsTracker />
        <CookieConsent />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={isPreview ? <Index /> : <UnderConstruction />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/page/:slug" element={<FooterPage />} />
          <Route path="/coming-soon" element={<UnderConstruction />} />

          {/* Public routes */}
          <Route path="/browse" element={<ProductCatalog />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/quote-request" element={<QuoteRequest />} />
          <Route path="/quote-success" element={<QuoteSuccess />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/for-contractors" element={<ForContractorsPage />} />
          <Route path="/for-sellers" element={<ForSellersPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Client routes */}
          <Route path="/client" element={<RoleGuard allowedRoles={['client']}><DashboardLayout role="client" /></RoleGuard>}>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="matches" element={<ClientMatches />} />
            <Route path="match/new" element={<ClientNewMatch />} />
            <Route path="projects" element={<ClientProjects />} />
            <Route path="projects/:projectId" element={<ClientProjectDetail />} />
            <Route path="messages" element={<ClientMessages />} />
            <Route path="profile" element={<ClientProfile />} />
          </Route>

          {/* Contractor routes */}
          <Route path="/contractor" element={<RoleGuard allowedRoles={['contractor']}><DashboardLayout role="contractor" /></RoleGuard>}>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<ContractorDashboard />} />
            <Route path="jobs" element={<ContractorJobs />} />
            <Route path="jobs/:jobId" element={<ContractorJobDetail />} />
            <Route path="projects" element={<ContractorProjects />} />
            <Route path="projects/:projectId" element={<ContractorProjectDetail />} />
            <Route path="messages" element={<ContractorMessages />} />
            <Route path="profile" element={<ContractorProfile />} />
          </Route>

          {/* Seller routes */}
          <Route path="/seller" element={<RoleGuard allowedRoles={['seller']}><DashboardLayout role="seller" /></RoleGuard>}>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="products" element={<SellerProducts />} />
            <Route path="products/new" element={<SellerNewProduct />} />
            <Route path="products/:productId" element={<SellerEditProduct />} />
            <Route path="documents" element={<SellerDocuments />} />
            <Route path="quotes" element={<SellerQuotes />} />
            <Route path="quotes/:quoteId" element={<SellerQuoteDetail />} />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="analytics" element={<SellerAnalytics />} />
            <Route path="messages" element={<SellerMessages />} />
            <Route path="store-profile" element={<SellerStoreProfile />} />
          </Route>

          {/* Builder routes */}
          <Route path="/builder" element={<RoleGuard allowedRoles={['builder']}><DashboardLayout role="builder" /></RoleGuard>}>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<BuilderDashboard />} />
            <Route path="projects" element={<BuilderProjects />} />
            <Route path="projects/new" element={<BuilderNewProject />} />
            <Route path="matches" element={<BuilderMatches />} />
            <Route path="messages" element={<BuilderMessages />} />
            <Route path="profile" element={<BuilderProfile />} />
          </Route>

          {/* Account routes (any authenticated user) */}
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<AccountOverview />} />
            <Route path="orders" element={<AccountOrders />} />
            <Route path="wishlist" element={<AccountWishlist />} />
            <Route path="addresses" element={<AccountAddresses />} />
            <Route path="settings" element={<AccountSettings />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
      </WishlistProvider>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
