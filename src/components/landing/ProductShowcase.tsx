import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const KITCHENS_SLUG = "kitchens";

const ProductShowcase = () => {
  const { data: kitchenCategory } = useQuery({
    queryKey: ["category-kitchens"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id").eq("slug", KITCHENS_SLUG).single();
      return data;
    },
    staleTime: 300_000,
  });

  const { data: dbProducts = [] } = useQuery({
    queryKey: ["kitchen-products", kitchenCategory?.id],
    queryFn: async () => {
      const q = supabase
        .from("products")
        .select("*")
        .eq("category_id", kitchenCategory!.id)
        .is("deleted_at", null);
      const { data, error } = await (q as any)
        .in("availability_status", ["In Stock", "Low Stock"])
        .eq("listing_status", "approved")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
    enabled: !!kitchenCategory?.id,
  });

  if (dbProducts.length === 0) return null;

  return (
    <section id="cabinets" className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 text-sm px-4 py-1">Featured Cabinets</Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-4">
            Premium Cabinets, Unbeatable Prices
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our curated selection of surplus luxury European cabinetry — all at 50–80% below retail.
          </p>
          <p className="text-xs text-muted-foreground mt-2">Savings based on MSRP. Actual retail prices may vary.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {dbProducts.map((product) => (
            <Link to={`/product/${product.id}`} key={product.id}>
              <Card className="group overflow-hidden h-full">
                <div className="relative aspect-square overflow-hidden">
                  <img src={product.main_image_url || "/placeholder.svg"} alt={`${product.product_name} kitchen cabinets`} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${product.availability_status === "Deactivated" ? "opacity-60" : ""}`} loading="lazy" />
                  {product.availability_status === "Deactivated" && (
                    <div className="absolute top-3 left-3 right-3 bg-foreground/80 text-background text-sm font-bold px-3 py-2 rounded-md text-center">
                      Temporarily Unavailable
                    </div>
                  )}
                  {product.discount_percentage > 0 && product.availability_status !== "Deactivated" && (
                    <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-base font-extrabold px-3 py-1.5 rounded-full">
                      {product.discount_percentage}% OFF
                    </div>
                  )}
                  {product.countertop_included && product.countertop_option !== "no" && (
                    <div className="absolute bottom-3 left-3 right-3 bg-destructive text-destructive-foreground text-sm font-bold px-3 py-1.5 rounded-full text-center">
                      {product.countertop_material ? `${product.countertop_material} ` : ""}Countertop Included!
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{product.style}</p>
                  <h3 className="text-lg font-serif font-semibold text-foreground mb-3">{product.product_name}</h3>
                  <div className="flex items-end gap-3">
                    <span className="text-2xl font-bold text-foreground">${Number(product.price_discounted_usd).toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground line-through mb-0.5">${Number(product.price_retail_usd).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Excl. HST</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Button variant="default" size="lg" asChild>
            <Link to="/browse">
              View All Available Cabinets
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
