import { useMemo } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import DimensionMatcher from "@/components/DimensionMatcher";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";
import { ProductCardSkeleton } from "@/components/ui/product-card-skeleton";
import Breadcrumbs from "@/components/Breadcrumbs";
import WishlistButton from "@/components/WishlistButton";
import CompareButton from "@/components/CompareButton";

const MM_TO_INCH = 0.0393701;
const fmtPrice = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const SearchResults = () => {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  usePageMeta(q ? `Search: ${q}` : "Search Results", "Search for premium European cabinets by name, style, color, or dimensions on FitMatch.");
  const dimW = params.get("w") ? Number(params.get("w")) : null;
  const dimD = params.get("d") ? Number(params.get("d")) : null;
  const dimH = params.get("h") ? Number(params.get("h")) : null;
  const tol = Number(params.get("tol") || "2");

  const isDimensionSearch = dimW !== null || dimD !== null || dimH !== null;

  // Fetch all products (we filter client-side for flexibility)
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["search-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .is("deleted_at", null)
        .neq("availability_status", "Deactivated");
      if (error) throw error;
      return data || [];
    },
    refetchOnWindowFocus: true,
  });

  const results = useMemo(() => {
    if (isDimensionSearch) {
      // Dimension matching: product dimensions <= opening dimensions (± tolerance)
      return products
        .map((p: any) => {
          const pW = p.width_inches ?? p.width_mm * MM_TO_INCH;
          const pD = p.depth_inches ?? p.depth_mm * MM_TO_INCH;
          const pH = p.height_inches ?? p.height_mm * MM_TO_INCH;

          let maxDiff = 0;
          let fits = true;

          if (dimW !== null) {
            const diff = pW - dimW;
            if (diff > tol) fits = false;
            maxDiff = Math.max(maxDiff, Math.abs(diff));
          }
          if (dimD !== null) {
            const diff = pD - dimD;
            if (diff > tol) fits = false;
            maxDiff = Math.max(maxDiff, Math.abs(diff));
          }
          if (dimH !== null) {
            const diff = pH - dimH;
            if (diff > tol) fits = false;
            maxDiff = Math.max(maxDiff, Math.abs(diff));
          }

          return { ...p, _fits: fits, _maxDiff: maxDiff, _pW: pW, _pD: pD, _pH: pH };
        })
        .filter((p: any) => p._fits)
        .sort((a: any, b: any) => a._maxDiff - b._maxDiff);
    }

    // Text search
    if (!q) return [];
    const lower = q.toLowerCase();
    return products.filter((p: any) => {
      const name = (p.product_name || "").toLowerCase();
      const desc = (p.short_description || "").toLowerCase();
      const longDesc = (p.long_description || "").toLowerCase();
      const style = (p.style || "").toLowerCase();
      const color = (p.color || "").toLowerCase();
      const cat = ((p as any).categories?.name || "").toLowerCase();
      return name.includes(lower) || desc.includes(lower) || longDesc.includes(lower) ||
        style.includes(lower) || color.includes(lower) || cat.includes(lower);
    });
  }, [products, q, isDimensionSearch, dimW, dimD, dimH, tol]);

  const headingText = isDimensionSearch
    ? `${results.length} cabinet${results.length !== 1 ? "s" : ""} match your opening: ${dimW ?? "—"}″ × ${dimD ?? "—"}″ × ${dimH ?? "—"}″ (±${tol}″)`
    : `${results.length} result${results.length !== 1 ? "s" : ""} for '${q}'`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        <Breadcrumbs items={[{ label: "Search Results" }]} />
        <h1 className="font-serif text-2xl md:text-3xl font-bold mb-6">{headingText}</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div
            className="text-center py-20 border-2 border-foreground max-w-lg mx-auto"
            style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
          >
            <SearchX className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-bold text-lg mb-2">
              {isDimensionSearch ? "No cabinets match those dimensions" : "No results found"}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {isDimensionSearch
                ? "Try increasing the tolerance or adjusting your measurements."
                : "Try different keywords or browse our catalog."}
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild variant="outline" className="border-2">
                <Link to="/browse">Browse Catalog</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((product: any) => {
              const categoryName = (product as any).categories?.name || "Uncategorized";

              // Dimension match badge
              let matchBadge = null;
              if (isDimensionSearch) {
                const diff = product._maxDiff;
                if (diff < 0.5) {
                  matchBadge = <Badge className="bg-green-600 text-primary-foreground border-0 text-[10px]">Exact match</Badge>;
                } else {
                  matchBadge = <Badge variant="secondary" className="text-[10px]">Within {diff.toFixed(1)}″</Badge>;
                }
              }

              return (
                <Link key={product.id} to={`/product/${product.id}`} className="group">
                  <Card
                    className="border-2 border-foreground overflow-hidden transition-transform group-hover:-translate-y-1"
                    style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
                  >
                    <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                      <div className="absolute top-2 left-2 z-10">
                        <WishlistButton productId={product.id} size="sm" />
                      </div>
                      {product.main_image_url ? (
                        <img
                          src={product.main_image_url}
                          alt={product.product_name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No Image</div>
                      )}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        {product.discount_percentage > 0 && (
                          <Badge className="bg-green-600 text-primary-foreground border-0 font-mono text-xs">
                            -{Math.round(product.discount_percentage)}%
                          </Badge>
                        )}
                        {matchBadge}
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm leading-tight line-clamp-2">{product.product_name}</h3>
                        <Badge variant="outline" className="text-[10px] shrink-0 border-foreground">{categoryName}</Badge>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">
                        {isDimensionSearch
                          ? `${(product._pW).toFixed(1)}″ × ${(product._pD).toFixed(1)}″ × ${(product._pH).toFixed(1)}″`
                          : `${product.width_mm}×${product.height_mm}×${product.depth_mm} mm`
                        }
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-lg">{fmtPrice(product.price_discounted_usd)}</span>
                        {product.price_retail_usd > product.price_discounted_usd && (
                          <span className="text-sm text-muted-foreground line-through">{fmtPrice(product.price_retail_usd)}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Excl. HST</p>
                      <Button variant="outline" size="sm" className="w-full border-2 border-foreground mt-2">View Details</Button>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Show dimension matcher at bottom if text search */}
        {!isDimensionSearch && (
          <div className="mt-16">
            <DimensionMatcher />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SearchResults;
