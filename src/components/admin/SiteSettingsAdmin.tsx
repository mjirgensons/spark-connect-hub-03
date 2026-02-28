import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

const GROUPS: { title: string; keys: string[] }[] = [
  {
    title: "Company Info",
    keys: [
      "company_name",
      "company_email",
      "company_phone",
      "company_address",
      "company_city",
      "company_province",
      "company_country",
    ],
  },
  {
    title: "Legal & Compliance",
    keys: [
      "copyright_text",
      "tax_notice",
      "discount_disclaimer",
      "privacy_contact_email",
    ],
  },
  {
    title: "Consent Text",
    keys: [
      "cookie_banner_text",
      "newsletter_consent_text",
      "cta_consent_text",
    ],
  },
];

const SiteSettingsAdmin = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .order("key");
    if (data) {
      setSettings(data as SiteSetting[]);
      const vals: Record<string, string> = {};
      data.forEach((s: any) => {
        vals[s.key] = s.value;
      });
      setEditedValues(vals);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (setting: SiteSetting) => {
    const newValue = editedValues[setting.key];
    if (newValue === setting.value) {
      toast({ title: "No changes to save" });
      return;
    }
    setSavingKey(setting.key);
    const { error } = await supabase
      .from("site_settings")
      .update({ value: newValue } as any)
      .eq("id", setting.id);
    setSavingKey(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Setting saved", description: `"${setting.key}" updated successfully.` });
      fetchSettings();
    }
  };

  const getSettingByKey = (key: string) => settings.find((s) => s.key === key);

  // Collect ungrouped settings
  const groupedKeys = GROUPS.flatMap((g) => g.keys);
  const ungrouped = settings.filter((s) => !groupedKeys.includes(s.key));

  return (
    <div className="space-y-8">
      {GROUPS.map((group) => (
        <div key={group.title}>
          <h3 className="text-lg font-bold font-sans mb-4">{group.title}</h3>
          <div className="grid gap-4">
            {group.keys.map((key) => {
              const setting = getSettingByKey(key);
              if (!setting) return null;
              return (
                <SettingCard
                  key={setting.id}
                  setting={setting}
                  value={editedValues[setting.key] ?? setting.value}
                  onChange={(v) => setEditedValues((prev) => ({ ...prev, [setting.key]: v }))}
                  onSave={() => handleSave(setting)}
                  saving={savingKey === setting.key}
                />
              );
            })}
          </div>
        </div>
      ))}

      {ungrouped.length > 0 && (
        <div>
          <h3 className="text-lg font-bold font-sans mb-4">Other Settings</h3>
          <div className="grid gap-4">
            {ungrouped.map((setting) => (
              <SettingCard
                key={setting.id}
                setting={setting}
                value={editedValues[setting.key] ?? setting.value}
                onChange={(v) => setEditedValues((prev) => ({ ...prev, [setting.key]: v }))}
                onSave={() => handleSave(setting)}
                saving={savingKey === setting.key}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SettingCard = ({
  setting,
  value,
  onChange,
  onSave,
  saving,
}: {
  setting: SiteSetting;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) => {
  const isDirty = value !== setting.value;

  return (
    <Card className="border-2">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <Label className="font-mono text-xs text-foreground">{setting.key}</Label>
            {setting.description && (
              <p className="text-xs text-muted-foreground">{setting.description}</p>
            )}
          </div>
          <Button
            size="sm"
            onClick={onSave}
            disabled={saving || !isDirty}
            className="shrink-0"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={value.length > 100 ? 4 : 2}
          className="font-sans text-sm"
        />
      </CardContent>
    </Card>
  );
};

export default SiteSettingsAdmin;
