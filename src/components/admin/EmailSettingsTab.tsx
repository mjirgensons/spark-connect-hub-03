import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Save, Info, Link } from "lucide-react";

interface SettingsMap {
  [key: string]: string;
}

const SETTINGS_KEYS = [
  "email_default_from_email",
  "email_default_from_name",
  "email_default_reply_to",
  "email_casl_company_name",
  "email_casl_address",
  "email_casl_support_email",
  "email_unsubscribe_url",
  "email_pause_marketing",
  "email_pause_lifecycle",
];

const EmailSettingsTab = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [webhookBaseUrl, setWebhookBaseUrl] = useState("");

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("site_settings").select("key, value").like("key", "email_%");
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      const map: SettingsMap = {};
      (data || []).forEach(d => { map[d.key] = d.value; });
      setSettings(map);
    }

    // Get n8n base URL
    const { data: n8n } = await supabase.from("integrations").select("config").eq("service_name", "n8n").maybeSingle();
    const config = n8n?.config as any;
    setWebhookBaseUrl(config?.webhook_base_url || config?.base_url || "");
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    for (const key of SETTINGS_KEYS) {
      if (settings[key] !== undefined) {
        await supabase.from("site_settings").upsert({ key, value: settings[key] } as any, { onConflict: "key" });
      }
    }
    setSaving(false);
    toast({ title: "Email settings saved" });
  };

  const webhookUrls = [
    { label: "Email Dispatcher", path: "/webhook/email-send" },
    { label: "Email Test", path: "/webhook/email-test" },
    { label: "Inbound Email", path: "/webhook/inbound-email" },
    { label: "Mailgun Events", path: "/webhook/mailgun-events" },
  ];

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Default Sender */}
      <Card className="border-2 border-border">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-serif font-bold text-foreground text-lg">Default Sender</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>From Email</Label><Input value={settings.email_default_from_email || ""} onChange={e => updateSetting("email_default_from_email", e.target.value)} className="border-2" /></div>
            <div><Label>From Name</Label><Input value={settings.email_default_from_name || ""} onChange={e => updateSetting("email_default_from_name", e.target.value)} className="border-2" /></div>
            <div><Label>Reply-To</Label><Input value={settings.email_default_reply_to || ""} onChange={e => updateSetting("email_default_reply_to", e.target.value)} className="border-2" /></div>
          </div>
        </CardContent>
      </Card>

      {/* CASL Compliance Footer */}
      <Card className="border-2 border-border">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-serif font-bold text-foreground text-lg">CASL Compliance Footer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Company Legal Name</Label><Input value={settings.email_casl_company_name || ""} onChange={e => updateSetting("email_casl_company_name", e.target.value)} className="border-2" /></div>
            <div><Label>Physical Address</Label><Input value={settings.email_casl_address || ""} onChange={e => updateSetting("email_casl_address", e.target.value)} className="border-2" /></div>
            <div><Label>Support Email</Label><Input value={settings.email_casl_support_email || ""} onChange={e => updateSetting("email_casl_support_email", e.target.value)} className="border-2" /></div>
            <div><Label>Unsubscribe URL Pattern</Label><Input value={settings.email_unsubscribe_url || ""} onChange={e => updateSetting("email_unsubscribe_url", e.target.value)} className="border-2 font-mono text-xs" /></div>
          </div>
        </CardContent>
      </Card>

      {/* n8n Integration */}
      <Card className="border-2 border-border">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-serif font-bold text-foreground text-lg">n8n Webhook URLs</h3>
          {webhookBaseUrl ? (
            <div className="space-y-3">
              {webhookUrls.map(w => (
                <div key={w.path}>
                  <Label className="text-xs text-muted-foreground">{w.label}</Label>
                  <div className="flex items-center gap-2">
                    <Input value={webhookBaseUrl.replace(/\/+$/, "") + w.path} readOnly className="border-2 font-mono text-xs bg-muted" />
                    <Button variant="outline" size="icon" className="border-2 h-9 w-9 shrink-0" onClick={() => { navigator.clipboard.writeText(webhookBaseUrl.replace(/\/+$/, "") + w.path); toast({ title: "Copied" }); }}>
                      <Link className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                These URLs are auto-constructed from your n8n configuration in the Integrations tab. Configure them in your Mailgun dashboard and n8n workflows.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">n8n integration not configured. Set it up in the Integrations tab first.</p>
          )}
        </CardContent>
      </Card>

      {/* Global Controls */}
      <Card className="border-2 border-border">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-serif font-bold text-foreground text-lg">Global Controls</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Pause All Marketing Emails</p>
                <p className="text-xs text-muted-foreground">Stops all express-consent emails from being sent</p>
              </div>
              <Switch checked={settings.email_pause_marketing === "true"} onCheckedChange={v => updateSetting("email_pause_marketing", v ? "true" : "false")} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Pause All Lifecycle Emails</p>
                <p className="text-xs text-muted-foreground">Stops all implied-consent lifecycle emails</p>
              </div>
              <Switch checked={settings.email_pause_lifecycle === "true"} onCheckedChange={v => updateSetting("email_pause_lifecycle", v ? "true" : "false")} />
            </div>
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Transactional emails (order confirmations, receipts, etc.) cannot be paused — they are legally required.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="border-2">
        <Save className="w-4 h-4 mr-1" />
        {saving ? "Saving..." : "Save All Settings"}
      </Button>
    </div>
  );
};

export default EmailSettingsTab;
