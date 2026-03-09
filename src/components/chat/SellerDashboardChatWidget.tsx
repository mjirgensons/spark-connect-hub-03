import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, ArrowUp, Mic, MicOff } from "lucide-react";
import { useChatSession, type ChatMessage } from "./useChatSession";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceInput } from "./useVoiceInput";
import VoiceLangSelector, { useVoiceLang } from "./VoiceLangSelector";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SellerAIConsentModal from "@/components/seller/SellerAIConsentModal";

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
            animation: `seller-chat-bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
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

/* ── Message bubble ── */
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div className={`group flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`px-3 py-2 text-sm font-sans leading-relaxed max-w-[80%] border-2 ${
          isSystem
            ? "border-destructive bg-destructive/10 text-foreground"
            : isUser
            ? "border-foreground bg-foreground text-background"
            : "border-foreground bg-background text-foreground"
        }`}
        style={{ borderRadius: 0 }}
      >
        {message.content}
      </div>
      <Timestamp date={message.timestamp} />
    </div>
  );
}

const INTRO_MESSAGE = "Hi! I'm your AI Personal Assistant. Ask me anything about your products, store setup, or FitMatch platform features.";

export default function SellerDashboardChatWidget({ sellerId }: { sellerId: string }) {
  const [open, setOpen] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [personalEnabled, setPersonalEnabled] = useState<boolean | null>(null);
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [sellerProfile, setSellerProfile] = useState<{ full_name: string; company_name: string | null; email: string } | null>(null);
  const [consentRecord, setConsentRecord] = useState<{ consent_at: string | null } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const openAfterConsentRef = useRef(false);

  // Fetch consent & enabled state
  useEffect(() => {
    if (!sellerId) return;
    const fetch = async () => {
      const [profileRes, consentRes] = await Promise.all([
        supabase.from("profiles").select("personal_assistant_enabled, full_name, company_name, email" as any).eq("id", sellerId).single(),
        (supabase as any).from("seller_ai_consents").select("consent_given, consent_at").eq("seller_id", sellerId).eq("consent_type", "personal_assistant").maybeSingle(),
      ]);
      const p = profileRes.data as any;
      setPersonalEnabled(!!p?.personal_assistant_enabled);
      setSellerProfile(p ? { full_name: p.full_name || "", company_name: p.company_name || null, email: p.email || "" } : null);
      setConsentGiven(!!consentRes.data?.consent_given);
      setConsentRecord(consentRes.data || null);
    };
    fetchData();

    // Listen for state changes from the card component
    const handler = () => fetchData();
    window.addEventListener("seller-assistant-state-changed", handler);
    return () => window.removeEventListener("seller-assistant-state-changed", handler);
  }, [sellerId]);

  const {
    messages,
    loading,
    sendMessage,
    addMessage,
  } = useChatSession({
    sellerId,
    sellerName: "FitMatch AI",
    productId: "",
    userRole: "seller",
    authenticatedUserId: user?.id ?? null,
  });

  // Show custom intro on first open
  const introShown = useRef(false);
  useEffect(() => {
    if (open && !introShown.current) {
      introShown.current = true;
      addMessage(INTRO_MESSAGE, "assistant");
    }
  }, [open, addMessage]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input on open (desktop)
  useEffect(() => {
    if (open && window.innerWidth >= 768) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Auto-focus after bot response (desktop)
  useEffect(() => {
    if (!open) return;
    if (window.innerWidth < 768) return;
    const last = messages[messages.length - 1];
    if (last && last.role === "assistant") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const [draft, setDraft] = useState("");
  const prefixRef = useRef("");
  const voiceLang = useVoiceLang();

  const { isSupported: voiceSupported, isListening, startListening, stopListening } = useVoiceInput({
    lang: voiceLang.bcp47,
    onTranscript: useCallback((text: string) => {
      setDraft(prefixRef.current ? prefixRef.current + " " + text : text);
      prefixRef.current = "";
    }, []),
    onInterim: useCallback((text: string) => {
      setDraft(prefixRef.current ? prefixRef.current + " " + text : text);
    }, []),
  });

  // Auto-resize textarea
  useEffect(() => {
    if (!inputRef.current) return;
    const el = inputRef.current;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
    el.scrollTop = el.scrollHeight;
  }, [draft]);

  const handleSend = useCallback(() => {
    if (!draft.trim() || loading) return;
    sendMessage(draft);
    setDraft("");
    if (inputRef.current) inputRef.current.style.height = "40px";
    if (window.innerWidth >= 768) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
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

  // Handle bubble click — if no consent, show consent modal; otherwise open widget
  const handleBubbleClick = () => {
    if (!consentGiven || !personalEnabled) {
      if (!consentGiven) {
        openAfterConsentRef.current = true;
        setShowConsent(true);
        return;
      }
      // Consent given but not enabled — re-enable
      enablePersonalAssistant();
      return;
    }
    setOpen(true);
  };

  const enablePersonalAssistant = async () => {
    const { error } = await supabase.from("profiles").update({ personal_assistant_enabled: true } as any).eq("id", sellerId);
    if (error) { toast.error("Failed to enable assistant"); return; }
    setPersonalEnabled(true);
    setOpen(true);
  };

  const handleConsentAccepted = async (consentText: string) => {
    // Save consent
    const { error } = await (supabase as any).from("seller_ai_consents").upsert({
      seller_id: sellerId,
      consent_type: "personal_assistant",
      consent_given: true,
      consent_at: new Date().toISOString(),
      consent_text: consentText,
    }, { onConflict: "seller_id,consent_type" });
    if (error) { toast.error("Failed to save consent"); return; }
    setConsentGiven(true);
    setConsentRecord({ consent_at: new Date().toISOString() });
    toast.success("Personal Assistant consent accepted");

    // Auto-enable
    await enablePersonalAssistant();

    // Open widget if triggered from bubble
    if (openAfterConsentRef.current) {
      openAfterConsentRef.current = false;
      setOpen(true);
    }
  };

  // Don't render anything until we know the state
  if (personalEnabled === null || consentGiven === null) return null;

  // Widget is fully active
  const isActive = personalEnabled && consentGiven;

  return (
    <>
      <style>{`
        @keyframes seller-chat-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}
        @keyframes seller-chat-panel-in{from{opacity:0;transform:scale(0.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes seller-chat-entrance{0%{transform:scale(0)}60%{transform:scale(1.1)}100%{transform:scale(1)}}
      `}</style>

      {/* Launcher — always visible for sellers */}
      {!open && (
        <button
          onClick={handleBubbleClick}
          aria-label="Open AI assistant"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-foreground text-background flex items-center justify-center rounded-full"
          style={{
            boxShadow: "4px 4px 0px hsl(var(--foreground))",
            animation: "seller-chat-entrance 400ms ease-out",
          }}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Panel — only when active and open */}
      {open && isActive && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Seller AI assistant"
          className="fixed bottom-6 right-6 z-50 flex flex-col bg-background border-2 border-foreground"
          style={{
            width: 400,
            height: 520,
            borderRadius: 0,
            boxShadow: "8px 8px 0px hsl(var(--foreground))",
            animation: "seller-chat-panel-in 200ms ease-out",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between h-12 px-4 bg-foreground text-background shrink-0">
            <span className="font-bold text-sm font-sans truncate">Personal Assistant</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-background hover:opacity-70 transition-opacity">
              <X className="w-5 h-5" />
            </button>
          </div>

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
          <div className="shrink-0 min-h-[56px] h-auto border-t-2 border-foreground p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your products, setup..."
                rows={1}
                spellCheck={false}
                autoCorrect="off"
                autoComplete="off"
                className="flex-1 resize-none border-2 border-foreground bg-background px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-foreground/30 placeholder:text-muted-foreground"
                style={{ borderRadius: 0, minHeight: 40, maxHeight: 120, overflow: "auto" }}
              />

              {/* Voice lang selector */}
              {voiceSupported && <VoiceLangSelector value={voiceLang.lang} onChange={voiceLang.select} />}

              {/* Mic button */}
              {voiceSupported && (
                <button
                  onClick={handleMicToggle}
                  aria-label={isListening ? "Stop listening" : "Start voice input"}
                  className={`shrink-0 w-9 h-9 flex items-center justify-center border-2 border-foreground transition-colors ${
                    isListening ? "bg-destructive text-destructive-foreground" : "bg-background text-foreground hover:bg-muted"
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!draft.trim() || loading}
                aria-label="Send message"
                className="shrink-0 w-9 h-9 bg-foreground text-background flex items-center justify-center border-2 border-foreground disabled:opacity-40 hover:opacity-80 transition-opacity"
                style={{ borderRadius: 0 }}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consent Modal */}
      <SellerAIConsentModal
        open={showConsent}
        onOpenChange={(o) => {
          if (!o) {
            setShowConsent(false);
            openAfterConsentRef.current = false;
          }
        }}
        sellerName={sellerProfile?.full_name || ""}
        sellerBusinessName={sellerProfile?.company_name || ""}
        sellerEmail={sellerProfile?.email || ""}
        alreadyAccepted={consentGiven}
        acceptedAt={consentRecord?.consent_at}
        onAccepted={handleConsentAccepted}
        sellerId={sellerId}
        consentType="personal_assistant"
      />
    </>
  );
}
