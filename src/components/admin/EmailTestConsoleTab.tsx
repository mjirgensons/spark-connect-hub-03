import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, Radio } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const neoCard = "border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]";

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

const PAGE_SIZE = 10;

const EmailTestConsoleTab = () => {
  const { toast } = useToast();

  // ── Section 1: WF-8 Test ──
  const [wf8Sending, setWf8Sending] = useState(false);
  const [lastWf8Log, setLastWf8Log] = useState<OutboundLog | null>(null);
  const [wf8Loading, setWf8Loading] = useState(true);

  // ── Section 2: Select outbound ──
  const [outboundLogs, setOutboundLogs] = useState<OutboundLog[]>([]);
  const [outboundLoading, setOutboundLoading] = useState(true);
  const [outboundPage, setOutboundPage] = useState(0);
  const [outboundTotal, setOutboundTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<OutboundLog | null>(null);

  // ── Section 3: WF-10 Simulate ──
  const [fromEmail, setFromEmail] = useState("");
  const [replyBody, setReplyBody] = useState("WF‑10 test reply from admin panel.");
  const [simulateSending, setSimulateSending] = useState(false);
  const [simulateStatus, setSimulateStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const formatDate = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 86400000) return formatDistanceToNow(new Date(d), { addSuffix: true });
    return format(new Date(d), "MMM d, yyyy HH:mm");
  };

  // ── Load last WF-8 test log ──
  const fetchLastWf8Log = useCallback(async () => {
    setWf8Loading(true);
    const { data } = await supabase
      .from("communication_logs")
      .select("id, user_email, to_address, subject, status, mailgun_message_id, related_entity_type, related_entity_id, created_at, template_key")
      .eq("direction", "outbound")
      .not("mailgun_message_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLastWf8Log(data as OutboundLog | null);
    setWf8Loading(false);
  }, []);

  // ── Load outbound logs with mailgun_message_id ──
  const fetchOutboundLogs = useCallback(async () => {
    setOutboundLoading(true);
    const { data, count } = await supabase
      .from("communication_logs")
      .select("id, user_email, to_address, subject, status, mailgun_message_id, related_entity_type, related_entity_id, created_at, template_key", { count: "exact" })
      .eq("direction", "outbound")
      .not("mailgun_message_id", "is", null)
      .order("created_at", { ascending: false })
      .range(outboundPage * PAGE_SIZE, (outboundPage + 1) * PAGE_SIZE - 1);
    setOutboundLogs((data || []) as OutboundLog[]);
    setOutboundTotal(count || 0);
    setOutboundLoading(false);
  }, [outboundPage]);

  useEffect(() => { fetchLastWf8Log(); }, [fetchLastWf8Log]);
  useEffect(() => { fetchOutboundLogs(); }, [fetchOutboundLogs]);

  // ── Section 1: Send WF-8 Test ──
  const handleSendWf8 = async () => {
    setWf8Sending(true);
    try {
      // Get n8n webhook URL
      const { data: intData } = await supabase
        .from("integrations")
        .select("config, webhook_url")
        .eq("service_name", "n8n")
        .maybeSingle();
      const cfg = intData?.config as any;
      const base = cfg?.webhook_base_url || cfg?.base_url || intData?.webhook_url || "";
      if (!base) {
        toast({ title: "No webhook URL", description: "Configure n8n integration first.", variant: "destructive" });
        setWf8Sending(false);
        return;
      }
      const webhookUrl = base.replace(/\/+$/, "") + "/webhook/email-send";

      // Get admin email
      const { data: adminData } = await supabase.from("admin_emails").select("email").limit(1).maybeSingle();
      const adminEmail = adminData?.email || "admin@fitmatch.ca";

      const payload = {
        template_key: "account_welcome",
        to_email: adminEmail,
        to_name: "WF8 Test",
        user_id: null,
        user_type: "client",
        variables: {
          customer_name: "WF8 Test User",
          login_url: "https://fitmatch.ca/login",
          browse_url: "https://fitmatch.ca/browse",
          how_it_works_url: "https://fitmatch.ca/how-it-works",
        },
        related_entity_type: null,
        related_entity_id: null,
        locale: "en-CA",
        test_mode: false,
      };

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "✅ WF‑8 test email sent", description: "Check the summary card below for the new log entry." });
      } else {
        const text = await res.text();
        toast({ title: `WF‑8 error (${res.status})`, description: text.slice(0, 200), variant: "destructive" });
      }
    } catch (err: any) {
      // Try no-cors fallback
      try {
        const { data: intData } = await supabase.from("integrations").select("config, webhook_url").eq("service_name", "n8n").maybeSingle();
        const cfg = intData?.config as any;
        const base = cfg?.webhook_base_url || cfg?.base_url || intData?.webhook_url || "";
        const webhookUrl = base.replace(/\/+$/, "") + "/webhook/email-send";
        const { data: adminData } = await supabase.from("admin_emails").select("email").limit(1).maybeSingle();
        await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ template_key: "account_welcome", to_email: adminData?.email || "admin@fitmatch.ca", to_name: "WF8 Test", user_type: "client", variables: { customer_name: "WF8 Test User", login_url: "#", browse_url: "#", how_it_works_url: "#" }, locale: "en-CA" }), mode: "no-cors" });
        toast({ title: "Request sent (no-cors)", description: "CORS blocked the response. Check n8n execution history." });
      } catch (e2: any) {
        toast({ title: "Network error", description: e2.message, variant: "destructive" });
      }
    } finally {
      setWf8Sending(false);
      // Refresh after delay
      setTimeout(() => { fetchLastWf8Log(); fetchOutboundLogs(); }, 3000);
    }
  };

  // ── Section 3: Simulate Reply ──
  const handleSimulateReply = async () => {
    if (!selectedLog) return;
    setSimulateSending(true);
    setSimulateStatus(null);
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
            communication_log_id: selectedLog.id,
            from_email: fromEmail,
            reply_body: replyBody,
          }),
        }
      );
      const result = await resp.json();
      console.log("[WF-10 Test Console] Response:", result);

      if (result.success) {
        console.log("[WF-10] payload_sent_to_wf10:", result.payload_sent_to_wf10);
        console.log("[WF-10] outbound_log:", result.outbound_log);
        setSimulateStatus({ type: "success", message: "WF‑10 test sent. A new inbound row should appear in Communication Log." });
        toast({ title: "✅ Simulated reply sent to WF‑10" });
      } else {
        const errMsg = `[${result.stage || "unknown"}] ${result.error || "Unknown error"}`;
        console.error("[WF-10 Test Console] Error:", result);
        setSimulateStatus({ type: "error", message: errMsg });
      }
    } catch (err: any) {
      console.error("[WF-10 Test Console] Network error:", err);
      setSimulateStatus({ type: "error", message: err.message || "Network error" });
    } finally {
      setSimulateSending(false);
    }
  };

  // When selecting an outbound log, pre-fill from email
  const handleSelectLog = (log: OutboundLog) => {
    setSelectedLog(log);
    setFromEmail(log.to_address || log.user_email);
    setSimulateStatus(null);
  };

  const outboundPages = Math.ceil(outboundTotal / PAGE_SIZE);

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Step-by-step console for testing WF‑8 outbound and WF‑10 inbound email workflows. No production data is modified.
      </p>

      {/* ━━━ SECTION 1: WF-8 Outbound Test ━━━ */}
      <Card className={neoCard}>
        <CardHeader>
          <CardTitle className="text-base font-serif">1. Send WF‑8 Test Email</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sends a real test email via WF‑8 and creates an outbound communication_log row with a Mailgun message ID.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleSendWf8} disabled={wf8Sending} className="border-2">
            {wf8Sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : <><Send className="w-4 h-4 mr-2" /> Send WF‑8 Test Email</>}
          </Button>

          {wf8Loading ? (
            <Skeleton className="h-20 w-full" />
          ) : lastWf8Log ? (
            <div className="border-2 border-border p-3 space-y-1 text-sm bg-muted/30">
              <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Last Outbound Log (with Mailgun ID)</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-muted-foreground">Date:</span>
                <span>{formatDate(lastWf8Log.created_at)}</span>
                <span className="text-muted-foreground">To:</span>
                <span className="truncate">{lastWf8Log.to_address || lastWf8Log.user_email}</span>
                <span className="text-muted-foreground">Subject:</span>
                <span className="truncate">{lastWf8Log.subject}</span>
                <span className="text-muted-foreground">Log ID:</span>
                <span className="font-mono text-xs truncate">{lastWf8Log.id}</span>
                <span className="text-muted-foreground">Mailgun ID:</span>
                <span className="font-mono text-xs truncate">{lastWf8Log.mailgun_message_id}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No outbound logs with Mailgun ID found yet.</p>
          )}
        </CardContent>
      </Card>

      {/* ━━━ SECTION 2: Select Outbound Email ━━━ */}
      <Card className={neoCard}>
        <CardHeader>
          <CardTitle className="text-base font-serif">2. Choose Outbound Email to Reply To</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select the outbound email WF‑10 should treat as the parent message.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-10"></TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">To</TableHead>
                  <TableHead className="text-xs">Subject</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Mailgun ID</TableHead>
                  <TableHead className="text-xs">Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outboundLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : outboundLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No outbound logs with Mailgun ID found. Send a WF‑8 test email first.
                    </TableCell>
                  </TableRow>
                ) : outboundLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    className={`cursor-pointer ${selectedLog?.id === log.id ? "bg-accent" : ""}`}
                    onClick={() => handleSelectLog(log)}
                  >
                    <TableCell>
                      <Radio className={`w-4 h-4 ${selectedLog?.id === log.id ? "text-foreground" : "text-muted-foreground/40"}`} />
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

          {/* Pagination */}
          {outboundPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Page {outboundPage + 1} of {outboundPages} ({outboundTotal} rows)
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="border-2" disabled={outboundPage === 0} onClick={() => setOutboundPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="border-2" disabled={outboundPage >= outboundPages - 1} onClick={() => setOutboundPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Selected email summary */}
          {selectedLog && (
            <div className="border-2 border-foreground p-3 space-y-1 text-sm bg-accent/50">
              <p className="font-medium text-xs uppercase tracking-wide flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Selected Email
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-muted-foreground">Log ID:</span>
                <span className="font-mono text-xs truncate">{selectedLog.id}</span>
                <span className="text-muted-foreground">To:</span>
                <span className="truncate">{selectedLog.to_address || selectedLog.user_email}</span>
                <span className="text-muted-foreground">Subject:</span>
                <span className="truncate">{selectedLog.subject}</span>
                <span className="text-muted-foreground">Mailgun ID:</span>
                <span className="font-mono text-xs truncate">{selectedLog.mailgun_message_id}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ━━━ SECTION 3: WF-10 Simulated Reply ━━━ */}
      <Card className={neoCard}>
        <CardHeader>
          <CardTitle className="text-base font-serif">3. Simulate Customer Reply (WF‑10)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Simulate a customer replying to the selected outbound email. This sends a Mailgun-style payload to WF‑10 via the simulate-inbound-email Edge Function.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div>
              <Label htmlFor="tc-from-email">From email</Label>
              <Input
                id="tc-from-email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="customer@example.com"
                className="border-2"
                disabled={!selectedLog}
              />
            </div>
            <div>
              <Label htmlFor="tc-reply-body">Reply body</Label>
              <Textarea
                id="tc-reply-body"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={3}
                className="border-2"
                disabled={!selectedLog}
              />
            </div>
          </div>

          <Button
            onClick={handleSimulateReply}
            disabled={!selectedLog || simulateSending}
            className="border-2"
          >
            {simulateSending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending to WF‑10…</>
            ) : (
              <><Send className="w-4 h-4 mr-2" /> Send to WF‑10</>
            )}
          </Button>

          {!selectedLog && (
            <p className="text-sm text-muted-foreground">↑ Select an outbound email in Step 2 first.</p>
          )}

          {simulateStatus && (
            <div className={`border-2 p-3 text-sm ${simulateStatus.type === "success" ? "border-green-600 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "border-destructive bg-destructive/10 text-destructive"}`}>
              {simulateStatus.type === "success" ? (
                <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {simulateStatus.message}</span>
              ) : (
                <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {simulateStatus.message}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTestConsoleTab;
