import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
import FooterPagesAdmin from "@/components/admin/FooterPagesAdmin";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import SiteSettingsAdmin from "@/components/admin/SiteSettingsAdmin";
import LegalPagesAdmin from "@/components/admin/LegalPagesAdmin";
import CookieCategoriesAdmin from "@/components/admin/CookieCategoriesAdmin";
import CookieRegistryAdmin from "@/components/admin/CookieRegistryAdmin";
import ConsentLogsAdmin from "@/components/admin/ConsentLogsAdmin";
import BannerSettingsAdmin from "@/components/admin/BannerSettingsAdmin";
import AdminSidebar, { type AdminSection } from "@/components/admin/AdminSidebar";
import AdminDashboardTab from "@/components/admin/AdminDashboardTab";
import AdminOrdersTab from "@/components/admin/AdminOrdersTab";
import AdminCustomersTab from "@/components/admin/AdminCustomersTab";
import AdminIntegrationsTab from "@/components/admin/AdminIntegrationsTab";
import AdminQuotesTab from "@/components/admin/AdminQuotesTab";
import AdminProductsTab from "@/components/admin/AdminProductsTab";
import AdminTrustSignalsTab from "@/components/admin/AdminTrustSignalsTab";
import AdminFAQTab from "@/components/admin/AdminFAQTab";
import AdminReviewsTab from "@/components/admin/AdminReviewsTab";
import AdminEmailTemplatesTab from "@/components/admin/AdminEmailTemplatesTab";
import AdminBlogTab from "@/components/admin/AdminBlogTab";
import AdminNewsletterTab from "@/components/admin/AdminNewsletterTab";

const Admin = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) { setIsAdmin(false); return; }
      const { data } = await supabase
        .from("admin_emails")
        .select("id")
        .eq("email", user.email || "")
        .maybeSingle();
      setIsAdmin(!!data);
    };
    if (user) checkAdmin();
  }, [user]);

  useEffect(() => {
    if (!loading && !user) navigate("/admin/login");
  }, [user, loading, navigate]);

  if (loading || isAdmin === null) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  if (!user) return null;
  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">Your account ({user.email}) is not authorized to access the admin panel.</p>
        <Button variant="outline" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Sign Out</Button>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <AdminDashboardTab onNavigateToOrders={() => setActiveSection("orders")} />;
      case "orders":
        return <AdminOrdersTab />;
      case "quotes":
        return <AdminQuotesTab />;
      case "products":
        return <AdminProductsTab />;
      case "customers":
        return <AdminCustomersTab />;
      case "reviews":
        return <AdminReviewsTab />;
      case "email":
        return <AdminEmailTemplatesTab />;
      case "integrations":
        return <AdminIntegrationsTab />;
      case "trust-signals":
        return <AdminTrustSignalsTab />;
      case "faq":
        return <AdminFAQTab />;
      case "blog":
        return <AdminBlogTab />;
      case "newsletter":
        return <AdminNewsletterTab />;
      case "content":
        return (
          <div className="space-y-8">
            <FooterPagesAdmin />
            <LegalPagesAdmin />
            <AnalyticsDashboard />
          </div>
        );
      case "cookie-manager":
        return (
          <div className="space-y-8">
            <BannerSettingsAdmin />
            <CookieCategoriesAdmin />
            <CookieRegistryAdmin />
            <ConsentLogsAdmin />
          </div>
        );
      case "settings":
        return <SiteSettingsAdmin />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-border bg-card">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-serif font-bold text-foreground">FitMatch Admin</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
            <Button variant="outline" size="sm" className="border-2" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <AdminSidebar
          active={activeSection}
          onNavigate={setActiveSection}
        />

        <main className="flex-1 p-6 min-w-0 overflow-x-auto">
          <h2 className="text-xl font-serif font-bold text-foreground mb-4 capitalize">
            {activeSection === "email" ? "Email Communication" : activeSection === "cookie-manager" ? "Cookie Manager" : activeSection === "trust-signals" ? "Trust Signals" : activeSection === "faq" ? "FAQ" : activeSection === "reviews" ? "Reviews" : activeSection === "blog" ? "Blog" : activeSection === "newsletter" ? "Newsletter" : activeSection}
          </h2>
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default Admin;
