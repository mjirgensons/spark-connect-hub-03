import { useState } from "react";
import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerName: string;
  sellerBusinessName: string;
  sellerEmail: string;
  alreadyAccepted: boolean;
  acceptedAt?: string | null;
  onAccepted: () => void;
  sellerId: string;
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

export default function SellerAIConsentModal({
  open,
  onOpenChange,
  sellerName,
  sellerBusinessName,
  sellerEmail,
  alreadyAccepted,
  acceptedAt,
  onAccepted,
  sellerId,
}: Props) {
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const businessName = sellerBusinessName || sellerName || "Your Business";
  const fullName = sellerName || "Seller";
  const email = sellerEmail || "your-email@example.com";

  const handleAccept = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        seller_ai_consent_accepted: true,
        seller_ai_consent_accepted_at: new Date().toISOString(),
      } as any)
      .eq("id", sellerId);
    setSaving(false);
    if (error) {
      toast.error("Failed to save consent");
      return;
    }
    toast.success("AI consent terms accepted");
    onAccepted();
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-foreground/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div
        className="relative z-10 flex flex-col bg-background border-2 border-foreground w-full max-w-[640px] mx-4"
        style={{
          boxShadow: "4px 4px 0px hsl(var(--foreground))",
          maxHeight: "80vh",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-foreground shrink-0">
          <h2 className="font-sans text-lg font-bold">
            AI Assistant — Seller Agreement
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="hover:opacity-70 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-5 text-sm leading-relaxed">
          <p className="font-bold text-base mb-4">
            AI ASSISTANT — SELLER TERMS OF USE
          </p>

          <p className="mb-1">
            <strong>Effective Date:</strong> {currentDate}
          </p>
          <p className="mb-1">
            <strong>Seller:</strong> {businessName} ({fullName})
          </p>
          <p className="mb-4">
            <strong>Platform:</strong> FitMatch
          </p>

          <p className="mb-4">
            By enabling the AI Assistant for your store, you ("Seller") agree to
            the following terms:
          </p>

          <h3 className="font-bold mb-2">1. ACCURACY & LIABILITY</h3>
          <p className="mb-4">
            You are solely responsible for the accuracy of all information in
            your Knowledge Base, including product descriptions, specifications,
            pricing, lead times, installation guides, and FAQs. The AI Assistant
            generates responses based on this content.
          </p>
          <p className="mb-4">
            Per the <em>Air Canada v. Moffatt</em> precedent (2024 BCCRT 149),
            a business is liable for all information provided through its AI
            systems. FitMatch does not verify or guarantee the accuracy of
            AI-generated responses derived from your Knowledge Base content.
          </p>
          <p className="mb-4">
            You agree to keep your Knowledge Base current and accurate at all
            times.
          </p>

          <h3 className="font-bold mb-2">2. AI DISCLOSURE TO BUYERS</h3>
          <p className="mb-4">
            The AI Assistant will clearly identify itself as an automated system
            to all buyers. At the start of each conversation, buyers are informed
            they are interacting with an AI assistant, not a human
            representative. This disclosure complies with emerging AI
            transparency requirements across Canadian provinces and US states.
          </p>
          <p className="mb-4">
            You must not instruct or configure the AI Assistant to impersonate a
            human.
          </p>

          <h3 className="font-bold mb-2">
            3. DATA COLLECTION & PIPEDA COMPLIANCE
          </h3>
          <p className="mb-2">
            The AI Assistant collects the following buyer data during chat
            interactions:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Chat messages and conversation history</li>
            <li>
              Email address (when voluntarily provided through the email gate)
            </li>
            <li>Product pages visited during the chat session</li>
          </ul>
          <p className="mb-4">
            This data is collected under Canada's Personal Information Protection
            and Electronic Documents Act (PIPEDA). Collection is limited to what
            is necessary for providing product assistance and facilitating
            seller-buyer communication.
          </p>
          <p className="mb-4">
            Buyer data collected through your AI Assistant is accessible only to
            you (the Seller) and FitMatch platform administrators. It will not be
            sold to third parties or used for purposes beyond product assistance
            and communication.
          </p>
          <p className="mb-4">
            Buyers may request deletion of their conversation data at any time.
          </p>

          <h3 className="font-bold mb-2">4. MARKETING CONSENT (CASL)</h3>
          <p className="mb-4">
            Canada's Anti-Spam Legislation (CASL) requires explicit opt-in
            consent before sending commercial electronic messages. The AI
            Assistant will never send marketing emails to buyers without their
            express consent.
          </p>
          <p className="mb-4">
            If the marketing opt-in checkbox is enabled in your AI Assistant
            configuration, it must be unchecked by default (opt-in, not opt-out).
          </p>

          <h3 className="font-bold mb-2">5. PROHIBITED USES</h3>
          <p className="mb-2">You must not use the AI Assistant to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Provide medical, legal, or financial advice</li>
            <li>
              Make guarantees or warranties beyond your stated product
              specifications
            </li>
            <li>
              Collect sensitive personal information (health data, financial
              details, government IDs)
            </li>
            <li>
              Engage in deceptive pricing or bait-and-switch practices
            </li>
            <li>
              Target or discriminate against buyers based on protected
              characteristics
            </li>
          </ul>

          <h3 className="font-bold mb-2">6. LIMITATION OF LIABILITY</h3>
          <p className="mb-4">
            FitMatch provides the AI Assistant technology on an "as-is" basis.
            FitMatch is not liable for:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>
              Incorrect or incomplete AI responses caused by inaccurate Knowledge
              Base content
            </li>
            <li>
              Lost sales or business opportunities arising from AI Assistant
              interactions
            </li>
            <li>
              Buyer claims resulting from AI-generated product information
            </li>
          </ul>
          <p className="mb-4">
            Your total liability for AI Assistant interactions is governed by the
            general FitMatch Seller Agreement.
          </p>

          <h3 className="font-bold mb-2">7. SUSPENSION & TERMINATION</h3>
          <p className="mb-2">
            FitMatch reserves the right to suspend or disable your AI Assistant
            if:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>
              Your Knowledge Base contains materially inaccurate information
            </li>
            <li>
              Buyer complaints related to AI interactions exceed reasonable
              thresholds
            </li>
            <li>You violate any term of this agreement</li>
          </ul>

          <h3 className="font-bold mb-2">8. AMENDMENTS</h3>
          <p className="mb-4">
            FitMatch may update these terms with 30 days notice via email to{" "}
            <strong>{email}</strong>. Continued use of the AI Assistant after the
            notice period constitutes acceptance.
          </p>

          <p className="text-muted-foreground text-xs">
            Last updated: {currentDate}
          </p>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t-2 border-foreground">
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
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="consent-check"
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(v === true)}
                  className="mt-0.5"
                />
                <label htmlFor="consent-check" className="text-sm cursor-pointer select-none">
                  I, {fullName}, on behalf of {businessName}, have read and agree
                  to the AI Assistant Seller Terms of Use
                </label>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onOpenChange(false)}
                  className="text-sm text-muted-foreground hover:opacity-70 transition-opacity"
                >
                  Cancel
                </button>
                <button
                  disabled={!agreed || saving}
                  onClick={handleAccept}
                  className="h-9 px-4 text-sm font-sans font-bold bg-foreground text-background hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ boxShadow: "2px 2px 0px hsl(var(--foreground))" }}
                >
                  {saving ? "Saving…" : "Accept & Enable"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
