import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 md:py-32 bg-foreground relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-background mb-6">
            Ready to Find Your Perfect Cabinets?
          </h2>
          <p className="text-lg md:text-xl text-background/70 mb-10">
            Join hundreds of homeowners and contractors already saving thousands on 
            premium European cabinetry. Your dream kitchen is just a few clicks away.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="gold" size="xl">
              Start Matching Now
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="xl"
              className="border-background/30 text-background hover:bg-background/10 hover:text-background"
            >
              Contact Sales
            </Button>
          </div>
          
          <p className="text-sm text-background/50 mt-8">
            No commitment required. See matched cabinets in minutes.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
