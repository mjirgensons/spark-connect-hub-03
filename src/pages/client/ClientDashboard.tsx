import { useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Link, useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bookmark, FolderOpen, DollarSign, ArrowRight, Search } from "lucide-react";

const stats = [
  { label: "Saved Products", value: "0", icon: Bookmark },
  { label: "Active Projects", value: "0", icon: FolderOpen },
  { label: "Total Savings", value: "$0", icon: DollarSign },
];

const ClientDashboard = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [w, setW] = useState("");
  const [h, setH] = useState("");
  const [d, setD] = useState("");

  const handleQuickMatch = () => {
    if (!w || !h || !d) return;
    navigate(`/client/matches?w=${w}&h=${h}&d=${d}`);
  };

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl md:text-3xl font-bold">
        Welcome back, {profile?.full_name?.split(" ")[0] || "there"}
      </h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card
            key={s.label}
            className="border-2 border-foreground p-5 flex items-center gap-4"
            style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
          >
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

      {/* Quick Match */}
      <Card
        className="border-2 border-foreground p-6"
        style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
      >
        <h2 className="font-sans text-lg font-bold mb-1 flex items-center gap-2">
          <Search size={18} /> Quick Match
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Enter your opening dimensions to find matching cabinets instantly.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <Label className="text-xs font-semibold">Width (mm)</Label>
            <Input
              type="number"
              value={w}
              onChange={(e) => setW(e.target.value)}
              className="mt-1 border-2 border-foreground"
              placeholder="e.g. 900"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold">Height (mm)</Label>
            <Input
              type="number"
              value={h}
              onChange={(e) => setH(e.target.value)}
              className="mt-1 border-2 border-foreground"
              placeholder="e.g. 2100"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold">Depth (mm)</Label>
            <Input
              type="number"
              value={d}
              onChange={(e) => setD(e.target.value)}
              className="mt-1 border-2 border-foreground"
              placeholder="e.g. 600"
            />
          </div>
        </div>
        <Button onClick={handleQuickMatch} disabled={!w || !h || !d}>
          Find Matches <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </Card>

      {/* Recently Viewed */}
      <Card
        className="border-2 border-foreground p-6 text-center"
        style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
      >
        <h2 className="font-sans text-lg font-bold mb-2">Recently Viewed</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Browse our catalog to see products here.
        </p>
        <Button variant="outline" asChild className="border-2 border-foreground">
          <Link to="/browse">Browse Catalog</Link>
        </Button>
      </Card>
    </div>
  );
};

export default ClientDashboard;
