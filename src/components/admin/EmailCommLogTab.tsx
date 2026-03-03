import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Copy, Mail, CheckCircle, Eye, AlertTriangle, Reply, Loader2 } from "lucide-react";
import { format, formatDistanceToNow, subDays } from "date-fns";

interface CommLog {
  id: string;
  direction: string;
  user_email: string;
  subject: string;
  template_key: string | null;
  status: string | null;
  to_address: string;
  from_address: string;
  html_body: string | null;
  plain_text_body: string | null;
  metadata: any;
  mailgun_message_id: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  pinecone_synced: boolean | null;
  created_at: string;
  opened_at: string | null;
  clicked_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  queued: "bg-muted text-muted-foreground",
  sent: "bg-blue-600 text-white",
  delivered: "bg-green-600 text-white",
  opened: "bg-emerald-600 text-white",
  clicked: "bg-teal-600 text-white",
  bounced: "bg-red-600 text-white",
  failed: "bg-red-600 text-white",
  blocked_no_consent: "bg-yellow-600 text-white",
};

const PAGE_SIZE = 25;

const EmailCommLogTab = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<CommLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<CommLog | null>(null);
  const [plainTextOpen, setPlainTextOpen] = useState(false);

  // WF-10 Simulate Reply state
  const [simulateLog, setSimulateLog] = useState<CommLog | null>(null);
  const [simulateFromEmail, setSimulateFromEmail] = useState("");
  const [simulateReplyBody, setSimulateReplyBody] = useState("Test reply from admin panel.");
  const [simulateSending, setSimulateSending] = useState(false);

  // Seed WF-10 test data state
  const [seeding, setSeeding] = useState(false);

  // Create WF-10 test user state
  const [creatingTestUser, setCreatingTestUser] = useState(false);

  // Filters
  const [direction, setDirection] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  // Stats
  const [stats, setStats] = useState({ sent: 0, delivered: 0, opened: 0, bounced: 0 });
  const [templateKeys, setTemplateKeys] = useState<string[]>([]);

  const fetchStats = useCallback(async () => {
    const since = subDays(new Date(), 30).toISOString();
    const [sentRes, deliveredRes, openedRes, bouncedRes] = await Promise.all([
      supabase.from("communication_logs").select("*", { count: "exact", head: true }).eq("direction", "outbound").gte("created_at", since),
      supabase.from("communication_logs").select("*", { count: "exact", head: true }).eq("status", "delivered").gte("created_at", since),
      supabase.from("communication_logs").select("*", { count: "exact", head: true }).eq("status", "opened").gte("created_at", since),
      supabase.from("communication_logs").select("*", { count: "exact", head: true }).eq("status", "bounced").gte("created_at", since),
    ]);
    setStats({
      sent: sentRes.count || 0,
      delivered: deliveredRes.count || 0,
      opened: openedRes.count || 0,
      bounced: bouncedRes.count || 0,
    });
  }, []);

  const fetchTemplateKeys = useCallback(async () => {
    const { data } = await supabase.from("communication_logs").select("template_key").not("template_key", "is", null);
    const unique = [...new Set((data || []).map(d => d.template_key).filter(Boolean))] as string[];
    setTemplateKeys(unique);
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("communication_logs").select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (direction !== "all") query = query.eq("direction", direction);
    if (status !== "all") query = query.eq("status", status);
    if (templateFilter !== "all") query = query.eq("template_key", templateFilter);
    if (dateFrom) query = query.gte("created_at", dateFrom + "T00:00:00");
    if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59");
    if (search) query = query.or(`user_email.ilike.%${search}%,subject.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      setLogs((data || []) as unknown as CommLog[]);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [page, direction, status, templateFilter, dateFrom, dateTo, search, toast]);

  useEffect(() => { fetchStats(); fetchTemplateKeys(); }, [fetchStats, fetchTemplateKeys]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(0); }, [direction, status, templateFilter, dateFrom, dateTo, search]);

  const deliveryRate = stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(1) : "0";
  const openRate = stats.delivered > 0 ? ((stats.opened / stats.delivered) * 100).toFixed(1) : "0";
  const bounceRate = stats.sent > 0 ? ((stats.bounced / stats.sent) * 100).toFixed(1) : "0";
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const formatDate = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 86400000) return formatDistanceToNow(new Date(d), { addSuffix: true });
    return format(new Date(d), "MMM d, yyyy HH:mm");
  };

  const openSimulateDrawer = (log: CommLog, e: React.MouseEvent) => {
    e.stopPropagation();
    setSimulateLog(log);
    setSimulateFromEmail(log.user_email);
    setSimulateReplyBody("Test reply from admin panel.");
  };

  const handleSendSimulate = async () => {
    if (!simulateLog) return;
    setSimulateSending(true);
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
            communication_log_id: simulateLog.id,
            from_email: simulateFromEmail,
            reply_body: simulateReplyBody,
          }),
        }
      );
      const result = await resp.json();
      if (!resp.ok && resp.status === 400) {
        toast({ title: "Cannot simulate reply", description: "This email has no Mailgun message ID. Use an email sent by WF‑8.", variant: "destructive" });
      } else if (result.success) {
        toast({ title: "✅ Simulated reply sent to WF‑10", description: "Check Communication Log for a new inbound row." });
        setSimulateLog(null);
        fetchLogs();
      } else {
        toast({ title: "WF‑10 Error", description: result.wf10_response_text || result.error || "Unknown error", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Network Error", description: err.message, variant: "destructive" });
    } finally {
      setSimulateSending(false);
    }
  };

  const handleSeedWf10 = async () => {
    setSeeding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/seed-wf10-test-data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token || ""}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const result = await resp.json();
      if (result.success) {
        toast({ title: "✅ WF‑10 test data seeded", description: "Look for an outbound row to wf10-test@example.com in the Communication Log and use Simulate Reply on it." });
        fetchLogs();
      } else {
        toast({ title: "Seed Error", description: result.error || result.detail || "Unknown error", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Network Error", description: err.message, variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateTestUser = async () => {
    setCreatingTestUser(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/create-wf10-test-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token || ""}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({}),
        }
      );
      const result = await resp.json();
      if (result.success) {
        toast({ title: "✅ WF‑10 test user created", description: `Profile: wf10-test@example.com (${result.profile_id})` });
      } else {
        toast({ title: "Error", description: result.error || result.detail || "Unknown error", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Network Error", description: err.message, variant: "destructive" });
    } finally {
      setCreatingTestUser(false);
    }
  };

  const canSimulate = (log: CommLog) => log.direction === "outbound" && !!log.mailgun_message_id;

  return (
    <div className="space-y-4">
      {/* Header with Seed button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif font-bold text-foreground">Communication Log</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-2 text-xs" onClick={handleCreateTestUser} disabled={creatingTestUser}>
            {creatingTestUser ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Creating…</> : "👤 Create WF‑10 Test User"}
          </Button>
          <Button variant="outline" size="sm" className="border-2 text-xs" onClick={handleSeedWf10} disabled={seeding}>
            {seeding ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Seeding…</> : "🌱 Seed WF‑10 Test Data"}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Sent (30d)", value: stats.sent, icon: Mail },
          { label: "Delivery Rate", value: `${deliveryRate}%`, icon: CheckCircle },
          { label: "Open Rate", value: `${openRate}%`, icon: Eye },
          { label: "Bounce Rate", value: `${bounceRate}%`, icon: AlertTriangle },
        ].map((s) => (
          <Card key={s.label} className="border-2 border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <s.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-serif font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={direction} onValueChange={setDirection}>
          <SelectTrigger className="w-36 border-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Directions</SelectItem>
            <SelectItem value="outbound">↑ Outbound</SelectItem>
            <SelectItem value="inbound">↓ Inbound</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36 border-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="opened">Opened</SelectItem>
            <SelectItem value="clicked">Clicked</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="blocked_no_consent">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={templateFilter} onValueChange={setTemplateFilter}>
          <SelectTrigger className="w-44 border-2"><SelectValue placeholder="Template" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Templates</SelectItem>
            {templateKeys.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36 border-2" />
        <span className="text-sm text-muted-foreground">to</span>
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36 border-2" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email/subject..." className="w-48 border-2" />
      </div>

      {/* Table */}
      <div className="border-2 border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Dir</TableHead>
              <TableHead className="text-xs">To/From</TableHead>
              <TableHead className="text-xs">Subject</TableHead>
              <TableHead className="text-xs">Template</TableHead>
              <TableHead className="text-xs">Entity</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs w-8">Sync</TableHead>
              <TableHead className="text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No communication logs found.</TableCell></TableRow>
            ) : logs.map(log => (
              <TableRow key={log.id} className="cursor-pointer" onClick={() => { setSelectedLog(log); setPlainTextOpen(false); }}>
                <TableCell className="text-xs whitespace-nowrap">{formatDate(log.created_at)}</TableCell>
                <TableCell>{log.direction === "outbound" ? <ArrowUp className="w-4 h-4 text-blue-500" /> : <ArrowDown className="w-4 h-4 text-green-500" />}</TableCell>
                <TableCell className="text-xs max-w-[180px] truncate">{log.direction === "outbound" ? log.to_address : log.from_address}</TableCell>
                <TableCell className="text-xs max-w-[200px] truncate" title={log.subject}>{log.subject.length > 60 ? log.subject.slice(0, 60) + "…" : log.subject}</TableCell>
                <TableCell>{log.template_key ? <Badge variant="outline" className="border-2 text-xs font-mono">{log.template_key}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                <TableCell>{log.related_entity_type ? <Badge variant="outline" className="border-2 text-xs capitalize">{log.related_entity_type}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                <TableCell><Badge className={`${STATUS_COLORS[log.status || "queued"]} text-xs`}>{log.status || "queued"}</Badge></TableCell>
                <TableCell><span className={`inline-block w-2 h-2 rounded-full ${log.pinecone_synced ? "bg-green-500" : "bg-muted-foreground/40"}`} /></TableCell>
                <TableCell>
                  {canSimulate(log) && (
                    <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={(e) => openSimulateDrawer(log, e)}>
                      <Reply className="w-3 h-3 mr-1" /> Simulate Reply
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{totalCount} results — Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-2" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" className="border-2" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Email Detail</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><Label className="text-xs text-muted-foreground">Direction</Label><p>{selectedLog.direction === "outbound" ? "↑ Outbound" : "↓ Inbound"}</p></div>
                <div><Label className="text-xs text-muted-foreground">Status</Label><Badge className={STATUS_COLORS[selectedLog.status || "queued"]}>{selectedLog.status}</Badge></div>
                <div><Label className="text-xs text-muted-foreground">To</Label><p>{selectedLog.to_address}</p></div>
                <div><Label className="text-xs text-muted-foreground">From</Label><p>{selectedLog.from_address}</p></div>
                <div><Label className="text-xs text-muted-foreground">Created</Label><p>{format(new Date(selectedLog.created_at), "PPpp")}</p></div>
                {selectedLog.opened_at && <div><Label className="text-xs text-muted-foreground">Opened</Label><p>{format(new Date(selectedLog.opened_at), "PPpp")}</p></div>}
                {selectedLog.clicked_at && <div><Label className="text-xs text-muted-foreground">Clicked</Label><p>{format(new Date(selectedLog.clicked_at), "PPpp")}</p></div>}
                {selectedLog.template_key && <div><Label className="text-xs text-muted-foreground">Template</Label><p className="font-mono text-xs">{selectedLog.template_key}</p></div>}
                {selectedLog.related_entity_type && (
                  <div><Label className="text-xs text-muted-foreground">Entity</Label><p className="capitalize">{selectedLog.related_entity_type} — {selectedLog.related_entity_id}</p></div>
                )}
                <div><Label className="text-xs text-muted-foreground">Pinecone Synced</Label><p>{selectedLog.pinecone_synced ? "✅ Yes" : "❌ No"}</p></div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <p className="font-semibold">{selectedLog.subject}</p>
              </div>

              {selectedLog.mailgun_message_id && (
                <div>
                  <Label className="text-xs text-muted-foreground">Mailgun ID</Label>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted p-1 rounded">{selectedLog.mailgun_message_id}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(selectedLog.mailgun_message_id!); toast({ title: "Copied" }); }}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

              {selectedLog.html_body && (
                <div>
                  <Label className="text-xs text-muted-foreground">HTML Body</Label>
                  <div className="border-2 border-border mt-1">
                    <iframe srcDoc={selectedLog.html_body} className="w-full min-h-[300px] border-0" title="Email Body" sandbox="allow-same-origin" />
                  </div>
                </div>
              )}

              {selectedLog.plain_text_body && (
                <div>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setPlainTextOpen(!plainTextOpen)}>
                    {plainTextOpen ? "▼" : "▶"} Plain Text
                  </Button>
                  {plainTextOpen && <pre className="text-xs bg-muted p-3 rounded mt-1 whitespace-pre-wrap">{selectedLog.plain_text_body}</pre>}
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Metadata</Label>
                  <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-x-auto">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* WF-10 Simulate Reply Sheet */}
      <Sheet open={!!simulateLog} onOpenChange={(open) => { if (!open) setSimulateLog(null); }}>
        <SheetContent side="right" className="w-[400px] sm:w-[440px]">
          <SheetHeader>
            <SheetTitle className="font-serif">Simulate Inbound Reply (WF‑10 Test)</SheetTitle>
            <SheetDescription className="text-xs">
              This tool simulates a customer replying to this email by sending a Mailgun‑style payload to WF‑10. Use it for testing only.
            </SheetDescription>
          </SheetHeader>
          {simulateLog && (
            <div className="space-y-4 mt-4">
              {/* Read-only fields */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Recipient</Label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">{simulateLog.user_email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Subject</Label>
                  <p className="text-sm bg-muted p-2 rounded">{simulateLog.subject}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Mailgun Message‑Id</Label>
                  <p className="text-xs font-mono bg-muted p-2 rounded break-all">{simulateLog.mailgun_message_id}</p>
                </div>
                {simulateLog.related_entity_type && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Entity</Label>
                    <p className="text-sm bg-muted p-2 rounded capitalize">{simulateLog.related_entity_type} — {simulateLog.related_entity_id}</p>
                  </div>
                )}
              </div>

              {/* Editable fields */}
              <div className="space-y-3 border-t pt-4">
                <div>
                  <Label htmlFor="sim-from">From email</Label>
                  <Input id="sim-from" value={simulateFromEmail} onChange={e => setSimulateFromEmail(e.target.value)} className="border-2 mt-1" />
                </div>
                <div>
                  <Label htmlFor="sim-body">Reply body</Label>
                  <Textarea id="sim-body" value={simulateReplyBody} onChange={e => setSimulateReplyBody(e.target.value)} rows={4} className="border-2 mt-1" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSendSimulate} disabled={simulateSending || !simulateFromEmail || !simulateReplyBody} className="flex-1">
                  {simulateSending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Sending…</> : "Send to WF‑10"}
                </Button>
                <Button variant="outline" className="border-2" onClick={() => setSimulateLog(null)} disabled={simulateSending}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default EmailCommLogTab;
