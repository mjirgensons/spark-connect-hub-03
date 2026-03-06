import { useParams } from "react-router-dom";
import Breadcrumbs from "@/components/Breadcrumbs";
import SellerProductForm from "@/components/seller/SellerProductForm";

const SellerEditProduct = () => {
  const { productId } = useParams();
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/seller/dashboard" }, { label: "Products", href: "/seller/products" }, { label: "Edit Product" }]} />
      <h1 className="font-serif text-2xl md:text-3xl font-bold">Edit Product</h1>
      <SellerProductForm productId={productId} />
    </div>
  );
};

export default SellerEditProduct;
