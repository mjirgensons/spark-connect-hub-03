import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompare } from "@/contexts/CompareContext";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const CompareBar = () => {
  const { compareIds, removeFromCompare, clearCompare, compareCount } = useCompare();

  const { data: products = [] } = useQuery({
    queryKey: ["compare-bar-products", compareIds],
    queryFn: async () => {
      if (compareIds.length === 0) return [];
      const { data } = await supabase
        .from("products")
        .select("id, product_name, main_image_url")
        .in("id", compareIds);
      return data || [];
    },
    enabled: compareIds.length > 0,
  });

  if (compareCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-foreground shadow-[0_-4px_0px_0px_hsl(var(--foreground))] p-3">
      <div className="container mx-auto flex items-center gap-3 flex-wrap">
        <span className="font-sans font-bold text-sm shrink-0">Compare ({compareCount})</span>
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto">
          {products.map((p) => (
            <div key={p.id} className="relative shrink-0">
              <img
                src={p.main_image_url || "/placeholder.svg"}
                alt={p.product_name}
                className="w-10 h-10 rounded-sm object-cover border-2 border-foreground"
              />
              <button
                onClick={() => removeFromCompare(p.id)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-foreground text-background rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={clearCompare} className="text-xs">
            Clear All
          </Button>
          <Button size="sm" disabled={compareCount < 2} asChild={compareCount >= 2}>
            {compareCount >= 2 ? <Link to="/compare">Compare Now</Link> : <span>Compare Now</span>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompareBar;
