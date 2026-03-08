import { Button } from "@/components/ui/button";
import { ShoppingCart, RefreshCw } from "lucide-react";

interface ProductStickySidebarProps {
  product: any;
  qtyInCart: number;
  isDeactivated: boolean;
  handleAddToCart: () => void;
  visible: boolean;
}

const ProductStickySidebar = ({ product, qtyInCart, isDeactivated, handleAddToCart, visible }: ProductStickySidebarProps) => {
  if (!visible) return null;

  return (
    <div className="hidden lg:block fixed right-6 top-20 z-40 w-72 border rounded-lg bg-background shadow-lg p-4 space-y-3 animate-in slide-in-from-right-5 duration-300">
      <p className="text-sm font-semibold text-foreground truncate">{product.product_name}</p>
      <p className="text-xl font-bold text-foreground">${Number(product.price_discounted_usd).toLocaleString()}</p>
      <Button
        size="sm"
        className="w-full"
        disabled={isDeactivated || qtyInCart >= product.stock_level}
        onClick={handleAddToCart}
      >
        {qtyInCart > 0 ? <RefreshCw className="w-4 h-4 mr-2" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
        {qtyInCart > 0 ? "Update Cart" : "Add to Cart"}
      </Button>
    </div>
  );
};

export default ProductStickySidebar;
