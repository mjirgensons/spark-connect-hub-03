import { useState, useEffect } from "react";
import { Bot, CheckCircle2, Circle, AlertTriangle, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import SellerAIConsentModal from "./SellerAIConsentModal";

interface Props {
  sellerId: string;
}

interface ConsentRecord {
  consent_type: string;
  consent_given: boolean;
  consent_at: string | null;
}

export default function SellerAIChatbotCard({ sellerId }: Props) {
  const [storefrontEnabled, setStorefrontEnabled] = useState(false);
  const [personalEnabled, setPersonalEnabled] = useState(false);
  const [kbCount, setKbCount] = useState(0);
  const [syncedProductCount, setSyncedProductCount] = useState(0);
  const [storefrontConsent, setStorefrontConsent] = useState<ConsentRecord | null>(null);
  const [personalConsent, setPersonalConsent] = useState<ConsentRecord | null>(null);
  const [showConsentModal, setShowConsentModal] = useState<"storefront" | "personal" | null>(null);
  const [missedAttemptCount, setMissedAttemptCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [aiDescriptions, setAiDescriptions] = useState<Record<string, string>>({});
  const [sellerProfile, setSellerProfile] = useState<{
    full_name: string;
    company_name: string | null;
    email: string;
  } | null>(null);

  useEffect(() => {
    if (!sellerId) return;
    const fetchData = async () => {
      setLoading(true);

      const [profileRes, kbRes, prodRes, missedRes, consentRes, descRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("ai_chatbot_enabled, full_name, company_name, email, personal_assistant_enabled" as any)
          .eq("id", sellerId)
          .single(),
        (supabase as any)
          .from("seller_knowledge_base")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", sellerId),
        (supabase as any)
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", sellerId)
          .eq("pinecone_synced", true),
        (supabase as any)
          .from("chatbot_missed_attempts")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", sellerId),
        (supabase as any)
          .from("seller_ai_consents")
          .select("consent_type, consent_given, consent_at")
          .eq("seller_id", sellerId),
        supabase
          .from("site_settings" as any)
          .select("key, value")
          .in("key", [
            "ai_storefront_assistant_short_desc",
            "ai_storefront_assistant_full_desc",
            "ai_personal_assistant_short_desc",
            "ai_personal_assistant_full_desc",
          ]),
      ]);

      const profile = profileRes.data as any;
      setStorefrontEnabled(!!profile?.ai_chatbot_enabled);
      setPersonalEnabled(!!profile?.personal_assistant_enabled);
      setSellerProfile(profile ? {
        full_name: profile.full_name || "",
        company_name: profile.company_name || null,
        email: profile.email || "",
      } : null);

      setKbCount(kbRes.count ?? 0);
      setSyncedProductCount(prodRes.count ?? 0);
      setMissedAttemptCount(missedRes.count ?? 0);

      // Parse consents
      const consents = (consentRes.data as ConsentRecord[]) || [];
      setStorefrontConsent(consents.find(c => c.consent_type === "storefront_assistant") || null);
      setPersonalConsent(consents.find(c => c.consent_type === "personal_assistant") || null);

      if (descRes.data) {
        const map: Record<string, string> = {};
        (descRes.data as any[]).forEach((r: any) => { map[r.key] = r.value; });
        setAiDescriptions(map);
      }

      setLoading(false);
    };
    fetchData();
  }, [sellerId]);

  const hasKb = kbCount >= 3;
  const hasSyncedProducts = syncedProductCount > 0;
  const sfConsentGiven = storefrontConsent?.consent_given === true;
  const paConsentGiven = personalConsent?.consent_given === true;
  const allStorefrontChecks = hasKb && hasSyncedProducts && sfConsentGiven;

  const updateProfileField = async (field: string, value: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value } as any)
      .eq("id", sellerId);
    if (error) {
      toast.error("Failed to update setting");
      return false;
    }
    return true;
  };

  const upsertConsent = async (consentType: "storefront_assistant" | "personal_assistant") => {
    const { error } = await (supabase as any)
      .from("seller_ai_consents")
      .upsert({
        seller_id: sellerId,
        consent_type: consentType,
        consent_given: true,
        consent_at: new Date().toISOString(),
        consent_text: consentType === "storefront_assistant"
          ? "I acknowledge that the AI Storefront Assistant will interact with buyers on my behalf using my product listings and Knowledge Base articles. I am responsible for the accuracy of information in my Knowledge Base."
          : "I acknowledge that the Personal Assistant uses AI to help me manage my store. My questions and interactions are processed by AI services. I understand this assistant uses my product data and Knowledge Base articles to provide answers.",
      }, { onConflict: "seller_id,consent_type" });
    if (error) {
      toast.error("Failed to save consent");
      return false;
    }
    return true;
  };

  // Storefront toggle
  const handleStorefrontToggle = async (checked: boolean) => {
    if (checked) {
      if (!sfConsentGiven) {
        setShowConsentModal("storefront");
        return;
      }
      if (!allStorefrontChecks) {
        toast.error("Complete all checklist items before enabling");
        return;
      }
      if (await updateProfileField("ai_chatbot_enabled", true)) {
        setStorefrontEnabled(true);
        toast.success("AI Storefront Assistant enabled");
      }
    } else {
      if (await updateProfileField("ai_chatbot_enabled", false)) {
        setStorefrontEnabled(false);
        toast.success("AI Storefront Assistant disabled");
      }
    }
  };

  // Personal toggle
  const handlePersonalToggle = async (checked: boolean) => {
    if (checked) {
      if (!paConsentGiven) {
        setShowConsentModal("personal");
        return;
      }
      if (await updateProfileField("personal_assistant_enabled", true)) {
        setPersonalEnabled(true);
        toast.success("Personal Assistant enabled");
      }
    } else {
      if (await updateProfileField("personal_assistant_enabled", false)) {
        setPersonalEnabled(false);
        toast.success("Personal Assistant disabled");
      }
    }
  };

  // Consent accepted callbacks
  const handleStorefrontConsentAccepted = async () => {
    if (await upsertConsent("storefront_assistant")) {
      setStorefrontConsent({ consent_type: "storefront_assistant", consent_given: true, consent_at: new Date().toISOString() });
      toast.success("Storefront Assistant consent accepted");
      if (hasKb && hasSyncedProducts) {
        if (await updateProfileField("ai_chatbot_enabled", true)) {
          setStorefrontEnabled(true);
          toast.success("AI Storefront Assistant enabled");
        }
      }
    }
  };

  const handlePersonalConsentAccepted = async () => {
    if (await upsertConsent("personal_assistant")) {
      setPersonalConsent({ consent_type: "personal_assistant", consent_given: true, consent_at: new Date().toISOString() });
      toast.success("Personal Assistant consent accepted");
      if (await updateProfileField("personal_assistant_enabled", true)) {
        setPersonalEnabled(true);
        toast.success("Personal Assistant enabled");
      }
    }
  };

  if (loading) return null;

  const sfLive = storefrontEnabled && allStorefrontChecks;
  const paActive = personalEnabled && paConsentGiven;

  const storefrontChecklist = [
    { ok: hasKb, label: "Add at least 3 Knowledge Base articles" },
    { ok: hasSyncedProducts, label: "Products synced to AI" },
    {
      ok: sfConsentGiven,
      label: "Review and accept AI consent terms",
      clickable: true,
    },
  ];

  return (
    <>
      <div
        className="bg-background border-2 border-foreground w-full"
        style={{ boxShadow: "4px 4px 0px hsl(var(--foreground))" }}
      >
        {/* ── Card Header ── */}
        <div className="flex items-center gap-3 p-4 border-b-2 border-foreground">
          <Bot className="w-5 h-5 shrink-0" />
          <p className="font-sans font-bold text-lg leading-tight">AI Assistants</p>
        </div>

        {/* ── SECTION 1: Storefront Assistant ── */}
        <div className="p-4">
          {/* Title row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <p className="font-sans font-bold text-sm">AI Storefront Assistant</p>
              {sfLive ? (
                <span
                  className="inline-block text-[10px] font-bold px-1.5 py-0.5 text-background leading-none"
                  style={{ backgroundColor: "hsl(142, 71%, 45%)" }}
                >
                  LIVE
                </span>
              ) : (
                <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 bg-muted-foreground/20 text-muted-foreground leading-none">
                  OFF
                </span>
              )}
            </div>
            <Switch
              checked={storefrontEnabled}
              disabled={!allStorefrontChecks && !storefrontEnabled}
              onCheckedChange={handleStorefrontToggle}
            />
          </div>

          {/* Description */}
          {aiDescriptions["ai_storefront_assistant_short_desc"] && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground">{aiDescriptions["ai_storefront_assistant_short_desc"]}</p>
              {aiDescriptions["ai_storefront_assistant_full_desc"] && (
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors mt-1">
                    <ChevronDown className="w-3 h-3" />
                    Read more
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1">
                    <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                      {aiDescriptions["ai_storefront_assistant_full_desc"]}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}

          {/* Storefront Checklist */}
          {storefrontEnabled && !allStorefrontChecks && (
            <div className="flex items-center gap-2 text-amber-700 mb-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="text-xs font-medium">Enabled but setup is incomplete</span>
            </div>
          )}
          {!allStorefrontChecks && !storefrontEnabled && (
            <p className="text-[11px] text-muted-foreground mb-2">Complete all 3 steps to activate</p>
          )}
          <div className="space-y-2">
            {storefrontChecklist.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                {item.ok ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                ) : (
                  <Circle className="w-4 h-4 shrink-0 text-muted-foreground/40" />
                )}
                {item.clickable ? (
                  <button
                    className="text-xs underline text-foreground hover:opacity-70 transition-opacity text-left"
                    onClick={() => setShowConsentModal("storefront")}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="text-xs">{item.label}</span>
                )}
              </div>
            ))}
          </div>

          {/* Missed Attempts */}
          {!storefrontEnabled && missedAttemptCount > 0 && (
            <div className="mt-3">
              <div
                className="flex items-center gap-2 p-2 border-2"
                style={{
                  backgroundColor: "hsl(48, 96%, 95%)",
                  borderColor: "hsl(45, 93%, 47%)",
                }}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "hsl(25, 95%, 53%)" }} />
                <span className="text-xs" style={{ color: "hsl(25, 95%, 26%)" }}>
                  <strong>{missedAttemptCount}</strong> buyer{missedAttemptCount === 1 ? "" : "s"} tried to chat but your AI assistant was offline.
                </span>
              </div>
            </div>
          )}

          {/* Manage KB button */}
          <div className="mt-3">
            <Link
              to="/seller/knowledge-base?scope=storefront"
              className="inline-flex items-center justify-center h-8 px-3 text-xs font-sans font-bold bg-foreground text-background hover:opacity-80 transition-opacity"
              style={{ boxShadow: "2px 2px 0px hsl(var(--foreground))" }}
            >
              Manage Knowledge Base
            </Link>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-muted" />

        {/* ── SECTION 2: Personal Assistant ── */}
        <div className="p-4">
          {/* Title row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <p className="font-sans font-bold text-sm">Personal Assistant</p>
              {paActive ? (
                <span
                  className="inline-block text-[10px] font-bold px-1.5 py-0.5 text-background leading-none"
                  style={{ backgroundColor: "hsl(142, 71%, 45%)" }}
                >
                  ACTIVE
                </span>
              ) : (
                <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 bg-muted-foreground/20 text-muted-foreground leading-none">
                  OFF
                </span>
              )}
            </div>
            <Switch
              checked={personalEnabled}
              onCheckedChange={handlePersonalToggle}
            />
          </div>

          {/* Description */}
          {aiDescriptions["ai_personal_assistant_short_desc"] && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground">{aiDescriptions["ai_personal_assistant_short_desc"]}</p>
              {aiDescriptions["ai_personal_assistant_full_desc"] && (
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors mt-1">
                    <ChevronDown className="w-3 h-3" />
                    Read more
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1">
                    <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                      {aiDescriptions["ai_personal_assistant_full_desc"]}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}

          {!paConsentGiven && (
            <p className="text-[11px] text-muted-foreground mb-2">Accept consent terms to activate</p>
          )}

          {/* Manage KB button */}
          <div className="mt-2">
            <Link
              to="/seller/knowledge-base?scope=personal"
              className="inline-flex items-center justify-center h-8 px-3 text-xs font-sans font-bold bg-foreground text-background hover:opacity-80 transition-opacity"
              style={{ boxShadow: "2px 2px 0px hsl(var(--foreground))" }}
            >
              Manage Knowledge Base
            </Link>
          </div>
        </div>

        {/* ── Footer: Analytics ── */}
        {(sfLive || paActive) && (
          <div className="p-4 border-t-2 border-foreground text-center">
            <Link
              to="/seller/analytics"
              className="inline-flex items-center justify-center h-8 px-4 text-xs font-sans font-bold bg-background text-foreground border-2 border-foreground hover:opacity-80 transition-opacity"
            >
              View Chat Analytics
            </Link>
          </div>
        )}
      </div>

      {/* ── Consent Modals ── */}
      <SellerAIConsentModal
        open={showConsentModal === "storefront"}
        onOpenChange={(open) => !open && setShowConsentModal(null)}
        sellerName={sellerProfile?.full_name || ""}
        sellerBusinessName={sellerProfile?.company_name || ""}
        sellerEmail={sellerProfile?.email || ""}
        alreadyAccepted={sfConsentGiven}
        acceptedAt={storefrontConsent?.consent_at}
        onAccepted={handleStorefrontConsentAccepted}
        sellerId={sellerId}
        consentType="storefront_assistant"
      />
      <SellerAIConsentModal
        open={showConsentModal === "personal"}
        onOpenChange={(open) => !open && setShowConsentModal(null)}
        sellerName={sellerProfile?.full_name || ""}
        sellerBusinessName={sellerProfile?.company_name || ""}
        sellerEmail={sellerProfile?.email || ""}
        alreadyAccepted={paConsentGiven}
        acceptedAt={personalConsent?.consent_at}
        onAccepted={handlePersonalConsentAccepted}
        sellerId={sellerId}
        consentType="personal_assistant"
      />
    </>
  );
}
