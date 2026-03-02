import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, ChevronDown, ChevronRight, Loader2, CheckCircle2, XCircle, Play, Eye, EyeOff } from "lucide-react";

const neoCard = "border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]";

// ─── Types ───
interface PreflightCheck {
  label: string;
  ok: boolean;
  detail?: string;
}

interface WebhookEndpoint {
  event: string;
  path: string;
  lastFired: string | null;
  lastStatus: string | null;
}

interface ConsentRow {
  id: string;
  email: string;
  consent_type: string;
  consent_category: string;
  granted: boolean;
  created_at: string | null;
}

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
}

const STRIPE_EVENTS: { event: string; path: string; stripeType: string }[] = [
  { event: "payment.completed", path: "/webhook/stripe-payment-completed", stripeType: "checkout.session.completed" },
  { event: "payment.failed", path: "/webhook/stripe-payment-failed", stripeType: "payment_intent.payment_failed" },
  { event: "payment.refunded", path: "/webhook/stripe-refund", stripeType: "charge.refunded" },
];

const REQUIRED_TEMPLATES = ["order_confirmation", "payment_receipt", "payment_failed", "refund_processed"];

const EmailWF9StripeTab = () => {
  const { toast } = useToast();

  // ─── Section collapsible state ───
  const [s1Open, setS1Open] = useState(true);
  const [s2Open, setS2Open] = useState(true);
  const [s3Open, setS3Open] = useState(true);
  const [s4Open, setS4Open] = useState(true);

  // ─── Section 1: Pre-flight ───
  const [checks, setChecks] = useState<PreflightCheck[]>([]);
  const [preflightLoading, setPreflightLoading] = useState(false);

  // ─── Section 2: Webhook endpoints ───
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [endpointsLoading, setEndpointsLoading] = useState(false);
  const [testFiring, setTestFiring] = useState<number | null>(null);
  const [n8nBaseUrl, setN8nBaseUrl] = useState<string | null>(null);

  // ─── Section 3: Consent log ───
  const [consentRows, setConsentRows] = useState<ConsentRow[]>([]);
  const [consentCount, setConsentCount] = useState(0);
  const [consentLoading, setConsentLoading] = useState(false);
  const [insertingConsent, setInsertingConsent] = useState(false);

  // ─── Section 4: Recent Stripe activity ───
  const [activityLogs, setActivityLogs] = useState<WebhookLogRow[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // ═══════════════════════════════════════════
  // Section 1: Pre-Flight Checklist
  // ═══════════════════════════════════════════
  const runPreflight = useCallback(async () => {
    setPreflightLoading(true);
    const results: PreflightCheck[] = [];

    // 1. Stripe integration
    const { data: stripeInt } = await supabase
      .from("integrations")
      .select("is_enabled, config")
      .eq("service_name", "stripe")
      .maybeSingle();

    results.push({
      label: "Stripe integration connected",
      ok: !!(stripeInt && stripeInt.is_enabled),
      detail: stripeInt ? (stripeInt.is_enabled ? "Enabled" : "Disabled") : "No row found",
    });

    // 2. Stripe webhook secret configured
    const stripeConfig = stripeInt?.config as Record<string, any> | null;
    const hasWebhookSecret = !!(stripeConfig && stripeConfig.webhook_secret && String(stripeConfig.webhook_secret).length > 0);
    results.push({
      label: "Stripe webhook secret configured",
      ok: hasWebhookSecret,
      detail: hasWebhookSecret ? "Set" : "Missing or empty in config",
    });

    // 3. n8n integration
    const { data: n8nInt } = await supabase
      .from("integrations")
      .select("is_enabled, config, webhook_url")
      .eq("service_name", "n8n")
      .maybeSingle();

    results.push({
      label: "n8n integration connected",
      ok: !!(n8nInt && n8nInt.is_enabled),
      detail: n8nInt ? (n8nInt.is_enabled ? "Enabled" : "Disabled") : "No row found",
    });

    // Store n8n base URL for section 2
    const n8nCfg = n8nInt?.config as Record<string, any> | null;
    const base = n8nCfg?.webhook_base_url || n8nCfg?.base_url || n8nInt?.webhook_url || "";
    setN8nBaseUrl(base ? String(base).replace(/\/+$/, "") : null);

    // 4. Edge Function: stripe-webhook health
    try {
      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/stripe-webhook`,
        { method: "OPTIONS" }
      );
      results.push({
        label: "Edge Function stripe-webhook healthy",
        ok: res.status < 500,
        detail: `OPTIONS → ${res.status}`,
      });
    } catch (err: any) {
      results.push({ label: "Edge Function stripe-webhook healthy", ok: false, detail: err.message });
    }

    // 5. Edge Function: log-email-consent health
    try {
      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/log-email-consent`,
        { method: "OPTIONS" }
      );
      results.push({
        label: "Edge Function log-email-consent healthy",
        ok: res.status < 500,
        detail: `OPTIONS → ${res.status}`,
      });
    } catch (err: any) {
      results.push({ label: "Edge Function log-email-consent healthy", ok: false, detail: err.message });
    }

    // 6. Required templates active
    const { data: tplData } = await supabase
      .from("email_templates")
      .select("template_key")
      .in("template_key", REQUIRED_TEMPLATES)
      .eq("is_active", true);

    const activeKeys = new Set((tplData || []).map((t) => t.template_key));
    REQUIRED_TEMPLATES.forEach((key) => {
      results.push({
        label: `Template active: ${key}`,
        ok: activeKeys.has(key),
        detail: activeKeys.has(key) ? "Active" : "Missing or inactive",
      });
    });

    setChecks(results);
    setPreflightLoading(false);
  }, []);

  // ═══════════════════════════════════════════
  // Section 2: Webhook Endpoint Status
  // ═══════════════════════════════════════════
  const loadEndpoints = useCallback(async () => {
    setEndpointsLoading(true);
    const result: WebhookEndpoint[] = [];

    for (const evt of STRIPE_EVENTS) {
      const { data } = await supabase
        .from("webhook_logs")
        .select("created_at, status")
        .eq("event_type", evt.event)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      result.push({
        event: evt.event,
        path: evt.path,
        lastFired: data?.created_at || null,
        lastStatus: data?.status || null,
      });
    }

    setEndpoints(result);
    setEndpointsLoading(false);
  }, []);

  const fireTestEvent = async (index: number) => {
    const evt = STRIPE_EVENTS[index];
    setTestFiring(index);

    try {
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/stripe-webhook`;
      const syntheticPayload = {
        id: `evt_test_wf9_${Date.now()}`,
        type: evt.stripeType,
        data: {
          object: {
            id: `test_${Date.now()}`,
            amount: 29900,
            currency: "cad",
            customer_email: "wf9-test@example.com",
            metadata: { order_id: "test-order-wf9" },
          },
        },
        livemode: false,
        created: Math.floor(Date.now() / 1000),
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syntheticPayload),
      });
      const text = await res.text();
      let json: any;
      try { json = JSON.parse(text); } catch { json = text; }

      if (res.ok) {
        toast({ title: `✅ ${evt.event} sent (${res.status})`, description: String(JSON.stringify(json)).slice(0, 200) });
      } else {
        toast({ title: `⚠️ ${evt.event} response (${res.status})`, description: String(JSON.stringify(json)).slice(0, 200), variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Network error", description: err.message, variant: "destructive" });
    }

    setTestFiring(null);
    setTimeout(() => { loadEndpoints(); loadActivity(); }, 3000);
  };

  // ═══════════════════════════════════════════
  // Section 3: Consent Log Monitor
  // ═══════════════════════════════════════════
  const loadConsent = useCallback(async () => {
    setConsentLoading(true);
    const [{ data, count }] = await Promise.all([
      supabase
        .from("email_consent_log")
        .select("id, email, consent_type, consent_category, granted, created_at", { count: "exact" })
        .eq("source", "stripe_checkout")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setConsentRows((data || []) as ConsentRow[]);
    setConsentCount(count || 0);
    setConsentLoading(false);
  }, []);

  const insertTestConsent = async () => {
    setInsertingConsent(true);
    try {
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/log-email-consent`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-secret": "fitmatch-n8n-secret-2026",
        },
        body: JSON.stringify({
          email: "wf9-test@example.com",
          consent_type: "implied_purchase",
          consent_category: "transactional",
          granted: true,
          consent_text: "Implied consent via completed purchase (WF-9 test)",
          source: "stripe_checkout",
        }),
      });
      const json = await res.json();
      if (res.ok) {
        toast({ title: "✅ Test consent inserted", description: `ID: ${json.data?.[0]?.id || "OK"}` });
      } else {
        toast({ title: "❌ Insert failed", description: json.error || JSON.stringify(json), variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Network error", description: err.message, variant: "destructive" });
    }
    setInsertingConsent(false);
    setTimeout(() => loadConsent(), 2000);
  };

  // ═══════════════════════════════════════════
  // Section 4: Recent Stripe Activity
  // ═══════════════════════════════════════════
  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    const { data } = await supabase
      .from("webhook_logs")
      .select("id, event_type, direction, status, webhook_url, response_status, created_at, request_payload, response_body")
      .or("event_type.ilike.%stripe%,event_type.ilike.%payment%,event_type.ilike.%refund%")
      .order("created_at", { ascending: false })
      .limit(20);
    setActivityLogs((data || []) as WebhookLogRow[]);
    setActivityLoading(false);
  }, []);

  // ─── Initial load + polling ───
  useEffect(() => {
    runPreflight();
    loadEndpoints();
    loadConsent();
    loadActivity();

    const interval = setInterval(() => {
      loadEndpoints();
      loadConsent();
      loadActivity();
    }, 30000);

    return () => clearInterval(interval);
  }, [runPreflight, loadEndpoints, loadConsent, loadActivity]);

  const formatTs = (ts: string | null) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "medium" });
  };

  const truncateUrl = (url: string, max = 50) => (url.length > max ? url.slice(0, max) + "…" : url);

  return (
    <div className="space-y-6">
      {/* ━━━ SECTION 1: PRE-FLIGHT CHECKLIST ━━━ */}
      <Collapsible open={s1Open} onOpenChange={setS1Open}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start text-lg font-serif font-bold gap-2 px-0">
            {s1Open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            Section 1: Pre-Flight Checklist
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="border-2" onClick={runPreflight} disabled={preflightLoading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${preflightLoading ? "animate-spin" : ""}`} /> Re-check all
            </Button>
          </div>
          <Card className={neoCard}>
            <CardContent className="pt-4">
              {preflightLoading && checks.length === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Running checks…</div>
              ) : (
                <div className="space-y-2">
                  {checks.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      {c.ok ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                      )}
                      <span className="font-mono">{c.label}</span>
                      {c.detail && <span className="text-xs text-muted-foreground ml-auto">{c.detail}</span>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* ━━━ SECTION 2: WEBHOOK ENDPOINT STATUS ━━━ */}
      <Collapsible open={s2Open} onOpenChange={setS2Open}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start text-lg font-serif font-bold gap-2 px-0">
            {s2Open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            Section 2: Webhook Endpoint Status
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <Card className={neoCard}>
            <CardContent className="pt-4">
              {endpointsLoading && endpoints.length === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>n8n Path</TableHead>
                      <TableHead>Last Fired</TableHead>
                      <TableHead>Last Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {endpoints.map((ep, i) => (
                      <TableRow key={ep.event}>
                        <TableCell className="font-mono text-xs">{ep.event}</TableCell>
                        <TableCell className="font-mono text-xs">{ep.path}</TableCell>
                        <TableCell className="text-xs">{formatTs(ep.lastFired)}</TableCell>
                        <TableCell>
                          {ep.lastStatus ? (
                            <Badge variant={ep.lastStatus === "delivered" ? "default" : "destructive"} className="text-xs">
                              {ep.lastStatus}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-2 text-xs"
                            onClick={() => fireTestEvent(i)}
                            disabled={testFiring !== null}
                          >
                            {testFiring === i ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                            Send Test
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* ━━━ SECTION 3: CONSENT LOG MONITOR ━━━ */}
      <Collapsible open={s3Open} onOpenChange={setS3Open}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start text-lg font-serif font-bold gap-2 px-0">
            {s3Open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            Section 3: Consent Log Monitor
            <Badge variant="outline" className="border-2 ml-2 text-xs">{consentCount}</Badge>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground font-mono">source = 'stripe_checkout'</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-2" onClick={loadConsent} disabled={consentLoading}>
                <RefreshCw className={`w-4 h-4 mr-1 ${consentLoading ? "animate-spin" : ""}`} /> Refresh
              </Button>
              <Button variant="outline" size="sm" className="border-2" onClick={insertTestConsent} disabled={insertingConsent}>
                {insertingConsent ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                Insert Test Consent
              </Button>
            </div>
          </div>
          <Card className={neoCard}>
            <CardContent className="pt-4">
              {consentRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No consent rows for source = 'stripe_checkout' yet.</p>
              ) : (
                <div className="max-h-60 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Granted</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consentRows.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-xs">{r.email}</TableCell>
                          <TableCell className="text-xs">{r.consent_type}</TableCell>
                          <TableCell className="text-xs">{r.consent_category}</TableCell>
                          <TableCell>
                            {r.granted ? (
                              <Badge className="bg-green-600 text-xs">Yes</Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">No</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">{formatTs(r.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* ━━━ SECTION 4: RECENT STRIPE ACTIVITY ━━━ */}
      <Collapsible open={s4Open} onOpenChange={setS4Open}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start text-lg font-serif font-bold gap-2 px-0">
            {s4Open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            Section 4: Recent Stripe Activity
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="border-2" onClick={loadActivity} disabled={activityLoading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${activityLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
          <Card className={neoCard}>
            <CardContent className="pt-4">
              {activityLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No Stripe-related webhook logs yet.</p>
              ) : (
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Dir</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>HTTP</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Inspect</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityLogs.map((log) => (
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
                              <TableCell colSpan={7} className="bg-muted/30 p-4">
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default EmailWF9StripeTab;
