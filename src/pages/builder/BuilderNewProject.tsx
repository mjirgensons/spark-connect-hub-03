import { useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Save } from "lucide-react";

const styles = ["Shaker", "Modern", "Traditional", "Minimalist", "European"];

const BuilderNewProject = () => {
  const [name, setName] = useState("");
  const [units, setUnits] = useState("");
  const [w, setW] = useState("");
  const [h, setH] = useState("");
  const [d, setD] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  const toggle = (val: string) => setSelectedStyles((p) => p.includes(val) ? p.filter((v) => v !== val) : [...p, val]);

  const handleSave = () => {
    console.log("Builder project:", { name, units, w, h, d, selectedStyles });
    toast({ title: "Project saved (placeholder)", description: "Database integration coming soon." });
  };

  const inputClass = "mt-1 border-2 border-foreground";
  const cardStyle = { boxShadow: "4px 4px 0 0 hsl(var(--foreground))" };

  return (
    <div className="space-y-6 max-w-2xl">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/builder/dashboard" }, { label: "Projects", href: "/builder/projects" }, { label: "New Project" }]} />
      <h1 className="font-serif text-2xl md:text-3xl font-bold">New Project</h1>

      <Card className="border-2 border-foreground p-6 space-y-4" style={cardStyle}>
        <div>
          <Label className="text-xs font-semibold">Project Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. 50 King St Condos" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Number of Units *</Label>
          <Input type="number" min="1" value={units} onChange={(e) => setUnits(e.target.value)} className={inputClass} />
        </div>
      </Card>

      <Card className="border-2 border-foreground p-6" style={cardStyle}>
        <h2 className="font-sans font-bold text-base mb-4">Unit Dimensions (typical)</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div><Label className="text-xs font-semibold">Width (mm)</Label><Input type="number" value={w} onChange={(e) => setW(e.target.value)} className={inputClass} /></div>
          <div><Label className="text-xs font-semibold">Height (mm)</Label><Input type="number" value={h} onChange={(e) => setH(e.target.value)} className={inputClass} /></div>
          <div><Label className="text-xs font-semibold">Depth (mm)</Label><Input type="number" value={d} onChange={(e) => setD(e.target.value)} className={inputClass} /></div>
        </div>
      </Card>

      <Card className="border-2 border-foreground p-6" style={cardStyle}>
        <h2 className="font-sans font-bold text-base mb-3">Style Preferences</h2>
        <div className="flex flex-wrap gap-3">
          {styles.map((s) => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={selectedStyles.includes(s)} onCheckedChange={() => toggle(s)} />
              <span className="text-sm">{s}</span>
            </label>
          ))}
        </div>
      </Card>

      <Button onClick={handleSave} size="lg" className="w-full" disabled={!name || !units}>
        <Save size={14} className="mr-2" /> Create Project
      </Button>
    </div>
  );
};

export default BuilderNewProject;
