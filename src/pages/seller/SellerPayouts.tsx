import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import Breadcrumbs from "@/components/Breadcrumbs";
import { DollarSign, TrendingUp, Percent, Clock } from "lucide-react";
import { format } from "date-fns";

interface PayoutRow {
  id: string;
  order_id: string;
  gross_amount_cents: number;
  platform_fee_cents: number;
  stripe_fee_cents: number;
  seller_payout_cents: number;
  hst_on_commission_cents: number;
  stripe_transfer_id: string | null;
  payout_status: string;
  released_at: string | null;
  created_at: string;
  order_number: string;
}

const statusColors: Record<string, string> = {
  completed: "bg-green-500/15 text-green-700 border-green-300",
  pending: "bg-yellow-500/15 text-yellow-700 border-yellow-300",
  failed: "bg-red-500/15 text-red-700 border-red-300",
};

const fmtCAD = (cents: number) => {
  const dollars = cents / 100;
  return `CA$${dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const SellerPayouts = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const adminViewId = searchParams.get("adminView");
  const effectiveId = adminViewId || user?.id;

  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayouts = useCallback(async () => {
    if (!effectiveId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("seller_payouts")
      .select("id, order_id, gross_amount_cents, platform_fee_cents, stripe_fee_cents, seller_payout_cents, hst_on_commission_cents, stripe_transfer_id, payout_status, released_at, created_at, orders!inner(order_number)")
      .eq("seller_id", effectiveId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch payouts:", error);
      setLoading(false);
      return;
    }

    const rows: PayoutRow[] = (data || []).map((row: any) => ({
      id: row.id,
      order_id: row.order_id,
      gross_amount_cents: row.gross_amount_cents,
      platform_fee_cents: row.platform_fee_cents,
      stripe_fee_cents: row.stripe_fee_cents,
      seller_payout_cents: row.seller_payout_cents,
      hst_on_commission_cents: row.hst_on_commission_cents,
      stripe_transfer_id: row.stripe_transfer_id,
      payout_status: row.payout_status,
      released_at: row.released_at,
      created_at: row.created_at,
      order_number: row.orders?.order_number || "—",
    }));

    setPayouts(rows);
    setLoading(false);
  }, [effectiveId]);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const totalEarned = payouts
    .filter((p) => p.payout_status === "completed")
    .reduce((sum, p) => sum + p.seller_payout_cents, 0);
  const totalFees = payouts
    .filter((p) => p.payout_status === "completed")
    .reduce((sum, p) => sum + p.platform_fee_cents, 0);
  const totalGross = payouts
    .filter((p) => p.payout_status === "completed")
    .reduce((sum, p) => sum + p.gross_amount_cents, 0);
  const pendingCount = payouts.filter((p) => p.payout_status === "pending").length;

  const stats = [
    { label: "Total Earned", value: fmtCAD(totalEarned), icon: DollarSign },
    { label: "Gross Sales", value: fmtCAD(totalGross), icon: TrendingUp },
    { label: "Platform Fees", value: fmtCAD(totalFees), icon: Percent },
    { label: "Pending", value: String(pendingCount), icon: Clock },
  ];

  const dashUrl = adminViewId ? `/seller/dashboard?adminView=${adminViewId}` : "/seller/dashboard";

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Seller", href: dashUrl }, { label: "Payouts" }]} />
        <h1 className="text-2xl font-bold">Payouts</h1>
        <p className="text-muted-foreground">Loading payouts…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Seller", href: dashUrl }, { label: "Payouts" }]} />
      <h1 className="text-2xl font-bold">Payouts</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))]">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-lg font-bold font-mono">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {payouts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground space-y-2">
          <DollarSign className="h-10 w-10 mx-auto opacity-30" />
          <p className="font-semibold">No payouts yet</p>
          <p className="text-sm">Payouts will appear here when customers complete purchases for your products.</p>
        </div>
      ) : (
        <Card className="border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Fee (10%)</TableHead>
                <TableHead className="text-right">Your Payout</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">{p.order_number}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(p.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {fmtCAD(p.gross_amount_cents)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    -{fmtCAD(p.platform_fee_cents)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {fmtCAD(p.seller_payout_cents)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[p.payout_status] || ""}>
                      {p.payout_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Fee explanation */}
      <div className="text-xs text-muted-foreground space-y-1 pt-2">
        <p>Platform fee is 10% of gross sales (subtotal + shipping). Stripe processing fees are additional.</p>
        <p>Payouts are transferred to your connected Stripe account after payment confirmation.</p>
      </div>
    </div>
  );
};

export default SellerPayouts;
