import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface UseChatSessionOptions {
  sellerId?: string;
  sellerName?: string;
  productId?: string;
  userRole?: string;
  authenticatedUserId?: string | null;
}

function generateId() {
  return crypto.randomUUID();
}

export function useChatSession({ sellerId = "", sellerName = "FitMatch", productId = "", userRole = "guest", authenticatedUserId }: UseChatSessionOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [consented, setConsented] = useState(() => sessionStorage.getItem("fitmatch_chat_consent") === "true");
  const sessionIdRef = useRef<string>(generateId());
  const introShownRef = useRef(false);
  const chatContextKey = sellerId || "platform";
  const [aiResponseCount, setAiResponseCount] = useState<number>(() => {
    const stored = sessionStorage.getItem(`fitmatch_chat_response_count_${chatContextKey}`);
    return stored ? parseInt(stored, 10) : 0;
  });

  const grantConsent = useCallback(() => {
    sessionStorage.setItem("fitmatch_chat_consent", "true");
    setConsented(true);
  }, []);

  const showIntro = useCallback(() => {
    if (introShownRef.current) return;
    introShownRef.current = true;
    const introText = sellerId
      ? `Hi! I'm the AI Storefront Assistant for ${sellerName}. Ask me anything about this product — dimensions, materials, delivery, or pricing.`
      : `Hi! I'm the FitMatch AI Assistant. Ask me anything about our products, materials, delivery, or how FitMatch works.`;
    setMessages([
      {
        id: generateId(),
        role: "assistant",
        content: introText,
        timestamp: new Date(),
      },
    ]);
  }, [sellerName, sellerId]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const metadata: Record<string, any> = {
          user_role: userRole || (authenticatedUserId ? "registered" : "guest"),
          page_url: window.location.href,
        };
        if (authenticatedUserId) {
          metadata.buyer_id = authenticatedUserId;
        }

        const payload: Record<string, any> = {
          chatInput: trimmed,
          sessionId: sessionIdRef.current,
          chatbot_mode: sellerId ? "buyer_inquiry" : "platform_wide",
          user_role: userRole || (authenticatedUserId ? "registered" : "guest"),
          metadata,
        };
        if (sellerId) {
          payload.sellerId = sellerId;
        }
        if (productId) {
          payload.productId = productId;
        }

        const { data, error } = await supabase.functions.invoke("chatbot-proxy", {
          body: {
            webhookPath: "/webhook/seller-chatbot",
            payload,
          },
        });

        if (error) throw error;

        const aiText = data?.output ?? data?.response ?? data?.text ?? "I wasn't able to generate a response. Please try again.";

        const newCount = aiResponseCount + 1;
        setAiResponseCount(newCount);
        sessionStorage.setItem(`fitmatch_chat_response_count_${sellerId}`, String(newCount));

        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "assistant",
            content: aiText,
            timestamp: new Date(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "system",
            content: "Something went wrong. Please try again.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, sellerId, productId, userRole, authenticatedUserId, aiResponseCount]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    sessionIdRef.current = generateId();
    introShownRef.current = false;
  }, []);

  const addMessage = useCallback((content: string, role: "assistant" | "system" = "assistant") => {
    setMessages((prev) => [
      ...prev,
      { id: generateId(), role, content, timestamp: new Date() },
    ]);
  }, []);

  return {
    messages,
    loading,
    consented,
    grantConsent,
    showIntro,
    sendMessage,
    resetChat,
    addMessage,
    aiResponseCount,
    sessionId: sessionIdRef.current,
  };
}
