import { Package, Wrench, Target, TrendingDown, Shield, Lock, Award } from "lucide-react";
import { Card } from "@/components/ui/card";

const stats = [
  { icon: Package, number: "500+", label: "Cabinets Matched" },
  { icon: Wrench, number: "50+", label: "Verified Contractors" },
  { icon: Target, number: "98%", label: "Fit Accuracy" },
  { icon: TrendingDown, number: "$2M+", label: "Client Savings" },
];

const guarantees = [
  { icon: Shield, title: "30-Day Returns", desc: "Not the right fit? Full refund within 30 days." },
  { icon: Lock, title: "Secure Checkout", desc: "256-bit SSL encryption on every transaction." },
  { icon: Award, title: "Premium Quality", desc: "Every cabinet manufactured for high-end developments." },
];

const TrustSignals = () => (
  <section className="bg-muted/50 py-16 md:py-20">
    <div className="container mx-auto px-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center">
            <s.icon className="w-6 h-6 text-primary mb-2" />
            <span className="font-serif text-3xl md:text-4xl font-bold text-foreground">{s.number}</span>
            <span className="text-sm text-muted-foreground mt-1">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Guarantees */}
      <div className="border-t border-border mt-12 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {guarantees.map((g) => (
            <Card key={g.title} className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--foreground))] sm:shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-5 flex items-start gap-4">
              <g.icon className="w-6 h-6 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">{g.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{g.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Social proof placeholder */}
      <p className="text-center text-sm text-muted-foreground mt-12">
        Trusted by contractors across the GTA
      </p>
    </div>
  </section>
);

export default TrustSignals;
