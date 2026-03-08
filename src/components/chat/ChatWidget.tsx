import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, ArrowUp } from "lucide-react";
import { useChatSession, type ChatMessage } from "./useChatSession";
import ChatConsentModal from "./ChatConsentModal";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatWidgetProps {
  sellerId: string;
  sellerName: string;
  productId: string;
  userRole: string;
  skipConsent?: boolean;
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

export default function ChatWidget({ sellerId, sellerName, productId, userRole, skipConsent = false }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
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
    if (open && consented) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, consented]);

  /* show intro after consent */
  useEffect(() => {
    if (open && consented) showIntro();
  }, [open, consented, showIntro]);

  /* unread dot */
  useEffect(() => {
    if (!open && consented) setHasUnread(true);
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

  const handleOpen = useCallback(() => {
    setOpen(true);
    setHasUnread(false);
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);

  const handleConsent = useCallback(() => {
    grantConsent();
    showIntro();
  }, [grantConsent, showIntro]);

  const handleDecline = useCallback(() => setOpen(false), []);

  const [draft, setDraft] = useState("");
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

  return (
    <>
      {/* Bounce keyframes injected once */}
      <style>{`@keyframes chat-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}`}</style>

      {/* Launcher */}
      {!open && (
        <button
          onClick={handleOpen}
          aria-label="Open chat with AI assistant"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-foreground text-background flex items-center justify-center rounded-full"
          style={{ boxShadow: "4px 4px 0px hsl(var(--foreground))" }}
        >
          <MessageCircle className="w-6 h-6" />
          {hasUnread && (
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
            <span className="font-bold text-sm font-sans truncate">{sellerName}</span>
            <button onClick={handleClose} aria-label="Close chat" className="text-background hover:opacity-70 transition-opacity">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          {!consented ? (
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
              <div className="shrink-0 border-t-2 border-foreground p-3 flex items-center gap-2">
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
                <button
                  onClick={handleSend}
                  disabled={loading || !draft.trim()}
                  aria-label="Send message"
                  className="w-9 h-9 flex items-center justify-center bg-foreground text-background rounded-full shrink-0 disabled:opacity-40 hover:opacity-80 transition-opacity"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
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
