import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Copy, Loader2, ShoppingBag, HelpCircle } from "lucide-react";
import { toast } from "sonner";

interface OrderRow {
  id: string;
  order_number: string;
  guest_email: string | null;
  user_id: string | null;
  status: string;
  payment_status: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total: number;
  shipping_name: string;
  shipping_address_line_1: string;
  shipping_address_line_2: string | null;
  shipping_city: string;
  shipping_province: string;
  shipping_postal_code: string;
  shipping_method: string | null;
  estimated_delivery: string | null;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const shippingLabels: Record<string, string> = {
  standard: "Standard Delivery (GTA)",
  express: "Express Delivery (GTA)",
  pickup: "Customer Pickup (Woodbridge, ON)",
};

const shippingEstimates: Record<string, string> = {
  standard: "5–7 business days",
  express: "2–3 business days",
  pickup: "Ready in 1–2 business days",
};

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const pollCount = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;

    const { data, error } = await supabase.functions.invoke("get-order-confirmation", {
      body: { order_id: orderId },
    });

    if (error || !data?.order) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setOrder(data.order as OrderRow);
    if (data.items) setItems(data.items as OrderItem[]);

    if (data.order.payment_status === "paid") {
      setPaymentPending(false);
      if (pollTimer.current) clearInterval(pollTimer.current);
    } else {
      setPaymentPending(true);
    }

    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Poll for payment status if still unpaid
  useEffect(() => {
    if (!paymentPending || !orderId) return;
    pollCount.current = 0;
    pollTimer.current = setInterval(() => {
      pollCount.current += 1;
      if (pollCount.current >= 10) {
        if (pollTimer.current) clearInterval(pollTimer.current);
        return;
      }
      fetchOrder();
    }, 3000);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [paymentPending, orderId, fetchOrder]);

  const copyOrderNumber = () => {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number);
      toast.success("Order number copied!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20 flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20 text-center pt-32">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find this order. It may not exist or you may not have access to it.
          </p>
          <Button asChild>
            <Link to="/">Go to Homepage</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const email = order?.guest_email || "your email";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 pt-24 md:pt-10 max-w-3xl">
        {/* Success Banner */}
        {paymentPending ? (
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
              Processing Payment…
            </h1>
            <p className="text-muted-foreground">
              We're confirming your payment. This usually takes just a few seconds.
            </p>
          </div>
        ) : (
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-600 animate-bounce" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
              Order Confirmed!
            </h1>
            <p className="text-muted-foreground mb-4">
              Thank you for your order. A confirmation email is on its way to{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </p>
            <button
              onClick={copyOrderNumber}
              className="inline-flex items-center gap-2 bg-muted border-2 border-border px-4 py-2 font-mono text-lg font-bold text-foreground hover:bg-accent transition-colors"
            >
              {order?.order_number}
              <Copy className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Order Summary Card */}
        <Card className="border-2 border-border mb-6">
          <CardContent className="p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Order Date</p>
                <p className="text-sm font-medium text-foreground">
                  {order ? new Date(order.created_at).toLocaleDateString("en-CA", {
                    year: "numeric", month: "long", day: "numeric",
                  }) : "—"}
                </p>
              </div>
              <Badge
                variant={order?.payment_status === "paid" ? "default" : "secondary"}
              >
                {order?.payment_status === "paid" ? "✓ Paid" : order?.payment_status ?? "—"}
              </Badge>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Shipping Method</p>
                <p className="text-foreground font-medium">
                  {shippingLabels[order?.shipping_method ?? "standard"]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order?.estimated_delivery ||
                    shippingEstimates[order?.shipping_method ?? "standard"]}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Shipping Address</p>
                <p className="text-foreground font-medium">{order?.shipping_name}</p>
                <p className="text-muted-foreground">{order?.shipping_address_line_1}</p>
                {order?.shipping_address_line_2 && (
                  <p className="text-muted-foreground">{order.shipping_address_line_2}</p>
                )}
                <p className="text-muted-foreground">
                  {order?.shipping_city}, {order?.shipping_province}{" "}
                  {order?.shipping_postal_code}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="border-2 border-border mb-6">
          <CardContent className="p-5">
            <h3 className="font-serif font-semibold text-sm mb-3">Order Items</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  {item.product_image ? (
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-12 h-12 object-cover border border-border"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted border border-border flex items-center justify-center text-muted-foreground text-xs">
                      N/A
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-foreground">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} × ${item.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span className="font-mono font-medium text-foreground">
                    ${item.total_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Price Breakdown */}
        <Card className="border-2 border-border shadow-[4px_4px_0px_0px_hsl(var(--foreground))] mb-8">
          <CardContent className="p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">
                ${order?.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-foreground">
                {order?.shipping_cost === 0
                  ? "FREE"
                  : `$${order?.shipping_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">HST (13%)</span>
              <span className="text-foreground">
                ${order?.tax_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">
                ${order?.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Button asChild size="lg" className="flex-1 shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
            <Link to="/browse">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </div>
        <div className="text-center">
          <Link
            to="/page/contact"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            Need Help?
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
