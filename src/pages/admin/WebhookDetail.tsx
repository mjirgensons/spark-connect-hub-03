import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  FlaskConical,
  RotateCcw,
  Copy,
  CheckCircle2,
  XCircle,
  CreditCard,
  Mail,
} from "lucide-react";

const neoCard = "border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]";

// ─── Provider / endpoint registry ───
const ENDPOINT_REGISTRY: Record<string, Record<string, {
  label: string;
  stripeType?: string;
  settingKey: string;
  workflow: string;
}>> = {
  stripe: {
    wf9_checkout_completed: {
      label: "checkout.session.completed",
      stripeType: "checkout.session.completed",
      settingKey: "stripe_checkout_completed_webhook_url",
      workflow: "WF-9",
    },
    wf9_checkout_expired: {
      label: "checkout.session.expired",
      stripeType: "checkout.session.expired",
      settingKey: "stripe_checkout_expired_webhook_url",
      workflow: "WF-9",
    },
    wf9_charge_refunded: {
      label: "charge.refunded",
      stripeType: "charge.refunded",
      settingKey: "stripe_charge_refunded_webhook_url",
      workflow: "WF-9",
    },
  },
};

const PROVIDER_META: Record<string, { name: string; icon: React.ElementType }> = {
  stripe: { name: "Stripe", icon: CreditCard },
  mailgun: { name: "Mailgun", icon: Mail },
};

interface LogRow {
  id: string;
  event_type: string;
  event_id: string | null;
  direction: string;
  status: string;
  webhook_url: string;
  response_status: number | null;
  response_body: string | null;
  request_payload: any;
  duration_ms: number | null;
  created_at: string;
  is_replay: boolean;
  is_test: boolean;
  error_message: string | null;
}

const WebhookDetail = () => {
  const { provider, endpointKey } = useParams<{ provider: string; endpointKey: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogRow | null>(null);
  const [timeFilter, setTimeFilter] = useState("24h");
  const [statusFilter, setStatusFilter] = useState("all");
  const [testRunning, setTestRunning] = useState(false);
  const [replayRunning, setReplayRunning] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [configuredUrl, setConfiguredUrl] = useState<string | null>(null);

  const endpointConfig = provider && endpointKey
    ? ENDPOINT_REGISTRY[provider]?.[endpointKey]
    : null;

  const providerMeta = provider ? PROVIDER_META[provider] || { name: provider, icon: CreditCard } : null;

  // Auth check
  useEffect(() => {
    const check = async () => {
      if (!user) { setIsAdmin(false); return; }
      const { data } = await supabase
        .from("admin_emails")
        .select("id")
        .eq("email", user.email || "")
        .maybeSingle();
      setIsAdmin(!!data);
    };
    if (user) check();
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/admin/login");
  }, [user, authLoading, navigate]);

  // Load configured URL
  useEffect(() => {
    if (!endpointConfig?.settingKey) return;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", endpointConfig.settingKey)
      .maybeSingle()
      .then(({ data }) => setConfiguredUrl(data?.value?.trim() || null));
  }, [endpointConfig?.settingKey]);

  // Load logs
  const loadLogs = useCallback(async () => {
    if (!provider || !endpointKey) return;
    setLogsLoading(true);

    let query = supabase
      .from("webhook_logs")
      .select("id, event_type, event_id, direction, status, webhook_url, response_status, response_body, request_payload, duration_ms, created_at, is_replay, is_test, error_message")
      .eq("provider", provider)
      .eq("endpoint_key", endpointKey)
      .order("created_at", { ascending: false })
      .limit(50);

    // Time filter
    const now = new Date();
    if (timeFilter === "1h") {
      query = query.gte("created_at", new Date(now.getTime() - 3600000).toISOString());
    } else if (timeFilter === "24h") {
      query = query.gte("created_at", new Date(now.getTime() - 86400000).toISOString());
    } else if (timeFilter === "7d") {
      query = query.gte("created_at", new Date(now.getTime() - 604800000).toISOString());
    }

    // Status filter
    if (statusFilter === "success") {
      query = query.eq("status", "delivered");
    } else if (statusFilter === "failed") {
      query = query.eq("status", "failed");
    }

    const { data } = await query;
    setLogs((data || []) as LogRow[]);
    setLogsLoading(false);
  }, [provider, endpointKey, timeFilter, statusFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  // Send test
  const sendTest = async () => {
    if (!endpointConfig?.stripeType) return;
    setTestRunning(true);
    try {
      const fnUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/stripe-webhook-test`;
      const res = await fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          stripe_event_type: endpointConfig.stripeType,
          provider,
          endpoint_key: endpointKey,
        }),
      });
      const json = await res.json();
      toast({
        title: json.status === "success" ? "✅ Test sent" : "❌ Test failed",
        description: json.message,
        variant: json.status === "success" ? undefined : "destructive",
      });
    } catch (err: any) {
      toast({ title: "Network error", description: err.message, variant: "destructive" });
    }
    setTestRunning(false);
    setTimeout(loadLogs, 2000);
  };

  // Replay
  const replayEvent = async (log: LogRow) => {
    if (!configuredUrl) {
      toast({ title: "No URL configured", description: "Save a target URL first.", variant: "destructive" });
      return;
    }
    setReplayRunning(true);
    try {
      const fnUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/stripe-webhook-test`;
      const res = await fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          stripe_event_type: endpointConfig?.stripeType,
          provider,
          endpoint_key: endpointKey,
          replay_payload: log.request_payload,
          is_replay: true,
        }),
      });
      const json = await res.json();
      toast({
        title: json.status === "success" ? "✅ Replay sent" : "❌ Replay failed",
        description: json.message,
        variant: json.status === "success" ? undefined : "destructive",
      });
    } catch (err: any) {
      toast({ title: "Network error", description: err.message, variant: "destructive" });
    }
    setReplayRunning(false);
    setTimeout(loadLogs, 2000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatTs = (ts: string) =>
    new Date(ts).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "medium" });

  // Auth guards
  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You are not authorized to view this page.</p>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Admin
          </Button>
        </div>
      </div>
    );
  }

  if (!endpointConfig || !providerMeta) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Endpoint Not Found</h1>
          <p className="text-muted-foreground">
            No configuration found for {provider}/{endpointKey}.
          </p>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Admin
          </Button>
        </div>
      </div>
    );
  }

  const Icon = providerMeta.icon;
  const lastDelivery = logs[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-border bg-card">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-serif font-bold text-foreground">FitMatch Admin</h1>
          <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* ─── Back + Title ─── */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="border-2" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>

        <Card className={neoCard}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-accent">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {providerMeta.name} → {endpointConfig.workflow} {endpointConfig.label}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    {provider}/{endpointKey}
                  </p>
                  {configuredUrl ? (
                    <p className="text-xs text-muted-foreground mt-1 font-mono truncate max-w-md" title={configuredUrl}>
                      Target: {configuredUrl}
                    </p>
                  ) : (
                    <p className="text-xs text-destructive mt-1">⚠ No target URL configured</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {lastDelivery && (
                  <div className="text-right text-xs">
                    <p className="text-muted-foreground">Last delivery</p>
                    <div className="flex items-center gap-1.5 justify-end mt-0.5">
                      {lastDelivery.status === "delivered" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-destructive" />
                      )}
                      <span>{formatTs(lastDelivery.created_at)}</span>
                    </div>
                  </div>
                )}
                <Button
                  size="sm"
                  className="gap-1"
                  disabled={testRunning || !configuredUrl}
                  onClick={sendTest}
                >
                  {testRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <FlaskConical className="w-3 h-3" />}
                  Send test event
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* ─── Filters ─── */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-32 border-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last 1h</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7d</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 border-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="border-2" onClick={loadLogs} disabled={logsLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${logsLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>

          <span className="text-xs text-muted-foreground ml-auto">
            {logs.length} event{logs.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ─── Content: list + detail ─── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Deliveries list */}
          <Card className={neoCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading && logs.length === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <p>No webhook events found for this endpoint.</p>
                  <p className="text-xs mt-1">Try sending a test event or adjusting filters.</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Event ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>HTTP</TableHead>
                        <TableHead>Flags</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow
                          key={log.id}
                          className={`cursor-pointer ${selectedLog?.id === log.id ? "bg-accent" : ""}`}
                          onClick={() => setSelectedLog(log)}
                        >
                          <TableCell className="text-xs">{formatTs(log.created_at)}</TableCell>
                          <TableCell className="font-mono text-[10px] max-w-[120px] truncate" title={log.event_id || "—"}>
                            {log.event_id?.slice(0, 20) || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={log.status === "delivered" ? "default" : log.status === "failed" ? "destructive" : "secondary"}
                              className="text-[10px]"
                            >
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{log.response_status ?? "—"}</TableCell>
                          <TableCell className="flex gap-1">
                            {log.is_test && <Badge variant="outline" className="text-[9px] border px-1">test</Badge>}
                            {log.is_replay && <Badge variant="outline" className="text-[9px] border px-1">replay</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detail panel */}
          <Card className={neoCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Delivery Detail</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedLog ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <p>Select a delivery from the list to inspect its details.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Event ID</p>
                      <p className="font-mono truncate">{selectedLog.event_id || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Event Type</p>
                      <p className="font-mono">{selectedLog.event_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p>{formatTs(selectedLog.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">HTTP Status</p>
                      <p className="font-mono">{selectedLog.response_status ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p>{selectedLog.duration_ms ? `${selectedLog.duration_ms}ms` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Flags</p>
                      <div className="flex gap-1">
                        {selectedLog.is_test && <Badge variant="outline" className="text-[9px]">test</Badge>}
                        {selectedLog.is_replay && <Badge variant="outline" className="text-[9px]">replay</Badge>}
                        {!selectedLog.is_test && !selectedLog.is_replay && <span>—</span>}
                      </div>
                    </div>
                  </div>

                  {selectedLog.error_message && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded p-2">
                      <p className="text-xs text-destructive font-mono">{selectedLog.error_message}</p>
                    </div>
                  )}

                  {/* Tabs */}
                  <Tabs defaultValue="request" className="w-full">
                    <TabsList className="w-full">
                      <TabsTrigger value="request" className="flex-1 text-xs">Original Event</TabsTrigger>
                      <TabsTrigger value="response" className="flex-1 text-xs">Target Response</TabsTrigger>
                    </TabsList>

                    <TabsContent value="request" className="mt-3">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 h-7 text-xs gap-1"
                          onClick={() => copyToClipboard(JSON.stringify(selectedLog.request_payload, null, 2), "request")}
                        >
                          {copied === "request" ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied === "request" ? "Copied" : "Copy"}
                        </Button>
                        <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto max-h-64 border">
                          {JSON.stringify(selectedLog.request_payload, null, 2)}
                        </pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="response" className="mt-3">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 h-7 text-xs gap-1"
                          onClick={() => copyToClipboard(selectedLog.response_body || "", "response")}
                        >
                          {copied === "response" ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied === "response" ? "Copied" : "Copy"}
                        </Button>
                        <div className="mb-2">
                          <Badge
                            variant={selectedLog.response_status && selectedLog.response_status < 300 ? "default" : "destructive"}
                            className="text-xs"
                          >
                            HTTP {selectedLog.response_status ?? "N/A"}
                          </Badge>
                        </div>
                        <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto max-h-64 border">
                          {selectedLog.response_body || "No response body"}
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-2 gap-1 text-xs"
                      disabled={replayRunning || !configuredUrl}
                      onClick={() => replayEvent(selectedLog)}
                    >
                      {replayRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                      Replay this event
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-2 gap-1 text-xs"
                      disabled={testRunning || !configuredUrl}
                      onClick={sendTest}
                    >
                      {testRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <FlaskConical className="w-3 h-3" />}
                      Send synthetic test
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WebhookDetail;
