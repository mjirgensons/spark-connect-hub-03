import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import SearchBar from "@/components/SearchBar";

type NavItem =
  | { label: string; type: "anchor"; href: string }
  | { label: string; type: "route"; to: string };

const navLinks: NavItem[] = [
  { label: "Browse", type: "route", to: "/browse" },
  { label: "Cabinets", type: "anchor", href: "#cabinets" },
  { label: "More Products", type: "anchor", href: "#other-products" },
  { label: "How It Works", type: "route", to: "/how-it-works" },
  { label: "Benefits", type: "anchor", href: "#benefits" },
  { label: "For Contractors", type: "route", to: "/for-contractors" },
  { label: "For Sellers", type: "route", to: "/for-sellers" },
  { label: "Contact", type: "anchor", href: "#contact" },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const { itemCount } = useCart();

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isHome) {
      e.preventDefault();
      navigate("/" + href);
    }
    setIsMenuOpen(false);
  };

  const linkClass = "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors";

  const renderNavItem = (item: NavItem) => {
    if (item.type === "route") {
      return (
        <Link
          key={item.label}
          to={item.to}
          className={linkClass}
          onClick={() => setIsMenuOpen(false)}
        >
          {item.label}
        </Link>
      );
    }
    return (
      <a
        key={item.label}
        href={isHome ? item.href : "/" + item.href}
        className={linkClass}
        onClick={(e) => handleAnchorClick(e, item.href)}
      >
        {item.label}
      </a>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-serif font-bold text-xl">F</span>
            </div>
            <div className="hidden sm:block min-w-0">
              <span className="font-serif text-xl font-semibold text-foreground">Fit-Match</span>
              <span className="block text-xs text-muted-foreground -mt-1">Luxury Cabinet Exchange</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(renderNavItem)}
          </nav>

          <div className="flex items-center gap-1">
            <SearchBar />
            <Link to="/cart" className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full leading-none">{itemCount}</span>
              )}
            </Link>
            <div className="hidden md:flex items-center gap-2 ml-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              {navLinks.map(renderNavItem)}
              <Link to="/cart" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setIsMenuOpen(false)}>
                <ShoppingCart className="w-4 h-4" />
                Cart {itemCount > 0 && `(${itemCount})`}
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
