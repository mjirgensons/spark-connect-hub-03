import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import Breadcrumbs from "@/components/Breadcrumbs";

const SellerEditProduct = () => {
  const { productId } = useParams();
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/seller/dashboard" }, { label: "Products", href: "/seller/products" }, { label: "Edit Product" }]} />
      <h1 className="font-serif text-2xl md:text-3xl font-bold">Edit Product</h1>
      <Card className="border-2 border-foreground p-8 text-center" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
        <p className="text-sm text-muted-foreground">
          Edit form for product <span className="font-mono font-semibold text-foreground">{productId}</span> will be pre-populated once seller_id is added to the products table.
        </p>
      </Card>
    </div>
  );
};

export default SellerEditProduct;
