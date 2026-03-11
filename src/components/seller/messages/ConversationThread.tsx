import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import MessagesSkeleton from "./MessagesSkeleton";
import ReplyComposer from "./ReplyComposer";

interface ConversationThreadProps {
  conversationId: string;
  sellerId: string;
  sellerName: string;
  buyerName: string;
  buyerId: string;
  buyerEmail: string;
  subject: string | null;
  productId: string | null;
  status: string | null;
  isMobile: boolean;
  onBack: () => void;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean | null;
  created_at: string | null;
  profiles?: { full_name: string } | null;
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, "h:mm a");
  return format(date, "MMM d, h:mm a");
}

function formatDateDivider(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

const ConversationThread = ({
  conversationId,
  sellerId,
  sellerName,
  buyerName,
  buyerId,
  buyerEmail,
  subject,
  productId,
  status,
  isMobile,
  onBack,
}: ConversationThreadProps) => {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [convStatus, setConvStatus] = useState(status);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Sync status from props
  useEffect(() => {
    setConvStatus(status);
  }, [status]);

  // Fetch product name if product_id exists
  const { data: productName } = useQuery({
    queryKey: ["conv-product", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("product_name")
        .eq("id", productId!)
        .single();
      return data?.product_name || null;
    },
    enabled: !!productId,
    staleTime: Infinity,
  });

  // Fetch messages
  const {
    data: messages = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["seller-conv-messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversation_messages")
        .select(
          "id, conversation_id, sender_id, content, is_read, created_at, profiles!conversation_messages_sender_id_fkey(full_name)"
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as MessageRow[];
    },
  });

  // Show error
  useEffect(() => {
    if (isError) toast.error("Failed to load messages");
  }, [isError]);

  // Mark as read on open and when new messages arrive
  useEffect(() => {
    if (!conversationId || !sellerId) return;

    // Reset unread count on conversation
    supabase
      .from("conversations")
      .update({ seller_unread_count: 0 })
      .eq("id", conversationId)
      .eq("seller_id", sellerId)
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ["seller-conversations"],
        });
      });
  }, [conversationId, sellerId, messages.length, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel(`seller-thread-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["seller-conv-messages", conversationId],
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  // Group messages by date
  const groupedMessages: { date: string; messages: MessageRow[] }[] = [];
  for (const msg of messages) {
    if (!msg.created_at) continue;
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (
      lastGroup &&
      isSameDay(new Date(lastGroup.date), new Date(msg.created_at))
    ) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date: msg.created_at, messages: [msg] });
    }
  }

  const isResolved = convStatus === "resolved";
  const statusLabel = convStatus === "escalated" ? "Escalated" : isResolved ? "Resolved" : "Active";
  const statusVariant = convStatus === "escalated" ? "outline" : "secondary";

  const handleToggleStatus = async () => {
    const newStatus = isResolved ? "active" : "resolved";
    setTogglingStatus(true);
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ status: newStatus })
        .eq("id", conversationId);
      if (error) throw error;
      setConvStatus(newStatus);
      queryClient.invalidateQueries({ queryKey: ["seller-conversations"] });
    } catch {
      toast.error("Failed to update conversation status");
    } finally {
      setTogglingStatus(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-start gap-3 shrink-0">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 mt-0.5"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-sans font-semibold text-sm truncate">
              {buyerName}
            </h3>
            <Badge
              variant={statusVariant}
              className={cn(
                "text-[10px] shrink-0",
                convStatus === "escalated"
                  ? "border-amber-500 text-amber-600"
                  : isResolved
                  ? "border-muted-foreground text-muted-foreground"
                  : "border-green-500 text-green-600"
              )}
            >
              {statusLabel}
            </Badge>
          </div>
          {subject && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {subject}
            </p>
          )}
          {productName && (
            <span className="inline-block mt-1 text-[11px] bg-muted text-muted-foreground px-2 py-0.5 border border-border">
              {productName}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 text-xs"
          disabled={togglingStatus}
          onClick={handleToggleStatus}
        >
          {isResolved ? "Reopen" : "Mark as Resolved"}
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <MessagesSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              This conversation has no messages yet
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-1">
            {groupedMessages.map((group, gi) => (
              <div key={gi}>
                {/* Date divider */}
                <div className="flex items-center gap-3 my-4">
                  <Separator className="flex-1" />
                  <span className="text-[11px] text-muted-foreground font-sans whitespace-nowrap">
                    {formatDateDivider(group.date)}
                  </span>
                  <Separator className="flex-1" />
                </div>

                <div className="space-y-3">
                  {group.messages.map((msg) => {
                    const isMe = msg.sender_id === sellerId;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          isMe ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className="max-w-[75%]">
                          {!isMe && (
                            <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 ml-1">
                              {msg.profiles?.full_name || buyerName}
                            </p>
                          )}
                          <div
                            className={cn(
                              "px-3 py-2 rounded-lg text-sm shadow-sm",
                              isMe
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground"
                            )}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          {msg.created_at && (
                            <p
                              className={cn(
                                "text-[10px] mt-1",
                                isMe ? "text-right mr-1" : "ml-1",
                                "text-muted-foreground"
                              )}
                            >
                              {formatMessageTime(msg.created_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Reply composer placeholder */}
      <div className="border-t border-border h-20 flex items-center justify-center shrink-0">
        <p className="text-sm text-muted-foreground">
          Reply composer coming next
        </p>
      </div>
    </div>
  );
};

export default ConversationThread;
