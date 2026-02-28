import { useState, useEffect } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Save } from "lucide-react";

const tradeTypes = [
  "General Contractor",
  "Cabinet Installer",
  "Plumber",
  "Electrician",
  "Drywall / Wall Builder",
  "Countertop Installer",
  "Painter",
];

const gtaAreas = [
  "Toronto", "North York", "Scarborough", "Etobicoke",
  "Mississauga", "Brampton", "Vaughan", "Richmond Hill",
  "Markham", "Oakville", "Burlington", "Hamilton",
  "Ajax", "Pickering", "Oshawa", "Newmarket",
];

const ContractorProfile = () => {
  const { profile, loading } = useProfile();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setCompanyName(profile.company_name || "");
      setPhone(profile.phone || "");
      setLocation(profile.location || "");
    }
  }, [profile]);

  const toggle = (list: string[], val: string, setter: (v: string[]) => void) => {
    setter(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        company_name: companyName || null,
        phone: phone || null,
        location: location || null,
      })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-muted border-2 border-muted" />;
  }

  const inputClass = "mt-1 border-2 border-foreground";

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-serif text-2xl md:text-3xl font-bold">My Profile</h1>

      <Card
        className="border-2 border-foreground p-6 space-y-5"
        style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
      >
        <div>
          <Label className="text-xs font-semibold">Email (read-only)</Label>
          <Input value={profile?.email || ""} disabled className="mt-1 border-2 border-muted bg-muted" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Full Name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <Label className="text-xs font-semibold">Company Name</Label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} placeholder="Optional" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </div>
        <div>
          <Label className="text-xs font-semibold">Location / Service Area</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="e.g. Vaughan, ON" />
        </div>
      </Card>

      {/* Trade types */}
      <Card
        className="border-2 border-foreground p-6"
        style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
      >
        <h2 className="font-sans font-bold text-base mb-3">Trade Types</h2>
        <div className="flex flex-wrap gap-3">
          {tradeTypes.map((t) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={selectedTrades.includes(t)} onCheckedChange={() => toggle(selectedTrades, t, setSelectedTrades)} />
              <span className="text-sm">{t}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Service areas */}
      <Card
        className="border-2 border-foreground p-6"
        style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
      >
        <h2 className="font-sans font-bold text-base mb-3">Service Areas (GTA)</h2>
        <div className="flex flex-wrap gap-3">
          {gtaAreas.map((a) => (
            <label key={a} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={serviceAreas.includes(a)} onCheckedChange={() => toggle(serviceAreas, a, setServiceAreas)} />
              <span className="text-sm">{a}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Experience & Bio */}
      <Card
        className="border-2 border-foreground p-6 space-y-5"
        style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
      >
        <div>
          <Label className="text-xs font-semibold">Years of Experience</Label>
          <Input type="number" min="0" max="60" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} className={inputClass} />
        </div>
        <div>
          <Label className="text-xs font-semibold">Portfolio URL</Label>
          <Input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} className={inputClass} placeholder="https://" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Bio / Description</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1 border-2 border-foreground resize-none" rows={4} placeholder="Tell clients about your experience and specialties…" />
        </div>
      </Card>

      <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
        <Save size={14} className="mr-2" />
        {saving ? "Saving…" : "Save Changes"}
      </Button>
    </div>
  );
};

export default ContractorProfile;
