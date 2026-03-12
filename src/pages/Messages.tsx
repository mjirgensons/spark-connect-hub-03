import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, MessageSquare, Loader2 } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { format } from "date-fns";

const Messages = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { user, loading: authLoading } = useAuth();
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

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  }, [authLoading, user, navigate]);

  // Fetch conversations
  const { data: conversations = [], isLoading: convsLoading } = useQuery({
    queryKey: ["buyer-conversations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, profiles!conversations_seller_id_fkey(company_name, full_name)")
        .eq("buyer_id", user!.id)
        .order("last_message_at", { ascending: false });
      if (error) {
        console.error("conversations query error:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch messages for active conversation
  const { data: messages = [], isLoading: msgsLoading } = useQuery({
    queryKey: ["conversation-messages", activeConvId],
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

  // Mark as read when opening conversation
  useEffect(() => {
    if (activeConvId && user) {
      supabase
        .from("conversations")
        .update({ buyer_unread_count: 0 })
        .eq("id", activeConvId)
        .eq("buyer_id", user.id)
        .then(() => queryClient.invalidateQueries({ queryKey: ["buyer-conversations"] }));
    }
  }, [activeConvId, user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!activeConvId) return;
    const channel = supabase
      .channel(`conv-${activeConvId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversation_messages", filter: `conversation_id=eq.${activeConvId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["conversation-messages", activeConvId] });
        queryClient.invalidateQueries({ queryKey: ["buyer-conversations"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConvId]);

  const handleSend = async () => {
    if (!messageText.trim() || !activeConvId || !user) return;
    setSending(true);
    try {
      const trimmedMessage = messageText.trim();
      const { error: msgErr } = await supabase.from("conversation_messages").insert({
        conversation_id: activeConvId,
        sender_id: user.id,
        content: trimmedMessage,
      });
      if (msgErr) throw msgErr;

      // Fire-and-forget notification — don't await, don't block the UI
      supabase.functions.invoke('notify-conversation-reply', {
        body: { conversation_id: activeConvId, message_content: trimmedMessage }
      }).catch(() => {});

      // Update conversation
      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          seller_unread_count: (conversations.find(c => c.id === activeConvId) as any)?.seller_unread_count + 1 || 1,
        })
        .eq("id", activeConvId);

      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["conversation-messages", activeConvId] });
      queryClient.invalidateQueries({ queryKey: ["buyer-conversations"] });
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find((c: any) => c.id === activeConvId);
  const showList = !isMobile || !activeConvId;
  const showThread = !isMobile || !!activeConvId;

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 md:pt-10 pb-10">
        <h1 className="font-serif text-2xl font-bold mb-4">Messages</h1>
        <div className="flex border-2 border-foreground rounded-md overflow-hidden" style={{ height: "calc(100vh - 200px)", boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
          {/* Conversation list */}
          {showList && (
            <div className={`${isMobile ? "w-full" : "w-80"} border-r border-border flex flex-col`}>
              <div className="p-3 border-b border-border font-sans font-semibold text-sm">Conversations</div>
              <ScrollArea className="flex-1">
                {convsLoading ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">Loading…</div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conv: any) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveConvId(conv.id);
                        navigate(`/client/messages/${conv.id}`, { replace: true });
                      }}
                      className={`w-full text-left p-3 border-b border-border hover:bg-muted transition-colors ${conv.id === activeConvId ? "bg-muted" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-sans font-semibold text-sm truncate">
                          {conv.profiles?.company_name || conv.profiles?.full_name || "Seller"}
                        </span>
                        {conv.buyer_unread_count > 0 && (
                          <span className="bg-destructive text-destructive-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{conv.buyer_unread_count}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conv.subject || "General Inquiry"}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{format(new Date(conv.last_message_at), "MMM d, yyyy")}</p>
                    </button>
                  ))
                )}
              </ScrollArea>
            </div>
          )}

          {/* Message thread */}
          {showThread && (
            <div className="flex-1 flex flex-col">
              {activeConvId && activeConv ? (
                <>
                  <div className="p-3 border-b border-border flex items-center gap-2">
                    {isMobile && (
                      <Button variant="ghost" size="icon" onClick={() => { setActiveConvId(null); navigate("/messages", { replace: true }); }}>
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    )}
                    <div>
                      <p className="font-sans font-semibold text-sm">{(activeConv as any).profiles?.company_name || (activeConv as any).profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{(activeConv as any).products?.product_name || (activeConv as any).subject}</p>
                    </div>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    {msgsLoading ? (
                      <div className="text-center text-muted-foreground text-sm">Loading…</div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((msg: any) => {
                          const isMe = msg.sender_id === user?.id;
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
      </main>
      <Footer />
    </div>
  );
};

export default Messages;
