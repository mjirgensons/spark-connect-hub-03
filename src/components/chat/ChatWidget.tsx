import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, ArrowUp, ExternalLink, Mic, MicOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChatSession, type ChatMessage } from "./useChatSession";
import ChatConsentModal from "./ChatConsentModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceInput } from "./useVoiceInput";

interface ChatWidgetProps {
  sellerId: string;
  sellerName: string;
  productId: string;
  userRole: string;
  skipConsent?: boolean;
  chatbotActive?: boolean;
}

/* ── Typing indicator ── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-2 border-foreground bg-background max-w-[80%]" style={{ borderRadius: 0 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-foreground inline-block"
          style={{
            borderRadius: "50%",
            animation: `chat-bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Timestamp ── */
function Timestamp({ date }: { date: Date }) {
  const t = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{t}</span>;
}

/* ── Inactive chatbot body ── */
function InactiveChatBody({ sellerId, productId, productName }: { sellerId: string; productId: string; productName: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleContactSeller = async () => {
    if (!user) {
      navigate(`/login?redirect=/product/${productId}`);
      return;
    }
    // Reuse ContactSellerButton logic
    try {
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("product_id", productId)
        .eq("buyer_id", user.id)
        .eq("seller_id", sellerId)
        .maybeSingle();

      if (existing) {
        navigate(`/messages/${existing.id}`);
        return;
      }

      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          product_id: productId,
          buyer_id: user.id,
          seller_id: sellerId,
          subject: productName || "Product inquiry",
        })
        .select("id")
        .single();

      if (error) throw error;
      navigate(`/messages/${newConv.id}`);
    } catch {
      navigate("/messages");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center gap-4">
      <MessageCircle className="w-10 h-10 text-muted-foreground" />
      <div className="space-y-2">
        <p className="font-sans font-bold text-sm text-foreground">AI Assistant Not Available</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The seller has not yet activated the AI assistant for this product.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You can message the seller directly for questions about dimensions, materials, pricing, or delivery.
        </p>
      </div>
      <Button
        variant="outline"
        className="border-2 border-foreground mt-2"
        style={{ borderRadius: 0 }}
        onClick={handleContactSeller}
      >
        Message Seller <ExternalLink className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

export default function ChatWidget({ sellerId, sellerName, productId, userRole, skipConsent = false, chatbotActive = true }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [launcherIcon, setLauncherIcon] = useState<"chat" | "mic">("chat");
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { messages, loading, consented, grantConsent, showIntro, sendMessage, resetChat } = useChatSession({
    sellerId,
    sellerName,
    productId,
    userRole,
  });

  /* auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* focus input on open */
  useEffect(() => {
    if (open && consented && chatbotActive) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, consented, chatbotActive]);

  /* auto-grant consent when skipConsent is true */
  useEffect(() => {
    if (skipConsent && !consented) grantConsent();
  }, [skipConsent, consented, grantConsent]);

  /* show intro after consent */
  useEffect(() => {
    if (open && consented && chatbotActive) showIntro();
  }, [open, consented, chatbotActive, showIntro]);

  /* unread dot */
  useEffect(() => {
    if (!open && consented && chatbotActive) setHasUnread(true);
  }, [consented]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Escape to close */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  /* focus trap */
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  /* Track missed attempt when inactive widget is opened */
  const trackMissedAttempt = useCallback(() => {
    if (chatbotActive) return;
    const key = `fitmatch_missed_attempt_${sellerId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase
      .from("chatbot_missed_attempts" as any)
      .insert({ seller_id: sellerId, product_id: productId, page_url: window.location.href } as any)
      .then(() => {});
  }, [chatbotActive, sellerId, productId]);

  /* Launcher icon rotation — stop after first open */
  useEffect(() => {
    if (hasOpened) return;
    const interval = setInterval(() => {
      setLauncherIcon((prev) => (prev === "chat" ? "mic" : "chat"));
    }, 2000);
    return () => clearInterval(interval);
  }, [hasOpened]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setHasOpened(true);
    setHasUnread(false);
    if (!chatbotActive) trackMissedAttempt();
  }, [chatbotActive, trackMissedAttempt]);

  const handleClose = useCallback(() => setOpen(false), []);

  const handleConsent = useCallback(() => {
    grantConsent();
    showIntro();
  }, [grantConsent, showIntro]);

  const handleDecline = useCallback(() => setOpen(false), []);

  const [draft, setDraft] = useState("");

  const prefixRef = useRef("");

  const { isSupported: voiceSupported, isListening, startListening, stopListening } = useVoiceInput({
    onTranscript: useCallback((text: string) => {
      setDraft(prefixRef.current ? prefixRef.current + " " + text : text);
      prefixRef.current = "";
    }, []),
    onInterim: useCallback((text: string) => {
      setDraft(prefixRef.current ? prefixRef.current + " " + text : text);
    }, []),
  });

  const handleSend = useCallback(() => {
    if (!draft.trim() || loading) return;
    sendMessage(draft);
    setDraft("");
  }, [draft, loading, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      prefixRef.current = draft.trim();
      startListening();
    }
  }, [isListening, startListening, stopListening, draft]);

  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes chat-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}
        @keyframes chatPulse{0%{box-shadow:0 0 0 0 rgba(0,0,0,0.4)}70%{box-shadow:0 0 0 12px rgba(0,0,0,0)}100%{box-shadow:0 0 0 0 rgba(0,0,0,0)}}
        @keyframes chatEntrance{0%{transform:scale(0)}60%{transform:scale(1.1)}100%{transform:scale(1)}}
        @keyframes mic-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(1.08)}}
        @keyframes mic-ring{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.6);opacity:0}}
        @keyframes launcherShadow{0%,100%{box-shadow:4px 4px 0px hsl(var(--foreground))}50%{box-shadow:4px 4px 12px hsl(var(--foreground)/0.5)}}
      `}</style>

      {/* Launcher */}
      {!open && (
        <button
          onClick={handleOpen}
          aria-label="Open chat"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-foreground text-background flex items-center justify-center rounded-full"
          style={{
            boxShadow: "4px 4px 0px hsl(var(--foreground))",
            animation: hasOpened
              ? "chatEntrance 400ms ease-out"
              : "chatEntrance 400ms ease-out, launcherShadow 3s 400ms ease-in-out infinite",
          }}
        >
          <span className="relative w-6 h-6">
            <MessageCircle
              className="w-6 h-6 absolute inset-0 transition-opacity duration-300"
              style={{ opacity: hasOpened || launcherIcon === "chat" ? 1 : 0 }}
            />
            {!hasOpened && (
              <Mic
                className="w-6 h-6 absolute inset-0 transition-opacity duration-300"
                style={{ opacity: launcherIcon === "mic" ? 1 : 0 }}
              />
            )}
          </span>
          {hasUnread && chatbotActive && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-destructive rounded-full" />
          )}
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Chat with AI assistant"
          className="fixed bottom-6 right-6 z-50 flex flex-col bg-background border-2 border-foreground"
          style={{
            width: 400,
            height: 520,
            borderRadius: 0,
            boxShadow: "8px 8px 0px hsl(var(--foreground))",
            animation: "chat-panel-in 200ms ease-out",
          }}
        >
          <style>{`
            @keyframes chat-panel-in{from{opacity:0;transform:scale(0.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
            @media(prefers-reduced-motion:reduce){.chat-panel-in{animation:none!important}}
          `}</style>

          {/* Header */}
          <div className="flex items-center justify-between h-12 px-4 bg-foreground text-background shrink-0">
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm font-sans truncate">{sellerName}</span>
              {!chatbotActive && (
                <span className="text-xs opacity-60 font-sans">AI Assistant · Offline</span>
              )}
            </div>
            <button onClick={handleClose} aria-label="Close chat" className="text-background hover:opacity-70 transition-opacity">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          {!chatbotActive ? (
            <InactiveChatBody sellerId={sellerId} productId={productId} productName={sellerName} />
          ) : !consented ? (
            <ChatConsentModal onAccept={handleConsent} onDecline={handleDecline} />
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="px-4 py-3 space-y-3">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <TypingDots />
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="shrink-0 border-t-2 border-foreground p-3">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    placeholder="Ask about this product..."
                    className="flex-1 h-9 px-3 text-sm font-sans bg-background text-foreground border-2 border-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                    style={{ borderRadius: 0 }}
                  />
                  {voiceSupported && (
                    <div className="relative shrink-0 flex items-center justify-center" style={{ width: 44, height: 44 }}>
                      {isListening && (
                        <span
                          className="absolute inset-0 rounded-full bg-destructive"
                          style={{ animation: "mic-ring 1.5s ease-out infinite" }}
                        />
                      )}
                      <button
                        onClick={handleMicToggle}
                        disabled={loading}
                        aria-label={isListening ? "Stop listening" : "Start voice input"}
                        className={`relative z-10 w-9 h-9 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all disabled:opacity-40 ${
                          isListening
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleSend}
                    disabled={loading || !draft.trim()}
                    aria-label="Send message"
                    className="w-9 h-9 flex items-center justify-center bg-foreground text-background rounded-full shrink-0 disabled:opacity-40 hover:opacity-80 transition-opacity"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
                {isListening && (
                  <p className="text-xs text-muted-foreground mt-1.5 animate-pulse">Listening...</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

/* ── Message bubble ── */
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div className={`group flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`px-3 py-2 text-sm font-sans max-w-[80%] whitespace-pre-wrap ${
          isSystem
            ? "bg-destructive/10 text-foreground border-2 border-destructive"
            : isUser
            ? "bg-foreground text-background"
            : "bg-background text-foreground border-2 border-foreground"
        }`}
        style={{ borderRadius: 0 }}
      >
        {message.content}
      </div>
      <Timestamp date={message.timestamp} />
    </div>
  );
}
