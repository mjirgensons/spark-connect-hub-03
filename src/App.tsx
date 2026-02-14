import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const isPreview = window.location.hostname.includes("preview") || 
  window.location.hostname === "localhost" || 
  window.location.hostname === "127.0.0.1";

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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
