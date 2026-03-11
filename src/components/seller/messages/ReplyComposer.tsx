import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReplyComposerProps {
  conversationId: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  conversationStatus: string | null;
}

const WEBHOOK_URL = "https://sundeco.app.n8n.cloud/webhook/conversation-reply-notify";

const ReplyComposer = ({
  conversationId,
  sellerId,
  sellerName,
  buyerId,
  buyerName,
  buyerEmail,
  conversationStatus,
}: ReplyComposerProps) => {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 24;
    const minH = lineHeight * 2;
    const maxH = lineHeight * 6;
    el.style.height = `${Math.min(Math.max(el.scrollHeight, minH), maxH)}px`;
  }, [text]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      // Insert message
      const { error: msgErr } = await supabase
        .from("conversation_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: sellerId,
          content,
          is_read: false,
        });
      if (msgErr) throw msgErr;

      // Update conversation — set last_message_at, increment buyer unread, reopen if resolved
      const updates: Record<string, any> = {
        last_message_at: new Date().toISOString(),
      };
      if (conversationStatus === "resolved") {
        updates.status = "active";
      }

      // Use RPC-style increment via raw update
      const { data: convData } = await supabase
        .from("conversations")
        .select("buyer_unread_count, first_response_at, created_at")
        .eq("id", conversationId)
        .single();

      updates.buyer_unread_count = ((convData?.buyer_unread_count as number) || 0) + 1;

      // Track first response time
      if (convData && !(convData as any).first_response_at) {
        const now = new Date();
        updates.first_response_at = now.toISOString();
        const createdAt = new Date(convData.created_at as string);
        updates.response_time_seconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
      }

      await supabase
        .from("conversations")
        .update(updates)
        .eq("id", conversationId);

      // Fire-and-forget webhook notification to buyer
      const preview = content.length > 150 ? content.slice(0, 150) + "…" : content;
      fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-secret": "fitmatch-n8n-secret-2026",
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          sender_name: sellerName,
          sender_role: "seller",
          recipient_email: buyerEmail,
          recipient_name: buyerName,
          recipient_role: "buyer",
          message_preview: preview,
        }),
      }).catch(() => {});

      setText("");

      // Invalidate queries so realtime + list update
      queryClient.invalidateQueries({ queryKey: ["seller-conv-messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["seller-conversations"] });
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border p-3 bg-background shrink-0">
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your reply..."
          className="resize-none min-h-[48px] max-h-[144px] text-sm"
          rows={2}
        />
        <Button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          size="icon"
          className="shrink-0 h-10 w-10"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <SendHorizontal className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReplyComposer;
