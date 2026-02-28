import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ArrowRight } from "lucide-react";

const MM_TO_INCH = 0.0393701;
const fmt = (mm: number) => `${mm}mm (${(mm * MM_TO_INCH).toFixed(1)}″)`;

const categories = ["Kitchen", "Vanity", "Bathroom", "Closet", "Garage"];
const styles = ["Shaker", "Modern", "Traditional", "Minimalist", "European"];

const ClientNewMatch = () => {
  const navigate = useNavigate();
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [depth, setDepth] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [budget, setBudget] = useState<[number, number]>([500, 30000]);

  const toggle = (list: string[], val: string, setter: (v: string[]) => void) => {
    setter(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!width || !height || !depth) return;
    navigate(`/client/matches?w=${width}&h=${height}&d=${depth}`);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-serif text-2xl md:text-3xl font-bold">New Match Request</h1>
      <p className="text-muted-foreground text-sm">
        Tell us your opening dimensions and preferences. We'll find cabinets that fit.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dimensions */}
        <Card
          className="border-2 border-foreground p-6"
          style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
        >
          <h2 className="font-sans font-bold text-base mb-4">Opening Dimensions *</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Width", val: width, set: setWidth },
              { label: "Height", val: height, set: setHeight },
              { label: "Depth", val: depth, set: setDepth },
            ].map((f) => (
              <div key={f.label}>
                <Label className="text-xs font-semibold">{f.label} (mm)</Label>
                <Input
                  type="number"
                  value={f.val}
                  onChange={(e) => f.set(e.target.value)}
                  className="mt-1 border-2 border-foreground"
                  required
                />
                {f.val && (
                  <p className="text-xs text-muted-foreground mt-1">{fmt(Number(f.val))}</p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Category */}
        <Card
          className="border-2 border-foreground p-6"
          style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
        >
          <h2 className="font-sans font-bold text-base mb-3">Category</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((c) => (
              <label key={c} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedCats.includes(c)}
                  onCheckedChange={() => toggle(selectedCats, c, setSelectedCats)}
                />
                <span className="text-sm">{c}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Style */}
        <Card
          className="border-2 border-foreground p-6"
          style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
        >
          <h2 className="font-sans font-bold text-base mb-3">Style Preference (optional)</h2>
          <div className="flex flex-wrap gap-3">
            {styles.map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedStyles.includes(s)}
                  onCheckedChange={() => toggle(selectedStyles, s, setSelectedStyles)}
                />
                <span className="text-sm">{s}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Budget */}
        <Card
          className="border-2 border-foreground p-6"
          style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
        >
          <h2 className="font-sans font-bold text-base mb-3">Budget Range (optional)</h2>
          <Slider
            min={500}
            max={50000}
            step={500}
            value={budget}
            onValueChange={(v) => setBudget(v as [number, number])}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>${budget[0].toLocaleString()}</span>
            <span>${budget[1].toLocaleString()}</span>
          </div>
        </Card>

        <Button type="submit" size="lg" disabled={!width || !height || !depth} className="w-full">
          Find My Matches <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </form>
    </div>
  );
};

export default ClientNewMatch;
