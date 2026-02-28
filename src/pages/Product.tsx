import { useParams, Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, Ruler, Palette, Layers, Info, ShoppingCart } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import ProductGallery from "@/components/ProductGallery";
import { ProductDetailSkeleton } from "@/components/ui/product-detail-skeleton";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useCart } from "@/contexts/CartContext";
import TrustBadgeBar from "@/components/TrustBadgeBar";
import { toast } from "sonner";

const Product = () => {
  const { id } = useParams<{ id: string }>();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", id!)
        .is("deleted_at", null)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <ProductDetailSkeleton />
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-4">Product Not Found</h1>
          <Link to="/">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const savings = product.price_retail_usd - product.price_discounted_usd;
  const isDeactivated = product.availability_status === "Deactivated";

  usePageMeta(
    product.product_name,
    product.short_description || `${product.product_name} — ${product.color} ${product.material} cabinet. $${Number(product.price_discounted_usd).toLocaleString()} (${product.discount_percentage}% off). Available at FitMatch.`
  );

  const { dispatch, getItemQuantity } = useCart();
  const qtyInCart = getItemQuantity(product.id);

  const handleAddToCart = () => {
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
    toast.success("Added to cart", {
      action: { label: "View Cart", onClick: () => window.location.href = "/cart" },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-10 pt-24 md:pt-10">
        <Breadcrumbs
          items={[
            { label: "Browse", href: "/browse" },
            ...(product.categories?.name
              ? [{ label: product.categories.name, href: `/browse?category=${(product.categories as any)?.slug || ""}` }]
              : []),
            { label: product.product_name },
          ]}
        />
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to all products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Images */}
          <div className="relative">
            <ProductGallery
              mainImage={product.main_image_url || "/placeholder.svg"}
              additionalImages={product.additional_image_urls || []}
              productName={product.product_name}
              discountPercentage={isDeactivated ? 0 : product.discount_percentage}
            />
            {isDeactivated && (
              <div className="absolute top-4 left-4 right-4 z-10">
                <div className="bg-foreground/80 text-background text-lg font-bold px-4 py-3 rounded-md text-center">
                  Temporarily Unavailable
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              {product.categories?.name && (
                <Badge variant="outline" className="mb-2">{product.categories.name}</Badge>
              )}
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                {product.product_name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">SKU: {product.product_code}</p>
            </div>

            {/* Pricing */}
            <div className="border p-5 space-y-2">
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold text-foreground">
                  ${Number(product.price_discounted_usd).toLocaleString()}
                </span>
                <span className="text-lg text-muted-foreground line-through mb-0.5">
                  ${Number(product.price_retail_usd).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Plus applicable HST (13%)</p>
              <p className="text-sm text-muted-foreground">
                You save <span className="font-semibold text-foreground">${savings.toLocaleString()}</span>
              </p>
              <Badge variant={product.availability_status === "In Stock" ? "default" : "secondary"}>
                {product.availability_status}
              </Badge>
            </div>

            {/* Short description */}
            {product.short_description && (
              <p className="text-muted-foreground leading-relaxed">{product.short_description}</p>
            )}

            <Separator />

            {/* Specs */}
            <div className="space-y-4">
              <h2 className="text-lg font-serif font-semibold text-foreground">Specifications</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Dimensions (W×H×D)</p>
                    <p className="text-sm font-medium text-foreground">
                      {product.width_mm} × {product.height_mm} × {product.depth_mm} mm
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Color</p>
                    <p className="text-sm font-medium text-foreground">{product.color}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Material</p>
                    <p className="text-sm font-medium text-foreground">{product.material}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Style</p>
                    <p className="text-sm font-medium text-foreground">{product.style}</p>
                  </div>
                </div>
                {product.stock_level > 0 && (
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Units in Stock</p>
                      <p className="text-sm font-medium text-foreground">{product.stock_level}</p>
                    </div>
                  </div>
                )}
              </div>
              {product.compatible_kitchen_layouts && product.compatible_kitchen_layouts.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Compatible Layouts</p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.compatible_kitchen_layouts.map((layout: string) => (
                      <Badge key={layout} variant="secondary" className="text-xs">{layout}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Countertop Info */}
              {product.countertop_option && product.countertop_option !== "no" && (
                <Separator />
              )}
              {product.countertop_option === "yes" && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Countertop</h3>
                  <Badge variant={product.countertop_included ? "default" : "secondary"}>
                    {product.countertop_included ? "Included with product" : "Available separately"}
                  </Badge>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {product.countertop_stock != null && product.countertop_stock > 0 && (
                      <div><p className="text-xs text-muted-foreground">Units in Stock</p><p className="font-medium text-foreground">{product.countertop_stock}</p></div>
                    )}
                    {product.countertop_material && (
                      <div><p className="text-xs text-muted-foreground">Material</p><p className="font-medium text-foreground">{product.countertop_material}</p></div>
                    )}
                    {product.countertop_thickness && (
                      <div><p className="text-xs text-muted-foreground">Thickness</p><p className="font-medium text-foreground">{product.countertop_thickness}</p></div>
                    )}
                    {product.countertop_finish && (
                      <div><p className="text-xs text-muted-foreground">Finish</p><p className="font-medium text-foreground">{product.countertop_finish}</p></div>
                    )}
                  </div>
                </div>
              )}
              {product.countertop_option === "optional" && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Countertop (Optional Add-on)</h3>
                  <div className="border p-3 space-y-2">
                    <div className="flex items-end gap-3">
                      <span className="text-xl font-bold text-foreground">
                        CA${Number(product.countertop_price_discounted).toLocaleString()}
                      </span>
                      {Number(product.countertop_price_retail) > Number(product.countertop_price_discounted) && (
                        <span className="text-sm text-muted-foreground line-through">
                          CA${Number(product.countertop_price_retail).toLocaleString()}
                        </span>
                      )}
                      {Number(product.countertop_discount_percentage) > 0 && (
                        <Badge variant="destructive" className="text-xs">{product.countertop_discount_percentage}% OFF</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {product.countertop_stock != null && product.countertop_stock > 0 && (
                        <div><p className="text-xs text-muted-foreground">Units in Stock</p><p className="font-medium text-foreground">{product.countertop_stock}</p></div>
                      )}
                      {product.countertop_material && (
                        <div><p className="text-xs text-muted-foreground">Material</p><p className="font-medium text-foreground">{product.countertop_material}</p></div>
                      )}
                      {product.countertop_thickness && (
                        <div><p className="text-xs text-muted-foreground">Thickness</p><p className="font-medium text-foreground">{product.countertop_thickness}</p></div>
                      )}
                      {product.countertop_finish && (
                        <div><p className="text-xs text-muted-foreground">Finish</p><p className="font-medium text-foreground">{product.countertop_finish}</p></div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Long description */}
            {product.long_description && (
              <>
                <Separator />
                <div>
                  <h2 className="text-lg font-serif font-semibold text-foreground mb-2">Description</h2>
                  <div className="max-h-48 overflow-y-auto border p-3">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {product.long_description}
                    </p>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                size="lg"
                className="w-full sm:flex-1 min-h-[48px] shadow-[2px_2px_0px_0px_hsl(var(--foreground))] sm:shadow-[4px_4px_0px_0px_hsl(var(--foreground))]"
                disabled={isDeactivated || qtyInCart >= product.stock_level}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {isDeactivated ? "Currently Unavailable" : qtyInCart > 0 ? `In Cart (${qtyInCart})` : "Add to Cart"}
              </Button>
              {product.installation_instructions_url && (
                <a
                  href={isDeactivated ? undefined : product.installation_instructions_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full sm:flex-1 ${isDeactivated ? "pointer-events-none" : ""}`}
                >
                  <Button variant="outline" size="sm" className="w-full h-full min-h-[44px] text-xs shadow-[0_4px_12px_hsla(var(--muted-foreground),0.3)]" disabled={isDeactivated}>
                    Download Installation Instructions
                  </Button>
                </a>
              )}
            </div>

            <TrustBadgeBar />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Product;
