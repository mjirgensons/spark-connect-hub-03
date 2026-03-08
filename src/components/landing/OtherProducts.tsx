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
import { ArrowRight } from "lucide-react";

const KITCHENS_SLUG = "kitchens";

interface CategoryWithProducts {
  id: string;
  name: string;
  slug: string;
  products: any[];
}

const OtherProducts = () => {
  // Fetch kitchen category ID to exclude from this section (kitchens shown in ProductShowcase)
  const { data: kitchenCategory } = useQuery({
    queryKey: ["category-kitchens"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id").eq("slug", KITCHENS_SLUG).single();
      return data;
    },
    staleTime: 300_000,
  });

  // Fetch all non-kitchen categories with approved products
  const { data: categoryCarousels = [] } = useQuery({
    queryKey: ["category-carousels", kitchenCategory?.id],
    queryFn: async () => {
      // Get all categories
      const { data: categories } = await supabase.from("categories").select("id, name, slug").order("name");
      if (!categories) return [];

      // Get all approved non-kitchen products
      let q = supabase
        .from("products")
        .select("*")
        .is("deleted_at", null)
        .eq("listing_status", "approved")
        .in("availability_status", ["In Stock", "Low Stock"])
        .order("created_at", { ascending: false });

      if (kitchenCategory?.id) {
        q = q.neq("category_id", kitchenCategory.id);
      }

      const { data: products } = await q;
      if (!products?.length) return [];

      // Group by category
      const grouped: CategoryWithProducts[] = [];
      for (const cat of categories) {
        if (cat.id === kitchenCategory?.id) continue;
        const catProducts = products.filter((p: any) => p.category_id === cat.id).slice(0, 10);
        if (catProducts.length > 0) {
          grouped.push({ id: cat.id, name: cat.name, slug: cat.slug, products: catProducts });
        }
      }

      // Sort by number of products (most first)
      grouped.sort((a, b) => b.products.length - a.products.length);
      return grouped;
    },
    enabled: kitchenCategory !== undefined,
  });

  if (categoryCarousels.length === 0) return null;

  return (
    <section id="other-products" className="py-14 bg-secondary/30 space-y-12">
      <div className="container mx-auto px-4">
        {categoryCarousels.map((cat) => (
          <div key={cat.id} className="mb-12 last:mb-0">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-serif font-bold text-foreground">
                  {cat.name}
                </h2>
              </div>
              <Link
                to={`/browse?category=${cat.slug}`}
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1 shrink-0"
              >
                Browse all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <Carousel opts={{ align: "start", loop: cat.products.length > 4 }} className="w-full">
              <CarouselContent className="-ml-4">
                {cat.products.map((product: any) => (
                  <CarouselItem key={product.id} className="pl-4 basis-1/2 sm:basis-1/3 lg:basis-1/5">
                    <Link to={`/product/${product.id}`}>
                      <Card className="group overflow-hidden">
                        <div className="relative aspect-square overflow-hidden">
                          <img
                            src={product.main_image_url || "/placeholder.svg"}
                            alt={`${product.product_name} luxury cabinetry`}
                            width={400}
                            height={400}
                            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${product.availability_status === "Deactivated" ? "opacity-60" : ""}`}
                            loading="lazy"
                          />
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
        ))}
      </div>
    </section>
  );
};

export default OtherProducts;
