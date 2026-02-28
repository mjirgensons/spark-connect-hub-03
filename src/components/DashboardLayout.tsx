import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Search,
  FolderOpen,
  MessageSquare,
  User,
  Briefcase,
  Package,
  PlusCircle,
  FileText,
  BarChart3,
  ShoppingCart,
  Menu,
  X,
  LogOut,
  Store,
} from "lucide-react";

type Role = "client" | "contractor" | "seller" | "builder";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

const navConfig: Record<Role, NavItem[]> = {
  client: [
    { label: "Dashboard", to: "/client/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Matches", to: "/client/matches", icon: <Search size={18} /> },
    { label: "New Match", to: "/client/match/new", icon: <PlusCircle size={18} /> },
    { label: "Projects", to: "/client/projects", icon: <FolderOpen size={18} /> },
    { label: "Messages", to: "/client/messages", icon: <MessageSquare size={18} /> },
    { label: "Profile", to: "/client/profile", icon: <User size={18} /> },
  ],
  contractor: [
    { label: "Dashboard", to: "/contractor/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Jobs", to: "/contractor/jobs", icon: <Briefcase size={18} /> },
    { label: "Projects", to: "/contractor/projects", icon: <FolderOpen size={18} /> },
    { label: "Messages", to: "/contractor/messages", icon: <MessageSquare size={18} /> },
    { label: "Profile", to: "/contractor/profile", icon: <User size={18} /> },
  ],
  seller: [
    { label: "Dashboard", to: "/seller/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Products", to: "/seller/products", icon: <Package size={18} /> },
    { label: "Add Product", to: "/seller/products/new", icon: <PlusCircle size={18} /> },
    { label: "Documents", to: "/seller/documents", icon: <FileText size={18} /> },
    { label: "Quotes", to: "/seller/quotes", icon: <FileText size={18} /> },
    { label: "Orders", to: "/seller/orders", icon: <ShoppingCart size={18} /> },
    { label: "Analytics", to: "/seller/analytics", icon: <BarChart3 size={18} /> },
    { label: "Messages", to: "/seller/messages", icon: <MessageSquare size={18} /> },
    { label: "Store Profile", to: "/seller/store-profile", icon: <Store size={18} /> },
  ],
  builder: [
    { label: "Dashboard", to: "/builder/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Projects", to: "/builder/projects", icon: <FolderOpen size={18} /> },
    { label: "New Project", to: "/builder/projects/new", icon: <PlusCircle size={18} /> },
    { label: "Matches", to: "/builder/matches", icon: <Search size={18} /> },
    { label: "Messages", to: "/builder/messages", icon: <MessageSquare size={18} /> },
    { label: "Profile", to: "/builder/profile", icon: <User size={18} /> },
  ],
};

const roleLabels: Record<Role, string> = {
  client: "Client",
  contractor: "Contractor",
  seller: "Seller",
  builder: "Builder",
};

interface DashboardLayoutProps {
  role: Role;
}

const DashboardLayout = ({ role }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const items = navConfig[role];

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r-2 border-foreground bg-background transition-transform duration-200 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ boxShadow: "4px 0 0 0 hsl(var(--foreground))" }}
      >
        <div className="flex h-14 items-center justify-between border-b-2 border-foreground px-4">
          <span className="font-sans text-lg font-bold tracking-tight">
            {roleLabels[role]} Panel
          </span>
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 font-sans text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-foreground text-background"
                    : "hover:bg-muted"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b-2 border-foreground px-4">
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <span className="font-sans text-sm">
            {session?.user?.email ?? "User"}
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut size={14} className="mr-1" />
            Log Out
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
