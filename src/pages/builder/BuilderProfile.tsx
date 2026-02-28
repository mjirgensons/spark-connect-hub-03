import { useState, useEffect } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Save } from "lucide-react";

const BuilderProfile = () => {
  const { profile, loading } = useProfile();
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [phone, setPhone] = useState("");
  const [annualVolume, setAnnualVolume] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.company_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ company_name: companyName || null, phone: phone || null })
      .eq("id", profile.id);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
    }
    setSaving(false);
  };

  if (loading) return <div className="animate-pulse h-64 bg-muted border-2 border-muted" />;

  const inputClass = "mt-1 border-2 border-foreground";

  return (
    <div className="space-y-6 max-w-xl">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/builder/dashboard" }, { label: "Profile" }]} />
      <h1 className="font-serif text-2xl md:text-3xl font-bold">My Profile</h1>
      <Card className="border-2 border-foreground p-6 space-y-5" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
        <div>
          <Label className="text-xs font-semibold">Email (read-only)</Label>
          <Input value={profile?.email || ""} disabled className="mt-1 border-2 border-muted bg-muted" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Company Name</Label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <Label className="text-xs font-semibold">Company Type</Label>
          <Select value={companyType} onValueChange={setCompanyType}>
            <SelectTrigger className={inputClass}><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Developer">Developer</SelectItem>
              <SelectItem value="Architect">Architect</SelectItem>
              <SelectItem value="Designer">Designer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </div>
        <div>
          <Label className="text-xs font-semibold">Typical Annual Project Volume</Label>
          <Input value={annualVolume} onChange={(e) => setAnnualVolume(e.target.value)} className={inputClass} placeholder="e.g. 10-20 units" />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save size={14} className="mr-2" /> {saving ? "Saving…" : "Save Changes"}
        </Button>
      </Card>
    </div>
  );
};

export default BuilderProfile;
