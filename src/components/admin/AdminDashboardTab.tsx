import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingCart, Clock, TrendingUp } from "lucide-react";

interface StatCard {
  label: string;
  value: string;
  icon: React.ElementType;
  sub?: string;
}

interface RecentOrder {
  id: string;
  order_number: string;
  shipping_name: string;
  guest_email: string | null;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
}

const statusColor: Record<string, string> = {
  pending: "secondary",
  confirmed: "default",
  preparing: "default",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  refunded: "destructive",
};

interface AdminDashboardTabProps {
  onNavigateToOrders: () => void;
}

const AdminDashboardTab = ({ onNavigateToOrders }: AdminDashboardTabProps) => {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Fetch all orders for calculations
    const { data: allOrders } = await supabase
      .from("orders")
      .select("id, total, status, payment_status, paid_at, created_at, order_number, shipping_name, guest_email");

    const orders = (allOrders || []) as RecentOrder[];

    const todayRevenue = orders
      .filter((o) => o.payment_status === "paid" && o.created_at >= todayStart)
      .reduce((sum, o) => sum + Number(o.total), 0);

    const monthRevenue = orders
      .filter((o) => o.payment_status === "paid" && o.created_at >= monthStart)
      .reduce((sum, o) => sum + Number(o.total), 0);

    const pendingCount = orders.filter((o) =>
      ["pending", "confirmed"].includes(o.status)
    ).length;

    setStats([
      {
        label: "Today's Revenue",
        value: `$${todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        icon: DollarSign,
      },
      {
        label: "Total Orders",
        value: String(orders.length),
        icon: ShoppingCart,
      },
      {
        label: "Pending Orders",
        value: String(pendingCount),
        icon: Clock,
      },
      {
        label: "This Month's Revenue",
        value: `$${monthRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        icon: TrendingUp,
      },
    ]);

    // Recent 10 orders
    const sorted = [...orders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setRecentOrders(sorted.slice(0, 10));
    setLoading(false);
  };

  if (loading) {
    return <p className="text-muted-foreground py-8 text-center">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-2 border-border shadow-[3px_3px_0px_0px_hsl(var(--foreground))]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-muted border-2 border-border">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold font-mono text-foreground">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders */}
      <Card className="border-2 border-border">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 pb-2">
            <h3 className="font-serif font-semibold text-foreground">Recent Orders</h3>
            <button
              onClick={onNavigateToOrders}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              View All Orders
            </button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="py-2 px-3">Order #</TableHead>
                <TableHead className="py-2 px-3">Customer</TableHead>
                <TableHead className="py-2 px-3 text-right">Total</TableHead>
                <TableHead className="py-2 px-3 text-center">Status</TableHead>
                <TableHead className="py-2 px-3 text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className="text-xs cursor-pointer hover:bg-accent"
                  onClick={onNavigateToOrders}
                >
                  <TableCell className="py-2 px-3 font-mono font-medium">
                    {order.order_number}
                  </TableCell>
                  <TableCell className="py-2 px-3 max-w-[150px] truncate">
                    {order.shipping_name}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-right font-mono">
                    ${Number(order.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-center">
                    <Badge
                      variant={(statusColor[order.status] as any) || "secondary"}
                      className="text-[9px] px-1.5 py-0"
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-3 text-right text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-CA", {
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
              {recentOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No orders yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardTab;
