import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, ChevronDown, ChevronRight, Search, Play, ClipboardList, Loader2 } from "lucide-react";

// ─── Neobrutalism card style ───
const neoCard = "border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]";

// ─── Types ───
interface TemplateRow {
  template_key: string;
  category: string;
  casl_category: string | null;
  is_active: boolean | null;
  requires_consent: boolean | null;
  locale: string | null;
}
interface StatusCount { status: string; count: number }
interface ConsentTypeCount { consent_type: string; count: number }
interface SettingRow { key: string; value: string }

const EmailWF8TestTab = () => {
  const { toast } = useToast();

  // ─── Section 1 state ───
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [commTotal, setCommTotal] = useState(0);
  const [commByStatus, setCommByStatus] = useState<StatusCount[]>([]);
  const [consentTotal, setConsentTotal] = useState(0);
  const [consentByType, setConsentByType] = useState<ConsentTypeCount[]>([]);
  const [emailSettings, setEmailSettings] = useState<SettingRow[]>([]);
  const [diagLoading, setDiagLoading] = useState(true);

  // ─── Section 2 state ───
  const [fetchKey, setFetchKey] = useState("account_welcome");
  const [fetchLocale, setFetchLocale] = useState("en-CA");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchResult, setFetchResult] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchDiag, setFetchDiag] = useState<any[] | null>(null);

  // ─── Section 3 state ───
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState("admin@fitmatch.ca");
  const [testLoading, setTestLoading] = useState<number | null>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [latestLogs, setLatestLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // ─── Collapsible state ───
  const [s1Open, setS1Open] = useState(true);
  const [s2Open, setS2Open] = useState(true);
  const [s3Open, setS3Open] = useState(true);

  // ─── Section 1: Diagnostics ───
  const runDiagnostics = useCallback(async () => {
    setDiagLoading(true);
    const [tplRes, commCountRes, commStatusRes, consentCountRes, consentTypeRes, settingsRes] = await Promise.all([
      supabase.from("email_templates").select("template_key, category, casl_category, is_active, requires_consent, locale").order("category").order("template_key"),
      supabase.from("communication_logs").select("*", { count: "exact", head: true }),
      supabase.rpc("is_admin").then(() => supabase.from("communication_logs").select("status")),
      supabase.from("email_consent_log").select("*", { count: "exact", head: true }),
      supabase.from("email_consent_log").select("consent_type"),
      supabase.from("site_settings").select("key, value").like("key", "email_%").order("key"),
    ]);

    setTemplates((tplRes.data || []) as TemplateRow[]);
    setCommTotal(commCountRes.count || 0);

    // Group statuses manually
    const statusMap: Record<string, number> = {};
    (commStatusRes.data || []).forEach((r: any) => { statusMap[r.status] = (statusMap[r.status] || 0) + 1; });
    setCommByStatus(Object.entries(statusMap).map(([status, count]) => ({ status, count })));

    setConsentTotal(consentCountRes.count || 0);
    const ctMap: Record<string, number> = {};
    (consentTypeRes.data || []).forEach((r: any) => { ctMap[r.consent_type] = (ctMap[r.consent_type] || 0) + 1; });
    setConsentByType(Object.entries(ctMap).map(([consent_type, count]) => ({ consent_type, count })));

    setEmailSettings((settingsRes.data || []) as SettingRow[]);
    setDiagLoading(false);
  }, []);

  // ─── Load webhook URL + admin email ───
  const loadMeta = useCallback(async () => {
    const [intRes, adminRes] = await Promise.all([
      supabase.from("integrations").select("config, webhook_url").eq("service_name", "n8n").maybeSingle(),
      supabase.from("admin_emails").select("email").limit(1).maybeSingle(),
    ]);
    const cfg = intRes.data?.config as any;
    const base = cfg?.webhook_base_url || cfg?.base_url || intRes.data?.webhook_url || "";
    setWebhookUrl(base ? base.replace(/\/+$/, "") + "/webhook/email-send" : null);
    setAdminEmail(adminRes.data?.email || "admin@fitmatch.ca");
  }, []);

  useEffect(() => { runDiagnostics(); loadMeta(); }, [runDiagnostics, loadMeta]);

  // ─── Section 2: Fetch Template ───
  const handleFetchTemplate = async () => {
    setFetchLoading(true);
    setFetchResult(null);
    setFetchError(null);
    setFetchDiag(null);

    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_key", fetchKey)
      .eq("is_active", true)
      .eq("locale", fetchLocale)
      .limit(1)
      .maybeSingle();

    if (error) {
      setFetchError(error.message);
    } else if (data) {
      setFetchResult(data);
    } else {
      setFetchError(`No template found for template_key="${fetchKey}", is_active=true, locale="${fetchLocale}"`);
      // Diagnostic: check if key exists at all
      const { data: diagData } = await supabase
        .from("email_templates")
        .select("template_key, is_active, locale")
        .eq("template_key", fetchKey);
      setFetchDiag(diagData || []);
    }
    setFetchLoading(false);
  };

  // ─── Section 3: WF-8 Branch Testers ───
  const testPayloads = [
    {
      label: "▶ Test Happy Path",
      body: {
        template_key: "account_welcome",
        to_email: adminEmail,
        to_name: "WF8 Test",
        user_id: null,
        user_type: "client",
        variables: { customer_name: "WF8 Test User", login_url: "https://fitmatch.ca/login", browse_url: "https://fitmatch.ca/browse", how_it_works_url: "https://fitmatch.ca/how-it-works" },
        related_entity_type: null,
        related_entity_id: null,
        locale: "en-CA",
        test_mode: false,
      },
    },
    {
      label: "▶ Test Template Not Found",
      body: {
        template_key: "nonexistent_template_xyz_9999",
        to_email: adminEmail,
        to_name: "WF8 Test",
        user_id: null,
        user_type: "client",
        variables: { customer_name: "WF8 Test User", login_url: "https://fitmatch.ca/login", browse_url: "https://fitmatch.ca/browse", how_it_works_url: "https://fitmatch.ca/how-it-works" },
        related_entity_type: null,
        related_entity_id: null,
        locale: "en-CA",
        test_mode: false,
      },
    },
    {
      label: "▶ Test No Consent (Blocked)",
      body: {
        template_key: "review_request",
        to_email: "noconsent-test-wf8@example.com",
        to_name: "No Consent Test",
        user_id: null,
        user_type: "client",
        variables: { customer_name: "No Consent Test", product_name: "Italian Marble Cabinet", product_image_url: "https://fitmatch.ca/placeholder.jpg", review_url: "https://fitmatch.ca/review/test", unsubscribe_url: "https://fitmatch.ca/unsubscribe" },
        related_entity_type: "order",
        related_entity_id: null,
        locale: "en-CA",
        test_mode: false,
      },
    },
    {
      label: "▶ Test Consent Bypass (testmode)",
      body: {
        template_key: "review_request",
        to_email: "noconsent-test-wf8@example.com",
        to_name: "No Consent Test",
        user_id: null,
        user_type: "client",
        variables: { customer_name: "No Consent Test", product_name: "Italian Marble Cabinet", product_image_url: "https://fitmatch.ca/placeholder.jpg", review_url: "https://fitmatch.ca/review/test", unsubscribe_url: "https://fitmatch.ca/unsubscribe" },
        related_entity_type: "order",
        related_entity_id: null,
        locale: "en-CA",
        test_mode: true,
      },
    },
    {
      label: "▶ Test Marketing Pause",
      body: {
        template_key: "newsletter",
        to_email: adminEmail,
        to_name: "Pause Test",
        user_id: null,
        user_type: "client",
        variables: { customer_name: "Pause Test User", newsletter_subject: "WF8 Test Newsletter", newsletter_body: "<p>This is a test newsletter body.</p>", unsubscribe_url: "https://fitmatch.ca/unsubscribe" },
        related_entity_type: null,
        related_entity_id: null,
        locale: "en-CA",
        test_mode: true,
      },
    },
  ];

  const fireTest = async (index: number) => {
    if (!webhookUrl) {
      toast({ title: "No webhook URL", description: "Configure n8n integration first.", variant: "destructive" });
      return;
    }
    setTestLoading(index);
    // Update admin email in payload dynamically
    const payload = { ...testPayloads[index].body };
    if (payload.to_email === adminEmail) {
      // already correct
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let json: any;
      try { json = JSON.parse(text); } catch { json = text; }
      setLastResponse({ status: res.status, body: json });
      if (res.ok) {
        toast({ title: `✅ WF-8 responded (${res.status})`, description: typeof json === "string" ? json : JSON.stringify(json).slice(0, 200) });
      } else {
        toast({ title: `❌ WF-8 error (${res.status})`, description: typeof json === "string" ? json : JSON.stringify(json).slice(0, 200), variant: "destructive" });
      }
    } catch (err: any) {
      // Try no-cors fallback
      try {
        await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), mode: "no-cors" });
        setLastResponse({ status: "opaque (no-cors)", body: "Request sent but response hidden due to CORS." });
        toast({ title: "Request sent (no-cors)", description: "CORS blocked the response. Check n8n execution history." });
      } catch (e2: any) {
        setLastResponse({ error: e2.message });
        toast({ title: "Network error", description: e2.message, variant: "destructive" });
      }
    }
    setTestLoading(null);
    // Auto-refresh logs after 3s
    setTimeout(() => fetchLatestLogs(), 3000);
  };

  const fetchLatestLogs = async () => {
    setLogsLoading(true);
    const { data } = await supabase
      .from("communication_logs")
      .select("id, created_at, template_key, to_address, status, error_message")
      .order("created_at", { ascending: false })
      .limit(10);
    setLatestLogs(data || []);
    setLogsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* ━━━ SECTION 1: DATABASE DIAGNOSTIC ━━━ */}
      <Collapsible open={s1Open} onOpenChange={setS1Open}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start text-lg font-serif font-bold gap-2 px-0">
            {s1Open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            Section 1: Database Diagnostic
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="border-2" onClick={runDiagnostics} disabled={diagLoading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${diagLoading ? "animate-spin" : ""}`} /> Refresh Diagnostics
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Card 1: email_templates */}
            <Card className={neoCard}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono">email_templates — {templates.length} rows</CardTitle>
              </CardHeader>
              <CardContent>
                {templates.length === 0 && !diagLoading ? (
                  <Alert variant="destructive"><AlertTitle>⚠️ No templates found</AlertTitle><AlertDescription>The seed data from Prompt E1 may not have been inserted. Re-run Prompt E1 or manually insert templates.</AlertDescription></Alert>
                ) : (
                  <div className="max-h-60 overflow-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>template_key</TableHead><TableHead>category</TableHead><TableHead>casl</TableHead><TableHead>active</TableHead><TableHead>consent</TableHead><TableHead>locale</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {templates.map((t, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">{t.template_key}</TableCell>
                            <TableCell><Badge variant="secondary" className="text-xs">{t.category}</Badge></TableCell>
                            <TableCell className="text-xs">{t.casl_category}</TableCell>
                            <TableCell>{t.is_active ? <Badge className="bg-green-600 text-xs">Yes</Badge> : <Badge variant="destructive" className="text-xs">No</Badge>}</TableCell>
                            <TableCell>{t.requires_consent ? <Badge className="bg-yellow-600 text-xs">Yes</Badge> : <Badge className="bg-green-600 text-xs">No</Badge>}</TableCell>
                            <TableCell className="text-xs">{t.locale}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 2: communication_logs */}
            <Card className={neoCard}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono">communication_logs — {commTotal} rows</CardTitle>
              </CardHeader>
              <CardContent>
                {commByStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No logs yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {commByStatus.map((s) => (
                      <Badge key={s.status} variant="outline" className="border-2 text-xs">{s.status}: {s.count}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 3: email_consent_log */}
            <Card className={neoCard}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono">email_consent_log — {consentTotal} rows</CardTitle>
              </CardHeader>
              <CardContent>
                {consentByType.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No consent logs yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {consentByType.map((c) => (
                      <Badge key={c.consent_type} variant="outline" className="border-2 text-xs">{c.consent_type}: {c.count}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 4: site_settings (email keys) */}
            <Card className={neoCard}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono">site_settings (email_*) — {emailSettings.length} rows</CardTitle>
              </CardHeader>
              <CardContent>
                {emailSettings.length === 0 && !diagLoading ? (
                  <Alert variant="destructive"><AlertTitle>⚠️ No email settings found</AlertTitle><AlertDescription>The seed from Prompt E3 may not have run. Check that site_settings has email_pause_marketing, email_pause_lifecycle, etc.</AlertDescription></Alert>
                ) : (
                  <div className="max-h-40 overflow-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>key</TableHead><TableHead>value</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {emailSettings.map((s, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">{s.key}</TableCell>
                            <TableCell className="text-xs">{s.value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ━━━ SECTION 2: TEMPLATE FETCH TESTER ━━━ */}
      <Collapsible open={s2Open} onOpenChange={setS2Open}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start text-lg font-serif font-bold gap-2 px-0">
            {s2Open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            Section 2: Template Fetch Tester
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <Card className={neoCard}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-xs font-mono">template_key</Label>
                  <Input value={fetchKey} onChange={(e) => setFetchKey(e.target.value)} className="border-2 font-mono" />
                </div>
                <div className="w-32">
                  <Label className="text-xs font-mono">locale</Label>
                  <Input value={fetchLocale} onChange={(e) => setFetchLocale(e.target.value)} className="border-2 font-mono" />
                </div>
                <Button onClick={handleFetchTemplate} disabled={fetchLoading} className="border-2">
                  {fetchLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Search className="w-4 h-4 mr-1" />}
                  Fetch
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Fetch results */}
          {fetchResult && (
            <Card className={neoCard}>
              <CardContent className="pt-6 space-y-4">
                <Alert className="border-green-600 bg-green-50 dark:bg-green-950">
                  <AlertTitle className="text-green-700 dark:text-green-400">✅ Template found: {fetchResult.display_name}</AlertTitle>
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="font-mono text-muted-foreground">id:</span> <code className="text-xs select-all">{fetchResult.id}</code></div>
                  <div><span className="font-mono text-muted-foreground">template_key:</span> {fetchResult.template_key}</div>
                  <div><span className="font-mono text-muted-foreground">display_name:</span> {fetchResult.display_name}</div>
                  <div><span className="font-mono text-muted-foreground">category:</span> <Badge variant="secondary">{fetchResult.category}</Badge></div>
                  <div><span className="font-mono text-muted-foreground">casl_category:</span> {fetchResult.casl_category}</div>
                  <div><span className="font-mono text-muted-foreground">requires_consent:</span> {fetchResult.requires_consent ? <Badge className="bg-yellow-600">Yes</Badge> : <Badge className="bg-green-600">No</Badge>}</div>
                  <div><span className="font-mono text-muted-foreground">from_email:</span> {fetchResult.from_email}</div>
                  <div><span className="font-mono text-muted-foreground">from_name:</span> {fetchResult.from_name}</div>
                  <div><span className="font-mono text-muted-foreground">reply_to:</span> {fetchResult.reply_to}</div>
                  <div><span className="font-mono text-muted-foreground">locale:</span> {fetchResult.locale}</div>
                </div>
                <div>
                  <Label className="font-mono text-xs text-muted-foreground">subject</Label>
                  <p className="text-sm border-2 border-border rounded p-2">{fetchResult.subject}</p>
                </div>
                <div>
                  <Label className="font-mono text-xs text-muted-foreground">html_body</Label>
                  <iframe
                    srcDoc={fetchResult.html_body}
                    className="w-full max-h-[300px] border-2 border-border rounded"
                    style={{ height: 300 }}
                    sandbox=""
                    title="HTML Preview"
                  />
                </div>
                {fetchResult.plain_text_body && (
                  <div>
                    <Label className="font-mono text-xs text-muted-foreground">plain_text_body</Label>
                    <pre className="text-xs bg-muted p-3 rounded max-h-40 overflow-auto whitespace-pre-wrap">{fetchResult.plain_text_body}</pre>
                  </div>
                )}
                <div>
                  <Label className="font-mono text-xs text-muted-foreground">variables_schema</Label>
                  <pre className="text-xs bg-muted p-3 rounded max-h-40 overflow-auto">{JSON.stringify(fetchResult.variables_schema, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>
          )}

          {fetchError && (
            <Card className={neoCard}>
              <CardContent className="pt-6 space-y-4">
                <Alert variant="destructive">
                  <AlertTitle>❌ {fetchError}</AlertTitle>
                </Alert>
                {fetchDiag && fetchDiag.length > 0 ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Found {fetchDiag.length} row(s) matching template_key="{fetchKey}" (may be inactive or wrong locale):</p>
                    <Table>
                      <TableHeader><TableRow><TableHead>template_key</TableHead><TableHead>is_active</TableHead><TableHead>locale</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {fetchDiag.map((r: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">{r.template_key}</TableCell>
                            <TableCell>{r.is_active ? "true" : "false"}</TableCell>
                            <TableCell>{r.locale}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : fetchDiag !== null ? (
                  <p className="text-sm text-muted-foreground">This template_key does not exist in the database at all.</p>
                ) : null}
              </CardContent>
            </Card>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* ━━━ SECTION 3: WF-8 BRANCH TESTERS ━━━ */}
      <Collapsible open={s3Open} onOpenChange={setS3Open}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start text-lg font-serif font-bold gap-2 px-0">
            {s3Open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            Section 3: WF-8 Branch Testers
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          {!webhookUrl && (
            <Alert className="border-yellow-600 bg-yellow-50 dark:bg-yellow-950">
              <AlertTitle className="text-yellow-700 dark:text-yellow-400">⚠️ n8n webhook URL not found</AlertTitle>
              <AlertDescription>Configure it in Integrations → n8n first.</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-2">
            {testPayloads.map((tp, i) => (
              <Button
                key={i}
                variant="outline"
                className="border-2"
                disabled={testLoading !== null || !webhookUrl}
                onClick={() => fireTest(i)}
              >
                {testLoading === i ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {tp.label}
              </Button>
            ))}
          </div>

          {/* Last Response */}
          {lastResponse && (
            <Card className={neoCard}>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-mono">Last Response</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded max-h-60 overflow-auto whitespace-pre-wrap">{JSON.stringify(lastResponse, null, 2)}</pre>
              </CardContent>
            </Card>
          )}

          {/* Quick Log Check */}
          <div className="pt-4 space-y-3">
            <Button variant="outline" className="border-2" onClick={fetchLatestLogs} disabled={logsLoading}>
              {logsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ClipboardList className="w-4 h-4 mr-1" />}
              📋 Check Latest Logs
            </Button>

            {latestLogs.length > 0 && (
              <Card className={neoCard}>
                <CardContent className="pt-4">
                  <div className="overflow-auto max-h-60">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>created_at</TableHead>
                          <TableHead>template_key</TableHead>
                          <TableHead>to_address</TableHead>
                          <TableHead>status</TableHead>
                          <TableHead>error_message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {latestLogs.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs font-mono">{new Date(log.created_at).toLocaleString()}</TableCell>
                            <TableCell className="text-xs font-mono">{log.template_key || "—"}</TableCell>
                            <TableCell className="text-xs">{log.to_address}</TableCell>
                            <TableCell>
                              <Badge variant={log.status === "sent" || log.status === "delivered" ? "default" : "destructive"} className="text-xs">
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-destructive">{log.error_message || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default EmailWF8TestTab;
