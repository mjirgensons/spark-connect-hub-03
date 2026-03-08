import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { CheckoutProvider, useCheckout } from "@/contexts/CheckoutContext";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import StepInformation from "@/components/checkout/StepInformation";
import StepReview from "@/components/checkout/StepReview";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

const CheckoutContent = () => {
  usePageMeta("Checkout", "Complete your order for premium European cabinetry at FitMatch.");
  const { items } = useCart();
  const { step } = useCheckout();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart", { replace: true });
    }
  }, [items.length, navigate]);

  useEffect(() => {
    if (searchParams.get("cancelled") === "true") {
      toast.info("Payment was cancelled. Your order has been saved.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 pt-24 md:pt-10">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Checkout</h1>
        <CheckoutStepper currentStep={step} />

        {step === 1 && <StepInformation />}
        {step === 2 && <StepReview />}
      </main>
      <Footer />
    </div>
  );
};

const Checkout = () => (
  <CheckoutProvider>
    <CheckoutContent />
  </CheckoutProvider>
);

export default Checkout;
