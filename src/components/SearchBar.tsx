import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, X, Ruler, Type, Loader2 } from "lucide-react";

const MM_TO_INCH = 0.0393701;
const INCH_TO_MM = 25.4;

const SearchBar = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"text" | "dimension">("text");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [highlighted, setHighlighted] = useState(-1);

  // Dimension state — always store in inches, show both
  const [dimW, setDimW] = useState("");
  const [dimD, setDimD] = useState("");
  const [dimH, setDimH] = useState("");
  const [tol, setTol] = useState("2");

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (dialogOpen && mode === "text") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [dialogOpen, mode]);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Suggestions query
  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ["search-suggestions", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const { data } = await supabase
        .from("products")
        .select("id, product_name, main_image_url, price_discounted_usd")
        .is("deleted_at", null)
        .or(`product_name.ilike.%${debouncedQuery}%,short_description.ilike.%${debouncedQuery}%,style.ilike.%${debouncedQuery}%,color.ilike.%${debouncedQuery}%`)
        .limit(5);
      return data || [];
    },
    enabled: mode === "text" && debouncedQuery.length >= 2,
  });

  const showSuggestions = mode === "text" && query.length >= 2;
  const totalItems = suggestions.length + 1;

  const handleTextSubmit = useCallback(() => {
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setDialogOpen(false);
    setQuery("");
  }, [query, navigate]);

  const handleDimensionSubmit = useCallback(() => {
    if (!dimW && !dimD && !dimH) return;
    const params = new URLSearchParams();
    if (dimW) params.set("w", dimW);
    if (dimD) params.set("d", dimD);
    if (dimH) params.set("h", dimH);
    params.set("tol", tol);
    navigate(`/search?${params.toString()}`);
    setDialogOpen(false);
  }, [dimW, dimD, dimH, tol, navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === "Enter") handleTextSubmit();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted >= 0 && highlighted < suggestions.length) {
        navigate(`/product/${suggestions[highlighted].id}`);
        setDialogOpen(false);
        setQuery("");
      } else {
        handleTextSubmit();
      }
    } else if (e.key === "Escape") {
      setDialogOpen(false);
    }
  };

  // Helper: show mm equivalent
  const inchToMmDisplay = (val: string) => {
    const n = parseFloat(val);
    if (isNaN(n)) return "";
    return `${Math.round(n * INCH_TO_MM)} mm`;
  };

  return (
    <>
      {/* Icon trigger — same style as shopping cart */}
      <button
        className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setDialogOpen(true)}
        aria-label="Search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Search dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] sm:shadow-[6px_6px_0px_0px_hsl(var(--foreground))] w-[calc(100vw-2rem)] max-w-lg p-0 gap-0">
          {/* Mode toggle */}
          <div className="flex border-b-2 border-border">
            <button
              className={`flex-1 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                mode === "text" ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-accent"
              }`}
              onClick={() => setMode("text")}
            >
              <Type className="w-4 h-4" /> Search by Name
            </button>
            <button
              className={`flex-1 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 border-l-2 border-border transition-colors ${
                mode === "dimension" ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-accent"
              }`}
              onClick={() => setMode("dimension")}
            >
              <Ruler className="w-4 h-4" /> Match by Dimensions
            </button>
          </div>

          {mode === "text" ? (
            <div className="p-4 space-y-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setHighlighted(-1); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search cabinets by name, style, color..."
                  className="border-2 border-border h-12 pl-10 pr-10 text-base rounded-none"
                />
                {isFetching && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />}
                {!isFetching && query && (
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setQuery("")}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showSuggestions && (
                <div className="border-2 border-t-0 border-border max-h-72 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button
                      key={s.id}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-accent ${highlighted === i ? "bg-accent" : ""}`}
                      onMouseEnter={() => setHighlighted(i)}
                      onClick={() => { navigate(`/product/${s.id}`); setDialogOpen(false); setQuery(""); }}
                    >
                      {s.main_image_url && (
                        <img src={s.main_image_url} alt="" className="w-10 h-10 object-cover border-2 border-border" />
                      )}
                      <span className="flex-1 truncate font-medium">{s.product_name}</span>
                      <span className="text-xs font-mono text-muted-foreground">
                        ${Number(s.price_discounted_usd).toLocaleString()}
                      </span>
                    </button>
                  ))}
                  <button
                    className={`w-full px-4 py-3 text-left text-sm font-medium hover:bg-accent border-t border-border flex items-center gap-2 ${
                      highlighted === suggestions.length ? "bg-accent" : ""
                    }`}
                    onMouseEnter={() => setHighlighted(suggestions.length)}
                    onClick={handleTextSubmit}
                  >
                    <Search className="w-3.5 h-3.5" />
                    Search for &lsquo;{query}&rsquo;
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 space-y-5">
              <p className="text-sm text-muted-foreground">
                Enter your opening dimensions to find cabinets that fit.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Width", value: dimW, set: setDimW },
                  { label: "Depth", value: dimD, set: setDimD },
                  { label: "Height", value: dimH, set: setDimH },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block text-muted-foreground">
                      {label}
                    </label>
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      placeholder='inches'
                      className="border-2 border-border h-12 text-center font-mono text-lg rounded-none"
                    />
                    <p className="text-[10px] text-muted-foreground text-center mt-1 font-mono h-3">
                      {inchToMmDisplay(value)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-end gap-3">
                <div className="w-36">
                  <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block text-muted-foreground">
                    Tolerance
                  </label>
                  <Select value={tol} onValueChange={setTol}>
                    <SelectTrigger className="border-2 border-border h-11 rounded-none text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Exact (±0″)</SelectItem>
                      <SelectItem value="1">±1″ (±25mm)</SelectItem>
                      <SelectItem value="2">±2″ (±51mm)</SelectItem>
                      <SelectItem value="3">±3″ (±76mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="flex-1 h-11 border-2 font-bold gap-2 shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  onClick={handleDimensionSubmit}
                >
                  <Search className="w-4 h-4" />
                  Find Matching Cabinets
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SearchBar;
