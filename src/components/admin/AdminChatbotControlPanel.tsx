import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

const NUMBER_KEYS = [
  "chatbot_guest_message_limit",
  "chatbot_email_gate_dismiss_extra",
  "chatbot_email_gate_hard_limit",
  "chatbot_email_tier_session_limit",
  "chatbot_registered_per_seller_limit",
  "chatbot_registered_total_daily_limit",
  "chatbot_auto_open_delay_seconds",
];

const TOGGLE_KEYS = [
  "chatbot_marketing_checkbox_default",
  "chatbot_consent_modal_enabled",
  "chatbot_voice_input_enabled",
];

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

  const NumberField = ({ label, settingKey }: { label: string; settingKey: string }) => (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{getDescription(settingKey)}</p>
      </div>
      <Input
        type="number"
        min={0}
        className="w-24 text-right"
        value={getValue(settingKey)}
        onChange={(e) => setField(settingKey, e.target.value)}
      />
    </div>
  );

  const ToggleField = ({ label, settingKey, warning }: { label: string; settingKey: string; warning?: string }) => {
    const checked = getValue(settingKey) === "true";
    return (
      <div className="flex items-center justify-between gap-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">{label}</Label>
            {warning && checked && (
              <Badge variant="destructive" className="text-[10px] gap-1">
                <AlertTriangle className="w-3 h-3" />
                {warning}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{getDescription(settingKey)}</p>
        </div>
        <Switch
          checked={checked}
          onCheckedChange={(val) => setField(settingKey, val ? "true" : "false")}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">
            Configure chatbot behavior, gating rules, and compliance settings. Changes apply immediately to all active chat widgets.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {onNavigateToTestChat && (
            <button
              onClick={onNavigateToTestChat}
              className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors flex items-center gap-1"
            >
              Open Test Console <ArrowRight className="w-3 h-3" />
            </button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || saving} size="sm" className="gap-1.5">
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Section 1 — Guest Gating */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Guest Gating</CardTitle>
          <CardDescription>Controls when the email capture form appears for anonymous visitors.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <NumberField label="Free messages before email gate" settingKey="chatbot_guest_message_limit" />
          <NumberField label="Extra messages after dismiss" settingKey="chatbot_email_gate_dismiss_extra" />
          <NumberField label="Hard gate total limit" settingKey="chatbot_email_gate_hard_limit" />
          <NumberField label="Messages per session (email captured)" settingKey="chatbot_email_tier_session_limit" />
        </CardContent>
      </Card>

      {/* Section 2 — Registered User Limits */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Registered User Limits</CardTitle>
          <CardDescription>Rate limits for authenticated buyers to prevent abuse.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <NumberField label="Messages per seller per day" settingKey="chatbot_registered_per_seller_limit" />
          <NumberField label="Total messages per day" settingKey="chatbot_registered_total_daily_limit" />
        </CardContent>
      </Card>

      {/* Section 3 — Compliance & Consent */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Compliance & Consent</CardTitle>
          <CardDescription>PIPEDA and CASL compliance settings.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <ToggleField
            label="Marketing checkbox default"
            settingKey="chatbot_marketing_checkbox_default"
            warning="CASL requires this to be OFF"
          />
          <ToggleField label="Show consent modal" settingKey="chatbot_consent_modal_enabled" />
        </CardContent>
      </Card>

      {/* Section 4 — Widget Behavior */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Widget Behavior</CardTitle>
          <CardDescription>Controls chat widget appearance and features.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <ToggleField label="Voice input enabled" settingKey="chatbot_voice_input_enabled" />
          <NumberField label="Chat button delay (seconds)" settingKey="chatbot_auto_open_delay_seconds" />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminChatbotControlPanel;
