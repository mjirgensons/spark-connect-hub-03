import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Loader2, Eye, EyeOff, ExternalLink, Webhook, CreditCard, Mail, ArrowRight } from "lucide-react";

const neoCard = "border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]";

interface WebhookLogRow {
  id: string;
  event_type: string;
  direction: string;
  status: string;
  webhook_url: string;
  response_status: number | null;
  created_at: string;
  request_payload: any;
  response_body: string | null;
  duration_ms: number | null;
}

// Provider registry — add new providers here
const PROVIDERS = [
  {
    id: "stripe",
    name: "Stripe",
    icon: CreditCard,
    description: "Payment lifecycle events forwarded to n8n via WF-9.",
    eventTypes: [
      { type: "checkout.session.completed", workflow: "WF-9", settingKey: "stripe_checkout_completed_webhook_url" },
      { type: "checkout.session.expired", workflow: "WF-9", settingKey: "stripe_checkout_expired_webhook_url" },
      { type: "charge.refunded", workflow: "WF-9", settingKey: "stripe_charge_refunded_webhook_url" },
    ],
    logFilter: "event_type.ilike.%checkout%,event_type.ilike.%charge%,event_type.ilike.test:checkout%,event_type.ilike.test:charge%",
    adminSection: "integrations" as const,
    adminLabel: "Configure in Integrations → Stripe",
  },
  {
    id: "mailgun",
    name: "Mailgun",
    icon: Mail,
    description: "Email delivery tracking events (open, click, bounce, etc.).",
    eventTypes: [
      { type: "email.send", workflow: "WF-8", settingKey: null },
      { type: "email.tracking", workflow: "WF-8", settingKey: null },
      { type: "email.inbound", workflow: "WF-8", settingKey: null },
    ],
    logFilter: "event_type.ilike.%email%,event_type.ilike.%mailgun%",
    adminSection: "integrations" as const,
    adminLabel: "Configure in Integrations → Mailgun",
  },
] as const;

interface AdminWebhooksTabProps {
  onNavigate?: (section: string) => void;
}

const AdminWebhooksTab = ({ onNavigate }: AdminWebhooksTabProps) => {
  const { toast } = useToast();
  const [recentLogs, setRecentLogs] = useState<WebhookLogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [wf9Urls, setWf9Urls] = useState<Record<string, string>>({});

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    const { data } = await supabase
      .from("webhook_logs")
      .select("id, event_type, direction, status, webhook_url, response_status, created_at, request_payload, response_body, duration_ms")
      .order("created_at", { ascending: false })
      .limit(30);
    setRecentLogs((data || []) as WebhookLogRow[]);
    setLogsLoading(false);
  }, []);

  const loadWf9Urls = useCallback(async () => {
    const keys = PROVIDERS.flatMap((p) => p.eventTypes.map((e) => e.settingKey).filter(Boolean)) as string[];
    if (keys.length === 0) return;
    const { data } = await supabase.from("site_settings").select("key, value").in("key", keys);
    const map: Record<string, string> = {};
    (data || []).forEach((row) => { map[row.key] = row.value || ""; });
    setWf9Urls(map);
  }, []);

  useEffect(() => {
    loadLogs();
    loadWf9Urls();
  }, [loadLogs, loadWf9Urls]);

  const formatTs = (ts: string | null) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "medium" });
  };

  const truncateUrl = (url: string, max = 60) => (url.length > max ? url.slice(0, max) + "…" : url);

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Overview of all webhook providers, event types, and recent activity. Add new providers by extending the registry.
      </p>

      {/* ━━━ PROVIDER CARDS ━━━ */}
      <div className="grid gap-6 md:grid-cols-2">
        {PROVIDERS.map((provider) => {
          const Icon = provider.icon;
          return (
            <Card key={provider.id} className={neoCard}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-accent">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{provider.name}</CardTitle>
                    <CardDescription className="text-xs">{provider.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  {provider.eventTypes.map((evt) => {
                    const url = evt.settingKey ? wf9Urls[evt.settingKey] : null;
                    return (
                      <div key={evt.type} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{evt.type}</code>
                          <Badge variant="outline" className="text-[10px] border">{evt.workflow}</Badge>
                        </div>
                        {evt.settingKey && (
                          <Badge
                            variant={url ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {url ? "Configured" : "Not set"}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-1">
                  {onNavigate && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-2 text-xs gap-1"
                      onClick={() => onNavigate(provider.adminSection)}
                    >
                      <ExternalLink className="w-3 h-3" />
                      {provider.adminLabel}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ━━━ RECENT WEBHOOK ACTIVITY ━━━ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-serif font-bold flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            Recent Webhook Activity
          </h3>
          <Button variant="outline" size="sm" className="border-2" onClick={loadLogs} disabled={logsLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${logsLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <Card className={neoCard}>
          <CardContent className="pt-4">
            {logsLoading && recentLogs.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No webhook logs yet.</p>
            ) : (
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Dir</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>HTTP</TableHead>
                      <TableHead>ms</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Inspect</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLogs.map((log) => (
                      <>
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">{log.event_type}</TableCell>
                          <TableCell className="text-xs">{log.direction}</TableCell>
                          <TableCell>
                            <Badge
                              variant={log.status === "delivered" ? "default" : log.status === "failed" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs" title={log.webhook_url}>
                            {truncateUrl(log.webhook_url)}
                          </TableCell>
                          <TableCell className="text-xs">{log.response_status ?? "—"}</TableCell>
                          <TableCell className="text-xs">{log.duration_ms ?? "—"}</TableCell>
                          <TableCell className="text-xs">{formatTs(log.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                            >
                              {expandedRow === log.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedRow === log.id && (
                          <TableRow key={`${log.id}-detail`}>
                            <TableCell colSpan={8} className="bg-muted/30 p-4">
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs font-mono font-bold mb-1">Request Payload:</p>
                                  <pre className="text-xs font-mono bg-muted p-2 rounded overflow-auto max-h-40">
                                    {JSON.stringify(log.request_payload, null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <p className="text-xs font-mono font-bold mb-1">Response Body:</p>
                                  <pre className="text-xs font-mono bg-muted p-2 rounded overflow-auto max-h-40">
                                    {log.response_body || "—"}
                                  </pre>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminWebhooksTab;
