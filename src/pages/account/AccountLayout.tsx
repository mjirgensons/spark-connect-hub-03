import { useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, LayoutDashboard, Package, MapPin, Settings, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { to: "/account", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/account/orders", label: "Orders", icon: Package, end: false },
  { to: "/account/addresses", label: "Addresses", icon: MapPin, end: false },
  { to: "/account/settings", label: "Settings", icon: Settings, end: false },
];

const AccountLayout = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const initials = (profile?.full_name || user.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors border-2 ${
      isActive
        ? "bg-foreground text-background border-foreground"
        : "border-transparent hover:bg-accent hover:border-border"
    }`;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top tabs */}
      <div className="md:hidden border-b-2 border-border bg-background sticky top-0 z-30">
        <div className="flex items-center gap-2 px-4 py-3">
          <Avatar className="h-8 w-8 border-2 border-border">
            <AvatarFallback className="bg-muted text-foreground text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-bold truncate">{profile?.full_name || user.email}</span>
        </div>
        <div className="flex overflow-x-auto px-2 pb-2 gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap border-2 ${
                  isActive
                    ? "bg-foreground text-background border-foreground"
                    : "border-border hover:bg-accent"
                }`
              }
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-64 min-h-screen border-r-2 border-border bg-background sticky top-0">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-1">
              <Avatar className="h-12 w-12 border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--foreground))]">
                <AvatarFallback className="bg-muted text-foreground font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="font-bold text-sm truncate">{profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <Separator className="border-border" />
          <nav className="flex-1 py-4 space-y-1 px-2">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="p-4">
            <Button
              variant="outline"
              className="w-full border-2 justify-start gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 max-w-4xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AccountLayout;
