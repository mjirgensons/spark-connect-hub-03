import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ProductShowcase = () => {
  const { data: products = [] } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  return (
    <section id="cabinets" className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 text-sm px-4 py-1">
            Featured Cabinets
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-4">
            Premium Cabinets, Unbeatable Prices
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our curated selection of surplus luxury European cabinetry — all at 50–80% below retail.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {products.map((product) => (
            <Link to={`/product/${product.id}`} key={product.id}>
              <Card className="group overflow-hidden h-full">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={product.main_image_url || "/placeholder.svg"}
                    alt={`${product.product_name} kitchen cabinets`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <Badge className="absolute top-3 left-3">Featured</Badge>
                  {product.discount_percentage > 0 && (
                    <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-sm md:text-base font-extrabold px-3 py-1.5 rounded-full shadow-lg">
                      {product.discount_percentage}% OFF
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {product.style}
                  </p>
                  <h3 className="text-lg font-serif font-semibold text-foreground mb-3">
                    {product.product_name}
                  </h3>
                  <div className="flex items-end gap-3">
                    <span className="text-2xl font-bold text-foreground">
                      ${Number(product.price_discounted_usd).toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground line-through mb-0.5">
                      ${Number(product.price_retail_usd).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Button variant="default" size="lg">
            View All Available Cabinets
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
