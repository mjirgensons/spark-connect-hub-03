import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import DimensionMatcher from "@/components/DimensionMatcher";
import ProductShowcase from "@/components/landing/ProductShowcase";
import OtherProducts from "@/components/landing/OtherProducts";
import HowItWorks from "@/components/landing/HowItWorks";
import Benefits from "@/components/landing/Benefits";
import TrustSignals from "@/components/landing/TrustSignals";
import ForContractors from "@/components/landing/ForContractors";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";

const Index = () => {
  usePageMeta({
    title: "FitMatch — Premium European Cabinetry at 50-80% Off | GTA",
    description: "Shop premium European kitchen and bathroom cabinets at 50-80% off retail. Free quotes, local delivery in the Greater Toronto Area.",
    ogType: "website",
    ogImage: "https://fitmatch.ca/og-image.jpg",
    ogUrl: "https://fitmatch.ca/",
  });
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <DimensionMatcher />
      <ProductShowcase />
      <OtherProducts />
      <HowItWorks />
      <Benefits />
      <TrustSignals />
      <ForContractors />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
