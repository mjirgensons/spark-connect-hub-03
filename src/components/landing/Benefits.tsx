import React from "react";
import { TrendingDown, Zap, Shield, Wrench, Sparkles, Users } from "lucide-react";

const benefits = [
  {
    icon: TrendingDown,
    title: "Massive Savings",
    description: "Access $30K-$50K custom kitchen looks for just $5K-$10K. Premium European finishes at a fraction of retail prices.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Reduce project timelines by 80%. Get your cabinets in days, not the typical 6-8 weeks for custom orders.",
  },
  {
    icon: Shield,
    title: "Premium Quality",
    description: "Every cabinet is manufactured for high-end developments. Same luxury quality, better price point.",
  },
  {
    icon: Wrench,
    title: "Trade Support",
    description: "Detailed MEP drawings for plumbing, electrical, and HVAC rough-ins included with every model.",
  },
  {
    icon: Sparkles,
    title: "Bundled Solutions",
    description: "Complete packages with pre-validated countertops, sinks, faucets, and appliances.",
  },
  {
    icon: Users,
    title: "Expert Network",
    description: "Access our network of verified installers, designers, and trades with industry expertise.",
  },
];

const Benefits = React.memo(() => {
  return (
    <section id="benefits" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Why Choose Us
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-3 mb-4">
            The Smart Way to Buy Premium Cabinets
          </h2>
          <p className="text-muted-foreground text-lg">
            We've reimagined how luxury cabinetry is bought and sold, creating value for 
            everyone in the process.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="group p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <benefit.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
