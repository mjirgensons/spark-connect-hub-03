import { usePageMeta } from "@/hooks/usePageMeta";
import { useWishlist } from "@/contexts/WishlistContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { ProductCardSkeleton } from "@/components/ui/product-card-skeleton";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const MM_TO_INCH = 0.0393701;
const fmtPrice = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const AccountWishlist = () => {
  usePageMeta("My Wishlist");
  const { items, loading: wishlistLoading, toggleWishlist } = useWishlist();
  const { dispatch, getItemQuantity } = useCart();

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["wishlist-products", items],
    queryFn: async () => {
      if (items.length === 0) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .in("id", items)
        .is("deleted_at", null);
      if (error) throw error;
      return data || [];
    },
    enabled: !wishlistLoading,
  });

  const handleAddToCart = (product: any) => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        productId: product.id,
        name: product.product_name,
        image: product.main_image_url || "/placeholder.svg",
        price: product.price_discounted_usd,
        dimensions: `${product.width_mm} × ${product.height_mm} × ${product.depth_mm} mm`,
        maxStock: product.stock_level,
      },
    });
    toast.success("Added to cart");
  };

  const loading = wishlistLoading || productsLoading;

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-serif font-bold mb-6">My Wishlist</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-serif font-bold mb-6">My Wishlist</h1>
        <div className="text-center py-20 border-2 border-foreground" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
          <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="font-bold text-lg mb-2">Your wishlist is empty</p>
          <p className="text-sm text-muted-foreground mb-6">Save products you love for later.</p>
          <Button asChild variant="outline" className="border-2">
            <Link to="/browse">Browse Catalog</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold mb-6">My Wishlist ({items.length})</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {products.map((product: any) => {
          const categoryName = product.categories?.name || "Uncategorized";
          const qtyInCart = getItemQuantity(product.id);
          const isDeactivated = product.availability_status === "Deactivated";

          return (
            <Card
              key={product.id}
              className="border-2 border-foreground overflow-hidden"
              style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
            >
              <Link to={`/product/${product.id}`}>
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  {product.main_image_url ? (
                    <img src={product.main_image_url} alt={product.product_name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No Image</div>
                  )}
                  {product.discount_percentage > 0 && (
                    <Badge className="absolute top-2 right-2 bg-green-600 text-primary-foreground border-0 font-mono text-xs">
                      -{Math.round(product.discount_percentage)}%
                    </Badge>
                  )}
                </div>
              </Link>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/product/${product.id}`} className="hover:underline">
                    <h3 className="font-bold text-sm leading-tight line-clamp-2">{product.product_name}</h3>
                  </Link>
                  <Badge variant="outline" className="text-[10px] shrink-0 border-foreground">{categoryName}</Badge>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {product.width_mm}×{product.height_mm}×{product.depth_mm} mm / {(product.width_mm * MM_TO_INCH).toFixed(1)}″×{(product.height_mm * MM_TO_INCH).toFixed(1)}″×{(product.depth_mm * MM_TO_INCH).toFixed(1)}″
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-lg">{fmtPrice(product.price_discounted_usd)}</span>
                  {product.price_retail_usd > product.price_discounted_usd && (
                    <span className="text-sm text-muted-foreground line-through">{fmtPrice(product.price_retail_usd)}</span>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 border-2 shadow-[2px_2px_0px_0px_hsl(var(--foreground))]"
                    disabled={isDeactivated || qtyInCart >= product.stock_level}
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    {qtyInCart > 0 ? `In Cart (${qtyInCart})` : "Add to Cart"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-2 text-destructive hover:bg-destructive/10"
                    onClick={() => toggleWishlist(product.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AccountWishlist;
