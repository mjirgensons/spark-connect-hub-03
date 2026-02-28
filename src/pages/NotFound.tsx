import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  LayoutGrid,
  ChefHat,
  Bath,
  HelpCircle,
  FileText,
  Mail,
  ArrowRight,
} from "lucide-react";

const quickLinks = [
  { label: "Browse All Cabinets", to: "/browse", icon: LayoutGrid },
  { label: "Kitchen Cabinets", to: "/browse?category=kitchen", icon: ChefHat },
  { label: "Bathroom Vanities", to: "/browse?category=vanity", icon: Bath },
  { label: "FAQ", to: "/faq", icon: HelpCircle },
  { label: "How It Works", to: "/how-it-works", icon: HelpCircle },
  { label: "Request a Quote", to: "/quote-request", icon: FileText },
  { label: "Contact Us", to: "/about", icon: Mail },
];

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-20 md:pt-24">
        {/* Hero */}
        <section className="container mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-block border-4 border-foreground px-8 py-4 shadow-[8px_8px_0px_0px_hsl(var(--foreground))] mb-8">
            <h1 className="font-serif text-7xl md:text-8xl font-bold text-foreground leading-none">
              404
            </h1>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground mt-6 mb-3">
            This page doesn't exist — but great cabinets do.
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-10">
            The page you're looking for may have been moved or removed. Let's get you back on track.
          </p>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="flex gap-2 max-w-lg mx-auto mb-16"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cabinets by name, style, color..."
                className="border-2 border-foreground h-12 pl-10 text-base shadow-[4px_4px_0px_0px_hsl(var(--foreground))]"
              />
            </div>
            <Button
              type="submit"
              className="h-12 px-6 border-2 border-foreground font-bold shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Search className="w-4 h-4" />
            </Button>
          </form>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto mb-16">
            {quickLinks.map(({ label, to, icon: Icon }) => (
              <Link key={label} to={to}>
                <Card className="border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] transition-all h-full">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Icon className="w-5 h-5 shrink-0 text-foreground" />
                    <span className="font-medium text-sm text-foreground">{label}</span>
                    <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <Button size="xl" asChild className="border-2 border-foreground font-bold shadow-[6px_6px_0px_0px_hsl(var(--foreground))] hover:shadow-[3px_3px_0px_0px_hsl(var(--foreground))] hover:translate-x-[3px] hover:translate-y-[3px] transition-all">
            <Link to="/">Return to Homepage</Link>
          </Button>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
