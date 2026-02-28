import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderOpen, Layers, Award, ArrowRight, Search } from "lucide-react";

const stats = [
  { label: "Active Projects", value: "0", icon: FolderOpen },
  { label: "Units Matched", value: "0", icon: Layers },
  { label: "Volume Tier", value: "Standard", icon: Award },
];

const BuilderDashboard = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [units, setUnits] = useState("");
  const [w, setW] = useState("");
  const [h, setH] = useState("");
  const [d, setD] = useState("");

  const handleMatch = () => {
    if (!w || !h || !d) return;
    navigate(`/builder/matches?w=${w}&h=${h}&d=${d}&units=${units || "1"}`);
  };

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl md:text-3xl font-bold">
        Welcome back, {profile?.full_name?.split(" ")[0] || "there"}
      </h1>

      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-2 border-foreground p-5 flex items-center gap-4" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
            <div className="w-10 h-10 bg-primary flex items-center justify-center shrink-0">
              <s.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-mono text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-2 border-foreground p-6" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
        <h2 className="font-sans text-lg font-bold mb-1 flex items-center gap-2"><Search size={18} /> Quick Bulk Match</h2>
        <p className="text-sm text-muted-foreground mb-4">Find matching cabinets for multiple units at once.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <Label className="text-xs font-semibold">Units</Label>
            <Input type="number" min="1" value={units} onChange={(e) => setUnits(e.target.value)} className="mt-1 border-2 border-foreground" placeholder="e.g. 20" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Width (mm)</Label>
            <Input type="number" value={w} onChange={(e) => setW(e.target.value)} className="mt-1 border-2 border-foreground" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Height (mm)</Label>
            <Input type="number" value={h} onChange={(e) => setH(e.target.value)} className="mt-1 border-2 border-foreground" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Depth (mm)</Label>
            <Input type="number" value={d} onChange={(e) => setD(e.target.value)} className="mt-1 border-2 border-foreground" />
          </div>
        </div>
        <Button onClick={handleMatch} disabled={!w || !h || !d}>Find Matches <ArrowRight className="ml-2 w-4 h-4" /></Button>
      </Card>
    </div>
  );
};

export default BuilderDashboard;
