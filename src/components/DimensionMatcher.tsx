import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ruler, Search } from "lucide-react";

const DimensionMatcher = () => {
  const navigate = useNavigate();
  const [w, setW] = useState("");
  const [d, setD] = useState("");
  const [h, setH] = useState("");
  const [tol, setTol] = useState("2");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!w && !d && !h) return;
    const params = new URLSearchParams();
    if (w) params.set("w", w);
    if (d) params.set("d", d);
    if (h) params.set("h", h);
    params.set("tol", tol);
    navigate(`/search?${params.toString()}`);
  };

  const fieldClass = "border-2 border-border h-14 text-lg text-center font-mono rounded-none";

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div
          className="max-w-3xl mx-auto border-[3px] border-foreground bg-background p-6 md:p-10"
          style={{ boxShadow: "8px 8px 0 0 hsl(var(--foreground))" }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 border-2 border-foreground bg-primary">
              <Ruler className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-serif text-xl md:text-2xl font-bold">FitMatch — Dimension Matcher</h2>
              <p className="text-sm text-muted-foreground">
                Enter your opening dimensions and find cabinets that fit
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block text-muted-foreground">
                  Width (inches)
                </label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  value={w}
                  onChange={(e) => setW(e.target.value)}
                  placeholder="W″"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block text-muted-foreground">
                  Depth (inches)
                </label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  value={d}
                  onChange={(e) => setD(e.target.value)}
                  placeholder="D″"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block text-muted-foreground">
                  Height (inches)
                </label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  value={h}
                  onChange={(e) => setH(e.target.value)}
                  placeholder="H″"
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="sm:w-40">
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block text-muted-foreground">
                  Tolerance
                </label>
                <Select value={tol} onValueChange={setTol}>
                  <SelectTrigger className="border-2 border-border h-12 rounded-none text-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Exact (±0″)</SelectItem>
                    <SelectItem value="1">±1 inch</SelectItem>
                    <SelectItem value="2">±2 inches</SelectItem>
                    <SelectItem value="3">±3 inches</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                size="xl"
                className="flex-1 border-[3px] border-foreground font-bold text-base gap-2 shadow-[6px_6px_0px_0px_hsl(var(--foreground))] hover:shadow-[3px_3px_0px_0px_hsl(var(--foreground))] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
              >
                <Search className="w-5 h-5" />
                Find Matching Cabinets
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default DimensionMatcher;
