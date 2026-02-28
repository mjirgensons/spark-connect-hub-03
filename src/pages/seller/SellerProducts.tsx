import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, PlusCircle } from "lucide-react";

const SellerProducts = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="font-serif text-2xl md:text-3xl font-bold">My Products</h1>
      <Button asChild>
        <Link to="/seller/products/new"><PlusCircle size={16} className="mr-2" /> Add Product</Link>
      </Button>
    </div>

    <Card className="border-2 border-foreground p-8 text-center" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
      <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <p className="font-sans font-bold text-lg mb-2">You haven't listed any products yet</p>
      <p className="text-sm text-muted-foreground mb-4">
        Products you list will appear here. Buyers will be matched to your inventory automatically.
      </p>
      <Button variant="outline" className="border-2 border-foreground" asChild>
        <Link to="/seller/products/new">List Your First Product</Link>
      </Button>
    </Card>
  </div>
);

export default SellerProducts;
