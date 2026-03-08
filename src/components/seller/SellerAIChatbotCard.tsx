import { useState, useEffect } from "react";
import { Bot, CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Props {
  sellerId: string;
}

export default function SellerAIChatbotCard({ sellerId }: Props) {
  const [chatbotEnabled, setChatbotEnabled] = useState(false);
  const [kbCount, setKbCount] = useState(0);
  const [syncedProductCount, setSyncedProductCount] = useState(0);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [missedAttemptCount, setMissedAttemptCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    const fetchData = async () => {
      setLoading(true);
      const profileRes = await supabase
        .from("profiles")
        .select("ai_chatbot_enabled, seller_ai_consent_accepted")
        .eq("id", sellerId)
        .single();
      const kbRes = await (supabase as any)
        .from("seller_knowledge_base")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", sellerId);
      const prodRes = await (supabase as any)
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", sellerId)
        .eq("pinecone_synced", true);
      const missedRes = await (supabase as any)
        .from("chatbot_missed_attempts")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", sellerId);

      const profile = profileRes.data as any;
      setChatbotEnabled(!!profile?.ai_chatbot_enabled);
      setConsentAccepted(!!profile?.seller_ai_consent_accepted);
      setKbCount(kbRes.count ?? 0);
      setSyncedProductCount(prodRes.count ?? 0);
      setMissedAttemptCount(missedRes.count ?? 0);
      setLoading(false);
    };
    fetchData();
  }, [sellerId]);

  const hasKb = kbCount >= 3;
  const hasSyncedProducts = syncedProductCount > 0;
  const allChecks = hasKb && hasSyncedProducts && consentAccepted;
  const enabledButIncomplete = chatbotEnabled && !allChecks;

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      if (!consentAccepted) {
        setShowConsent(true);
        return;
      }
      if (!allChecks) {
        toast.error("Complete all checklist items before enabling");
        return;
      }
      await updateEnabled(true);
    } else {
      await updateEnabled(false);
    }
  };

  const updateEnabled = async (value: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ ai_chatbot_enabled: value } as any)
      .eq("id", sellerId);
    if (error) {
      toast.error("Failed to update chatbot setting");
      return;
    }
    setChatbotEnabled(value);
    toast.success(value ? "AI Chatbot enabled" : "AI Chatbot disabled");
  };

  const handleConsentAccept = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({ seller_ai_consent_accepted: true } as any)
      .eq("id", sellerId);
    if (error) {
      toast.error("Failed to save consent");
      return;
    }
    setConsentAccepted(true);
    setShowConsent(false);
    if (hasKb && hasSyncedProducts) {
      await updateEnabled(true);
    }
  };

  if (loading) return null;

  const isLive = chatbotEnabled && allChecks;

  const checklist = [
    { ok: hasKb, label: "Add at least 3 Knowledge Base articles" },
    { ok: hasSyncedProducts, label: "Products synced to AI" },
    {
      ok: consentAccepted,
      label: "Review and accept AI consent terms",
      clickable: !consentAccepted,
    },
  ];

  return (
    <>
      <div
        className="bg-background border-2 border-foreground w-full"
        style={{ boxShadow: "4px 4px 0px hsl(var(--foreground))" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-4 border-b-2 border-foreground">
          <div className="flex items-center gap-3 min-w-0">
            <Bot className="w-5 h-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-sans font-bold text-lg leading-tight">AI Chatbot</p>
              {isLive ? (
                <span
                  className="inline-block mt-1 text-xs font-bold px-2 py-0.5 text-background"
                  style={{ backgroundColor: "hsl(142, 71%, 45%)" }}
                >
                  LIVE
                </span>
              ) : (
                <span
                  className="inline-block mt-1 text-xs font-bold px-2 py-0.5 text-background"
                  style={{ backgroundColor: "hsl(0, 84%, 60%)" }}
                >
                  OFFLINE
                </span>
              )}
            </div>
          </div>
          <Switch
            checked={chatbotEnabled}
            disabled={!allChecks && !chatbotEnabled}
            onCheckedChange={handleToggle}
          />
        </div>

        {/* ── Setup Checklist ── */}
        <div className="p-4">
          {enabledButIncomplete && (
            <div className="flex items-center gap-2 text-amber-700 mb-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">Chatbot is enabled but setup is incomplete</span>
            </div>
          )}

          <p className="text-sm font-semibold mb-3">Setup Checklist</p>
          <div className="space-y-3">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                {item.ok ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 shrink-0 text-muted-foreground/40" />
                )}
                {item.clickable ? (
                  <button
                    className="text-sm underline text-foreground hover:opacity-70 transition-opacity text-left"
                    onClick={() => setShowConsent(true)}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="text-sm">{item.label}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Missed Attempts Callout ── */}
        {!chatbotEnabled && missedAttemptCount > 0 && (
          <div className="mx-4 mb-4 border-t border-muted pt-4">
            <div
              className="flex items-center gap-2 p-3 border-2"
              style={{
                backgroundColor: "hsl(48, 96%, 95%)",
                borderColor: "hsl(45, 93%, 47%)",
              }}
            >
              <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "hsl(25, 95%, 53%)" }} />
              <span className="text-sm" style={{ color: "hsl(25, 95%, 26%)" }}>
                <strong>{missedAttemptCount}</strong> buyer{missedAttemptCount === 1 ? "" : "s"} tried to chat about your products but your AI assistant was offline.
              </span>
            </div>
          </div>
        )}

        {/* ── Action Row ── */}
        <div className="p-4 border-t-2 border-foreground text-center">
          {isLive ? (
            <>
              <p className="text-xs text-green-600 mb-2">Your AI assistant is live on your product pages</p>
              <div className="flex items-center justify-center gap-2">
                <Link
                  to="/seller/knowledge-base"
                  className="inline-flex items-center justify-center h-9 px-4 text-sm font-sans font-bold bg-foreground text-background hover:opacity-80 transition-opacity"
                  style={{ boxShadow: "2px 2px 0px hsl(var(--foreground))" }}
                >
                  Manage Knowledge Base
                </Link>
                <Link
                  to="/seller/analytics"
                  className="inline-flex items-center justify-center h-9 px-4 text-sm font-sans font-bold bg-background text-foreground border-2 border-foreground hover:opacity-80 transition-opacity"
                >
                  View Chat Analytics
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-2">Complete all steps above to activate your AI assistant</p>
              <Link
                to="/seller/knowledge-base"
                className="inline-flex items-center justify-center h-9 px-4 text-sm font-sans font-bold bg-foreground text-background hover:opacity-80 transition-opacity"
                style={{ boxShadow: "2px 2px 0px hsl(var(--foreground))" }}
              >
                Manage Knowledge Base
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Consent Modal ── */}
      <AlertDialog open={showConsent} onOpenChange={setShowConsent}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>AI Chatbot Consent</AlertDialogTitle>
            <AlertDialogDescription>
              By enabling the AI Chatbot, I acknowledge that I am responsible for the accuracy of
              information in my Knowledge Base. FitMatch's AI assistant will use this information to
              answer buyer questions about my products. I understand that inaccurate information may
              affect buyer trust and my seller reputation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConsentAccept}>
              I Accept &amp; Enable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
