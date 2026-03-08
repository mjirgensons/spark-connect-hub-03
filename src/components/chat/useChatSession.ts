import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface UseChatSessionOptions {
  sellerId: string;
  sellerName: string;
  productId: string;
  userRole: string;
  authenticatedUserId?: string | null;
}

function generateId() {
  return crypto.randomUUID();
}

export function useChatSession({ sellerId, sellerName, productId, userRole }: UseChatSessionOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [consented, setConsented] = useState(() => sessionStorage.getItem("fitmatch_chat_consent") === "true");
  const sessionIdRef = useRef<string>(generateId());
  const introShownRef = useRef(false);

  const grantConsent = useCallback(() => {
    sessionStorage.setItem("fitmatch_chat_consent", "true");
    setConsented(true);
  }, []);

  const showIntro = useCallback(() => {
    if (introShownRef.current) return;
    introShownRef.current = true;
    setMessages([
      {
        id: generateId(),
        role: "assistant",
        content: `Hi! I'm the AI assistant for ${sellerName}. Ask me anything about this product — dimensions, materials, delivery, or pricing.`,
        timestamp: new Date(),
      },
    ]);
  }, [sellerName]);

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
        const { data, error } = await supabase.functions.invoke("chatbot-proxy", {
          body: {
            webhookPath: "/webhook/seller-chatbot",
            payload: {
              chatInput: trimmed,
              sessionId: sessionIdRef.current,
              sellerId,
              productId,
              metadata: {
                user_role: userRole,
                page_url: window.location.href,
              },
            },
          },
        });

        if (error) throw error;

        const aiText = data?.output ?? data?.response ?? data?.text ?? "I wasn't able to generate a response. Please try again.";

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
    [loading, sellerId, productId, userRole]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    sessionIdRef.current = generateId();
    introShownRef.current = false;
  }, []);

  return {
    messages,
    loading,
    consented,
    grantConsent,
    showIntro,
    sendMessage,
    resetChat,
  };
}
