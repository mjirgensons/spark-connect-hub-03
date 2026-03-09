import { useState, useEffect } from "react";
import { Bot, CheckCircle2, Circle, AlertTriangle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
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
  const [readMoreModal, setReadMoreModal] = useState<"storefront" | "personal" | null>(null);
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
        supabase.from("profiles").select("ai_chatbot_enabled, full_name, company_name, email, personal_assistant_enabled" as any).eq("id", sellerId).single(),
        (supabase as any).from("seller_knowledge_base").select("id", { count: "exact", head: true }).eq("seller_id", sellerId),
        (supabase as any).from("products").select("id", { count: "exact", head: true }).eq("seller_id", sellerId).eq("pinecone_synced", true),
        (supabase as any).from("chatbot_missed_attempts").select("id", { count: "exact", head: true }).eq("seller_id", sellerId),
        (supabase as any).from("seller_ai_consents").select("consent_type, consent_given, consent_at").eq("seller_id", sellerId),
        supabase.from("site_settings" as any).select("key, value").in("key", ["ai_storefront_assistant_short_desc", "ai_storefront_assistant_full_desc", "ai_personal_assistant_short_desc", "ai_personal_assistant_full_desc"]),
      ]);
      const profile = profileRes.data as any;
      setStorefrontEnabled(!!profile?.ai_chatbot_enabled);
      setPersonalEnabled(!!profile?.personal_assistant_enabled);
      setSellerProfile(profile ? { full_name: profile.full_name || "", company_name: profile.company_name || null, email: profile.email || "" } : null);
      setKbCount(kbRes.count ?? 0);
      setSyncedProductCount(prodRes.count ?? 0);
      setMissedAttemptCount(missedRes.count ?? 0);
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
    const { error } = await supabase.from("profiles").update({ [field]: value } as any).eq("id", sellerId);
    if (error) { toast.error("Failed to update setting"); return false; }
    return true;
  };

  const upsertConsent = async (consentType: "storefront_assistant" | "personal_assistant") => {
    const { error } = await (supabase as any).from("seller_ai_consents").upsert({
      seller_id: sellerId, consent_type: consentType, consent_given: true, consent_at: new Date().toISOString(),
      consent_text: consentType === "storefront_assistant"
        ? "I acknowledge that the AI Storefront Assistant will interact with buyers on my behalf using my product listings and Knowledge Base articles. I am responsible for the accuracy of information in my Knowledge Base."
        : "I acknowledge that the Personal Assistant uses AI to help me manage my store. My questions and interactions are processed by AI services. I understand this assistant uses my product data and Knowledge Base articles to provide answers.",
    }, { onConflict: "seller_id,consent_type" });
    if (error) { toast.error("Failed to save consent"); return false; }
    return true;
  };

  const handleStorefrontToggle = async (checked: boolean) => {
    if (checked) {
      if (!sfConsentGiven) { setShowConsentModal("storefront"); return; }
      if (!allStorefrontChecks) { toast.error("Complete all checklist items before enabling"); return; }
      if (await updateProfileField("ai_chatbot_enabled", true)) { setStorefrontEnabled(true); toast.success("AI Storefront Assistant enabled"); }
    } else {
      if (await updateProfileField("ai_chatbot_enabled", false)) { setStorefrontEnabled(false); toast.success("AI Storefront Assistant disabled"); }
    }
  };

  const handlePersonalToggle = async (checked: boolean) => {
    if (checked) {
      if (!paConsentGiven) { setShowConsentModal("personal"); return; }
      if (await updateProfileField("personal_assistant_enabled", true)) { setPersonalEnabled(true); toast.success("Personal Assistant enabled"); }
    } else {
      if (await updateProfileField("personal_assistant_enabled", false)) { setPersonalEnabled(false); toast.success("Personal Assistant disabled"); }
    }
  };

  const handleStorefrontConsentAccepted = async () => {
    if (await upsertConsent("storefront_assistant")) {
      setStorefrontConsent({ consent_type: "storefront_assistant", consent_given: true, consent_at: new Date().toISOString() });
      toast.success("Storefront Assistant consent accepted");
      if (hasKb && hasSyncedProducts) {
        if (await updateProfileField("ai_chatbot_enabled", true)) { setStorefrontEnabled(true); toast.success("AI Storefront Assistant enabled"); }
      }
    }
  };

  const handlePersonalConsentAccepted = async () => {
    if (await upsertConsent("personal_assistant")) {
      setPersonalConsent({ consent_type: "personal_assistant", consent_given: true, consent_at: new Date().toISOString() });
      toast.success("Personal Assistant consent accepted");
      if (await updateProfileField("personal_assistant_enabled", true)) { setPersonalEnabled(true); toast.success("Personal Assistant enabled"); }
    }
  };

  if (loading) return null;

  const sfLive = storefrontEnabled && allStorefrontChecks;
  const paActive = personalEnabled && paConsentGiven;

  const storefrontChecklist = [
    { ok: hasKb, label: "3+ Knowledge Base articles" },
    { ok: hasSyncedProducts, label: "Products synced to AI" },
    { ok: sfConsentGiven, label: "Accept AI consent terms", clickable: true },
  ];

  return (
    <>
      <div className="bg-background border-2 border-foreground w-full" style={{ boxShadow: "4px 4px 0px hsl(var(--foreground))" }}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-foreground">
          <Bot className="w-4 h-4 shrink-0" />
          <p className="font-sans font-bold text-base leading-tight">AI Assistants</p>
        </div>

        {/* Two mini-cards body */}
        <div className="p-4 flex flex-col md:flex-row gap-4">
          {/* LEFT — Storefront */}
          <div className="flex-1 border border-foreground p-4 flex flex-col gap-2">
            {/* Title + badge + toggle */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-sans font-bold text-sm whitespace-nowrap">AI Storefront Assistant</span>
                {sfLive ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 text-background leading-none shrink-0 animate-pulse" style={{ backgroundColor: "hsl(142, 71%, 45%)" }}>LIVE</span>
                ) : (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-muted-foreground/20 text-muted-foreground leading-none shrink-0">OFF</span>
                )}
              </div>
              <Switch checked={storefrontEnabled} onCheckedChange={handleStorefrontToggle} />
            </div>

            {/* Short desc */}
            {aiDescriptions["ai_storefront_assistant_short_desc"] && (
              <p className="text-xs text-muted-foreground line-clamp-2 max-w-[400px]">{aiDescriptions["ai_storefront_assistant_short_desc"]}</p>
            )}

            {/* Read more link */}
            {aiDescriptions["ai_storefront_assistant_full_desc"] && (
              <button onClick={() => setReadMoreModal("storefront")} className="text-[11px] underline text-muted-foreground hover:text-foreground transition-colors text-left">
                Read more
              </button>
            )}

            {/* Checklist */}
            {storefrontEnabled && !allStorefrontChecks && (
              <div className="flex items-center gap-1.5 text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-medium">Setup incomplete</span>
              </div>
            )}
            <div className="space-y-1">
              {storefrontChecklist.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {item.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-green-600" /> : <Circle className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />}
                  {item.clickable ? (
                    <button className="text-xs underline text-foreground hover:opacity-70 transition-opacity text-left" onClick={() => setShowConsentModal("storefront")}>{item.label}</button>
                  ) : (
                    <span className="text-xs">{item.label}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Missed attempts */}
            {!storefrontEnabled && missedAttemptCount > 0 && (
              <div className="flex items-center gap-1.5 p-2 border" style={{ backgroundColor: "hsl(48, 96%, 95%)", borderColor: "hsl(45, 93%, 47%)" }}>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(25, 95%, 53%)" }} />
                <span className="text-[11px]" style={{ color: "hsl(25, 95%, 26%)" }}><strong>{missedAttemptCount}</strong> missed chat{missedAttemptCount === 1 ? "" : "s"}</span>
              </div>
            )}

            {/* Manage KB link */}
            <Link to="/seller/knowledge-base?scope=storefront" className="text-xs underline text-muted-foreground hover:text-foreground transition-colors">
              Manage Knowledge Base →
            </Link>
          </div>

          {/* RIGHT — Personal */}
          <div className="flex-1 border border-foreground p-4 flex flex-col gap-2">
            {/* Title + badge + toggle */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-sans font-bold text-sm whitespace-nowrap">Personal Assistant</span>
                {paActive ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 text-background leading-none shrink-0" style={{ backgroundColor: "hsl(142, 71%, 45%)" }}>ACTIVE</span>
                ) : (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-muted-foreground/20 text-muted-foreground leading-none shrink-0">OFF</span>
                )}
              </div>
              <Switch checked={personalEnabled} onCheckedChange={handlePersonalToggle} />
            </div>

            {/* Short desc */}
            {aiDescriptions["ai_personal_assistant_short_desc"] && (
              <p className="text-xs text-muted-foreground line-clamp-2 max-w-[400px]">{aiDescriptions["ai_personal_assistant_short_desc"]}</p>
            )}

            {/* Read more link */}
            {aiDescriptions["ai_personal_assistant_full_desc"] && (
              <button onClick={() => setReadMoreModal("personal")} className="text-[11px] underline text-muted-foreground hover:text-foreground transition-colors text-left">
                Read more
              </button>
            )}

            {/* Consent hint */}
            {!paConsentGiven && (
              <button onClick={() => setShowConsentModal("personal")} className="text-[11px] underline text-muted-foreground hover:text-foreground transition-colors text-left">
                Accept consent terms to activate
              </button>
            )}

            {/* Manage KB link */}
            <Link to="/seller/knowledge-base?scope=personal" className="text-xs underline text-muted-foreground hover:text-foreground transition-colors">
              Manage Knowledge Base →
            </Link>
          </div>
        </div>

        {/* Footer: Analytics */}
        {(sfLive || paActive) && (
          <div className="px-4 py-3 border-t border-foreground text-center">
            <Link to="/seller/analytics" className="text-xs underline text-muted-foreground hover:text-foreground transition-colors">
              View Chat Analytics
            </Link>
          </div>
        )}
      </div>

      {/* Read More Modal */}
      {readMoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setReadMoreModal(null)} />
          <div className="relative z-10 bg-background border-2 border-foreground w-full max-w-lg mx-4 max-h-[70vh] flex flex-col" style={{ boxShadow: "4px 4px 0px hsl(var(--foreground))" }}>
            <div className="flex items-center justify-between p-4 border-b-2 border-foreground shrink-0">
              <h2 className="font-sans font-bold text-base">
                {readMoreModal === "storefront" ? "AI Storefront Assistant" : "Personal Assistant"}
              </h2>
              <button onClick={() => setReadMoreModal(null)} className="hover:opacity-70 transition-opacity"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto p-4">
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {readMoreModal === "storefront" ? aiDescriptions["ai_storefront_assistant_full_desc"] : aiDescriptions["ai_personal_assistant_full_desc"]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Consent Modals */}
      <SellerAIConsentModal open={showConsentModal === "storefront"} onOpenChange={(open) => !open && setShowConsentModal(null)} sellerName={sellerProfile?.full_name || ""} sellerBusinessName={sellerProfile?.company_name || ""} sellerEmail={sellerProfile?.email || ""} alreadyAccepted={sfConsentGiven} acceptedAt={storefrontConsent?.consent_at} onAccepted={handleStorefrontConsentAccepted} sellerId={sellerId} consentType="storefront_assistant" />
      <SellerAIConsentModal open={showConsentModal === "personal"} onOpenChange={(open) => !open && setShowConsentModal(null)} sellerName={sellerProfile?.full_name || ""} sellerBusinessName={sellerProfile?.company_name || ""} sellerEmail={sellerProfile?.email || ""} alreadyAccepted={paConsentGiven} acceptedAt={personalConsent?.consent_at} onAccepted={handlePersonalConsentAccepted} sellerId={sellerId} consentType="personal_assistant" />
    </>
  );
}
