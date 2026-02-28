import { useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Search } from "lucide-react";

const fmtPrice = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const ClientMatches = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const w = searchParams.get("w");
  const h = searchParams.get("h");
  const d = searchParams.get("d");
  const hasDims = !!(w && h && d);

  const [localW, setLocalW] = useState(w || "");
  const [localH, setLocalH] = useState(h || "");
  const [localD, setLocalD] = useState(d || "");

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["client-matches", w, h, d],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .is("deleted_at", null)
        .neq("availability_status", "Deactivated")
        .lte("width_mm", Number(w))
        .lte("height_mm", Number(h))
        .lte("depth_mm", Number(d));
      if (error) throw error;
      return data || [];
    },
    enabled: hasDims,
  });

  const handleSearch = () => {
    if (!localW || !localH || !localD) return;
    navigate(`/client/matches?w=${localW}&h=${localH}&d=${localD}`);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl md:text-3xl font-bold">My Matches</h1>

      {/* Dimension input (always visible) */}
      <Card
        className="border-2 border-foreground p-5"
        style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
      >
        <p className="text-sm text-muted-foreground mb-3">
          Enter your opening dimensions to find cabinets that fit.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <Label className="text-xs font-semibold">Width (mm)</Label>
            <Input type="number" value={localW} onChange={(e) => setLocalW(e.target.value)} className="mt-1 border-2 border-foreground" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Height (mm)</Label>
            <Input type="number" value={localH} onChange={(e) => setLocalH(e.target.value)} className="mt-1 border-2 border-foreground" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Depth (mm)</Label>
            <Input type="number" value={localD} onChange={(e) => setLocalD(e.target.value)} className="mt-1 border-2 border-foreground" />
          </div>
        </div>
        <Button onClick={handleSearch} disabled={!localW || !localH || !localD} size="sm">
          <Search size={14} className="mr-1" /> Find Matches
        </Button>
      </Card>

      {/* Results */}
      {hasDims && (
        <>
          <p className="text-sm text-muted-foreground">
            Showing products that fit within <span className="font-mono font-semibold text-foreground">{w}×{h}×{d} mm</span>
          </p>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 border-2 border-muted animate-pulse bg-muted" />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <Card
              className="border-2 border-foreground p-8 text-center"
              style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
            >
              <p className="font-sans font-bold text-lg mb-2">No exact matches found</p>
              <p className="text-sm text-muted-foreground mb-4">
                We couldn't find cabinets that fit those dimensions. Request custom quotes from our sellers.
              </p>
              <Button
                variant="outline"
                className="border-2 border-foreground"
                onClick={() => toast({ title: "Coming soon", description: "Custom quote requests will be available shortly." })}
              >
                Request Custom Quotes
              </Button>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((product: any) => (
                <Link key={product.id} to={`/product/${product.id}`} className="group">
                  <Card
                    className="border-2 border-foreground overflow-hidden transition-transform group-hover:-translate-y-1"
                    style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
                  >
                    <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                      {product.main_image_url ? (
                        <img src={product.main_image_url} alt={product.product_name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No Image</div>
                      )}
                      {product.discount_percentage > 0 && (
                        <Badge className="absolute top-2 right-2 bg-green-600 text-white border-0 font-mono text-xs">
                          -{Math.round(product.discount_percentage)}%
                        </Badge>
                      )}
                    </div>
                    <div className="p-4 space-y-1">
                      <h3 className="font-sans font-bold text-sm line-clamp-1">{product.product_name}</h3>
                      <p className="font-mono text-xs text-muted-foreground">
                        {product.width_mm}×{product.height_mm}×{product.depth_mm} mm
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="font-sans font-bold text-base">{fmtPrice(product.price_discounted_usd)}</span>
                        {product.price_retail_usd > product.price_discounted_usd && (
                          <span className="text-xs text-muted-foreground line-through">{fmtPrice(product.price_retail_usd)}</span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClientMatches;
