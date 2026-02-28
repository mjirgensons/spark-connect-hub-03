import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { CheckoutProvider, useCheckout } from "@/contexts/CheckoutContext";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import StepInformation from "@/components/checkout/StepInformation";
import StepShipping from "@/components/checkout/StepShipping";
import StepReview from "@/components/checkout/StepReview";

const CheckoutContent = () => {
  const { items } = useCart();
  const { step } = useCheckout();
  const navigate = useNavigate();

  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart", { replace: true });
    }
  }, [items.length, navigate]);

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 pt-24 md:pt-10">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Checkout</h1>
        <CheckoutStepper currentStep={step} />

        {step === 1 && <StepInformation />}
        {step === 2 && <StepShipping />}
        {step === 3 && <StepReview />}
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
