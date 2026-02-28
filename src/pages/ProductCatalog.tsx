import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import DimensionMatcher from "@/components/DimensionMatcher";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, X } from "lucide-react";

const MM_TO_INCH = 0.0393701;
const fmt = (mm: number) => `${mm}mm / ${(mm * MM_TO_INCH).toFixed(1)}″`;
const fmtPrice = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

type SortOption = "price-asc" | "price-desc" | "newest" | "discount";

interface Filters {
  categories: string[];
  styles: string[];
  conditions: string[];
  width: [number, number];
  height: [number, number];
  depth: [number, number];
  price: [number, number];
}

const DEFAULT_FILTERS: Filters = {
  categories: [],
  styles: [],
  conditions: [],
  width: [600, 5000],
  height: [600, 2700],
  depth: [300, 700],
  price: [500, 50000],
};

const ProductCatalog = () => {
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS });
  const [sort, setSort] = useState<SortOption>("newest");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["catalog-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .is("deleted_at", null)
        .neq("availability_status", "Deactivated");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["catalog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Extract unique styles
  const uniqueStyles = useMemo(
    () => [...new Set(products.map((p: any) => p.style).filter(Boolean))].sort(),
    [products]
  );

  // Filter products
  const filtered = useMemo(() => {
    let result = products.filter((p: any) => {
      if (filters.categories.length && !filters.categories.includes(p.category_id)) return false;
      if (filters.styles.length && !filters.styles.includes(p.style)) return false;
      if (filters.conditions.length && !filters.conditions.includes(p.availability_status)) return false;
      if (p.width_mm < filters.width[0] || p.width_mm > filters.width[1]) return false;
      if (p.height_mm < filters.height[0] || p.height_mm > filters.height[1]) return false;
      if (p.depth_mm < filters.depth[0] || p.depth_mm > filters.depth[1]) return false;
      if (p.price_discounted_usd < filters.price[0] || p.price_discounted_usd > filters.price[1]) return false;
      return true;
    });

    switch (sort) {
      case "price-asc":
        result.sort((a: any, b: any) => a.price_discounted_usd - b.price_discounted_usd);
        break;
      case "price-desc":
        result.sort((a: any, b: any) => b.price_discounted_usd - a.price_discounted_usd);
        break;
      case "newest":
        result.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "discount":
        result.sort((a: any, b: any) => b.discount_percentage - a.discount_percentage);
        break;
    }
    return result;
  }, [products, filters, sort]);

  const toggleArrayFilter = (key: "categories" | "styles" | "conditions", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const clearFilters = () => setFilters({ ...DEFAULT_FILTERS });

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.styles.length > 0 ||
    filters.conditions.length > 0 ||
    filters.width[0] !== DEFAULT_FILTERS.width[0] ||
    filters.width[1] !== DEFAULT_FILTERS.width[1] ||
    filters.height[0] !== DEFAULT_FILTERS.height[0] ||
    filters.height[1] !== DEFAULT_FILTERS.height[1] ||
    filters.depth[0] !== DEFAULT_FILTERS.depth[0] ||
    filters.depth[1] !== DEFAULT_FILTERS.depth[1] ||
    filters.price[0] !== DEFAULT_FILTERS.price[0] ||
    filters.price[1] !== DEFAULT_FILTERS.price[1];

  const filtersContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-lg font-bold">Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            <X size={14} className="mr-1" /> Clear All
          </Button>
        )}
      </div>

      {/* Category */}
      <div>
        <h3 className="font-sans text-sm font-semibold mb-2">Category</h3>
        <div className="space-y-2">
          {categories.map((c: any) => (
            <label key={c.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.categories.includes(c.id)}
                onCheckedChange={() => toggleArrayFilter("categories", c.id)}
              />
              <span className="text-sm">{c.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Width */}
      <div>
        <h3 className="font-sans text-sm font-semibold mb-2">Width</h3>
        <Slider
          min={600}
          max={5000}
          step={50}
          value={filters.width}
          onValueChange={(v) => setFilters((f) => ({ ...f, width: v as [number, number] }))}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{fmt(filters.width[0])}</span>
          <span>{fmt(filters.width[1])}</span>
        </div>
      </div>

      {/* Height */}
      <div>
        <h3 className="font-sans text-sm font-semibold mb-2">Height</h3>
        <Slider
          min={600}
          max={2700}
          step={50}
          value={filters.height}
          onValueChange={(v) => setFilters((f) => ({ ...f, height: v as [number, number] }))}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{fmt(filters.height[0])}</span>
          <span>{fmt(filters.height[1])}</span>
        </div>
      </div>

      {/* Depth */}
      <div>
        <h3 className="font-sans text-sm font-semibold mb-2">Depth</h3>
        <Slider
          min={300}
          max={700}
          step={10}
          value={filters.depth}
          onValueChange={(v) => setFilters((f) => ({ ...f, depth: v as [number, number] }))}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{fmt(filters.depth[0])}</span>
          <span>{fmt(filters.depth[1])}</span>
        </div>
      </div>

      {/* Style */}
      {uniqueStyles.length > 0 && (
        <div>
          <h3 className="font-sans text-sm font-semibold mb-2">Style</h3>
          <div className="space-y-2">
            {uniqueStyles.map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.styles.includes(s)}
                  onCheckedChange={() => toggleArrayFilter("styles", s)}
                />
                <span className="text-sm">{s}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Condition */}
      <div>
        <h3 className="font-sans text-sm font-semibold mb-2">Availability</h3>
        <div className="space-y-2">
          {["In Stock", "Low Stock"].map((c) => (
            <label key={c} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.conditions.includes(c)}
                onCheckedChange={() => toggleArrayFilter("conditions", c)}
              />
              <span className="text-sm">{c}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="font-sans text-sm font-semibold mb-2">Price Range</h3>
        <Slider
          min={500}
          max={50000}
          step={100}
          value={filters.price}
          onValueChange={(v) => setFilters((f) => ({ ...f, price: v as [number, number] }))}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{fmtPrice(filters.price[0])}</span>
          <span>{fmtPrice(filters.price[1])}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4">Browse Cabinets</h1>
        <DimensionMatcher />
        <div className="flex gap-8 mt-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div
              className="sticky top-24 border-2 border-foreground p-4 bg-background"
              style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
            >
              {filtersContent}
            </div>
          </aside>

          {/* Mobile filter trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden fixed bottom-4 right-4 z-40">
              <Button size="lg" className="shadow-lg">
                <SlidersHorizontal size={18} className="mr-2" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              {filtersContent}
            </SheetContent>
          </Sheet>

          {/* Product grid area */}
          <div className="flex-1 min-w-0">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <p className="font-sans text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{filtered.length}</span> products found
              </p>
              <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                <SelectTrigger className="w-48 border-2 border-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-asc">Price: Low → High</SelectItem>
                  <SelectItem value="price-desc">Price: High → Low</SelectItem>
                  <SelectItem value="discount">Biggest Discount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 border-2 border-muted animate-pulse bg-muted" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="text-center py-20 border-2 border-foreground"
                style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
              >
                <p className="font-sans text-lg font-semibold mb-2">No products match your filters</p>
                <p className="text-sm text-muted-foreground mb-4">Try adjusting your criteria</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((product: any) => {
                  const categoryName =
                    (product as any).categories?.name || "Uncategorized";
                  return (
                    <Link key={product.id} to={`/product/${product.id}`} className="group">
                      <Card
                        className="border-2 border-foreground overflow-hidden transition-transform group-hover:-translate-y-1"
                        style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
                      >
                        {/* Image */}
                        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                          {product.main_image_url ? (
                            <img
                              src={product.main_image_url}
                              alt={product.product_name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                              No Image
                            </div>
                          )}
                          {product.discount_percentage > 0 && (
                            <Badge className="absolute top-2 right-2 bg-green-600 text-white border-0 font-mono text-xs">
                              -{Math.round(product.discount_percentage)}%
                            </Badge>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-sans font-bold text-sm leading-tight line-clamp-2">
                              {product.product_name}
                            </h3>
                            <Badge variant="outline" className="text-[10px] shrink-0 border-foreground">
                              {categoryName}
                            </Badge>
                          </div>

                          <p className="font-mono text-xs text-muted-foreground">
                            {product.width_mm}×{product.height_mm}×{product.depth_mm} mm
                          </p>

                          <div className="flex items-baseline gap-2">
                            <span className="font-sans font-bold text-lg">
                              {fmtPrice(product.price_discounted_usd)}
                            </span>
                            {product.price_retail_usd > product.price_discounted_usd && (
                              <span className="text-sm text-muted-foreground line-through">
                                {fmtPrice(product.price_retail_usd)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">Excl. HST</p>

                          <Button variant="outline" size="sm" className="w-full border-2 border-foreground mt-2">
                            View Details
                          </Button>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductCatalog;
