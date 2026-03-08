import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Loader2, Copy, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SessionRow {
  id: string;
  session_id: string;
  seller_id: string | null;
  buyer_id: string | null;
  buyer_email: string | null;
  user_role: string | null;
  chatbot_mode: string;
  status: string | null;
  consent_given: boolean | null;
  consent_at: string | null;
  escalated_at: string | null;
  escalation_reason: string | null;
  metadata: any;
  started_at: string | null;
  last_active_at: string | null;
  message_count?: number;
  seller_name?: string;
}

interface MessageRow {
  id: number;
  session_id: string;
  message_type: string;
  content: string;
  confidence_score: number | null;
  was_cached: boolean | null;
  latency_ms: number | null;
  created_at: string | null;
}

interface LoadSessionData {
  seller_id: string;
  session_id: string;
  user_role: string;
  chatbot_mode: string;
  messages: Array<{ role: "user" | "bot" | "error"; content: string; timestamp: Date; id: string }>;
}

interface SessionHistoryTabProps {
  onLoadSession: (data: LoadSessionData) => void;
}

const statusBadge = (status: string | null) => {
  switch (status) {
    case "active":
      return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/15">active</Badge>;
    case "escalated":
      return <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/15">escalated</Badge>;
    default:
      return <Badge variant="secondary">{status || "unknown"}</Badge>;
  }
};

const SessionHistoryTab = ({ onLoadSession }: SessionHistoryTabProps) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionRow | null>(null);
  const [sessionMessages, setSessionMessages] = useState<MessageRow[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    // Fetch sessions
    const { data: sessionsData, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50);

    if (error) {
      toast({ title: "Error loading sessions", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch message counts
    const sessionIds = (sessionsData || []).map((s) => s.session_id);
    let messageCounts: Record<string, number> = {};
    if (sessionIds.length > 0) {
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("session_id")
        .in("session_id", sessionIds);
      if (msgs) {
        msgs.forEach((m) => {
          messageCounts[m.session_id] = (messageCounts[m.session_id] || 0) + 1;
        });
      }
    }

    // Try to resolve seller names
    const sellerIds = [...new Set((sessionsData || []).map((s) => s.seller_id).filter(Boolean))] as string[];
    let sellerNames: Record<string, string> = {};
    if (sellerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", sellerIds);
      if (profiles) {
        profiles.forEach((p) => {
          sellerNames[p.id] = p.full_name;
        });
      }
    }

    const enriched = (sessionsData || []).map((s) => ({
      ...s,
      message_count: messageCounts[s.session_id] || 0,
      seller_name: s.seller_id ? sellerNames[s.seller_id] || undefined : undefined,
    }));

    setSessions(enriched);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const openSession = useCallback(async (session: SessionRow) => {
    setSelectedSession(session);
    setLoadingMessages(true);
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", session.session_id)
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Error loading messages", description: error.message, variant: "destructive" });
    }
    setSessionMessages((data as MessageRow[]) || []);
    setLoadingMessages(false);
  }, [toast]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleLoadInConsole = () => {
    if (!selectedSession) return;
    const mapped = sessionMessages.map((m) => ({
      id: String(m.id),
      role: (m.message_type === "user" ? "user" : m.message_type === "assistant" ? "bot" : "bot") as "user" | "bot" | "error",
      content: m.content,
      timestamp: new Date(m.created_at || Date.now()),
    }));
    onLoadSession({
      seller_id: selectedSession.seller_id || "",
      session_id: selectedSession.session_id,
      user_role: selectedSession.user_role || "guest",
      chatbot_mode: selectedSession.chatbot_mode,
      messages: mapped,
    });
    setSelectedSession(null);
  };

  const fmtDate = (d: string | null) => d ? format(new Date(d), "MMM d, HH:mm") : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing up to 50 most recent sessions</p>
        <Button variant="outline" size="sm" onClick={fetchSessions} disabled={loading}>
          <RefreshCw className={cn("w-3.5 h-3.5 mr-1", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No chat sessions found.</p>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session ID</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Msgs</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openSession(s)}>
                  <TableCell className="font-mono text-xs">
                    <span
                      className="hover:underline cursor-copy"
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(s.session_id); }}
                      title={s.session_id}
                    >
                      {s.session_id.slice(0, 8)}…
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {s.seller_name || (s.seller_id ? `${s.seller_id.slice(0, 8)}…` : "—")}
                  </TableCell>
                  <TableCell className="text-xs">{s.user_role || "—"}</TableCell>
                  <TableCell className="text-xs">{s.chatbot_mode}</TableCell>
                  <TableCell>{statusBadge(s.status)}</TableCell>
                  <TableCell className="text-right text-xs">{s.message_count}</TableCell>
                  <TableCell className="text-xs">{fmtDate(s.started_at)}</TableCell>
                  <TableCell className="text-xs">{fmtDate(s.last_active_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Session Detail Sheet */}
      <Sheet open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="flex flex-row items-center justify-between gap-2">
            <SheetTitle className="text-base">Session Detail</SheetTitle>
            <Button size="sm" onClick={handleLoadInConsole} disabled={loadingMessages}>
              <Play className="w-3.5 h-3.5 mr-1" /> Load in Console
            </Button>
          </SheetHeader>

          {selectedSession && (
            <div className="space-y-6 mt-4">
              {/* Section A: Config */}
              <div>
                <h4 className="text-sm font-medium mb-3">Session Config</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {[
                    ["Session ID", selectedSession.session_id, true],
                    ["Seller ID", selectedSession.seller_id || "—", true],
                    ["Buyer ID", selectedSession.buyer_id || "None — guest"],
                    ["Buyer Email", selectedSession.buyer_email || "None"],
                    ["User Role", selectedSession.user_role || "—"],
                    ["Chatbot Mode", selectedSession.chatbot_mode],
                    ["Status", selectedSession.status || "—"],
                    ["Consent Given", selectedSession.consent_given ? "Yes" : "No"],
                    ["Consent At", fmtDate(selectedSession.consent_at)],
                    ["Escalated At", fmtDate(selectedSession.escalated_at)],
                    ["Escalation Reason", selectedSession.escalation_reason || "—"],
                  ].map(([label, value, copyable]) => (
                    <div key={label as string} className="contents">
                      <span className="text-muted-foreground">{label as string}</span>
                      <span className={cn("font-mono break-all", copyable && "cursor-copy hover:underline")}
                        onClick={() => copyable && copyToClipboard(value as string)}>
                        {value as string}
                        {copyable && <Copy className="w-3 h-3 inline ml-1 opacity-40" />}
                      </span>
                    </div>
                  ))}
                  <span className="text-muted-foreground">Metadata</span>
                  <pre className="font-mono text-[10px] bg-muted p-1.5 rounded overflow-x-auto col-span-1">
                    {JSON.stringify(selectedSession.metadata, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Section B: Conversation */}
              <div>
                <h4 className="text-sm font-medium mb-3">Conversation ({sessionMessages.length} messages)</h4>
                {loadingMessages ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin" /></div>
                ) : sessionMessages.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No messages in this session.</p>
                ) : (
                  <ScrollArea className="h-[400px] pr-2">
                    <div className="space-y-3">
                      {sessionMessages.map((msg) => {
                        const isUser = msg.message_type === "user";
                        const isSystem = msg.message_type === "system" || msg.message_type === "escalation";

                        if (isSystem) {
                          return (
                            <div key={msg.id} className="flex justify-center">
                              <div className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 px-3 py-1.5 text-xs italic rounded max-w-[85%] text-center">
                                <span className="font-medium">[{msg.message_type}]</span> {msg.content}
                                <div className="text-[10px] opacity-60 mt-0.5">{fmtDate(msg.created_at)}</div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={msg.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                            <div className={cn(
                              "max-w-[80%] px-3 py-2 text-xs whitespace-pre-wrap rounded",
                              isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                            )}>
                              <span className="font-medium text-[10px] opacity-70">[{msg.message_type}]</span>
                              <div className="mt-0.5">{msg.content}</div>
                              <div className={cn("text-[10px] mt-1 opacity-60 flex gap-2 flex-wrap", isUser ? "justify-end" : "justify-start")}>
                                {!isUser && msg.confidence_score != null && <span>conf: {msg.confidence_score.toFixed(2)}</span>}
                                {!isUser && msg.latency_ms != null && <span>{msg.latency_ms}ms</span>}
                                <span>{fmtDate(msg.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SessionHistoryTab;
