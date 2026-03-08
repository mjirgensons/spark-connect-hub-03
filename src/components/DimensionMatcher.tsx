import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ruler, Search } from "lucide-react";

const INCH_TO_MM = 25.4;

const DimensionMatcher = () => {
  const navigate = useNavigate();
  const [unit, setUnit] = useState<"in" | "mm">("in");
  const [w, setW] = useState("");
  const [d, setD] = useState("");
  const [h, setH] = useState("");
  const [tol, setTol] = useState("2");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!w && !d && !h) return;
    const params = new URLSearchParams();
    // Always send inches to search
    const toInch = (val: string) => unit === "mm" ? (parseFloat(val) / INCH_TO_MM).toFixed(2) : val;
    if (w) params.set("w", toInch(w));
    if (d) params.set("d", toInch(d));
    if (h) params.set("h", toInch(h));
    params.set("tol", tol);
    navigate(`/search?${params.toString()}`);
  };

  // Show the other unit as helper text
  const convertDisplay = (val: string) => {
    const n = parseFloat(val);
    if (isNaN(n) || !val) return "";
    if (unit === "in") return `${Math.round(n * INCH_TO_MM)} mm`;
    return `${(n / INCH_TO_MM).toFixed(1)}″`;
  };

  const fieldClass = "border-2 border-border h-14 text-lg text-center font-mono rounded-none";

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div
          className="max-w-3xl mx-auto border-[3px] border-foreground bg-background p-6 md:p-10"
          style={{ boxShadow: "8px 8px 0 0 hsl(var(--foreground))" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 border-2 border-foreground bg-primary shrink-0">
                <Ruler className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h2 className="font-serif text-lg sm:text-xl md:text-2xl font-bold">FitMatch — Dimension Matcher</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your opening dimensions and find cabinets that fit
                </p>
              </div>
            </div>
            {/* Unit toggle */}
            <div className="flex border-2 border-border overflow-hidden shrink-0 self-start sm:self-auto">
              <button
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                  unit === "in" ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-accent"
                }`}
                onClick={() => setUnit("in")}
                type="button"
                aria-pressed={unit === "in"}
              >
                inches
              </button>
              <button
                className={`px-3 py-1.5 text-xs font-bold border-l-2 border-border transition-colors ${
                  unit === "mm" ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-accent"
                }`}
                onClick={() => setUnit("mm")}
                type="button"
                aria-pressed={unit === "mm"}
              >
                mm
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {[
                { label: "Width", value: w, set: setW },
                { label: "Depth", value: d, set: setD },
                { label: "Height", value: h, set: setH },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block text-muted-foreground">
                    {label} ({unit === "in" ? "inches" : "mm"})
                  </label>
                  <Input
                    type="number"
                    step={unit === "in" ? "0.25" : "1"}
                    min="0"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    placeholder={unit === "in" ? '″' : "mm"}
                    className={fieldClass}
                  />
                  <p className="text-[10px] text-muted-foreground text-center mt-1 font-mono h-3">
                    {convertDisplay(value)}
                  </p>
                </div>
              ))}
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
                    <SelectItem value="0">Exact (±0″ / ±0mm)</SelectItem>
                    <SelectItem value="1">±1″ (±25mm)</SelectItem>
                    <SelectItem value="2">±2″ (±51mm)</SelectItem>
                    <SelectItem value="3">±3″ (±76mm)</SelectItem>
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
