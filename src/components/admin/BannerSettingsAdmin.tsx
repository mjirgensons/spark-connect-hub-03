import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const KEYS = [
  { key: "cookie_banner_text", label: "Banner Main Text", type: "textarea", default: "We use cookies to improve your experience and analyze site traffic. You can manage your preferences at any time." },
  { key: "cookie_accept_text", label: "Accept All Button Text", type: "input", default: "Accept All" },
  { key: "cookie_reject_text", label: "Reject Button Text", type: "input", default: "Reject Non-Essential" },
  { key: "cookie_settings_text", label: "Settings Button Text", type: "input", default: "Cookie Settings" },
  { key: "cookie_policy_link_text", label: "Cookie Policy Link Text", type: "input", default: "Read our Cookie Policy" },
  { key: "cookie_banner_version", label: "Banner Version", type: "input", default: "1.0" },
] as const;

const BannerSettingsAdmin = () => {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", KEYS.map((k) => k.key));
      const map: Record<string, string> = {};
      KEYS.forEach((k) => { map[k.key] = k.default; });
      (data || []).forEach((row: any) => { map[row.key] = row.value; });
      setValues(map);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    for (const k of KEYS) {
      const val = values[k.key] ?? k.default;
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", k.key)
        .maybeSingle();
      if (existing) {
        await supabase.from("site_settings").update({ value: val } as any).eq("key", k.key);
      } else {
        await supabase.from("site_settings").insert({ key: k.key, value: val, description: k.label } as any);
      }
    }
    setSaving(false);
    toast({ title: "Banner settings saved" });
  };

  if (loading) return <p className="text-muted-foreground text-sm py-4">Loading banner settings…</p>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Banner Settings</h3>
      <Card className="border-2 border-border">
        <CardContent className="p-4 space-y-4">
          {KEYS.map((k) => (
            <div key={k.key}>
              <Label className="text-xs font-semibold">{k.label}</Label>
              {k.type === "textarea" ? (
                <Textarea
                  rows={3}
                  value={values[k.key] || ""}
                  onChange={(e) => setValues((p) => ({ ...p, [k.key]: e.target.value }))}
                />
              ) : (
                <Input
                  value={values[k.key] || ""}
                  onChange={(e) => setValues((p) => ({ ...p, [k.key]: e.target.value }))}
                />
              )}
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">{k.key}</p>
            </div>
          ))}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save All"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerSettingsAdmin;
