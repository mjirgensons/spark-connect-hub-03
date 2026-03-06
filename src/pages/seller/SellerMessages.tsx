import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, MessageSquare, Loader2 } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { format } from "date-fns";

const SellerMessages = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const adminViewId = searchParams.get("adminView");
  const effectiveId = adminViewId || user?.id;
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [activeConvId, setActiveConvId] = useState<string | null>(conversationId || null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) setActiveConvId(conversationId);
  }, [conversationId]);

  const { data: conversations = [], isLoading: convsLoading } = useQuery({
    queryKey: ["seller-conversations", effectiveId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, profiles!conversations_buyer_id_fkey(full_name, email), products(product_name)")
        .eq("seller_id", effectiveId!)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveId,
  });

  const { data: messages = [], isLoading: msgsLoading } = useQuery({
    queryKey: ["seller-conv-messages", activeConvId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversation_messages")
        .select("*, profiles!conversation_messages_sender_id_fkey(full_name)")
        .eq("conversation_id", activeConvId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeConvId,
  });

  // Mark as read
  useEffect(() => {
    if (activeConvId && effectiveId) {
      supabase
        .from("conversations")
        .update({ seller_unread_count: 0 })
        .eq("id", activeConvId)
        .eq("seller_id", effectiveId)
        .then(() => queryClient.invalidateQueries({ queryKey: ["seller-conversations"] }));
    }
  }, [activeConvId, effectiveId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime
  useEffect(() => {
    if (!activeConvId) return;
    const channel = supabase
      .channel(`seller-conv-${activeConvId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversation_messages", filter: `conversation_id=eq.${activeConvId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["seller-conv-messages", activeConvId] });
        queryClient.invalidateQueries({ queryKey: ["seller-conversations"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConvId]);

  const handleSend = async () => {
    if (!messageText.trim() || !activeConvId || !effectiveId) return;
    setSending(true);
    try {
      const senderId = adminViewId ? adminViewId : user!.id;
      const { error: msgErr } = await supabase.from("conversation_messages").insert({
        conversation_id: activeConvId,
        sender_id: senderId,
        content: messageText.trim(),
      });
      if (msgErr) throw msgErr;

      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          buyer_unread_count: (conversations.find((c: any) => c.id === activeConvId) as any)?.buyer_unread_count + 1 || 1,
        })
        .eq("id", activeConvId);

      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["seller-conv-messages", activeConvId] });
      queryClient.invalidateQueries({ queryKey: ["seller-conversations"] });
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find((c: any) => c.id === activeConvId);
  const showList = !isMobile || !activeConvId;
  const showThread = !isMobile || !!activeConvId;
  const navBase = adminViewId ? `?adminView=${adminViewId}` : "";

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: "Dashboard", href: `/seller/dashboard${navBase}` }, { label: "Messages" }]} />
      <h1 className="font-serif text-2xl font-bold">Messages</h1>
      <div className="flex border-2 border-foreground rounded-md overflow-hidden" style={{ height: "calc(100vh - 260px)", boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
        {showList && (
          <div className={`${isMobile ? "w-full" : "w-80"} border-r border-border flex flex-col`}>
            <div className="p-3 border-b border-border font-sans font-semibold text-sm">Buyer Conversations</div>
            <ScrollArea className="flex-1">
              {convsLoading ? (
                <div className="p-4 text-center text-muted-foreground text-sm">Loading…</div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Messages from buyers will appear here.</p>
                </div>
              ) : (
                conversations.map((conv: any) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id);
                      navigate(`/seller/messages/${conv.id}${navBase}`, { replace: true });
                    }}
                    className={`w-full text-left p-3 border-b border-border hover:bg-muted transition-colors ${conv.id === activeConvId ? "bg-muted" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-semibold text-sm truncate">
                        {conv.profiles?.full_name || conv.profiles?.email || "Buyer"}
                      </span>
                      {conv.seller_unread_count > 0 && (
                        <span className="bg-destructive text-destructive-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{conv.seller_unread_count}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.products?.product_name || conv.subject || "General Inquiry"}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{format(new Date(conv.last_message_at), "MMM d, yyyy")}</p>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>
        )}

        {showThread && (
          <div className="flex-1 flex flex-col">
            {activeConvId && activeConv ? (
              <>
                <div className="p-3 border-b border-border flex items-center gap-2">
                  {isMobile && (
                    <Button variant="ghost" size="icon" onClick={() => { setActiveConvId(null); navigate(`/seller/messages${navBase}`, { replace: true }); }}>
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  )}
                  <div>
                    <p className="font-sans font-semibold text-sm">{(activeConv as any).profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{(activeConv as any).products?.product_name || (activeConv as any).subject}</p>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  {msgsLoading ? (
                    <div className="text-center text-muted-foreground text-sm">Loading…</div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg: any) => {
                        const isMe = msg.sender_id === effectiveId;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                              {!isMe && <p className="text-[10px] font-semibold mb-0.5">{msg.profiles?.full_name}</p>}
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{format(new Date(msg.created_at), "MMM d, h:mm a")}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
                <div className="p-3 border-t border-border flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message…"
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  />
                  <Button onClick={handleSend} disabled={sending || !messageText.trim()} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerMessages;
