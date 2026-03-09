import { Construction, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const UnderConstruction = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      {/* Under Construction Banner */}
      <div className="w-full bg-primary text-primary-foreground py-3 fixed top-0 left-0 z-50">
        <p className="text-sm font-semibold tracking-wide uppercase flex items-center justify-center gap-2">
          <Construction className="w-4 h-4" />
          This Site Is Under Construction
          <Construction className="w-4 h-4" />
        </p>
      </div>

      {/* Logo */}
      <div className="mb-8">
        <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-primary-foreground font-serif font-bold text-3xl">F</span>
        </div>
        <span className="font-serif text-2xl font-semibold text-foreground">Fitmatch</span>
        <span className="block text-sm text-muted-foreground">Luxury Cabinet Exchange</span>
      </div>

      {/* H1 — matches SEO title */}
      <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-6 max-w-3xl leading-tight">
        Luxury European Cabinets for GTA:{" "}
        <span className="text-primary">50-80% Off</span>, Perfect Fit, Fast Install
      </h1>

      <p className="text-lg text-muted-foreground mb-8 max-w-xl">
        We're building something amazing. Premium European kitchen &amp; bath cabinets at unbeatable prices — coming soon to the Greater Toronto Area.
      </p>

      <p className="text-sm text-muted-foreground mb-2">Stay updated:</p>
      <a href="mailto:info@fitmatch.ca">
        <Button size="lg" className="gap-2">
          <Mail className="w-5 h-5" />
          info@fitmatch.ca
        </Button>
      </a>

      <p className="mt-12 text-xs text-muted-foreground">
        © {new Date().getFullYear()} The Fitmatch Luxury Cabinet Exchange. All rights reserved.
      </p>
    </div>
  );
};

export default UnderConstruction;
