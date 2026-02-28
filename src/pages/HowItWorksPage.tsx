import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Ruler,
  Search,
  Package,
  CheckCircle,
  ArrowRight,
  FileText,
  Wrench,
  Zap,
  DollarSign,
} from "lucide-react";

const steps = [
  {
    icon: Ruler,
    number: "01",
    title: "Share Your Dimensions",
    description:
      "Upload your room measurements or tell us your opening dimensions. Our system takes it from there.",
    detail:
      "Provide the width, height, and depth of your cabinet openings. You can upload a photo, a floor plan, or simply type in the numbers. Our matching engine works with millimetre precision so you get cabinets that actually fit.",
  },
  {
    icon: Search,
    number: "02",
    title: "Get Matched Instantly",
    description:
      "Our proprietary fit-matching engine scans thousands of premium cabinets to find your perfect match.",
    detail:
      "FitMatch cross-references your opening dimensions against every cabinet in our inventory — factoring in style, colour, and budget preferences. Results appear in seconds, not weeks.",
  },
  {
    icon: Package,
    number: "03",
    title: "Bundled Solutions",
    description:
      "Receive complete packages with MEP drawings, countertops, sinks, and appliances — all pre-validated.",
    detail:
      "Every match includes a downloadable installation package: rough-in drawings with plumbing and electrical specs, compatible countertop options, and a list of verified local contractors who can do the install.",
  },
  {
    icon: CheckCircle,
    number: "04",
    title: "Fast Delivery & Support",
    description:
      "Get your luxury cabinets delivered quickly with installation drawings and trade support included.",
    detail:
      "Because we're matching you to existing inventory — not building from scratch — delivery is measured in days, not months. Our support team stays with you through installation and beyond.",
  },
];

const deliverables = [
  {
    icon: FileText,
    title: "Installation Drawings",
    text: "Detailed rough-in specs for plumbing, electrical, and wall framing so your contractor can prep the space perfectly.",
  },
  {
    icon: Zap,
    title: "Appliance Compatibility",
    text: "A verified list of appliances (range, dishwasher, hood) that fit your matched cabinet layout.",
  },
  {
    icon: Wrench,
    title: "Contractor Matching",
    text: "We connect you with vetted GTA trades — cabinet installers, plumbers, electricians, drywall pros, and painters.",
  },
  {
    icon: DollarSign,
    title: "Countertop Bundle",
    text: "Pre-negotiated countertop options (quartz, granite, laminate) cut to your cabinet's exact dimensions at bundle pricing.",
  },
];

const HowItWorksPage = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />

    {/* Hero */}
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-card">
      <div className="container mx-auto px-4 text-center max-w-3xl">
        <Badge variant="outline" className="mb-4 border-foreground text-xs font-mono uppercase tracking-widest">
          How It Works
        </Badge>
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
          From Dimensions to Dream Kitchen in Days
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl">
          Our streamlined process eliminates the typical 6–8 week wait for custom cabinetry. Find, match, and receive premium cabinets faster than ever.
        </p>
      </div>
    </section>

    {/* Steps — detailed */}
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 space-y-16">
        {steps.map((step, i) => {
          const isEven = i % 2 === 1;
          return (
            <div
              key={step.number}
              className={`flex flex-col md:flex-row ${isEven ? "md:flex-row-reverse" : ""} gap-8 items-center`}
            >
              {/* Number + Icon card */}
              <div
                className="w-full md:w-1/3 border-2 border-foreground p-8 flex flex-col items-center text-center bg-card"
                style={{ boxShadow: "6px 6px 0 0 hsl(var(--foreground))" }}
              >
                <span className="font-mono text-4xl font-bold text-muted-foreground/30 mb-2">
                  {step.number}
                </span>
                <div className="w-14 h-14 bg-primary flex items-center justify-center mb-3">
                  <step.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-sans text-lg font-bold">{step.title}</h3>
              </div>

              {/* Description */}
              <div className="w-full md:w-2/3">
                <p className="text-muted-foreground text-base mb-3">{step.description}</p>
                <p className="text-foreground text-sm leading-relaxed">{step.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>

    {/* Rebuild-the-Wall */}
    <section className="py-16 md:py-24 bg-foreground text-background">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
          The Rebuild-the-Wall Approach
        </h2>
        <p className="text-lg md:text-xl leading-relaxed mb-6 opacity-90">
          Instead of ordering custom cabinets to match your rough-ins
          <span className="font-semibold"> ($15K–$30K+, 6–8 week wait)</span>, FitMatch finds a
          matching cabinet <span className="italic">first</span>. Then a local contractor rebuilds
          the wall behind it to match the cabinet's rough-in specs.
        </p>
        <p className="text-lg md:text-xl leading-relaxed opacity-90">
          This reversal saves <span className="font-bold">50–80%</span> and cuts the timeline from
          months to <span className="font-bold">days</span>.
        </p>
      </div>
    </section>

    {/* What You Get */}
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-12">
          What You Get
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {deliverables.map((d) => (
            <div
              key={d.title}
              className="border-2 border-foreground p-6 bg-card"
              style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
            >
              <div className="w-12 h-12 bg-primary flex items-center justify-center mb-4">
                <d.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-sans font-bold text-base mb-2">{d.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{d.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-serif text-3xl font-bold mb-4">Ready to Find Your Match?</h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Browse our inventory of premium European cabinets at 50–80% off retail.
        </p>
        <Button size="lg" asChild>
          <Link to="/browse">
            Find Your Match <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </Button>
      </div>
    </section>

    <Footer />
  </div>
);

export default HowItWorksPage;
