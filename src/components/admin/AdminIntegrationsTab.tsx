import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  Mail, CreditCard, Workflow, Bot, Mic, Megaphone, Settings,
  CheckCircle, XCircle, Circle, ArrowRight, ArrowLeft,
  Copy, RefreshCw, Eye, RotateCcw, Loader2, Activity,
} from "lucide-react";
import { format } from "date-fns";

// Types
interface Integration {
  id: string;
  service_name: string;
  display_name: string;
  category: string;
  status: string;
  is_enabled: boolean;
  webhook_url: string | null;
  config: Record<string, any>;
  encrypted_credentials: Record<string, any> | null;
  last_health_check: string | null;
  last_health_status: string | null;
  notes: string | null;
}

interface WebhookLog {
  id: string;
  event_type: string;
  direction: string;
  webhook_url: string;
  status: string;
  response_status: number | null;
  duration_ms: number | null;
  created_at: string;
  request_payload: any;
  response_body: string | null;
  error_message: string | null;
  integration_id: string | null;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  email: Mail,
  payment: CreditCard,
  automation: Workflow,
  chatbot: Bot,
  voice: Mic,
  marketing: Megaphone,
  analytics: Activity,
};

const STATUS_COLORS: Record<string, string> = {
  connected: "bg-green-500",
  error: "bg-red-500",
  testing: "bg-yellow-500",
  disconnected: "bg-muted-foreground/40",
};

const WEBHOOK_EVENTS = [
  { event: "order.created", path: "/webhook/order-created" },
  { event: "order.status_changed", path: "/webhook/order-status-changed" },
  { event: "order.shipped", path: "/webhook/order-shipped" },
  { event: "payment.completed", path: "/webhook/stripe-payment-completed" },
  { event: "payment.failed", path: "/webhook/stripe-payment-failed" },
  { event: "payment.refunded", path: "/webhook/stripe-refund" },
  { event: "quote.created", path: "/webhook/quote-created" },
  { event: "quote.status_changed", path: "/webhook/quote-status-changed" },
  { event: "chat.b2c.session_completed", path: "/webhook/chat-b2c-session" },
  { event: "chat.b2c.lead_captured", path: "/webhook/chat-b2c-lead" },
  { event: "chat.b2c.escalation", path: "/webhook/chat-b2c-escalation" },
  { event: "chat.b2b.quote_requested", path: "/webhook/chat-b2b-quote" },
  { event: "chat.b2b.callback_requested", path: "/webhook/chat-b2b-callback" },
  { event: "voice.session_completed", path: "/webhook/voice-session" },
  { event: "voice.escalation", path: "/webhook/voice-escalation" },
  { event: "marketing.abandoned_cart", path: "/webhook/marketing-abandoned-cart" },
  { event: "marketing.restock_alert", path: "/webhook/marketing-restock" },
  { event: "user.signup", path: "/webhook/user-signup" },
  { event: "user.first_purchase", path: "/webhook/user-first-purchase" },
  { event: "health.check", path: "/webhook/health-check" },
];

const STRIPE_EVENTS = [
  "checkout.session.completed",
  "checkout.session.expired",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "charge.refunded",
];

const AdminIntegrationsTab = () => {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [configSheet, setConfigSheet] = useState<Integration | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, any>>({});
  const [credForm, setCredForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null);
  const [payloadDialog, setPayloadDialog] = useState<WebhookLog | null>(null);
  const [logFilter, setLogFilter] = useState({ integration: "all", status: "all", direction: "all" });
  const [logLimit, setLogLimit] = useState(50);
  const [healthChecking, setHealthChecking] = useState(false);
  const [webhookPaths, setWebhookPaths] = useState<Record<string, string>>({});
  const [lastFired, setLastFired] = useState<Record<string, string>>({});
  const refreshRef = useRef<ReturnType<typeof setInterval>>();

  const fetchIntegrations = useCallback(async () => {
    const { data } = await supabase.from("integrations").select("*").order("category");
    if (data) setIntegrations(data as unknown as Integration[]);
  }, []);

  const fetchWebhookLogs = useCallback(async () => {
    let query = supabase.from("webhook_logs").select("*").order("created_at", { ascending: false }).limit(logLimit);
    if (logFilter.status !== "all") query = query.eq("status", logFilter.status);
    if (logFilter.direction !== "all") query = query.eq("direction", logFilter.direction);
    if (logFilter.integration !== "all") query = query.eq("integration_id", logFilter.integration);
    const { data } = await query;
    if (data) setWebhookLogs(data as unknown as WebhookLog[]);
  }, [logLimit, logFilter]);

  const fetchLastFired = useCallback(async () => {
    const fired: Record<string, string> = {};
    for (const we of WEBHOOK_EVENTS) {
      const { data } = await supabase
        .from("webhook_logs")
        .select("created_at")
        .eq("event_type", we.event)
        .eq("status", "delivered")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) fired[we.event] = data.created_at;
    }
    setLastFired(fired);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchIntegrations(), fetchWebhookLogs(), fetchLastFired()]);
      setLoading(false);
    };
    load();
  }, [fetchIntegrations, fetchWebhookLogs, fetchLastFired]);

  // Auto-refresh webhook logs
  useEffect(() => {
    refreshRef.current = setInterval(fetchWebhookLogs, 30000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [fetchWebhookLogs]);

  const openConfig = (integration: Integration) => {
    setConfigSheet(integration);
    setConfigForm({ ...integration.config });
    setCredForm({ ...(integration.encrypted_credentials || {}) });
    setTestResult(null);
    if (integration.service_name === "n8n") {
      const paths: Record<string, string> = {};
      const webhooks = integration.config?.webhooks || {};
      WEBHOOK_EVENTS.forEach(we => {
        paths[we.event] = webhooks[we.event] || we.path;
      });
      setWebhookPaths(paths);
    }
  };

  const handleToggleEnabled = async (integration: Integration) => {
    const { error } = await supabase
      .from("integrations")
      .update({ is_enabled: !integration.is_enabled } as any)
      .eq("id", integration.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchIntegrations();
  };

  const handleSaveConfig = async () => {
    if (!configSheet) return;
    setSaving(true);
    const updatePayload: any = {
      config: configForm,
      encrypted_credentials: credForm,
    };
    if (configSheet.service_name === "n8n") {
      updatePayload.config = { ...configForm, webhooks: webhookPaths };
      updatePayload.webhook_url = configForm.base_url || configSheet.webhook_url;
    }
    const { error } = await supabase.from("integrations").update(updatePayload).eq("id", configSheet.id);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Configuration saved" });
      fetchIntegrations();
    }
  };

  const handleTestConnection = async (serviceName: string) => {
    setTesting(serviceName);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("test-integration", {
        body: { service_name: serviceName },
      });
      if (error) setTestResult({ status: "error", message: error.message });
      else setTestResult(data as { status: string; message: string });
    } catch (e: any) {
      setTestResult({ status: "error", message: e.message });
    }
    setTesting(null);
  };

  const handleTestWebhook = async (event: string, path: string) => {
    setTesting(event);
    const n8n = integrations.find(i => i.service_name === "n8n");
    const baseUrl = (n8n?.config as any)?.base_url || n8n?.webhook_url || "";
    const fullUrl = baseUrl.replace(/\/+$/, "") + path;
    const samplePayload = { event, test: true, timestamp: new Date().toISOString(), sample_data: { order_id: "test-123" } };

    try {
      const res = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(samplePayload),
      });
      const body = await res.text();
      const status = res.ok ? "delivered" : "failed";
      toast({ title: res.ok ? "Webhook delivered" : "Webhook failed", description: `Status: ${res.status}` });

      await supabase.from("webhook_logs").insert([{
        event_type: `${event}.test`,
        direction: "outbound",
        webhook_url: fullUrl,
        request_payload: samplePayload,
        response_status: res.status,
        response_body: body.slice(0, 2000),
        duration_ms: 0,
        status,
        error_message: res.ok ? null : `HTTP ${res.status}`,
      }] as any);
      fetchWebhookLogs();
    } catch (e: any) {
      toast({ title: "Test failed", description: e.message, variant: "destructive" });
    }
    setTesting(null);
  };

  const handleRetryWebhook = async (log: WebhookLog) => {
    try {
      const res = await fetch(log.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log.request_payload),
      });
      const body = await res.text();
      await supabase.from("webhook_logs").insert([{
        event_type: log.event_type,
        direction: "outbound",
        webhook_url: log.webhook_url,
        request_payload: log.request_payload,
        response_status: res.status,
        response_body: body.slice(0, 2000),
        duration_ms: 0,
        status: res.ok ? "delivered" : "failed",
        error_message: res.ok ? null : `HTTP ${res.status}`,
      }] as any);
      toast({ title: res.ok ? "Retry successful" : "Retry failed" });
      fetchWebhookLogs();
    } catch (e: any) {
      toast({ title: "Retry failed", description: e.message, variant: "destructive" });
    }
  };

  const handleRunHealthCheck = async () => {
    setHealthChecking(true);
    for (const integration of integrations.filter(i => i.is_enabled)) {
      try {
        const { data } = await supabase.functions.invoke("test-integration", {
          body: { service_name: integration.service_name },
        });
        const healthStatus = data?.status === "healthy" ? "healthy" : "unhealthy";
        await supabase.from("integrations").update({
          last_health_check: new Date().toISOString(),
          last_health_status: healthStatus,
        } as any).eq("id", integration.id);
      } catch {
        await supabase.from("integrations").update({
          last_health_check: new Date().toISOString(),
          last_health_status: "unhealthy",
        } as any).eq("id", integration.id);
      }
    }
    await fetchIntegrations();
    setHealthChecking(false);
    toast({ title: "Health check complete" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  // Config sheet content per category
  const renderConfigContent = () => {
    if (!configSheet) return null;
    const cat = configSheet.category;

    if (cat === "email") return renderMailgunConfig();
    if (cat === "payment") return renderStripeConfig();
    if (cat === "automation") return renderN8nConfig();
    if (cat === "chatbot") return renderChatbotConfig();
    if (cat === "voice") return renderVoiceConfig();
    if (cat === "marketing") return renderMarketingConfig();
    return <p className="text-sm text-muted-foreground">No configuration available.</p>;
  };

  const renderMailgunConfig = () => (
    <div className="space-y-4">
      <div><Label>API Key</Label><Input type="password" value={credForm.api_key || ""} onChange={e => setCredForm(p => ({ ...p, api_key: e.target.value }))} placeholder="key-xxxxxxxx" /></div>
      <div><Label>Domain</Label><Input value={configForm.domain || ""} onChange={e => setConfigForm(p => ({ ...p, domain: e.target.value }))} placeholder="fitmatch.ca" /></div>
      <div><Label>Region</Label>
        <Select value={configForm.region || "US"} onValueChange={v => setConfigForm(p => ({ ...p, region: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="US">US</SelectItem><SelectItem value="EU">EU</SelectItem></SelectContent>
        </Select>
      </div>
      <div><Label>From Email</Label><Input value={configForm.from_email || ""} onChange={e => setConfigForm(p => ({ ...p, from_email: e.target.value }))} placeholder="orders@fitmatch.ca" /></div>
      <div><Label>From Name</Label><Input value={configForm.from_name || ""} onChange={e => setConfigForm(p => ({ ...p, from_name: e.target.value }))} placeholder="FitMatch" /></div>
      {renderTestButton("mailgun")}
    </div>
  );

  const renderStripeConfig = () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const webhookUrl = `https://${projectId}.supabase.co/functions/v1/stripe-webhook`;
    return (
      <div className="space-y-4">
        <div><Label>Secret Key</Label><Input type="password" value={credForm.secret_key || ""} onChange={e => setCredForm(p => ({ ...p, secret_key: e.target.value }))} placeholder="sk_live_..." /></div>
        <div><Label>Webhook Signing Secret</Label><Input type="password" value={credForm.webhook_secret || ""} onChange={e => setCredForm(p => ({ ...p, webhook_secret: e.target.value }))} placeholder="whsec_..." /></div>
        <div><Label>Currency</Label><Input value={configForm.currency || "CAD"} onChange={e => setConfigForm(p => ({ ...p, currency: e.target.value }))} /></div>
        <div>
          <Label>Webhook URL</Label>
          <div className="flex gap-2">
            <Input value={webhookUrl} readOnly className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl)}><Copy className="w-4 h-4" /></Button>
          </div>
        </div>
        <div>
          <Label>Configured Webhook Events</Label>
          <div className="space-y-1 mt-1">
            {STRIPE_EVENTS.map(evt => (
              <div key={evt} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                <span className="font-mono text-xs">{evt}</span>
              </div>
            ))}
          </div>
        </div>
        {renderTestButton("stripe")}
      </div>
    );
  };

  const renderN8nConfig = () => (
    <div className="space-y-4">
      <div><Label>n8n Instance URL</Label><Input value={configForm.base_url || ""} onChange={e => setConfigForm(p => ({ ...p, base_url: e.target.value }))} placeholder="https://your-instance.app.n8n.cloud" /></div>
      <div><Label>API Key (optional)</Label><Input type="password" value={credForm.api_key || ""} onChange={e => setCredForm(p => ({ ...p, api_key: e.target.value }))} /></div>
      <div><Label>Webhook Base URL</Label><Input value={configForm.webhook_base_url || configForm.base_url || ""} onChange={e => setConfigForm(p => ({ ...p, webhook_base_url: e.target.value }))} placeholder="Same as instance URL or custom" /></div>
      {renderTestButton("n8n")}
      <Separator />
      <h3 className="text-sm font-bold text-foreground">Webhook Registry</h3>
      <div className="border-2 border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2 px-2">Event</TableHead>
              <TableHead className="py-2 px-2">Webhook Path</TableHead>
              <TableHead className="py-2 px-2 text-center">Status</TableHead>
              <TableHead className="py-2 px-2 text-center">Last Fired</TableHead>
              <TableHead className="py-2 px-2 text-center">Test</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {WEBHOOK_EVENTS.map(we => (
              <TableRow key={we.event} className="text-xs">
                <TableCell className="py-1.5 px-2 font-mono">{we.event}</TableCell>
                <TableCell className="py-1.5 px-2">
                  <Input
                    value={webhookPaths[we.event] || we.path}
                    onChange={e => setWebhookPaths(p => ({ ...p, [we.event]: e.target.value }))}
                    className="h-7 text-xs font-mono min-w-[260px]"
                    title={webhookPaths[we.event] || we.path}
                  />
                </TableCell>
                <TableCell className="py-1.5 px-2 text-center">
                  {lastFired[we.event] ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 mx-auto" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-muted-foreground mx-auto" />
                  )}
                </TableCell>
                <TableCell className="py-1.5 px-2 text-center text-muted-foreground">
                  {lastFired[we.event] ? timeAgo(lastFired[we.event]) : "never"}
                </TableCell>
                <TableCell className="py-1.5 px-2 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    disabled={testing === we.event}
                    onClick={() => handleTestWebhook(we.event, webhookPaths[we.event] || we.path)}
                  >
                    {testing === we.event ? <Loader2 className="w-3 h-3 animate-spin" /> : "Test"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderChatbotConfig = () => (
    <div className="space-y-4">
      <div><Label>n8n Webhook URL</Label><Input value={configForm.webhook_url || ""} onChange={e => setConfigForm(p => ({ ...p, webhook_url: e.target.value }))} placeholder="https://..." /></div>
      <div><Label>OpenAI API Key</Label><Input type="password" value={credForm.openai_key || ""} onChange={e => setCredForm(p => ({ ...p, openai_key: e.target.value }))} /></div>
      <div><Label>Pinecone API Key</Label><Input type="password" value={credForm.pinecone_key || ""} onChange={e => setCredForm(p => ({ ...p, pinecone_key: e.target.value }))} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Pinecone Index</Label><Input value={configForm.pinecone_index || ""} onChange={e => setConfigForm(p => ({ ...p, pinecone_index: e.target.value }))} /></div>
        <div><Label>Pinecone Namespace</Label><Input value={configForm.pinecone_namespace || ""} onChange={e => setConfigForm(p => ({ ...p, pinecone_namespace: e.target.value }))} /></div>
      </div>
      <div><Label>System Prompt</Label><Textarea rows={6} value={configForm.system_prompt || ""} onChange={e => setConfigForm(p => ({ ...p, system_prompt: e.target.value }))} /></div>
      <div>
        <Label>Temperature: {configForm.temperature ?? 0.7}</Label>
        <Slider value={[configForm.temperature ?? 0.7]} min={0} max={1} step={0.1} onValueChange={v => setConfigForm(p => ({ ...p, temperature: v[0] }))} />
      </div>
      <div><Label>Max Tokens</Label><Input type="number" value={configForm.max_tokens || 1024} onChange={e => setConfigForm(p => ({ ...p, max_tokens: Number(e.target.value) }))} /></div>
      {renderTestButton("chatbot")}
    </div>
  );

  const renderVoiceConfig = () => (
    <div className="space-y-4">
      <div><Label>ElevenLabs API Key</Label><Input type="password" value={credForm.api_key || ""} onChange={e => setCredForm(p => ({ ...p, api_key: e.target.value }))} /></div>
      <div><Label>Agent ID</Label><Input value={configForm.agent_id || ""} onChange={e => setConfigForm(p => ({ ...p, agent_id: e.target.value }))} /></div>
      <div><Label>Voice ID</Label><Input value={configForm.voice_id || ""} onChange={e => setConfigForm(p => ({ ...p, voice_id: e.target.value }))} /></div>
      <div><Label>n8n Webhook URL for Voice Events</Label><Input value={configForm.webhook_url || ""} onChange={e => setConfigForm(p => ({ ...p, webhook_url: e.target.value }))} /></div>
      {renderTestButton("elevenlabs")}
    </div>
  );

  const renderMarketingConfig = () => (
    <div className="space-y-4">
      <div><Label>Abandoned Cart Delay (minutes)</Label><Input type="number" value={configForm.abandoned_cart_delay || 30} onChange={e => setConfigForm(p => ({ ...p, abandoned_cart_delay: Number(e.target.value) }))} /></div>
      <div><Label>Restock Alert Threshold</Label><Input type="number" value={configForm.restock_threshold || 5} onChange={e => setConfigForm(p => ({ ...p, restock_threshold: Number(e.target.value) }))} /></div>
      <div><Label>Newsletter Frequency</Label>
        <Select value={configForm.newsletter_frequency || "weekly"} onValueChange={v => setConfigForm(p => ({ ...p, newsletter_frequency: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <h3 className="text-sm font-bold">Automation Toggles</h3>
      {["abandoned_cart", "restock_alert", "newsletter"].map(key => (
        <div key={key} className="flex items-center justify-between">
          <Label className="capitalize">{key.replace(/_/g, " ")}</Label>
          <Switch checked={configForm[`${key}_enabled`] ?? false} onCheckedChange={v => setConfigForm(p => ({ ...p, [`${key}_enabled`]: v }))} />
        </div>
      ))}
    </div>
  );

  const renderTestButton = (service: string) => (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="border-2"
        disabled={testing === service}
        onClick={() => handleTestConnection(service)}
      >
        {testing === service ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
        Test Connection
      </Button>
      {testResult && (
        <div className={`flex items-center gap-2 text-sm ${testResult.status === "healthy" ? "text-green-600" : "text-destructive"}`}>
          {testResult.status === "healthy" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {testResult.message}
        </div>
      )}
    </div>
  );

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-8">
      {/* SECTION 1: Service Cards */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">Service Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map(integration => {
            const Icon = CATEGORY_ICONS[integration.category] || Settings;
            return (
              <Card key={integration.id} className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--foreground))]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 border-2 border-border">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{integration.display_name}</p>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{integration.category}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[integration.status] || STATUS_COLORS.disconnected}`} />
                      <span className="text-[10px] text-muted-foreground capitalize">{integration.status}</span>
                    </div>
                  </div>
                  {integration.last_health_check && (
                    <p className="text-[10px] text-muted-foreground mb-2">
                      Last check: {timeAgo(integration.last_health_check)}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <Switch
                      checked={integration.is_enabled}
                      onCheckedChange={() => handleToggleEnabled(integration)}
                    />
                    <Button variant="outline" size="sm" className="h-7 text-xs border-2" onClick={() => openConfig(integration)}>
                      <Settings className="w-3 h-3 mr-1" /> Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Webhook Activity Log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">Webhook Activity Log</h3>
          <Button variant="outline" size="sm" className="h-7 text-xs border-2" onClick={fetchWebhookLogs}>
            <RefreshCw className="w-3 h-3 mr-1" /> Refresh
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <Select value={logFilter.integration} onValueChange={v => setLogFilter(p => ({ ...p, integration: v }))}>
            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Integration" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Integrations</SelectItem>
              {integrations.map(i => <SelectItem key={i.id} value={i.id}>{i.display_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={logFilter.status} onValueChange={v => setLogFilter(p => ({ ...p, status: v }))}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="retrying">Retrying</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={logFilter.direction} onValueChange={v => setLogFilter(p => ({ ...p, direction: v }))}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Direction" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directions</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
              <SelectItem value="inbound">Inbound</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Card className="border-2 border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2 px-2">Time</TableHead>
                  <TableHead className="py-2 px-2">Event</TableHead>
                  <TableHead className="py-2 px-2 text-center">Dir</TableHead>
                  <TableHead className="py-2 px-2">URL</TableHead>
                  <TableHead className="py-2 px-2 text-center">Status</TableHead>
                  <TableHead className="py-2 px-2 text-center">Code</TableHead>
                  <TableHead className="py-2 px-2 text-center">Ms</TableHead>
                  <TableHead className="py-2 px-2 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhookLogs.map(log => (
                  <TableRow key={log.id} className="text-xs">
                    <TableCell className="py-1.5 px-2 text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                    </TableCell>
                    <TableCell className="py-1.5 px-2 font-mono max-w-[140px] truncate">{log.event_type}</TableCell>
                    <TableCell className="py-1.5 px-2 text-center">
                      {log.direction === "outbound" ? <ArrowRight className="w-3 h-3 mx-auto" /> : <ArrowLeft className="w-3 h-3 mx-auto" />}
                    </TableCell>
                    <TableCell className="py-1.5 px-2 max-w-[160px] truncate font-mono text-muted-foreground" title={log.webhook_url}>
                      {log.webhook_url}
                    </TableCell>
                    <TableCell className="py-1.5 px-2 text-center">
                      <Badge variant={log.status === "delivered" ? "default" : log.status === "failed" ? "destructive" : "secondary"} className="text-[9px] px-1 py-0">
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5 px-2 text-center">{log.response_status || "—"}</TableCell>
                    <TableCell className="py-1.5 px-2 text-center">{log.duration_ms ?? "—"}</TableCell>
                    <TableCell className="py-1.5 px-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPayloadDialog(log)}>
                          <Eye className="w-3 h-3" />
                        </Button>
                        {log.status === "failed" && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRetryWebhook(log)}>
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {webhookLogs.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No webhook activity yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {webhookLogs.length >= logLimit && (
          <Button variant="outline" className="w-full mt-2 border-2 text-xs" onClick={() => setLogLimit(l => l + 50)}>
            Load More
          </Button>
        )}
      </div>

      {/* SECTION 3: System Health */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">System Health</h3>
          <Button variant="outline" size="sm" className="h-7 text-xs border-2" disabled={healthChecking} onClick={handleRunHealthCheck}>
            {healthChecking ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Activity className="w-3 h-3 mr-1" />}
            Run Health Check
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {integrations.map(i => {
            const healthColor = i.last_health_status === "healthy" ? "bg-green-500"
              : i.last_health_status === "degraded" ? "bg-yellow-500"
              : i.last_health_status === "unhealthy" ? "bg-red-500"
              : "bg-muted-foreground/40";
            const label = i.is_enabled ? (i.last_health_status || "unknown") : "Not configured";
            return (
              <div key={i.id} className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-border text-xs font-medium">
                <div className={`w-2 h-2 rounded-full ${healthColor}`} />
                {i.display_name}: <span className="capitalize text-muted-foreground">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Configuration Sheet */}
      <Sheet open={!!configSheet} onOpenChange={open => { if (!open) setConfigSheet(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-foreground">{configSheet?.display_name} Configuration</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {renderConfigContent()}
            <Separator />
            <Button onClick={handleSaveConfig} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Payload Viewer Dialog */}
      <Dialog open={!!payloadDialog} onOpenChange={open => { if (!open) setPayloadDialog(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Webhook Details — {payloadDialog?.event_type}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-bold">Request Payload</Label>
              <pre className="bg-muted p-3 text-xs font-mono overflow-x-auto border-2 border-border mt-1 max-h-[200px] overflow-y-auto">
                {JSON.stringify(payloadDialog?.request_payload, null, 2)}
              </pre>
            </div>
            <div>
              <Label className="text-xs font-bold">Response Body</Label>
              <pre className="bg-muted p-3 text-xs font-mono overflow-x-auto border-2 border-border mt-1 max-h-[200px] overflow-y-auto">
                {payloadDialog?.response_body || "—"}
              </pre>
            </div>
            {payloadDialog?.error_message && (
              <div>
                <Label className="text-xs font-bold text-destructive">Error</Label>
                <p className="text-sm text-destructive mt-1">{payloadDialog.error_message}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminIntegrationsTab;
