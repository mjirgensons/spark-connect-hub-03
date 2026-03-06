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
      const q = supabase
        .from("products")
        .select("*")
        .neq("category_id", kitchenCategory!.id)
        .is("deleted_at", null);
      const { data, error } = await (q as any)
        .in("availability_status", ["In Stock", "Low Stock"])
        .eq("listing_status", "approved")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!kitchenCategory?.id,
  });

  if (dbProducts.length === 0) return null;

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
            {dbProducts.map((product) => (
              <CarouselItem key={product.id} className="pl-4 basis-1/2 sm:basis-1/3 lg:basis-1/5">
                <Link to={`/product/${product.id}`}>
                  <Card className="group overflow-hidden">
                    <div className="relative aspect-square overflow-hidden">
                      <img src={product.main_image_url || "/placeholder.svg"} alt={`${product.product_name} luxury cabinetry`} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${product.availability_status === "Deactivated" ? "opacity-60" : ""}`} loading="lazy" />
                      {product.availability_status === "Deactivated" && (
                        <div className="absolute top-2 left-2 right-2 bg-foreground/80 text-background text-[10px] font-bold px-2 py-1 rounded-md text-center">
                          Temporarily Unavailable
                        </div>
                      )}
                      {product.tag && product.availability_status !== "Deactivated" && (
                        <Badge className="absolute top-2 left-2 text-[10px] px-2 py-0.5">{product.tag}</Badge>
                      )}
                      {product.discount_percentage > 0 && product.availability_status !== "Deactivated" && (
                        <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-sm font-extrabold px-2.5 py-1 rounded-full">
                          {product.discount_percentage}% OFF
                        </div>
                      )}
                      {product.countertop_included && product.countertop_option !== "no" && (
                        <div className="absolute bottom-2 left-2 right-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full text-center">
                          {product.countertop_material ? `${product.countertop_material} ` : ""}Countertop Included!
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
                      <p className="text-[10px] text-muted-foreground">Excl. HST</p>
                    </CardContent>
                  </Card>
                </Link>
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
