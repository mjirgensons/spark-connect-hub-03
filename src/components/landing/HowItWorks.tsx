import React from "react";
import { Ruler, Search, Package, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Ruler,
    title: "Share Your Dimensions",
    description: "Upload your room measurements or tell us your opening dimensions. Our system takes it from there.",
  },
  {
    icon: Search,
    title: "Get Matched Instantly",
    description: "Our proprietary fit-matching engine scans thousands of premium cabinets to find your perfect match.",
  },
  {
    icon: Package,
    title: "Bundled Solutions",
    description: "Receive complete packages with MEP drawings, countertops, sinks, and appliances—all pre-validated.",
  },
  {
    icon: CheckCircle,
    title: "Fast Delivery & Support",
    description: "Get your luxury cabinets delivered quickly with installation drawings and trade support included.",
  },
];

const HowItWorks = React.memo(() => {
  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-card">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-3 mb-4">
            From Dimensions to Dream Kitchen in Days
          </h2>
          <p className="text-muted-foreground text-lg">
            Our streamlined process eliminates the typical 6-8 week wait for custom cabinetry. 
            Find, match, and receive premium cabinets faster than ever.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-border" />
              )}
              
              <div className="relative bg-background rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">{index + 1}</span>
                </div>
                
                {/* Icon */}
                <div className="w-14 h-14 bg-accent rounded-lg flex items-center justify-center mb-4">
                  <step.icon className="w-7 h-7 text-accent-foreground" />
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
