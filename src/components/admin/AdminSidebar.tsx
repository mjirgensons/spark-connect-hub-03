import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Package,
  Users,
  Plug,
  FileEdit,
  Cookie,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Shield,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export type AdminSection =
  | "dashboard"
  | "orders"
  | "quotes"
  | "products"
  | "customers"
  | "reviews"
  | "integrations"
  | "content"
  | "trust-signals"
  | "faq"
  | "cookie-manager"
  | "settings";

interface AdminSidebarProps {
  active: AdminSection;
  onNavigate: (section: AdminSection) => void;
  productCount?: number;
}

const navItems: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "quotes", label: "Quotes", icon: FileText },
  { id: "products", label: "Products", icon: Package },
  { id: "customers", label: "Customers", icon: Users },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "content", label: "Content", icon: FileEdit },
  { id: "trust-signals", label: "Trust Signals", icon: Shield },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "cookie-manager", label: "Cookie Manager", icon: Cookie },
  { id: "settings", label: "Settings", icon: Settings },
];

const AdminSidebar = ({ active, onNavigate, productCount }: AdminSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleNav = (id: AdminSection) => {
    onNavigate(id);
    if (isMobile) setMobileOpen(false);
  };

  const sidebarContent = (
    <nav className="flex flex-col gap-1 p-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors border-2 border-transparent",
              collapsed && !isMobile ? "justify-center px-2" : "",
              isActive
                ? "bg-foreground text-background border-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
            title={collapsed ? item.label : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {(!collapsed || isMobile) && (
              <span className="truncate">
                {item.label}
                {item.id === "products" && productCount !== undefined ? ` (${productCount})` : ""}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  // Mobile: hamburger overlay
  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 left-4 z-50 border-2 shadow-[2px_2px_0px_0px_hsl(var(--foreground))]"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 bg-background/80 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="fixed left-0 top-0 bottom-0 w-60 bg-card border-r-2 border-border z-50 overflow-y-auto pt-16">
              {sidebarContent}
            </aside>
          </>
        )}
      </>
    );
  }

  // Desktop: persistent sidebar
  return (
    <aside
      className={cn(
        "shrink-0 border-r-2 border-border bg-card min-h-[calc(100vh-65px)] transition-all duration-200 relative",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      {sidebarContent}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-4 w-6 h-6 border-2 border-border bg-card hover:bg-accent"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </Button>
    </aside>
  );
};

export default AdminSidebar;
