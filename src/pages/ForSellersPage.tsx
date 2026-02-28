import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  BarChart3,
  Users,
  FileText,
  Search,
  Package,
  ShoppingCart,
  Store,
  Layers,
  Lightbulb,
} from "lucide-react";

const benefits = [
  {
    icon: Users,
    title: "Reach GTA Buyers",
    text: "Connect directly with homeowners, contractors, and builders actively searching for premium cabinets in the Greater Toronto Area.",
  },
  {
    icon: Search,
    title: "Automated Matching",
    text: "Our fit-matching engine automatically surfaces your products to buyers whose opening dimensions match — no manual quoting needed.",
  },
  {
    icon: FileText,
    title: "RFQ System",
    text: "When no existing product fits a buyer's dimensions, quote requests are distributed to relevant sellers. Win custom orders effortlessly.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    text: "Track views, matches, conversion rates, and revenue from your dedicated seller dashboard.",
  },
];

const sellerTypes = [
  { icon: Store, label: "Cabinet Makers" },
  { icon: ShoppingCart, label: "Resellers" },
  { icon: Lightbulb, label: "Appliance Vendors" },
  { icon: Layers, label: "Countertop Suppliers" },
  { icon: Package, label: "Fixture Suppliers" },
];

const howSteps = [
  { number: "1", title: "List Your Products", text: "Upload your inventory with photos, dimensions, pricing, and availability. Bulk import via CSV is supported." },
  { number: "2", title: "Get Matched to Buyers", text: "Our engine matches your products to buyers whose kitchen or bathroom openings fit your cabinet dimensions." },
  { number: "3", title: "Receive Orders & RFQs", text: "Accept orders for in-stock items or respond to custom quote requests from clients and builders." },
];

const ForSellersPage = () => {
  usePageMeta("For Sellers", "List your surplus European cabinets on FitMatch. Reach GTA buyers through automatic dimension matching. Free to list, commission-based.");
  return (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />

    {/* Hero */}
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-card">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <Badge variant="outline" className="mb-4 border-foreground text-xs font-mono uppercase tracking-widest">
          For Sellers
        </Badge>
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
          Sell Smarter on FitMatch
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl">
          Turn surplus and overstock inventory into revenue. FitMatch connects your premium European cabinets to qualified buyers across the GTA — automatically.
        </p>
      </div>
    </section>

    {/* Why List on FitMatch */}
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-12">
          Why List on FitMatch
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="border-2 border-foreground p-6 bg-card"
              style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
            >
              <div className="w-12 h-12 bg-primary flex items-center justify-center mb-4">
                <b.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-sans font-bold text-base mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Seller Types */}
    <section className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-4">
          Who Sells on FitMatch
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
          From manufacturers with overstock to resellers with surplus — if you have premium cabinetry, we have buyers.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {sellerTypes.map((t) => (
            <div
              key={t.label}
              className="flex items-center gap-3 border-2 border-foreground px-5 py-3 bg-background"
              style={{ boxShadow: "3px 3px 0 0 hsl(var(--foreground))" }}
            >
              <t.icon className="w-5 h-5 text-foreground" />
              <span className="font-sans text-sm font-semibold">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* How It Works */}
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-12">
          How It Works
        </h2>
        <div className="space-y-8">
          {howSteps.map((s) => (
            <div key={s.number} className="flex gap-5">
              <div className="w-10 h-10 shrink-0 bg-foreground text-background flex items-center justify-center font-mono font-bold text-lg">
                {s.number}
              </div>
              <div>
                <h3 className="font-sans font-bold text-base mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-16 md:py-24 bg-foreground text-background">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
          Start Selling Today
        </h2>
        <p className="text-lg opacity-90 mb-8 max-w-lg mx-auto">
          Create your seller account, list your first products, and reach thousands of GTA buyers in minutes.
        </p>
        <Button size="lg" variant="outline" className="border-background text-background hover:bg-background hover:text-foreground" asChild>
          <Link to="/register">
            Start Selling <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </Button>
      </div>
    </section>

    <Footer />
  </div>
);

export default ForSellersPage;
