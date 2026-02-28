import { Card } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

const SellerOrders = () => (
  <div className="space-y-6">
    <Breadcrumbs items={[{ label: "Dashboard", href: "/seller/dashboard" }, { label: "Orders" }]} />
    <h1 className="font-serif text-2xl md:text-3xl font-bold">Orders</h1>
    <Card className="border-2 border-foreground p-8 text-center" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
      <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <p className="font-sans font-bold text-lg mb-2">No orders yet</p>
      <p className="text-sm text-muted-foreground">
        Orders from matched buyers will appear here once your products start selling.
      </p>
    </Card>
  </div>
);

export default SellerOrders;
