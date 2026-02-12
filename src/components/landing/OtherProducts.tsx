import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import productIsland from "@/assets/product-island-new.jpg";
import productVanity from "@/assets/product-vanity-new.jpg";
import productMurphy from "@/assets/product-murphy-desk.jpg";
import productWallBed from "@/assets/product-wall-bed.jpg";
import cabinet6 from "@/assets/cabinet-6.jpg";

const fallbackProducts = [
  { id: "", image: cabinet6, name: "Milano Kitchen Set", brand: "Italian Collection", retailPrice: 16000, ourPrice: 4800, discount: 70, tag: "New" },
  { id: "", image: productVanity, name: "Vienna Vanity Cabinet", brand: "Austrian Heritage", retailPrice: 9500, ourPrice: 2850, discount: 70, tag: "Popular" },
  { id: "", image: productIsland, name: "Berlin Kitchen Island", brand: "German Precision", retailPrice: 12000, ourPrice: 3600, discount: 70, tag: "Premium" },
  { id: "", image: productMurphy, name: "Oxford Murphy Desk", brand: "British Elegance", retailPrice: 14000, ourPrice: 4200, discount: 70, tag: "Best Seller" },
  { id: "", image: productWallBed, name: "Provence Wall Bed", brand: "French Countryside", retailPrice: 20000, ourPrice: 6000, discount: 70, tag: "Limited" },
];

const KITCHENS_SLUG = "kitchens";

const OtherProducts = () => {
  const { data: kitchenCategory } = useQuery({
    queryKey: ["category-kitchens"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id").eq("slug", KITCHENS_SLUG).single();
      return data;
    },
  });

  const { data: dbProducts = [] } = useQuery({
    queryKey: ["non-kitchen-products", kitchenCategory?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .neq("category_id", kitchenCategory!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!kitchenCategory?.id,
  });

  const hasDbProducts = dbProducts.length > 0;

  return (
    <section id="other-products" className="py-14 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 text-sm px-4 py-1">Beyond the Kitchen</Badge>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-foreground mb-3">
            More Luxury Cabinetry
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            The same European craftsmanship and unbeatable prices — for every room in your home.
          </p>
        </div>

        <Carousel opts={{ align: "start", loop: true }} className="w-full">
          <CarouselContent className="-ml-4">
            {hasDbProducts
              ? dbProducts.map((product) => (
                  <CarouselItem key={product.id} className="pl-4 basis-1/2 sm:basis-1/3 lg:basis-1/5">
                    <Link to={`/product/${product.id}`}>
                      <Card className="group overflow-hidden">
                        <div className="relative aspect-square overflow-hidden">
                          <img src={product.main_image_url || "/placeholder.svg"} alt={`${product.product_name} luxury cabinetry`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                          {product.tag && (
                            <Badge className="absolute top-2 left-2 text-[10px] px-2 py-0.5">{product.tag}</Badge>
                          )}
                          {product.discount_percentage > 0 && (
                            <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs sm:text-sm font-extrabold px-2.5 py-1 rounded-full shadow-lg">
                              {product.discount_percentage}% OFF
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{product.style}</p>
                          <h3 className="text-sm font-serif font-semibold text-foreground mb-2">{product.product_name}</h3>
                          <div className="flex items-end gap-2">
                            <span className="text-lg font-bold text-foreground">${Number(product.price_discounted_usd).toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground line-through">${Number(product.price_retail_usd).toLocaleString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </CarouselItem>
                ))
              : fallbackProducts.map((product) => (
                  <CarouselItem key={product.name} className="pl-4 basis-1/2 sm:basis-1/3 lg:basis-1/5">
                    <Card className="group overflow-hidden">
                      <div className="relative aspect-square overflow-hidden">
                        <img src={product.image} alt={`${product.name} luxury cabinetry`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                        <Badge className="absolute top-2 left-2 text-[10px] px-2 py-0.5">{product.tag}</Badge>
                        <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs sm:text-sm font-extrabold px-2.5 py-1 rounded-full shadow-lg">
                          {product.discount}% OFF
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{product.brand}</p>
                        <h3 className="text-sm font-serif font-semibold text-foreground mb-2">{product.name}</h3>
                        <div className="flex items-end gap-2">
                          <span className="text-lg font-bold text-foreground">${product.ourPrice.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground line-through">${product.retailPrice.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
          </CarouselContent>
          <CarouselPrevious className="-left-4 md:-left-6" />
          <CarouselNext className="-right-4 md:-right-6" />
        </Carousel>
      </div>
    </section>
  );
};

export default OtherProducts;
