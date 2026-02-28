import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  DollarSign,
  Clock3,
  FileText,
  Building2,
  Wrench,
  Zap,
  Paintbrush,
  Pipette,
  HardHat,
  LayoutGrid,
  Users,
} from "lucide-react";

const benefits = [
  {
    icon: DollarSign,
    title: "Improve Your Margins",
    text: "Source premium cabinets at wholesale pricing and increase project profitability.",
  },
  {
    icon: Clock3,
    title: "Faster Project Completion",
    text: "Skip the 6–8 week custom-order wait. Ready-to-install inventory means faster turnaround.",
  },
  {
    icon: FileText,
    title: "Complete Documentation",
    text: "Every order includes detailed rough-in drawings for seamless installation.",
  },
  {
    icon: Building2,
    title: "B2B Partnership",
    text: "Join 300+ contractors already benefiting from our network and pricing.",
  },
];

const howSteps = [
  { number: "1", title: "Sign Up & List Your Trades", text: "Create a profile, select your trade specialties, and set your service area within the GTA." },
  { number: "2", title: "Get Matched to Local Projects", text: "When a client purchases cabinets in your area, you receive a project notification with full scope details." },
  { number: "3", title: "Access Installation Drawings", text: "Download rough-in specs, plumbing/electrical layouts, and wall-framing diagrams before you arrive on site." },
  { number: "4", title: "Complete the Job & Get Paid", text: "Finish the installation, submit completion photos, and receive payment through the platform." },
];

const trades = [
  { icon: HardHat, label: "General Contractor" },
  { icon: Wrench, label: "Cabinet Installer" },
  { icon: Pipette, label: "Plumber" },
  { icon: Zap, label: "Electrician" },
  { icon: LayoutGrid, label: "Drywall / Wall Builder" },
  { icon: Building2, label: "Countertop Installer" },
  { icon: Paintbrush, label: "Painter" },
];

const ForContractorsPage = () => {
  usePageMeta("For Contractors", "Join FitMatch as a verified GTA contractor. Get matched to cabinet installation projects with MEP drawings, specs, and qualified leads.");
  return (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />

    {/* Hero */}
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-card">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <Badge variant="outline" className="mb-4 border-foreground text-xs font-mono uppercase tracking-widest">
          For Trade Professionals
        </Badge>
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
          Built for Contractors, Builders &amp; Designers
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl">
          Whether you're a renovator serving clients with mid-range budgets but high-end aspirations, or a builder working on spec homes, our inventory helps you deliver more value without compromising on quality.
        </p>
      </div>
    </section>

    {/* Benefits */}
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-12">
          Why Contractors Choose FitMatch
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

    {/* How It Works for Contractors */}
    <section className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-12">
          How It Works for Contractors
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

    {/* Trade Types */}
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-4">
          Trades We Work With
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
          We match projects to the right professionals across every trade needed for a complete renovation.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {trades.map((t) => (
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

    {/* Stats */}
    <section className="py-16 md:py-24 bg-foreground text-background">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            { value: "$5–6B", label: "Canadian cabinet market annually" },
            { value: "$1–1.5B", label: "Premium European segment" },
            { value: "300+", label: "Active B2B partners target (2 yrs)" },
            { value: "80%", label: "Reduction in project timelines" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-mono text-4xl font-bold mb-1">{s.value}</p>
              <p className="text-sm opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Users className="w-8 h-8 text-foreground" />
          <h2 className="font-serif text-3xl font-bold">Join the FitMatch Network</h2>
        </div>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Create your contractor profile in minutes and start receiving project matches in the GTA.
        </p>
        <Button size="lg" asChild>
          <Link to="/register">
            Join as a Contractor <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </Button>
      </div>
    </section>

    <Footer />
  </div>
  );
};

export default ForContractorsPage;
