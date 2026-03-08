import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CornerDownRight, Pencil, Truck, MapPin } from "lucide-react";
import TrustBadgeBar from "@/components/TrustBadgeBar";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

const formatPrice = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Cart = () => {
  usePageMeta("Your Cart", "Review your selected premium European cabinets before checkout.");
  const { items, dispatch } = useCart();

  const isAddon = (productId: string) => productId.includes("_option_");

  const mainItems = items.filter((i) => !isAddon(i.productId));
  const addonItems = items.filter((i) => isAddon(i.productId));
  const mainProductCount = mainItems.reduce((s, i) => s + i.quantity, 0);

  // Subtotal = products + add-ons (no delivery)
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  // Delivery total from main items only
  const deliveryTotal = mainItems.reduce((s, i) => {
    if (i.deliveryChoice === "delivery" && (i.deliveryPrice || 0) > 0) {
      return s + (i.deliveryPrice || 0);
    }
    return s;
  }, 0);

  const allPickup = mainItems.length > 0 && mainItems.every((i) => i.deliveryChoice !== "delivery");

  const taxRate = 0.13;
  const tax = Math.round((subtotal + deliveryTotal) * taxRate * 100) / 100;
  const total = Math.round((subtotal + deliveryTotal + tax) * 100) / 100;

  const handleRemove = (productId: string, name: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: productId });
    toast.success(`${name} removed from cart`);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20 pt-24 md:pt-20 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Browse our catalog to find premium cabinetry at unbeatable prices.</p>
          <Button size="lg" asChild>
            <Link to="/browse">Browse Catalog</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const renderMainItem = (item: typeof items[0]) => {
    const relatedAddons = addonItems.filter((a) =>
      a.productId.startsWith(item.productId + "_option_")
    );

    return (
      <Card key={item.productId} className="border-2 border-border shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
        <CardContent className="p-4">
          {/* Main product row */}
          <div className="flex gap-4">
            <Link to={`/product/${item.productId}`} className="shrink-0">
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                className="w-24 h-24 object-cover border-2 border-border"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/product/${item.productId}`} className="font-serif font-semibold text-foreground hover:underline line-clamp-1">
                {item.name}
              </Link>
              <Link to={`/product/${item.productId}`} className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                <Pencil className="w-3 h-3" /> Edit selections
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">{item.dimensions}</p>
              <p className="text-sm font-semibold text-foreground mt-1">${formatPrice(item.price)}</p>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center border-2 border-border">
                  <button
                    className="min-w-[48px] min-h-[48px] flex items-center justify-center hover:bg-muted transition-colors"
                    onClick={() => dispatch({ type: "UPDATE_QUANTITY", payload: { productId: item.productId, quantity: item.quantity - 1 } })}
                    disabled={item.quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-sm font-mono font-medium min-w-[2rem] text-center">{item.quantity}</span>
                  <button
                    className="min-w-[48px] min-h-[48px] flex items-center justify-center hover:bg-muted transition-colors"
                    onClick={() => dispatch({ type: "UPDATE_QUANTITY", payload: { productId: item.productId, quantity: item.quantity + 1 } })}
                    disabled={item.quantity >= item.maxStock}
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-semibold text-foreground">${formatPrice(item.price * item.quantity)}</span>
                  <button
                    className="min-w-[44px] min-h-[44px] p-2 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => handleRemove(item.productId, item.name)}
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Related add-ons + delivery indented below */}
          {(relatedAddons.length > 0 || item.deliveryChoice) && (
            <div className="mt-3 ml-6 md:ml-10 space-y-2 border-l-2 border-border pl-4">
              {relatedAddons.map((addon) => (
                <div key={addon.productId} className="flex items-center justify-between gap-3 py-1.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground truncate">{addon.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-mono font-medium text-foreground">
                      {addon.price > 0 ? `$${formatPrice(addon.price)}` : "Included"}
                    </span>
                    <button
                      className="min-w-[44px] min-h-[44px] p-2 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => handleRemove(addon.productId, addon.name)}
                      aria-label={`Remove ${addon.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Delivery / Pickup line */}
              {item.deliveryChoice === "delivery" && (item.deliveryPrice || 0) > 0 && (
                <div className="flex items-start justify-between gap-3 py-1.5">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <Truck className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-sm text-muted-foreground">Delivery</span>
                      {item.deliveryPrepDays && (
                        <p className="text-xs text-muted-foreground/70">
                          ~{item.deliveryPrepDays} business days prep
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-mono font-medium text-foreground shrink-0">
                    ${formatPrice(item.deliveryPrice || 0)}
                  </span>
                </div>
              )}
              {item.deliveryChoice === "pickup" && (
                <div className="flex items-start justify-between gap-3 py-1.5">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-sm text-muted-foreground">Pickup</span>
                      {(item.pickupAddress || item.pickupCity) && (
                        <p className="text-xs text-muted-foreground/70 truncate">
                          {[item.pickupAddress, item.pickupCity, item.pickupProvince].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-mono font-medium text-muted-foreground shrink-0">Free</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Orphan add-ons (parent product removed)
  const orphanAddons = addonItems.filter((a) => {
    const parentId = a.productId.split("_option_")[0];
    return !mainItems.some((m) => m.productId === parentId);
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 pt-24 md:pt-10">
        <Link to="/browse" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>

        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">Shopping Cart ({mainProductCount})</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {mainItems.map(renderMainItem)}
            {orphanAddons.map((addon) => (
              <Card key={addon.productId} className="border-2 border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground truncate">{addon.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-mono font-medium text-foreground">${formatPrice(addon.price)}</span>
                      <button
                        className="min-w-[44px] min-h-[44px] p-2 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => handleRemove(addon.productId, addon.name)}
                        aria-label={`Remove ${addon.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <Card className="border-2 border-border shadow-[6px_6px_0px_0px_hsl(var(--foreground))]">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">${formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-medium text-foreground">
                      {allPickup ? "Free (Pickup)" : deliveryTotal > 0 ? `$${formatPrice(deliveryTotal)}` : "Free"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated HST (13%)</span>
                    <span className="font-medium text-foreground">${formatPrice(tax)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Estimated Total</span>
                    <span>${formatPrice(total)}</span>
                  </div>

                  <TrustBadgeBar />

                  <Button size="lg" className="w-full mt-4 min-h-[48px] shadow-[2px_2px_0px_0px_hsl(var(--foreground))] sm:shadow-[4px_4px_0px_0px_hsl(var(--foreground))]" asChild>
                    <Link to="/checkout">Proceed to Checkout</Link>
                  </Button>

                  <div className="text-center space-y-2 pt-2">
                    <Link to="/quote-request" className="text-sm text-muted-foreground hover:text-foreground underline transition-colors">
                      Request a Quote Instead
                    </Link>
                    <br />
                    <Link to="/browse" className="text-sm text-muted-foreground hover:text-foreground underline transition-colors">
                      Continue Shopping
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
