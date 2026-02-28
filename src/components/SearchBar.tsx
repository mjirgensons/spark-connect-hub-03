import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Ruler, Type, Loader2 } from "lucide-react";

const SearchBar = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"text" | "dimension">("text");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [highlighted, setHighlighted] = useState(-1);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  // Dimension state
  const [dimW, setDimW] = useState("");
  const [dimD, setDimD] = useState("");
  const [dimH, setDimH] = useState("");
  const [tol, setTol] = useState("2");

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setMobileExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  const showDropdown = open && mode === "text" && query.length >= 2;
  const totalItems = suggestions.length + 1; // +1 for "Search for" row

  const handleTextSubmit = useCallback(() => {
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setOpen(false);
    setMobileExpanded(false);
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
    setOpen(false);
    setMobileExpanded(false);
  }, [dimW, dimD, dimH, tol, navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
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
        setOpen(false);
        setQuery("");
      } else {
        handleTextSubmit();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Mobile: icon only */}
      <button
        className="md:hidden p-2 text-muted-foreground hover:text-foreground"
        onClick={() => {
          setMobileExpanded(true);
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        aria-label="Search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Mobile expanded overlay */}
      {mobileExpanded && (
        <div className="md:hidden fixed inset-0 z-[60] bg-background p-4">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => { setMobileExpanded(false); setOpen(false); }} className="p-1">
              <X className="w-5 h-5" />
            </button>
            <div className="flex border-2 border-border rounded-none overflow-hidden flex-1">
              <button
                className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1 ${mode === "text" ? "bg-foreground text-background" : "bg-background text-foreground"}`}
                onClick={() => setMode("text")}
              >
                <Type className="w-3 h-3" /> Name
              </button>
              <button
                className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1 border-l-2 border-border ${mode === "dimension" ? "bg-foreground text-background" : "bg-background text-foreground"}`}
                onClick={() => setMode("dimension")}
              >
                <Ruler className="w-3 h-3" /> Size
              </button>
            </div>
          </div>
          {mode === "text" ? (
            <div>
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlighted(-1); }}
                onKeyDown={handleKeyDown}
                placeholder="Search cabinets..."
                className="border-2 border-border h-10"
              />
              {showDropdown && (
                <div className="border-2 border-border mt-1 bg-background max-h-72 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button
                      key={s.id}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent ${highlighted === i ? "bg-accent" : ""}`}
                      onClick={() => { navigate(`/product/${s.id}`); setMobileExpanded(false); setOpen(false); setQuery(""); }}
                    >
                      {s.main_image_url && <img src={s.main_image_url} alt="" className="w-8 h-8 object-cover border border-border" />}
                      <span className="flex-1 truncate">{s.product_name}</span>
                      <span className="text-xs font-mono text-muted-foreground">${Number(s.price_discounted_usd).toLocaleString()}</span>
                    </button>
                  ))}
                  <button
                    className={`w-full px-3 py-2 text-left text-sm font-medium hover:bg-accent ${highlighted === suggestions.length ? "bg-accent" : ""}`}
                    onClick={handleTextSubmit}
                  >
                    Search for &lsquo;{query}&rsquo;
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold mb-1 block">Width ″</label>
                  <Input type="number" value={dimW} onChange={(e) => setDimW(e.target.value)} className="border-2 border-border h-10" placeholder="W" />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">Depth ″</label>
                  <Input type="number" value={dimD} onChange={(e) => setDimD(e.target.value)} className="border-2 border-border h-10" placeholder="D" />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">Height ″</label>
                  <Input type="number" value={dimH} onChange={(e) => setDimH(e.target.value)} className="border-2 border-border h-10" placeholder="H" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold whitespace-nowrap">Tolerance</label>
                <Select value={tol} onValueChange={setTol}>
                  <SelectTrigger className="border-2 border-border h-9 w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">±0″</SelectItem>
                    <SelectItem value="1">±1″</SelectItem>
                    <SelectItem value="2">±2″</SelectItem>
                    <SelectItem value="3">±3″</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full border-2 shadow-[3px_3px_0px_0px_hsl(var(--foreground))]" onClick={handleDimensionSubmit}>
                Find Matching Cabinets
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Desktop: full search bar */}
      <div className="hidden md:flex items-center gap-0 relative">
        <div className="flex border-2 border-border overflow-hidden">
          <button
            className={`px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1 transition-colors ${mode === "text" ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-accent"}`}
            onClick={() => setMode("text")}
          >
            <Type className="w-3 h-3" /> Name
          </button>
          <button
            className={`px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1 border-l-2 border-border transition-colors ${mode === "dimension" ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-accent"}`}
            onClick={() => setMode("dimension")}
          >
            <Ruler className="w-3 h-3" /> Size
          </button>
        </div>

        {mode === "text" ? (
          <div className="relative">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlighted(-1); }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search cabinets by name, style, or dimensions..."
              className="border-2 border-l-0 border-border h-9 w-[280px] lg:w-[340px] rounded-none pr-8"
            />
            {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />}
            {!isFetching && query && (
              <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => { setQuery(""); setOpen(false); }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-0 border-2 border-t-0 border-border bg-background z-50 max-h-72 overflow-y-auto shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
                {suggestions.map((s, i) => (
                  <button
                    key={s.id}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent ${highlighted === i ? "bg-accent" : ""}`}
                    onMouseEnter={() => setHighlighted(i)}
                    onClick={() => { navigate(`/product/${s.id}`); setOpen(false); setQuery(""); }}
                  >
                    {s.main_image_url && <img src={s.main_image_url} alt="" className="w-8 h-8 object-cover border border-border" />}
                    <span className="flex-1 truncate font-medium">{s.product_name}</span>
                    <span className="text-xs font-mono text-muted-foreground">${Number(s.price_discounted_usd).toLocaleString()}</span>
                  </button>
                ))}
                <button
                  className={`w-full px-3 py-2.5 text-left text-sm font-medium hover:bg-accent border-t border-border ${highlighted === suggestions.length ? "bg-accent" : ""}`}
                  onMouseEnter={() => setHighlighted(suggestions.length)}
                  onClick={handleTextSubmit}
                >
                  <Search className="w-3.5 h-3.5 inline mr-2" />
                  Search for &lsquo;{query}&rsquo;
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center border-2 border-l-0 border-border">
            <Input type="number" value={dimW} onChange={(e) => setDimW(e.target.value)} placeholder="W″" className="border-0 h-9 w-16 rounded-none text-center text-sm" />
            <span className="text-muted-foreground text-xs">×</span>
            <Input type="number" value={dimD} onChange={(e) => setDimD(e.target.value)} placeholder="D″" className="border-0 h-9 w-16 rounded-none text-center text-sm" />
            <span className="text-muted-foreground text-xs">×</span>
            <Input type="number" value={dimH} onChange={(e) => setDimH(e.target.value)} placeholder="H″" className="border-0 h-9 w-16 rounded-none text-center text-sm" />
            <Select value={tol} onValueChange={setTol}>
              <SelectTrigger className="border-0 border-l-2 border-border h-9 w-[72px] rounded-none text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">±0″</SelectItem>
                <SelectItem value="1">±1″</SelectItem>
                <SelectItem value="2">±2″</SelectItem>
                <SelectItem value="3">±3″</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-9 rounded-none border-l-2 border-border px-3" onClick={handleDimensionSubmit}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
