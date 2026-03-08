import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ShoppingCart, Download, RefreshCw } from "lucide-react";
import ProductGallery from "@/components/ProductGallery";
import Breadcrumbs from "@/components/Breadcrumbs";
import TrustBadgeBar from "@/components/TrustBadgeBar";
import WishlistButton from "@/components/WishlistButton";
import CompareButton from "@/components/CompareButton";
import ContactSellerButton from "@/components/ContactSellerButton";
import { fmt2 } from "@/lib/productHelpers";
import ProductAddOns from "./ProductAddOns";
import ProductDelivery from "./ProductDelivery";
import type { RefObject } from "react";

interface ProductHeroProps {
  product: any;
  heroRef: RefObject<HTMLDivElement>;
  displayOpts: any[];
  checkedAddOns: Set<string>;
  toggleAddOn: (id: string) => void;
  productPrice: number;
  addOnTotal: number;
  grandTotal: number;
  deliveryChoice: 'delivery' | 'pickup';
  setDeliveryChoice: (v: 'delivery' | 'pickup') => void;
  qtyInCart: number;
  isDeactivated: boolean;
  savings: number;
  handleAddToCart: () => void;
}

const ProductHero = ({
  product,
  heroRef,
  displayOpts,
  checkedAddOns,
  toggleAddOn,
  productPrice,
  addOnTotal,
  grandTotal,
  deliveryChoice,
  setDeliveryChoice,
  qtyInCart,
  isDeactivated,
  savings,
  handleAddToCart,
}: ProductHeroProps) => {
  return (
    <div ref={heroRef} className="min-h-[70vh] pt-24 md:pt-10">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "Browse", href: "/browse" },
            ...(product.categories?.name
              ? [{ label: product.categories.name, href: `/browse?category=${(product.categories as any)?.slug || ""}` }]
              : []),
            { label: product.product_name },
          ]}
        />
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to all products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
          {/* LEFT: Gallery */}
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

          {/* RIGHT: Purchase Decision */}
          <div className="space-y-4">
            {/* Category + Name + Wishlist */}
            <div className="relative">
              {product.categories?.name && (
                <Badge variant="outline" className="mb-2">{product.categories.name}</Badge>
              )}
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                  {product.product_name}
                </h1>
                <WishlistButton productId={product.id} size="md" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">SKU: {product.product_code}</p>
            </div>

            {/* Price block */}
            <div className="border rounded-md p-4 space-y-1.5">
              <div className="flex items-end gap-3">
                <span className="text-2xl font-bold text-foreground">
                  ${Number(product.price_discounted_usd).toLocaleString()}
                </span>
                <span className="text-base text-muted-foreground line-through mb-0.5">
                  ${Number(product.price_retail_usd).toLocaleString()}
                </span>
              </div>
              {savings > 0 && (
                <p className="text-sm text-muted-foreground">
                  You save <span className="font-semibold text-foreground">${savings.toLocaleString()}</span>{" "}
                  <span className="text-xs">({product.discount_percentage}% off)</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">Plus applicable HST (13%)</p>
              <Badge variant={product.availability_status === "In Stock" ? "default" : "secondary"} className="mt-1">
                {product.availability_status}
              </Badge>
            </div>

            {/* Short description */}
            {product.short_description && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{product.short_description}</p>
            )}

            {/* ── Add-On Quick Selector ── */}
            {displayOpts.length > 0 && (
              <div className="border rounded-md p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">Customize Your Order</p>
                <div className="divide-y">
                  {displayOpts.map((opt: any) => (
                    <ProductAddOns key={opt.id} opt={opt} compact checkedAddOns={checkedAddOns} toggleAddOn={toggleAddOn} />
                  ))}
                </div>
                <Separator />
                {(() => {
                  const dOpt = product.delivery_option || 'pickup_only';
                  const deliveryPriceNum = (dOpt === 'delivery' || (dOpt === 'both' && deliveryChoice === 'delivery')) ? Number(product.delivery_price || 0) : 0;
                  const fullTotal = grandTotal + deliveryPriceNum;
                  return (
                    <div className="space-y-1 text-sm pt-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Product</span>
                        <span>${fmt2(productPrice)}</span>
                      </div>
                      {addOnTotal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Add-ons</span>
                          <span>${fmt2(addOnTotal)}</span>
                        </div>
                      )}
                      {deliveryPriceNum > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Delivery</span>
                          <span>${fmt2(deliveryPriceNum)}</span>
                        </div>
                      )}
                      {deliveryPriceNum === 0 && product.delivery_option && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pickup</span>
                          <span>Free</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${fmt2(fullTotal)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── Delivery & Pickup ── */}
            <ProductDelivery product={product} deliveryChoice={deliveryChoice} setDeliveryChoice={setDeliveryChoice} />

            {/* Action buttons */}
            <div className="space-y-3 pt-1">
              <Button
                size="lg"
                className="w-full min-h-[48px] shadow-[2px_2px_0px_0px_hsl(var(--foreground))] sm:shadow-[4px_4px_0px_0px_hsl(var(--foreground))]"
                disabled={isDeactivated || qtyInCart >= product.stock_level}
                onClick={handleAddToCart}
              >
                {qtyInCart > 0 ? <RefreshCw className="w-4 h-4 mr-2" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
                {isDeactivated ? "Currently Unavailable" : qtyInCart > 0 ? "Update Cart" : "Add to Cart"}
              </Button>
              {qtyInCart > 0 && (
                <p className="text-xs text-muted-foreground text-center mt-1">This will update your current cart selections for this product</p>
              )}
              <div className="flex gap-2">
                <CompareButton productId={product.id} variant="text" />
                {product.seller_id && (
                  <ContactSellerButton productId={product.id} sellerId={product.seller_id} productName={product.product_name} />
                )}
              </div>
              {product.installation_instructions_url && (
                <a
                  href={isDeactivated ? undefined : product.installation_instructions_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={isDeactivated ? "pointer-events-none" : ""}
                >
                  <Button variant="outline" size="sm" className="w-full text-xs" disabled={isDeactivated}>
                    <Download className="w-3 h-3 mr-2" />
                    Download Installation Instructions
                  </Button>
                </a>
              )}
            </div>

            <TrustBadgeBar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductHero;
