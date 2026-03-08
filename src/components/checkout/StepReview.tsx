import { useState } from "react";
import { Link } from "react-router-dom";
import { useCheckout } from "@/contexts/CheckoutContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { dispatchWebhook } from "@/lib/webhookDispatcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Edit2, Loader2, Lock, Truck, MapPin } from "lucide-react";
import { toast } from "sonner";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const StepReview = () => {
  const { info, setStep, reset } = useCheckout();
  const { items, subtotal, dispatch: cartDispatch } = useCart();
  const { user } = useAuth();
  const [placing, setPlacing] = useState(false);

  // Compute delivery total from cart items (only main products, not add-ons)
  const deliveryTotal = items.reduce((sum, item) => {
    if (item.deliveryChoice === "delivery" && item.deliveryPrice) {
      return sum + item.deliveryPrice * item.quantity;
    }
    return sum;
  }, 0);

  const tax = Math.round((subtotal + deliveryTotal) * 0.13 * 100) / 100;
  const total = Math.round((subtotal + deliveryTotal + tax) * 100) / 100;

  const handlePlaceOrder = async () => {
    if (!info) return;
    setPlacing(true);

    try {
      // --- Group items by seller ---
      const sellerGroups = new Map<string, typeof items>();
      for (const item of items) {
        let sellerId: string;
        if (item.productId.includes("_option_")) {
          const parentId = item.productId.split("_option_")[0];
          const parent = items.find((i) => i.productId === parentId);
          sellerId = parent?.sellerId || "no_seller";
        } else {
          sellerId = item.sellerId || "no_seller";
        }
        if (!sellerGroups.has(sellerId)) sellerGroups.set(sellerId, []);
        sellerGroups.get(sellerId)!.push(item);
      }

      // --- Build per-seller order payloads ---
      const ordersPayload = Array.from(sellerGroups.entries()).map(
        ([sellerId, groupItems]) => {
          const groupSubtotal = groupItems.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0
          );
          const groupDelivery = groupItems.reduce((sum, i) => {
            if (i.deliveryChoice === "delivery" && i.deliveryPrice) {
              return sum + i.deliveryPrice * i.quantity;
            }
            return sum;
          }, 0);
          const groupTax =
            Math.round((groupSubtotal + groupDelivery) * 0.13 * 100) / 100;
          const groupTotal =
            Math.round((groupSubtotal + groupDelivery + groupTax) * 100) / 100;

          const orderPayload = {
            user_id: user?.id ?? null,
            guest_email: user ? null : info.email,
            subtotal: groupSubtotal,
            shipping_cost: groupDelivery,
            tax_rate: 0.13,
            tax_amount: groupTax,
            total: groupTotal,
            shipping_name: info.fullName,
            shipping_address_line_1: info.addressLine1,
            shipping_address_line_2: info.addressLine2 || null,
            shipping_city: info.city,
            shipping_province: info.province,
            shipping_postal_code: info.postalCode,
            shipping_phone: info.phone || null,
            shipping_method: "seller_defined",
            payment_status: "unpaid",
            status: "pending",
            order_number: "placeholder",
            seller_id: sellerId === "no_seller" ? null : sellerId,
          };

          const orderItems = groupItems.map((item) => ({
            product_id: isUuid(item.productId) ? item.productId : null,
            product_name: item.name,
            product_sku: null as string | null,
            product_image: item.image,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
          }));

          return { order: orderPayload, items: orderItems };
        }
      );

      // --- Create all orders in one call ---
      const { data: createResult, error: createOrderErr } =
        await supabase.functions.invoke("create-order", {
          body: { orders: ordersPayload },
        });

      if (createOrderErr || !createResult?.orders?.length) {
        const msg =
          createResult?.error ||
          createOrderErr?.message ||
          "Failed to create orders";
        throw new Error(msg);
      }

      const createdOrders = createResult.orders as Array<{
        order_id: string;
        order_number: string;
        seller_id: string | null;
      }>;

      // Save address if requested
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

      // Webhook (non-blocking) — send all order IDs
      dispatchWebhook({
        eventType: "order.created",
        data: {
          order_ids: createdOrders.map((o) => o.order_id),
          order_numbers: createdOrders.map((o) => o.order_number),
          email: info.email,
          total,
          items: items.map((i) => ({
            name: i.name,
            qty: i.quantity,
            price: i.price,
          })),
        },
      });

      // --- Single Stripe session for all orders ---
      const orderIds = createdOrders.map((o) => o.order_id);
      const { data: sessionData, error: sessionErr } =
        await supabase.functions.invoke("create-checkout-session", {
          body: { order_ids: orderIds },
        });

      if (sessionErr || !sessionData?.url) {
        const msg = sessionData?.error || "Could not create payment session.";
        toast.error(msg);
        return;
      }

      window.location.href = sessionData.url;
      setTimeout(() => {
        cartDispatch({ type: "CLEAR_CART" });
        reset();
      }, 500);
    } catch (err: unknown) {
      console.error("Order creation failed:", err);
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setPlacing(false);
    }
  };

  // Separate main products from add-ons for display
  const mainItems = items.filter((item) => !item.productId.includes("_option_"));
  const addonItems = items.filter((item) => item.productId.includes("_option_"));

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Shipping address */}
      <Card className="border-2 border-border">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-serif font-semibold text-sm">Shipping Address</h3>
            <button onClick={() => setStep(1)} className="min-w-[44px] min-h-[44px] p-2 flex items-center justify-center text-muted-foreground hover:text-foreground">
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

      {/* Order items with per-product delivery info */}
      <Card className="border-2 border-border">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-serif font-semibold text-sm">Order Items</h3>
            <Link to="/cart" className="text-muted-foreground hover:text-foreground">
              <Edit2 className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {mainItems.map((item) => {
              const relatedAddons = addonItems.filter((a) =>
                a.productId.startsWith(item.productId + "_option_")
              );
              return (
                <div key={item.productId} className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <img src={item.image} alt={item.name} className="w-10 h-10 object-cover border border-border" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-mono font-medium">${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {/* Delivery info for this product */}
                  {item.deliveryChoice === "delivery" && (
                    <div className="ml-13 pl-3 border-l-2 border-border">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Truck className="w-3 h-3" />
                        <span>Delivery to your address — ${item.deliveryPrice?.toFixed(2)} — est. {item.deliveryPrepDays || 5} business days prep</span>
                      </div>
                    </div>
                  )}
                  {item.deliveryChoice === "pickup" && (
                    <div className="ml-13 pl-3 border-l-2 border-border space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>Pickup at {item.pickupAddress}, {item.pickupCity} — est. {item.deliveryPrepDays || 5} business days prep</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/70 pl-4">You'll be notified when ready. Do not visit before confirmation.</p>
                    </div>
                  )}
                  {/* Related add-ons */}
                  {relatedAddons.map((addon) => (
                    <div key={addon.productId} className="ml-13 pl-3 border-l-2 border-border flex items-center gap-3 text-xs">
                      <span className="truncate text-muted-foreground flex-1">{addon.name} × {addon.quantity}</span>
                      <span className="font-mono">${(addon.price * addon.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card className="border-2 border-border shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {deliveryTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span>${deliveryTotal.toFixed(2)}</span>
            </div>
          )}
          {deliveryTotal === 0 && items.some((i) => i.deliveryChoice === "pickup") && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pickup</span>
              <span>Free</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">HST (13%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Place Order */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(1)} className="border-2">
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

      {/* Trust badge */}
      {placing && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span>Secured by Stripe</span>
        </div>
      )}
    </div>
  );
};

export default StepReview;
