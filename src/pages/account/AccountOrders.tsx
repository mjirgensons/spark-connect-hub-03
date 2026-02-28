import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, ExternalLink, ShoppingBag } from "lucide-react";
import { OrderCardSkeleton } from "@/components/ui/order-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import Breadcrumbs from "@/components/Breadcrumbs";
import { format } from "date-fns";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  confirmed: "default",
  preparing: "default",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  refunded: "destructive",
};

const AccountOrders = () => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["account-orders-full", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-serif">Your Orders</h1>

      {!orders || orders.length === 0 ? (
        <Card className="border-2 border-border">
          <CardContent className="p-8 text-center space-y-4">
            <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No orders yet</p>
            <Button asChild>
              <Link to="/browse">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isOpen = expanded === order.id;
            const items = (order as any).order_items || [];
            return (
              <Card key={order.id} className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--foreground))]">
                <CardContent className="p-0">
                  <button
                    className="w-full p-4 flex flex-wrap items-center justify-between gap-2 text-left"
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                  >
                    <div>
                      <p className="font-mono text-sm font-bold">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), "MMM d, yyyy")} · {items.length} item{items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={STATUS_VARIANT[order.status] || "secondary"} className="capitalize text-xs">
                        {order.status}
                      </Badge>
                      <span className="font-bold text-sm">${Number(order.total).toFixed(2)}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-4">
                      <Separator />
                      {/* Items */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase">Items</p>
                        {items.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3 py-2">
                            {item.product_image && (
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                className="w-12 h-12 object-cover border-2 border-border"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Qty: {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                              </p>
                            </div>
                            <p className="text-sm font-bold">${Number(item.total_price).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Shipping */}
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Shipping</p>
                        <p className="text-sm">
                          {order.shipping_name}<br />
                          {order.shipping_address_line_1}
                          {order.shipping_address_line_2 ? `, ${order.shipping_address_line_2}` : ""}<br />
                          {order.shipping_city}, {order.shipping_province} {order.shipping_postal_code}
                        </p>
                        {order.tracking_number && (
                          <div className="mt-2 flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">Tracking:</p>
                            {order.tracking_url ? (
                              <a
                                href={order.tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-mono underline flex items-center gap-1"
                              >
                                {order.tracking_number} <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-xs font-mono">{order.tracking_number}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Price breakdown */}
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Price Breakdown</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>${Number(order.subtotal).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Shipping</span>
                            <span>${Number(order.shipping_cost).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax</span>
                            <span>${Number(order.tax_amount).toFixed(2)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-bold">
                            <span>Total</span>
                            <span>${Number(order.total).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AccountOrders;
