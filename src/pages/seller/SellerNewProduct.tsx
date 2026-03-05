import Breadcrumbs from "@/components/Breadcrumbs";
import SellerProductForm from "@/components/seller/SellerProductForm";

const SellerNewProduct = () => {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/seller/dashboard" }, { label: "Products", href: "/seller/products" }, { label: "New Product" }]} />
      <h1 className="font-serif text-2xl md:text-3xl font-bold">Add New Product</h1>
      <SellerProductForm />
    </div>
  );
};

export default SellerNewProduct;
