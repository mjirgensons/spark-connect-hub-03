import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from "lucide-react";
import TrustBadgeBar from "@/components/TrustBadgeBar";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

const Cart = () => {
  usePageMeta("Your Cart");
  const { items, itemCount, subtotal, dispatch } = useCart();

  const taxRate = 0.13;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const isDeliveryItem = (name: string, productId: string) =>
    /delivery|shipping/i.test(name) || (productId.includes("_option_") && /delivery|shipping/i.test(name));

  const formatPrice = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 pt-24 md:pt-10">
        <Link to="/browse" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>

        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">Shopping Cart ({itemCount})</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.productId} className="border-2 border-border shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
                <CardContent className="p-4">
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
                      <p className="text-xs text-muted-foreground mt-0.5">{item.dimensions}</p>
                      <p className="text-sm font-semibold text-foreground mt-1">${formatPrice(item.price)}</p>

                      <div className="flex items-center justify-between mt-3">
                        {isDeliveryItem(item.name, item.productId) ? (
                          <span className="px-3 py-2 text-sm font-mono font-medium text-muted-foreground">× 1</span>
                        ) : (
                          <div className="flex items-center border-2 border-border">
                            <button
                              className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-muted transition-colors"
                              onClick={() => dispatch({ type: "UPDATE_QUANTITY", payload: { productId: item.productId, quantity: item.quantity - 1 } })}
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 text-sm font-mono font-medium min-w-[2rem] text-center">{item.quantity}</span>
                            <button
                              className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-muted transition-colors"
                              onClick={() => dispatch({ type: "UPDATE_QUANTITY", payload: { productId: item.productId, quantity: item.quantity + 1 } })}
                              disabled={item.quantity >= item.maxStock}
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-foreground">${formatPrice(item.price * item.quantity)}</span>
                          <button
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => handleRemove(item.productId, item.name)}
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
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
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-muted-foreground text-xs">Calculated at checkout</span>
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
