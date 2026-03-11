import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import Breadcrumbs from "@/components/Breadcrumbs";
import ConversationList, {
  type ConversationItem,
} from "@/components/seller/messages/ConversationList";
import ConversationThread from "@/components/seller/messages/ConversationThread";

interface RawConversation {
  id: string;
  subject: string | null;
  last_message_at: string | null;
  seller_unread_count: number;
  status: string | null;
  buyer_id: string;
  product_id: string | null;
  profiles: { full_name: string; email: string } | null;
}

const SellerMessages = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const adminViewId = searchParams.get("adminView");
  const effectiveId = adminViewId || user?.id;
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [activeConvId, setActiveConvId] = useState<string | null>(
    conversationId || null
  );

  // Fetch seller profile for name
  const { data: sellerProfile } = useQuery({
    queryKey: ["seller-profile", effectiveId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", effectiveId!)
        .single();
      return data;
    },
    enabled: !!effectiveId,
    staleTime: Infinity,
  });

  // Fetch conversations with buyer profile and latest message
  const {
    data: rawConversations = { raw: [] as any[], latestMessages: {} as Record<string, string> },
    isLoading: convsLoading,
    isError,
  } = useQuery({
    queryKey: ["seller-conversations", effectiveId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select(
          "id, subject, last_message_at, seller_unread_count, status, buyer_id, product_id, profiles!conversations_buyer_id_fkey(full_name, email)"
        )
        .eq("seller_id", effectiveId!)
        .order("last_message_at", { ascending: false });
      if (error) throw error;

      // Fetch latest message for each conversation in parallel
      const convIds = (data || []).map((c: any) => c.id);
      let latestMessages: Record<string, string> = {};
      if (convIds.length > 0) {
        const { data: msgs } = await supabase
          .from("conversation_messages")
          .select("conversation_id, content, created_at")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: false });

        if (msgs) {
          for (const msg of msgs) {
            if (!latestMessages[msg.conversation_id]) {
              latestMessages[msg.conversation_id] = msg.content;
            }
          }
        }
      }

      return { raw: data || [], latestMessages };
    },
    enabled: !!effectiveId,
  });

  const conversations: ConversationItem[] = (rawConversations.raw || []).map(
    (conv: any): ConversationItem => ({
      id: conv.id,
      buyerName: conv.profiles?.full_name || conv.profiles?.email || "Buyer",
      subject: conv.subject,
      lastMessagePreview: (rawConversations.latestMessages || {})[conv.id] || null,
      lastMessageAt: conv.last_message_at,
      unreadCount: conv.seller_unread_count || 0,
    })
  );

  // Show error toast
  useEffect(() => {
    if (isError) toast.error("Failed to load conversations");
  }, [isError]);

  // Realtime: listen for conversation updates
  useEffect(() => {
    if (!effectiveId) return;
    const channel = supabase
      .channel("seller-conv-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `seller_id=eq.${effectiveId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["seller-conversations", effectiveId],
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["seller-conversations", effectiveId],
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveId, queryClient]);

  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
    const navBase = adminViewId ? `?adminView=${adminViewId}` : "";
    navigate(`/seller/messages/${id}${navBase}`, { replace: true });
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const activeRawConv = rawConversations.raw.find((c: any) => c.id === activeConvId);
  const navBase = adminViewId ? `?adminView=${adminViewId}` : "";
  const showList = !isMobile || !activeConvId;
  const showThread = !isMobile || !!activeConvId;

  const handleBack = () => {
    setActiveConvId(null);
    navigate(`/seller/messages${navBase}`, { replace: true });
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: `/seller/dashboard${navBase}` },
          { label: "Messages" },
        ]}
      />

      {adminViewId && (
        <div className="bg-muted border border-border px-4 py-2 text-xs font-mono text-muted-foreground">
          Admin view — viewing as seller
        </div>
      )}

      <div
        className="flex border-2 border-foreground overflow-hidden"
        style={{
          height: "calc(100vh - 220px)",
          boxShadow: "4px 4px 0 0 hsl(var(--foreground))",
        }}
      >
        {/* Left panel — conversation list */}
        {showList && (
          <div
            className={`${
              isMobile ? "w-full" : "w-[350px]"
            } border-r border-border flex flex-col bg-background`}
          >
            <ConversationList
              conversations={conversations}
              isLoading={convsLoading}
              activeConvId={activeConvId}
              onSelect={handleSelectConversation}
            />
          </div>
        )}

        {/* Right panel — placeholder / selected conversation header */}
        {showThread && (
          <div className="flex-1 flex flex-col bg-background">
            {activeConvId && activeConv && activeRawConv ? (
              <ConversationThread
                conversationId={activeConvId}
                sellerId={effectiveId!}
                buyerName={activeConv.buyerName}
                subject={activeConv.subject}
                productId={activeRawConv.product_id}
                status={activeRawConv.status}
                isMobile={isMobile}
                onBack={handleBack}
              />
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
