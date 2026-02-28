import { Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Eye, ShoppingCart, FileText, PlusCircle } from "lucide-react";

const stats = [
  { label: "Products Listed", value: "0", icon: Package },
  { label: "Total Views", value: "0", icon: Eye },
  { label: "Active Orders", value: "0", icon: ShoppingCart },
  { label: "Pending RFQs", value: "0", icon: FileText },
];

const SellerDashboard = () => {
  const { profile } = useProfile();

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl md:text-3xl font-bold">
        Welcome back, {profile?.full_name?.split(" ")[0] || "there"}
      </h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-2 border-foreground p-5 flex items-center gap-4" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
            <div className="w-10 h-10 bg-primary flex items-center justify-center shrink-0">
              <s.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-mono text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/seller/products/new"><PlusCircle size={16} className="mr-2" /> Add New Product</Link>
        </Button>
        <Button variant="outline" className="border-2 border-foreground" asChild>
          <Link to="/seller/quotes">View Quotes</Link>
        </Button>
      </div>

      <Card className="border-2 border-foreground p-8 text-center" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="font-sans font-bold text-lg mb-2">Top Products</p>
        <p className="text-sm text-muted-foreground mb-4">List your first product to start selling on FitMatch.</p>
        <Button variant="outline" className="border-2 border-foreground" asChild>
          <Link to="/seller/products/new">Add Your First Product</Link>
        </Button>
      </Card>
    </div>
  );
};

export default SellerDashboard;
