import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import ProductShowcase from "@/components/landing/ProductShowcase";
import OtherProducts from "@/components/landing/OtherProducts";
import HowItWorks from "@/components/landing/HowItWorks";
import Benefits from "@/components/landing/Benefits";
import ForContractors from "@/components/landing/ForContractors";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <ProductShowcase />
      <OtherProducts />
      <HowItWorks />
      <Benefits />
      <ForContractors />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
