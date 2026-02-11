import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import cabinet1 from "@/assets/cabinet-1.jpg";
import cabinet2 from "@/assets/cabinet-2.jpg";
import cabinet3 from "@/assets/cabinet-3.jpg";
import cabinet4 from "@/assets/cabinet-4.jpg";
import cabinet5 from "@/assets/cabinet-5.jpg";

const fallbackProducts = [
  { id: "", image: cabinet1, name: "Milano Light Oak", brand: "Italian Collection", retailPrice: 18500, ourPrice: 5900, discount: 68, tag: "Best Seller" },
  { id: "", image: cabinet2, name: "Berlin Grey Modern", brand: "German Precision", retailPrice: 21000, ourPrice: 5250, discount: 75, tag: "New Arrival" },
  { id: "", image: cabinet3, name: "Vienna Gloss White", brand: "Austrian Heritage", retailPrice: 24000, ourPrice: 7200, discount: 70, tag: "Premium" },
  { id: "", image: cabinet4, name: "Oxford Grey & Walnut", brand: "British Elegance", retailPrice: 28000, ourPrice: 8400, discount: 70, tag: "Limited" },
  { id: "", image: cabinet5, name: "Provence Cream & Wood", brand: "French Countryside", retailPrice: 22000, ourPrice: 6600, discount: 70, tag: "Popular" },
];

const ProductShowcase = () => {
  const { data: dbProducts = [] } = useQuery({
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

  const hasDbProducts = dbProducts.length > 0;

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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {hasDbProducts
            ? dbProducts.map((product) => (
                <Link to={`/product/${product.id}`} key={product.id}>
                  <Card className="group overflow-hidden h-full">
                    <div className="relative aspect-square overflow-hidden">
                      <img src={product.main_image_url || "/placeholder.svg"} alt={`${product.product_name} kitchen cabinets`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                      <Badge className="absolute top-3 left-3">Featured</Badge>
                      {product.discount_percentage > 0 && (
                        <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-sm md:text-base font-extrabold px-3 py-1.5 rounded-full shadow-lg">
                          {product.discount_percentage}% OFF
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
                    </CardContent>
                  </Card>
                </Link>
              ))
            : fallbackProducts.map((product) => (
                <Card key={product.name} className="group overflow-hidden">
                  <div className="relative aspect-square overflow-hidden">
                    <img src={product.image} alt={`${product.name} kitchen cabinets`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    <Badge className="absolute top-3 left-3">{product.tag}</Badge>
                    <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-sm md:text-base font-extrabold px-3 py-1.5 rounded-full shadow-lg">
                      {product.discount}% OFF
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{product.brand}</p>
                    <h3 className="text-lg font-serif font-semibold text-foreground mb-3">{product.name}</h3>
                    <div className="flex items-end gap-3">
                      <span className="text-2xl font-bold text-foreground">${product.ourPrice.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground line-through mb-0.5">${product.retailPrice.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
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
