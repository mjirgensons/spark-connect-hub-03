import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Save, Lock } from "lucide-react";

const ClientProfile = () => {
  const { profile, loading } = useProfile();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setLocation(profile.location || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone: phone || null, location: location || null })
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

  return (
    <div className="space-y-6 max-w-xl">
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
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 border-2 border-foreground" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 border-2 border-foreground" placeholder="Optional" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Postal Code / Location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 border-2 border-foreground" placeholder="e.g. M5V 2T6" />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save size={14} className="mr-2" />
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </Card>

      <Card
        className="border-2 border-foreground p-6"
        style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
      >
        <h2 className="font-sans font-bold text-base mb-2 flex items-center gap-2">
          <Lock size={16} /> Change Password
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          Password reset functionality is coming soon.
        </p>
        <Button
          variant="outline"
          className="border-2 border-foreground"
          onClick={() => toast({ title: "Coming soon", description: "Password change will be available shortly." })}
        >
          Change Password
        </Button>
      </Card>
    </div>
  );
};

export default ClientProfile;
