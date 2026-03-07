import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompare } from "@/contexts/CompareContext";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";

const MM_TO_INCH = 0.0393701;
const fmtPrice = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const ComparePage = () => {
  usePageMeta("Compare Products", "Compare premium European cabinets side by side — dimensions, pricing, features, and specifications.");
  const { compareIds, removeFromCompare, clearCompare } = useCompare();
  const { dispatch, getItemQuantity } = useCart();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["compare-products", compareIds],
    queryFn: async () => {
      if (compareIds.length === 0) return [];
      const { data } = await supabase
        .from("products")
        .select("*, categories(name)")
        .in("id", compareIds)
        .is("deleted_at", null);
      return (data || []).filter(Boolean);
    },
    enabled: compareIds.length > 0,
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
        sellerId: product.seller_id || undefined,
      },
    });
    toast.success("Added to cart");
  };

  // Find best values for highlighting
  const lowestPrice = products.length > 0 ? Math.min(...products.map((p: any) => Number(p.price_discounted_usd))) : 0;
  const highestDiscount = products.length > 0 ? Math.max(...products.map((p: any) => Number(p.discount_percentage))) : 0;

  type Row = { label: string; render: (p: any) => React.ReactNode };

  const rows: Row[] = [
    {
      label: "Image",
      render: (p) => (
        <Link to={`/product/${p.id}`}>
          <img src={p.main_image_url || "/placeholder.svg"} alt={p.product_name} className="w-full aspect-square object-cover border-2 border-foreground rounded-sm" />
        </Link>
      ),
    },
    {
      label: "Name",
      render: (p) => <Link to={`/product/${p.id}`} className="font-serif font-bold text-sm hover:underline">{p.product_name}</Link>,
    },
    {
      label: "Price",
      render: (p) => (
        <div>
          <span className={`font-bold text-lg ${Number(p.price_discounted_usd) === lowestPrice ? "text-green-600" : ""}`}>
            {fmtPrice(p.price_discounted_usd)}
          </span>
          {p.price_retail_usd > p.price_discounted_usd && (
            <span className="block text-sm text-muted-foreground line-through">{fmtPrice(p.price_retail_usd)}</span>
          )}
        </div>
      ),
    },
    {
      label: "Discount",
      render: (p) => (
        <span className={`font-bold ${Number(p.discount_percentage) === highestDiscount && highestDiscount > 0 ? "text-green-600" : ""}`}>
          {Math.round(p.discount_percentage)}%
        </span>
      ),
    },
    {
      label: "Dimensions",
      render: (p) => (
        <div className="text-sm">
          <p>{p.width_mm} × {p.height_mm} × {p.depth_mm} mm</p>
          <p className="text-muted-foreground">{(p.width_mm * MM_TO_INCH).toFixed(1)}″ × {(p.height_mm * MM_TO_INCH).toFixed(1)}″ × {(p.depth_mm * MM_TO_INCH).toFixed(1)}″</p>
        </div>
      ),
    },
    { label: "Color", render: (p) => <span className="text-sm">{p.color}</span> },
    { label: "Style", render: (p) => <span className="text-sm">{p.style}</span> },
    { label: "Material", render: (p) => <span className="text-sm">{p.material}</span> },
    {
      label: "Countertop",
      render: (p) => (
        <span className="text-sm">
          {p.countertop_included ? `Yes — ${p.countertop_material || "Included"}` : "No"}
        </span>
      ),
    },
    {
      label: "Layouts",
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          {(p.compatible_kitchen_layouts || []).map((l: string) => (
            <Badge key={l} variant="secondary" className="text-[10px]">{l}</Badge>
          ))}
          {(!p.compatible_kitchen_layouts || p.compatible_kitchen_layouts.length === 0) && <span className="text-sm text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      label: "Availability",
      render: (p) => <Badge variant={p.availability_status === "In Stock" ? "default" : "secondary"}>{p.availability_status}</Badge>,
    },
    {
      label: "Category",
      render: (p) => <span className="text-sm">{(p as any).categories?.name || "—"}</span>,
    },
    {
      label: "Actions",
      render: (p) => (
        <div className="flex flex-col gap-2">
          <Button size="sm" onClick={() => handleAddToCart(p)} disabled={p.availability_status === "Deactivated" || getItemQuantity(p.id) >= p.stock_level}>
            <ShoppingCart className="w-3 h-3 mr-1" /> Add to Cart
          </Button>
          <Button variant="ghost" size="sm" onClick={() => removeFromCompare(p.id)}>
            <X className="w-3 h-3 mr-1" /> Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-20">
        <Breadcrumbs items={[{ label: "Browse", href: "/browse" }, { label: "Compare" }]} />
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Compare Products</h1>
          {products.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCompare}>Clear All</Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length < 2 ? (
          <div className="text-center py-20 border-2 border-foreground max-w-lg mx-auto" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
            <p className="font-bold text-lg mb-2">Add at least 2 products to compare</p>
            <p className="text-sm text-muted-foreground mb-6">Browse our catalog to get started.</p>
            <Button asChild><Link to="/browse">Browse Catalog</Link></Button>
          </div>
        ) : (
          <div className="overflow-x-auto border-2 border-foreground" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
            <table className="w-full min-w-[600px]">
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="p-3 font-sans font-semibold text-sm text-muted-foreground w-[120px] align-top border-r-2 border-foreground/10">
                      {row.label}
                    </td>
                    {products.map((p: any) => (
                      <td key={p.id} className="p-3 align-top border-r border-foreground/10 last:border-r-0" style={{ width: `${100 / products.length}%` }}>
                        {row.render(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ComparePage;
