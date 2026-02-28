import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { HideChatOnAdmin } from "./components/HideChatOnAdmin";
import { useAnalytics } from "@/hooks/useAnalytics";
import "./App.css";
import Index from "./pages/Index";
import Product from "./pages/Product";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import FooterPage from "./pages/FooterPage";
import UnderConstruction from "./pages/UnderConstruction";
import ProductCatalog from "./pages/ProductCatalog";
import HowItWorksPage from "./pages/HowItWorksPage";
import ForContractorsPage from "./pages/ForContractorsPage";
import ForSellersPage from "./pages/ForSellersPage";
import AboutPage from "./pages/AboutPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientMatches from "./pages/client/ClientMatches";
import ClientNewMatch from "./pages/client/ClientNewMatch";
import ClientProjects from "./pages/client/ClientProjects";
import ClientProjectDetail from "./pages/client/ClientProjectDetail";
import ClientMessages from "./pages/client/ClientMessages";
import ClientProfile from "./pages/client/ClientProfile";
import ContractorDashboard from "./pages/contractor/ContractorDashboard";
import ContractorJobs from "./pages/contractor/ContractorJobs";
import ContractorJobDetail from "./pages/contractor/ContractorJobDetail";
import ContractorProjects from "./pages/contractor/ContractorProjects";
import ContractorProjectDetail from "./pages/contractor/ContractorProjectDetail";
import ContractorMessages from "./pages/contractor/ContractorMessages";
import ContractorProfile from "./pages/contractor/ContractorProfile";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProducts from "./pages/seller/SellerProducts";
import SellerNewProduct from "./pages/seller/SellerNewProduct";
import SellerEditProduct from "./pages/seller/SellerEditProduct";
import SellerDocuments from "./pages/seller/SellerDocuments";
import SellerQuotes from "./pages/seller/SellerQuotes";
import SellerQuoteDetail from "./pages/seller/SellerQuoteDetail";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerAnalytics from "./pages/seller/SellerAnalytics";
import SellerMessages from "./pages/seller/SellerMessages";
import SellerStoreProfile from "./pages/seller/SellerStoreProfile";
import BuilderDashboard from "./pages/builder/BuilderDashboard";
import BuilderProjects from "./pages/builder/BuilderProjects";
import BuilderNewProject from "./pages/builder/BuilderNewProject";
import BuilderMatches from "./pages/builder/BuilderMatches";
import BuilderMessages from "./pages/builder/BuilderMessages";
import BuilderProfile from "./pages/builder/BuilderProfile";
import RoleGuard from "./components/RoleGuard";
import DashboardLayout from "./components/DashboardLayout";

const PRODUCTION_DOMAINS = ["fitmatch.ca", "www.fitmatch.ca", "spark-connect-hub-03.lovable.app"];
const isProduction = PRODUCTION_DOMAINS.includes(window.location.hostname);
const isPreview = !isProduction;

const queryClient = new QueryClient();

const AnalyticsTracker = () => {
  useAnalytics();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <HideChatOnAdmin />
        <AnalyticsTracker />
        <Routes>
          <Route path="/" element={isPreview ? <Index /> : <UnderConstruction />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/page/:slug" element={<FooterPage />} />
          <Route path="/coming-soon" element={<UnderConstruction />} />

          {/* Public routes */}
          <Route path="/browse" element={<ProductCatalog />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/for-contractors" element={<ForContractorsPage />} />
          <Route path="/for-sellers" element={<ForSellersPage />} />
          <Route path="/about" element={<AboutPage />} />
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
            <Route path="dashboard" element={<BuilderDashboard />} />
            <Route path="projects" element={<BuilderProjects />} />
            <Route path="projects/new" element={<BuilderNewProject />} />
            <Route path="matches" element={<BuilderMatches />} />
            <Route path="messages" element={<BuilderMessages />} />
            <Route path="profile" element={<BuilderProfile />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
