import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle } from "lucide-react";

interface HealthData {
  total_orders: number;
  on_time_shipped: number;
  late_shipped: number;
  not_yet_shipped: number;
  on_time_rate: number;
  consecutive_overdue: number;
  health_status: "good" | "warning" | "at_risk" | "restricted";
}

const statusConfig = {
  good: { label: "Good", className: "bg-green-500/15 text-green-700 border-green-300" },
  warning: { label: "Warning", className: "bg-yellow-500/15 text-yellow-700 border-yellow-300" },
  at_risk: { label: "At Risk", className: "bg-orange-500/15 text-orange-700 border-orange-300" },
  restricted: { label: "Restricted", className: "bg-red-500/15 text-red-700 border-red-300" },
};

const alertMessages: Record<string, string> = {
  warning: "Your on-time shipping rate has dropped below 90%. Ship orders on time to maintain your seller standing.",
  at_risk: "Your on-time shipping rate is below 75%. Continued late shipments may result in account restrictions.",
  restricted: "Your account is restricted due to low on-time shipping or consecutive overdue orders. Contact support for assistance.",
};

export default function SellerHealthCard({ sellerId }: { sellerId: string }) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("calculate_seller_health_score", {
        p_seller_id: sellerId,
      });
      if (!error && data) setHealth(data as unknown as HealthData);
      setLoading(false);
    };
    fetch();
  }, [sellerId]);

  if (loading || !health) {
    return (
      <Card
        className="border-2 border-foreground p-5 flex items-center gap-4"
        style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
      >
        <div className="w-10 h-10 bg-primary flex items-center justify-center shrink-0">
          <Activity className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-mono text-2xl font-bold">—</p>
          <p className="text-xs text-muted-foreground">Seller Health</p>
        </div>
      </Card>
    );
  }

  const cfg = statusConfig[health.health_status];
  const showAlert = health.health_status !== "good" && alertMessages[health.health_status];

  return (
    <Card
      className="border-2 border-foreground p-5 space-y-3"
      style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-primary flex items-center justify-center shrink-0">
          <Activity className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-mono text-2xl font-bold">{health.on_time_rate}%</p>
            <Badge variant="outline" className={`text-[10px] ${cfg.className}`}>
              {cfg.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {health.on_time_shipped} of {health.total_orders} orders shipped on time (90 days)
          </p>
        </div>
      </div>
      {showAlert && (
        <div className="flex items-start gap-2 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
          <span className="text-muted-foreground">{showAlert}</span>
        </div>
      )}
    </Card>
  );
}
