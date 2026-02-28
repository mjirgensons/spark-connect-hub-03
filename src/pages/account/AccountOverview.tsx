import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, DollarSign, Clock, ShoppingBag, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderCardSkeleton } from "@/components/ui/order-card-skeleton";
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

const AccountOverview = () => {
  const { user } = useAuth();
  const { profile } = useProfile();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["account-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
  });

  const firstName = (profile?.full_name || "").split(" ")[0] || "there";
  const totalOrders = orders?.length || 0;
  const totalSpent = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
  const activeOrders = orders?.filter((o) => !["delivered", "cancelled", "refunded"].includes(o.status)).length || 0;
  const recentOrders = orders?.slice(0, 3) || [];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-2 border-border shadow-[3px_3px_0px_0px_hsl(var(--foreground))]">
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="w-9 h-9 shrink-0" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: "My Account" }]} />
      <h1 className="text-2xl md:text-3xl font-bold font-serif">
        Welcome back, {firstName}
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Orders", value: totalOrders, icon: Package },
          { label: "Total Spent", value: `$${totalSpent.toFixed(2)}`, icon: DollarSign },
          { label: "Active Orders", value: activeOrders, icon: Clock },
        ].map((stat) => (
          <Card key={stat.label} className="border-2 border-border shadow-[3px_3px_0px_0px_hsl(var(--foreground))]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 border-2 border-border bg-muted">
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Recent Orders</h2>
          {totalOrders > 3 && (
            <Link to="/account/orders" className="text-sm text-muted-foreground underline hover:text-foreground">
              View All Orders
            </Link>
          )}
        </div>
        {recentOrders.length === 0 ? (
          <Card className="border-2 border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
              <Button asChild>
                <Link to="/browse">Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Card key={order.id} className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--foreground))]">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-bold">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={STATUS_VARIANT[order.status] || "secondary"} className="capitalize text-xs">
                      {order.status}
                    </Badge>
                    <span className="font-bold text-sm">${Number(order.total).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="border-2 gap-2" asChild>
            <Link to="/browse">
              <ShoppingBag className="w-4 h-4" /> Browse Catalog
            </Link>
          </Button>
          <Button variant="outline" className="border-2 gap-2" asChild>
            <Link to="/page/contact">
              <MessageSquare className="w-4 h-4" /> Contact Support
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountOverview;
