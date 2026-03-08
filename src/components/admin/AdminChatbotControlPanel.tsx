import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Save, AlertTriangle } from "lucide-react";

interface ChatbotSetting {
  key: string;
  value: string;
  description: string | null;
}

interface AdminChatbotControlPanelProps {
  onNavigateToTestChat?: () => void;
}

const AdminChatbotControlPanel = ({ onNavigateToTestChat }: AdminChatbotControlPanelProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, ChatbotSetting>>({});
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value, description")
      .like("key", "chatbot_%");

    if (error) {
      toast({ title: "Error loading settings", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const map: Record<string, ChatbotSetting> = {};
    (data || []).forEach((row) => {
      map[row.key] = row as ChatbotSetting;
    });
    setSettings(map);
    setEditedValues({});
    setLoading(false);
  };

  const getValue = (key: string) => {
    if (key in editedValues) return editedValues[key];
    return settings[key]?.value ?? "";
  };

  const getDescription = (key: string) => settings[key]?.description ?? "";

  const setField = (key: string, value: string) => {
    setEditedValues((prev) => {
      const original = settings[key]?.value ?? "";
      if (value === original) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  };

  const hasChanges = useMemo(() => Object.keys(editedValues).length > 0, [editedValues]);

  const handleSave = async () => {
    setSaving(true);
    const keys = Object.keys(editedValues);
    let hadError = false;

    for (const key of keys) {
      const { error } = await supabase
        .from("site_settings")
        .update({ value: editedValues[key] })
        .eq("key", key);
      if (error) {
        hadError = true;
        toast({ title: `Error saving ${key}`, description: error.message, variant: "destructive" });
      }
    }

    if (!hadError) {
      toast({ title: "Chatbot settings saved" });
      await fetchSettings();
    }
    setSaving(false);
  };

  /* ── Row components ── */

  const NumberRow = ({ label, settingKey, min = 0, max }: { label: string; settingKey: string; min?: number; max?: number }) => (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-muted last:border-b-0" style={{ maxWidth: 600 }}>
      <div className="flex-1 min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{getDescription(settingKey)}</p>
      </div>
      <Input
        type="number"
        min={min}
        max={max}
        className="w-20 text-right border-2 border-foreground"
        style={{ borderRadius: 0 }}
        value={getValue(settingKey)}
        onChange={(e) => setField(settingKey, e.target.value)}
      />
    </div>
  );

  const ToggleRow = ({ label, settingKey, warning }: { label: string; settingKey: string; warning?: string }) => {
    const checked = getValue(settingKey) === "true";
    return (
      <div className="flex items-center justify-between gap-4 py-4 border-b border-muted last:border-b-0" style={{ maxWidth: 600 }}>
        <div className="flex-1 min-w-0">
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground mt-0.5">{getDescription(settingKey)}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {warning && checked && (
            <Badge variant="destructive" className="text-xs px-2 py-0.5 gap-1" style={{ borderRadius: 0 }}>
              <AlertTriangle className="w-3 h-3" />
              CASL: must be OFF
            </Badge>
          )}
          <Switch
            checked={checked}
            onCheckedChange={(val) => setField(settingKey, val ? "true" : "false")}
          />
        </div>
      </div>
    );
  };

  /* ── Section card wrapper ── */
  const SectionCard = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
    <div
      className="bg-background border-2 border-foreground"
      style={{ borderRadius: 0, boxShadow: "4px 4px 0px hsl(var(--foreground))" }}
    >
      <div className="px-4 py-4 border-b border-foreground">
        <h3 className="text-base font-bold font-sans">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6 max-w-[700px] mx-auto">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-64 mb-2" />
          <Skeleton className="h-9 w-32" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-48 w-full" style={{ borderRadius: 0 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground max-w-md">
          Configure chatbot behavior, gating rules, and compliance settings. Changes apply immediately.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          {onNavigateToTestChat && (
            <button
              onClick={onNavigateToTestChat}
              className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors flex items-center gap-1"
            >
              Open Test Console <ArrowRight className="w-3 h-3" />
            </button>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            size="sm"
            className="gap-1.5"
            style={{ borderRadius: 0 }}
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Section 1 — Guest Gating */}
      <SectionCard title="Guest Gating" description="Controls when the email capture form appears for anonymous visitors.">
        <NumberRow label="Free messages before email gate" settingKey="chatbot_guest_message_limit" />
        <NumberRow label="Extra messages after dismiss" settingKey="chatbot_email_gate_dismiss_extra" />
        <NumberRow label="Hard gate total limit" settingKey="chatbot_email_gate_hard_limit" />
        <NumberRow label="Messages per session (email captured)" settingKey="chatbot_email_tier_session_limit" />
      </SectionCard>

      {/* Section 2 — Registered User Limits */}
      <SectionCard title="Registered User Limits" description="Rate limits for authenticated buyers to prevent abuse.">
        <NumberRow label="Messages per seller per day" settingKey="chatbot_registered_per_seller_limit" />
        <NumberRow label="Total messages per day" settingKey="chatbot_registered_total_daily_limit" />
      </SectionCard>

      {/* Section 3 — Compliance & Consent */}
      <SectionCard title="Compliance & Consent" description="PIPEDA and CASL compliance settings.">
        <ToggleRow
          label="Marketing checkbox default"
          settingKey="chatbot_marketing_checkbox_default"
          warning="CASL"
        />
        <ToggleRow label="Show consent modal" settingKey="chatbot_consent_modal_enabled" />
      </SectionCard>

      {/* Section 4 — Widget Behavior */}
      <SectionCard title="Widget Behavior" description="Controls chat widget appearance and features.">
        <ToggleRow label="Voice input enabled" settingKey="chatbot_voice_input_enabled" />
        <NumberRow label="Chat button appear delay" settingKey="chatbot_auto_open_delay_seconds" min={0} max={300} />
      </SectionCard>
    </div>
  );
};

export default AdminChatbotControlPanel;
