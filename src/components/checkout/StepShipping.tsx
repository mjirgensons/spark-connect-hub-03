import { useState, useEffect } from "react";
import { useCheckout, ShippingMethod } from "@/contexts/CheckoutContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Edit2 } from "lucide-react";

const shippingOptions: {
  id: ShippingMethod;
  label: string;
  description: string;
  getPrice: (subtotal: number) => number;
  priceLabel: (subtotal: number) => string;
}[] = [
  {
    id: "standard",
    label: "Standard Delivery (GTA)",
    description: "5-7 business days",
    getPrice: (sub) => (sub >= 500 ? 0 : 99),
    priceLabel: (sub) => (sub >= 500 ? "FREE" : "$99"),
  },
  {
    id: "express",
    label: "Express Delivery (GTA)",
    description: "2-3 business days",
    getPrice: () => 199,
    priceLabel: () => "$199",
  },
  {
    id: "pickup",
    label: "Customer Pickup (Woodbridge, ON)",
    description: "Ready in 1-2 business days",
    getPrice: () => 0,
    priceLabel: () => "FREE",
  },
];

const StepShipping = () => {
  const { info, shippingMethod, setShippingMethod, setShippingCost, setStep } = useCheckout();
  const { subtotal, items } = useCart();
  const [selected, setSelected] = useState<ShippingMethod>(shippingMethod ?? "standard"); // eslint-disable-line

  const option = shippingOptions.find((o) => o.id === selected)!;
  const shipCost = option.getPrice(subtotal);
  const tax = (subtotal + shipCost) * 0.13;
  const total = subtotal + shipCost + tax;

  useEffect(() => {
    setShippingCost(shipCost);
  }, [shipCost, setShippingCost]);

  const handleContinue = () => {
    setShippingMethod(selected);
    setShippingCost(shipCost);
    setStep(3);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        {/* Address summary */}
        <Card className="border-2 border-border">
          <CardContent className="p-4 flex justify-between items-start">
            <div className="text-sm space-y-0.5">
              <p className="font-semibold text-foreground">{info?.fullName}</p>
              <p className="text-muted-foreground">{info?.addressLine1}</p>
              {info?.addressLine2 && <p className="text-muted-foreground">{info.addressLine2}</p>}
              <p className="text-muted-foreground">
                {info?.city}, {info?.province} {info?.postalCode}
              </p>
              <p className="text-muted-foreground">{info?.email}</p>
            </div>
            <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground">
              <Edit2 className="w-4 h-4" />
            </button>
          </CardContent>
        </Card>

        {/* Shipping options */}
        <div className="space-y-3">
          <h2 className="font-serif font-semibold text-lg">Shipping Method</h2>
          {shippingOptions.map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center justify-between border-2 p-4 cursor-pointer transition-colors ${
                selected === opt.id
                  ? "border-foreground bg-muted/50"
                  : "border-border hover:border-foreground/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 border-2 border-foreground flex items-center justify-center ${
                    selected === opt.id ? "bg-foreground" : ""
                  }`}
                >
                  {selected === opt.id && (
                    <div className="w-1.5 h-1.5 bg-background" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
              </div>
              <span className="font-mono font-semibold text-sm">{opt.priceLabel(subtotal)}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep(1)} className="border-2">
            Back
          </Button>
          <Button
            onClick={handleContinue}
            size="lg"
            className="flex-1 shadow-[4px_4px_0px_0px_hsl(var(--foreground))]"
          >
            Continue to Review
          </Button>
        </div>
      </div>

      {/* Order summary sidebar */}
      <div className="lg:col-span-1">
        <Card className="border-2 border-border shadow-[4px_4px_0px_0px_hsl(var(--foreground))] lg:sticky lg:top-24">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-serif font-semibold">Order Summary</h3>
            <div className="space-y-1">
              {items.map((it) => (
                <div key={it.productId} className="flex justify-between text-xs text-muted-foreground">
                  <span className="truncate mr-2">{it.name} × {it.quantity}</span>
                  <span>${(it.price * it.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span>{shipCost === 0 ? "FREE" : `$${shipCost}`}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">HST (13%)</span>
              <span>${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StepShipping;
