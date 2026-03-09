import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

const AI_KEYS = [
  { key: "ai_storefront_assistant_short_desc", label: "Storefront Assistant — Short Description", multiline: false },
  { key: "ai_storefront_assistant_full_desc", label: "Storefront Assistant — Full Description", multiline: true },
  { key: "ai_personal_assistant_short_desc", label: "Personal Assistant — Short Description", multiline: false },
  { key: "ai_personal_assistant_full_desc", label: "Personal Assistant — Full Description", multiline: true },
];

export default function AdminAIDescriptionsTab() {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings" as any)
      .select("key, value")
      .in("key", AI_KEYS.map((k) => k.key))
      .then(({ data }: any) => {
        const map: Record<string, string> = {};
        (data || []).forEach((r: any) => { map[r.key] = r.value; });
        setValues({ ...map });
        setOriginal({ ...map });
      });
  }, []);

  const hasChanges = AI_KEYS.some((k) => (values[k.key] ?? "") !== (original[k.key] ?? ""));

  const handleSave = async () => {
    setSaving(true);
    let hadError = false;
    for (const k of AI_KEYS) {
      if ((values[k.key] ?? "") === (original[k.key] ?? "")) continue;
      const { error } = await supabase
        .from("site_settings" as any)
        .update({ value: values[k.key] } as any)
        .eq("key", k.key);
      if (error) {
        hadError = true;
        toast({ title: `Error saving ${k.key}`, description: error.message, variant: "destructive" });
      }
    }
    if (!hadError) {
      toast({ title: "AI descriptions saved" });
      setOriginal({ ...values });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold font-sans">AI Assistant Descriptions</h3>
        <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving} className="gap-1.5">
          <Save className="w-3.5 h-3.5" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">These descriptions appear on the seller dashboard AI card.</p>
      <div className="grid gap-4">
        {AI_KEYS.map((k) => (
          <div key={k.key} className="space-y-1">
            <Label className="text-sm font-medium">{k.label}</Label>
            {k.multiline ? (
              <Textarea
                value={values[k.key] ?? ""}
                onChange={(e) => setValues((p) => ({ ...p, [k.key]: e.target.value }))}
                rows={6}
                className="font-sans text-sm"
              />
            ) : (
              <Input
                value={values[k.key] ?? ""}
                onChange={(e) => setValues((p) => ({ ...p, [k.key]: e.target.value }))}
                className="font-sans text-sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
