import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerName: string;
  sellerBusinessName: string;
  sellerEmail: string;
  alreadyAccepted: boolean;
  acceptedAt?: string | null;
  onAccepted: (consentText: string) => void;
  sellerId: string;
  consentType?: "storefront_assistant" | "personal_assistant";
}

const formatDate = (d?: string | null) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const currentDate = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** Normalize escaped newlines from DB then render with paragraph breaks and bold numbered headers */
function normalizeNewlines(raw: string): string {
  // DB may store literal \n sequences — convert to real newlines
  return raw.replace(/\\n/g, "\n");
}

function ConsentBody({ text }: { text: string }) {
  const normalized = normalizeNewlines(text);
  const paragraphs = normalized.split(/\n\n/);
  return (
    <>
      {paragraphs.map((p, i) => {
        const headerMatch = p.match(/^(\d+\.\s+.+?)(?:\n)([\s\S]*)$/);
        if (headerMatch) {
          return (
            <div key={i} className="mb-4">
              <h3 className="font-sans font-bold text-sm mb-1">{headerMatch[1]}</h3>
              <p className="text-sm leading-relaxed">
                {headerMatch[2].split("\n").map((line, j, arr) => (
                  <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                ))}
              </p>
            </div>
          );
        }
        return (
          <p key={i} className="text-sm leading-relaxed mb-4">
            {p.split("\n").map((line, j, arr) => (
              <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
            ))}
          </p>
        );
      })}
    </>
  );
}

export default function SellerAIConsentModal({
  open,
  onOpenChange,
  sellerName,
  sellerBusinessName,
  sellerEmail: _sellerEmail,
  alreadyAccepted,
  acceptedAt,
  onAccepted,
  sellerId: _sellerId,
  consentType = "storefront_assistant",
}: Props) {
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [consentText, setConsentText] = useState("");
  const [loadingText, setLoadingText] = useState(false);

  const isPersonal = consentType === "personal_assistant";
  const settingsKey = isPersonal
    ? "personal_assistant_consent_text"
    : "storefront_assistant_consent_text";

  useEffect(() => {
    if (!open) return;
    setAgreed(false);
    setLoadingText(true);
    supabase
      .from("site_settings" as any)
      .select("value")
      .eq("key", settingsKey)
      .single()
      .then(({ data }: any) => {
        setConsentText(data?.value || "");
        setLoadingText(false);
      });
  }, [open, settingsKey]);

  if (!open) return null;

  const businessName = sellerBusinessName || sellerName || "Your Business";
  const fullName = sellerName || "Seller";

  const modalTitle = isPersonal
    ? "Personal Assistant — Consent Agreement"
    : "AI Storefront Assistant — Consent Agreement";

  const handleAccept = async () => {
    setSaving(true);
    onAccepted(consentText);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/50"
        onClick={() => onOpenChange(false)}
      />
      <div
        className="relative z-10 flex flex-col bg-background border-2 border-foreground w-full max-w-[640px] mx-4"
        style={{
          boxShadow: "4px 4px 0px hsl(var(--foreground))",
          maxHeight: "85vh",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-foreground shrink-0">
          <h2 className="font-sans text-lg font-bold">{modalTitle}</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="hover:opacity-70 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-5 text-foreground font-sans">
            {/* Seller info */}
            <div className="mb-4 text-sm space-y-0.5">
              <p><strong>Seller:</strong> {businessName} ({fullName})</p>
              <p><strong>Date:</strong> {currentDate}</p>
            </div>

            {loadingText ? (
              <p className="text-sm text-muted-foreground">Loading consent terms…</p>
            ) : consentText ? (
              <ConsentBody text={consentText} />
            ) : (
              <p className="text-sm text-muted-foreground">No consent text configured.</p>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {currentDate}
            </p>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t-2 border-foreground space-y-3">
          {alreadyAccepted ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Checkbox checked disabled />
                <span className="text-sm">
                  Accepted by {fullName}
                  {acceptedAt ? ` on ${formatDate(acceptedAt)}` : ""}
                </span>
              </div>
              <button
                disabled
                className="h-9 px-4 text-sm font-sans font-bold bg-foreground text-background opacity-50 cursor-not-allowed"
              >
                Already Accepted
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="consent-check"
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(v === true)}
                  className="mt-0.5"
                />
                <label htmlFor="consent-check" className="text-sm cursor-pointer select-none leading-snug">
                  I, {fullName}, have read and agree to the terms above
                </label>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onOpenChange(false)}
                  className="h-9 px-4 text-sm font-sans text-muted-foreground hover:opacity-70 transition-opacity"
                >
                  Cancel
                </button>
                <button
                  disabled={!agreed || saving || !consentText}
                  onClick={handleAccept}
                  className="h-9 px-4 text-sm font-sans font-bold bg-foreground text-background hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ boxShadow: "2px 2px 0px hsl(var(--foreground))" }}
                >
                  {saving ? "Saving…" : "Accept & Enable"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
