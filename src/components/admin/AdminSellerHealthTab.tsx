import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, Activity, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SellerRow {
  id: string;
  full_name: string | null;
  email: string | null;
  company_name: string | null;
  seller_restriction_status: string | null;
  health?: {
    on_time_rate: number;
    total_orders: number;
    on_time_shipped: number;
    health_status: string;
  } | null;
}

const restrictionBadge = (status: string | null) => {
  switch (status) {
    case "active":
      return { label: "Active", className: "bg-green-500/15 text-green-700 border-green-300" };
    case "warning":
      return { label: "Warning", className: "bg-yellow-500/15 text-yellow-700 border-yellow-300" };
    case "restricted":
      return { label: "Restricted", className: "bg-orange-500/15 text-orange-700 border-orange-300" };
    case "suspended":
      return { label: "Suspended", className: "bg-red-500/15 text-red-700 border-red-300" };
    default:
      return { label: "Active", className: "bg-green-500/15 text-green-700 border-green-300" };
  }
};

const healthBadge = (status: string | null) => {
  switch (status) {
    case "good":
      return { label: "Good", className: "bg-green-500/15 text-green-700 border-green-300" };
    case "warning":
      return { label: "Warning", className: "bg-yellow-500/15 text-yellow-700 border-yellow-300" };
    case "at_risk":
      return { label: "At Risk", className: "bg-orange-500/15 text-orange-700 border-orange-300" };
    case "restricted":
      return { label: "Restricted", className: "bg-red-500/15 text-red-700 border-red-300" };
    default:
      return { label: "—", className: "" };
  }
};

const AdminSellerHealthTab = () => {
  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerRow | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchSellers = async () => {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, company_name, seller_restriction_status")
      .eq("user_type", "seller")
      .order("full_name");

    if (error || !profiles) {
      setLoading(false);
      return;
    }

    // Fetch health scores in parallel
    const withHealth = await Promise.all(
      profiles.map(async (p) => {
        const { data } = await supabase.rpc("calculate_seller_health_score", {
          p_seller_id: p.id,
        });
        return { ...p, health: data as SellerRow["health"] };
      })
    );

    setSellers(withHealth);
    setLoading(false);
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const openRestrictionDialog = (seller: SellerRow, status: string) => {
    setSelectedSeller(seller);
    setTargetStatus(status);
    setReason("");
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedSeller) return;
    setSubmitting(true);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-seller-restriction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            seller_id: selectedSeller.id,
            restriction_status: targetStatus,
            reason: reason || null,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");

      toast.success(`Seller status updated to ${targetStatus}`);
      setDialogOpen(false);
      fetchSellers();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const statuses = ["active", "warning", "restricted", "suspended"];

  return (
    <div className="space-y-4">
      <Card
        className="border-2 border-foreground overflow-hidden"
        style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : sellers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No sellers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border bg-muted/50">
                  <th className="text-left p-3 font-semibold">Seller</th>
                  <th className="text-left p-3 font-semibold">Email</th>
                  <th className="text-left p-3 font-semibold">Business</th>
                  <th className="text-center p-3 font-semibold">Health Score</th>
                  <th className="text-center p-3 font-semibold">Health Status</th>
                  <th className="text-center p-3 font-semibold">Restriction</th>
                  <th className="text-center p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((s) => {
                  const rBadge = restrictionBadge(s.seller_restriction_status);
                  const hBadge = healthBadge(s.health?.health_status || null);
                  return (
                    <tr key={s.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{s.full_name || "—"}</td>
                      <td className="p-3 text-muted-foreground">{s.email || "—"}</td>
                      <td className="p-3 text-muted-foreground">{s.company_name || "—"}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-mono font-bold">
                            {s.health ? `${s.health.on_time_rate}%` : "—"}
                          </span>
                        </div>
                        {s.health && s.health.total_orders > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {s.health.on_time_shipped}/{s.health.total_orders} on time
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className={`text-[10px] ${hBadge.className}`}>
                          {hBadge.label}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className={`text-[10px] ${rBadge.className}`}>
                          {rBadge.label}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {statuses
                              .filter((st) => st !== (s.seller_restriction_status || "active"))
                              .map((st) => (
                                <DropdownMenuItem
                                  key={st}
                                  onClick={() => openRestrictionDialog(s, st)}
                                  className="capitalize"
                                >
                                  Set {st}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              Set Seller to {targetStatus}
            </DialogTitle>
            <DialogDescription>
              {selectedSeller?.full_name || "This seller"} ({selectedSeller?.email})
              {targetStatus === "restricted" &&
                " — This will hide all approved listings from the marketplace."}
              {targetStatus === "suspended" &&
                " — This will hide all approved listings from the marketplace."}
              {targetStatus === "active" &&
                " — This will restore any enforcement-hidden listings."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason (optional)</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for this action..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSellerHealthTab;
