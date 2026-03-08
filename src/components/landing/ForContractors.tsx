import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, DollarSign, Clock3, FileText } from "lucide-react";
import { trackCTAClick } from "@/lib/analytics";

const contractorBenefits = [
  {
    icon: DollarSign,
    title: "Improve Your Margins",
    description: "Source premium cabinets at wholesale pricing and increase project profitability.",
  },
  {
    icon: Clock3,
    title: "Faster Project Completion",
    description: "Skip the 6-8 week wait. Ready-to-install inventory means faster turnaround.",
  },
  {
    icon: FileText,
    title: "Complete Documentation",
    description: "Every order includes detailed rough-in drawings for seamless installation.",
  },
  {
    icon: Building2,
    title: "B2B Partnership",
    description: "Join 300+ contractors already benefiting from our network and pricing.",
  },
];

const ForContractors = React.memo(() => {
  return (
    <section id="contractors" className="py-20 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              For Trade Professionals
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-3 mb-4">
              Built for Contractors, Builders & Designers
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Whether you're a renovator serving clients with mid-range budgets but high-end 
              aspirations, or a builder working on spec homes, our inventory helps you deliver 
              more value without compromising on quality.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              {contractorBenefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="gold" size="xl" onClick={() => trackCTAClick("Join Our Trade Network")}>
              Join Our Trade Network
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Right Stats Card */}
          <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
            <h3 className="font-serif text-2xl font-bold text-foreground mb-6">
              By the Numbers
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-border">
                <div>
                  <p className="text-4xl font-bold text-primary">$5-6B</p>
                  <p className="text-sm text-muted-foreground">Canadian cabinet market annually</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pb-6 border-b border-border">
                <div>
                  <p className="text-4xl font-bold text-primary">$1-1.5B</p>
                  <p className="text-sm text-muted-foreground">Premium European segment</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pb-6 border-b border-border">
                <div>
                  <p className="text-4xl font-bold text-primary">300+</p>
                  <p className="text-sm text-muted-foreground">Active B2B partners in 2 years</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold text-primary">80%</p>
                  <p className="text-sm text-muted-foreground">Reduction in project timelines</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

ForContractors.displayName = "ForContractors";

export default ForContractors;
