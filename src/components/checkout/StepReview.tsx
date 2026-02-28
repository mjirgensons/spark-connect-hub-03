import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCheckout } from "@/contexts/CheckoutContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { dispatchWebhook } from "@/lib/webhookDispatcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const shippingLabels: Record<string, string> = {
  standard: "Standard Delivery (GTA)",
  express: "Express Delivery (GTA)",
  pickup: "Customer Pickup (Woodbridge, ON)",
};

const StepReview = () => {
  const { info, shippingMethod, shippingCost, setStep, reset } = useCheckout();
  const { items, subtotal, dispatch: cartDispatch } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);

  const tax = (subtotal + shippingCost) * 0.13;
  const total = subtotal + shippingCost + tax;

  const handlePlaceOrder = async () => {
    if (!info || !shippingMethod) return;
    setPlacing(true);

    try {
      // 1. Create order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id ?? null,
          guest_email: user ? null : info.email,
          subtotal,
          shipping_cost: shippingCost,
          tax_rate: 0.13,
          tax_amount: Math.round(tax * 100) / 100,
          total: Math.round(total * 100) / 100,
          shipping_name: info.fullName,
          shipping_address_line_1: info.addressLine1,
          shipping_address_line_2: info.addressLine2 || null,
          shipping_city: info.city,
          shipping_province: info.province,
          shipping_postal_code: info.postalCode,
          shipping_phone: info.phone || null,
          shipping_method: shippingMethod,
          payment_status: "unpaid",
          status: "pending",
          order_number: "placeholder", // trigger overwrites
        })
        .select("id, order_number")
        .single();

      if (orderErr || !order) throw orderErr ?? new Error("Failed to create order");

      // 2. Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        product_sku: null as string | null,
        product_image: item.image,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      // 3. Save address if requested
      if (info.saveAddress && user) {
        await supabase.from("shipping_addresses").insert({
          user_id: user.id,
          full_name: info.fullName,
          address_line_1: info.addressLine1,
          address_line_2: info.addressLine2 || null,
          city: info.city,
          province: info.province,
          postal_code: info.postalCode,
          phone: info.phone || null,
          is_default: false,
        });
      }

      // 4. Webhook (non-blocking)
      dispatchWebhook({
        eventType: "order.created",
        data: {
          order_id: order.id,
          order_number: order.order_number,
          email: info.email,
          total: Math.round(total * 100) / 100,
          items: items.map((i) => ({
            name: i.name,
            qty: i.quantity,
            price: i.price,
          })),
          shipping: {
            method: shippingMethod,
            cost: shippingCost,
            address: `${info.addressLine1}, ${info.city}, ${info.province} ${info.postalCode}`,
          },
        },
      });

      // 5. TODO: Stripe checkout session creation (Prompt I4)
      // For now, show success and redirect
      toast.success(`Order ${order.order_number} created!`);
      cartDispatch({ type: "CLEAR_CART" });
      reset();
      navigate("/");
    } catch (err: unknown) {
      console.error("Order creation failed:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Shipping address */}
      <Card className="border-2 border-border">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-serif font-semibold text-sm">Shipping Address</h3>
            <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p className="text-foreground font-medium">{info?.fullName}</p>
            <p>{info?.addressLine1}</p>
            {info?.addressLine2 && <p>{info.addressLine2}</p>}
            <p>{info?.city}, {info?.province} {info?.postalCode}</p>
            <p>{info?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Shipping method */}
      <Card className="border-2 border-border">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-serif font-semibold text-sm">Shipping Method</h3>
            <button onClick={() => setStep(2)} className="text-muted-foreground hover:text-foreground">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {shippingLabels[shippingMethod ?? "standard"]} —{" "}
            {shippingCost === 0 ? "FREE" : `$${shippingCost}`}
          </p>
        </CardContent>
      </Card>

      {/* Order items */}
      <Card className="border-2 border-border">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-serif font-semibold text-sm">Order Items</h3>
            <Link to="/cart" className="text-muted-foreground hover:text-foreground">
              <Edit2 className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 text-sm">
                <img src={item.image} alt={item.name} className="w-10 h-10 object-cover border border-border" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <span className="font-mono font-medium">${(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card className="border-2 border-border shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span>{shippingCost === 0 ? "FREE" : `$${shippingCost}`}</span>
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

      {/* Place Order */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(2)} className="border-2">
          Back
        </Button>
        <Button
          onClick={handlePlaceOrder}
          disabled={placing}
          size="lg"
          className="flex-1 shadow-[4px_4px_0px_0px_hsl(var(--foreground))]"
        >
          {placing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Redirecting to secure payment…
            </>
          ) : (
            "Place Order"
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepReview;
