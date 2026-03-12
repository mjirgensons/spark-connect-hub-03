import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, ChevronDown, ChevronRight, ChevronLeft, Search, Play, ClipboardList, Loader2, Send, CheckCircle, AlertTriangle, Radio } from "lucide-react";
import SortableTableHead, { useTableSort } from "./SortableTableHead";
import { format, formatDistanceToNow } from "date-fns";

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

interface OutboundLog {
  id: string;
  user_email: string;
  to_address: string;
  subject: string;
  status: string | null;
  mailgun_message_id: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
  template_key: string | null;
}

const WF10_PAGE_SIZE = 10;

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

  // ─── Section 4: WF-10 state ───
  const [wf10OutboundLogs, setWf10OutboundLogs] = useState<OutboundLog[]>([]);
  const [wf10OutboundLoading, setWf10OutboundLoading] = useState(true);
  const [wf10OutboundPage, setWf10OutboundPage] = useState(0);
  const [wf10OutboundTotal, setWf10OutboundTotal] = useState(0);
  const [wf10SelectedLog, setWf10SelectedLog] = useState<OutboundLog | null>(null);
  const [wf10FromEmail, setWf10FromEmail] = useState("");
  const [wf10ReplyBody, setWf10ReplyBody] = useState("WF‑10 test reply from admin panel.");
  const [wf10Sending, setWf10Sending] = useState(false);
  const [wf10Status, setWf10Status] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [wf10DebugPayload, setWf10DebugPayload] = useState<any>(null);
  const wf10Sort = useTableSort<OutboundLog>("created_at", "desc");

  // ─── Collapsible state ───
  const [s1Open, setS1Open] = useState(true);
  const [s2Open, setS2Open] = useState(true);
  const [s3Open, setS3Open] = useState(true);
  const [s4Open, setS4Open] = useState(true);

  const formatDate = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 86400000) return formatDistanceToNow(new Date(d), { addSuffix: true });
    return format(new Date(d), "MMM d, yyyy HH:mm");
  };

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

  // ─── Section 4: Load outbound logs with mailgun_message_id ───
  const fetchWf10OutboundLogs = useCallback(async () => {
    setWf10OutboundLoading(true);
    const { data, count } = await supabase
      .from("communication_logs")
      .select("id, user_email, to_address, subject, status, mailgun_message_id, related_entity_type, related_entity_id, created_at, template_key", { count: "exact" })
      .eq("direction", "outbound")
      .not("mailgun_message_id", "is", null)
      .order("created_at", { ascending: false })
      .range(wf10OutboundPage * WF10_PAGE_SIZE, (wf10OutboundPage + 1) * WF10_PAGE_SIZE - 1);
    setWf10OutboundLogs((data || []) as OutboundLog[]);
    setWf10OutboundTotal(count || 0);
    setWf10OutboundLoading(false);
  }, [wf10OutboundPage]);

  useEffect(() => { runDiagnostics(); loadMeta(); }, [runDiagnostics, loadMeta]);
  useEffect(() => { fetchWf10OutboundLogs(); }, [fetchWf10OutboundLogs]);

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
    const payload = { ...testPayloads[index].body };

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
    setTimeout(() => { fetchLatestLogs(); fetchWf10OutboundLogs(); }, 3000);
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

  // ─── Section 4: WF-10 handlers ───
  const handleWf10SelectLog = (log: OutboundLog) => {
    setWf10SelectedLog(log);
    setWf10FromEmail(log.to_address || log.user_email);
    setWf10Status(null);
    setWf10DebugPayload(null);
  };

  const handleWf10SimulateReply = async () => {
    if (!wf10SelectedLog) return;
    setWf10Sending(true);
    setWf10Status(null);
    setWf10DebugPayload(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/simulate-inbound-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token || ""}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            communication_log_id: wf10SelectedLog.id,
            from_email: wf10FromEmail,
            reply_body: wf10ReplyBody,
          }),
        }
      );
      const result = await resp.json();
      console.log("[WF-10 Section 4] Response:", result);
      setWf10DebugPayload(result);

      if (result.success) {
        console.log("[WF-10] payload_sent_to_wf10:", result.payload_sent_to_wf10);
        console.log("[WF-10] outbound_log:", result.outbound_log);
        setWf10Status({ type: "success", message: "WF‑10 test sent. A new inbound row should appear in Communication Log." });
        toast({ title: "✅ Simulated reply sent to WF‑10" });
      } else {
        const errMsg = `[${result.stage || "unknown"}] ${result.error || "Unknown error"}`;
        console.error("[WF-10 Section 4] Error:", result);
        setWf10Status({ type: "error", message: errMsg });
      }
    } catch (err: any) {
      console.error("[WF-10 Section 4] Network error:", err);
      setWf10Status({ type: "error", message: err.message || "Network error" });
    } finally {
      setWf10Sending(false);
    }
  };

  const wf10OutboundPages = Math.ceil(wf10OutboundTotal / WF10_PAGE_SIZE);

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

          {lastResponse && (
            <Card className={neoCard}>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-mono">Last Response</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded max-h-60 overflow-auto whitespace-pre-wrap">{JSON.stringify(lastResponse, null, 2)}</pre>
              </CardContent>
            </Card>
          )}

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

      {/* ━━━ SECTION 4: WF-10 INBOUND REPLY TEST ━━━ */}
      <Collapsible open={s4Open} onOpenChange={setS4Open}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start text-lg font-serif font-bold gap-2 px-0">
            {s4Open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            Section 4: WF-10 Inbound Reply Test
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">

          {/* ── 4.1 Select Outbound Email ── */}
          <Card className={neoCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono">4.1 Select outbound email</CardTitle>
              <p className="text-xs text-muted-foreground">Choose the outbound log WF‑10 should treat as the parent message. Only rows with a Mailgun message ID are shown.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-10"></TableHead>
                      <SortableTableHead label="Date" sortKey="created_at" currentSort={wf10Sort.sortKey} currentDirection={wf10Sort.sortDirection} onSort={wf10Sort.handleSort} className="text-xs" />
                      <SortableTableHead label="To" sortKey="to_address" currentSort={wf10Sort.sortKey} currentDirection={wf10Sort.sortDirection} onSort={wf10Sort.handleSort} className="text-xs" />
                      <SortableTableHead label="Subject" sortKey="subject" currentSort={wf10Sort.sortKey} currentDirection={wf10Sort.sortDirection} onSort={wf10Sort.handleSort} className="text-xs" />
                      <SortableTableHead label="Status" sortKey="status" currentSort={wf10Sort.sortKey} currentDirection={wf10Sort.sortDirection} onSort={wf10Sort.handleSort} className="text-xs" />
                      <TableHead className="text-xs">Mailgun ID</TableHead>
                      <SortableTableHead label="Entity" sortKey="related_entity_type" currentSort={wf10Sort.sortKey} currentDirection={wf10Sort.sortDirection} onSort={wf10Sort.handleSort} className="text-xs" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wf10OutboundLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : wf10OutboundLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No outbound logs with Mailgun ID found. Send a WF‑8 test email first (Section 3).
                        </TableCell>
                      </TableRow>
                    ) : wf10OutboundLogs.map((log) => (
                      <TableRow
                        key={log.id}
                        className={`cursor-pointer ${wf10SelectedLog?.id === log.id ? "bg-accent" : ""}`}
                        onClick={() => handleWf10SelectLog(log)}
                      >
                        <TableCell>
                          <Radio className={`w-4 h-4 ${wf10SelectedLog?.id === log.id ? "text-foreground" : "text-muted-foreground/40"}`} />
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{formatDate(log.created_at)}</TableCell>
                        <TableCell className="text-xs max-w-[160px] truncate">{log.to_address || log.user_email}</TableCell>
                        <TableCell className="text-xs max-w-[180px] truncate">{log.subject}</TableCell>
                        <TableCell><Badge variant="outline" className="border-2 text-xs">{log.status || "queued"}</Badge></TableCell>
                        <TableCell className="text-xs font-mono max-w-[160px] truncate">{log.mailgun_message_id}</TableCell>
                        <TableCell>
                          {log.related_entity_type ? (
                            <Badge variant="outline" className="border-2 text-xs capitalize">{log.related_entity_type}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {wf10OutboundPages > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Page {wf10OutboundPage + 1} of {wf10OutboundPages} ({wf10OutboundTotal} rows)
                  </span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="border-2" disabled={wf10OutboundPage === 0} onClick={() => setWf10OutboundPage(p => p - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="border-2" disabled={wf10OutboundPage >= wf10OutboundPages - 1} onClick={() => setWf10OutboundPage(p => p + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {wf10SelectedLog && (
                <div className="border-2 border-foreground p-3 space-y-1 text-sm bg-accent/50">
                  <p className="font-medium text-xs uppercase tracking-wide flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Selected Email
                  </p>
                  <p className="font-mono text-xs">
                    Selected log: <span className="select-all">{wf10SelectedLog.id}</span> – {wf10SelectedLog.subject} → {wf10SelectedLog.to_address || wf10SelectedLog.user_email} (mailgun id: <span className="select-all">{wf10SelectedLog.mailgun_message_id}</span>)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 4.2 Compose Simulated Reply ── */}
          <Card className={neoCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono">4.2 Compose simulated reply</CardTitle>
              <p className="text-xs text-muted-foreground">Simulate a customer replying to the selected outbound email. Sends a Mailgun-style payload to WF‑10 via the simulate-inbound-email Edge Function.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div>
                  <Label htmlFor="wf10-from-email" className="text-xs font-mono">From email</Label>
                  <Input
                    id="wf10-from-email"
                    value={wf10FromEmail}
                    onChange={(e) => setWf10FromEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="border-2"
                    disabled={!wf10SelectedLog}
                  />
                </div>
                <div>
                  <Label htmlFor="wf10-reply-body" className="text-xs font-mono">Reply body</Label>
                  <Textarea
                    id="wf10-reply-body"
                    value={wf10ReplyBody}
                    onChange={(e) => setWf10ReplyBody(e.target.value)}
                    rows={3}
                    className="border-2"
                    disabled={!wf10SelectedLog}
                  />
                </div>
              </div>

              <Button
                onClick={handleWf10SimulateReply}
                disabled={!wf10SelectedLog || wf10Sending}
                className="border-2"
              >
                {wf10Sending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending to WF‑10…</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Send to WF‑10</>
                )}
              </Button>

              {!wf10SelectedLog && (
                <p className="text-sm text-muted-foreground">↑ Select an outbound email in 4.1 first.</p>
              )}
            </CardContent>
          </Card>

          {/* ── 4.3 Result & Debug ── */}
          <Card className={neoCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono">4.3 Result & debug</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status line */}
              {wf10Sending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending to WF‑10…
                </div>
              )}

              {wf10Status && (
                <div className={`border-2 p-3 text-sm ${wf10Status.type === "success" ? "border-green-600 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "border-destructive bg-destructive/10 text-destructive"}`}>
                  {wf10Status.type === "success" ? (
                    <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {wf10Status.message}</span>
                  ) : (
                    <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {wf10Status.message}</span>
                  )}
                </div>
              )}

              {/* Debug payload */}
              {wf10DebugPayload ? (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs font-mono gap-1 px-0 text-muted-foreground">
                      <ChevronRight className="w-3 h-3" /> Response JSON
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre className="text-xs bg-muted p-3 rounded max-h-60 overflow-auto whitespace-pre-wrap mt-2">{JSON.stringify(wf10DebugPayload, null, 2)}</pre>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <p className="text-xs text-muted-foreground">No WF‑10 response yet. Run a test from 4.2 above.</p>
              )}
            </CardContent>
          </Card>

        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default EmailWF8TestTab;
