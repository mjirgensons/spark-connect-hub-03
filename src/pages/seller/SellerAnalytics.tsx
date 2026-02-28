import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const SellerAnalytics = () => (
  <div className="space-y-6">
    <h1 className="font-serif text-2xl md:text-3xl font-bold">Analytics</h1>
    <Card className="border-2 border-foreground p-8 text-center" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
      <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <p className="font-sans font-bold text-lg mb-2">Analytics Coming Soon</p>
      <p className="text-sm text-muted-foreground">
        Track product views, match rates, conversion metrics, and revenue — all from this dashboard.
      </p>
    </Card>
  </div>
);

export default SellerAnalytics;
