import { useState } from "react";
import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const STOREFRONT_CONSENT_TEXT = `By enabling the AI Storefront Assistant, you agree to the following terms:

1. AI-Powered Interactions
The AI Storefront Assistant will interact with buyers visiting your product pages on FitMatch.ca on your behalf. It uses artificial intelligence (powered by OpenAI, Inc.) to generate responses — it is not a human representative.

2. Data Processing
Your product listings, Knowledge Base articles, and store information will be processed by OpenAI, Inc., located in the United States, to generate AI responses. Data stored in the US may be accessible to US government authorities under US law.

3. Your Responsibility
You are responsible for the accuracy of information in your Knowledge Base. FitMatch does not verify the content you provide. Inaccurate product specifications, pricing, or policies communicated by the AI assistant to buyers may result in legal liability under Canadian consumer protection laws.

4. Buyer Conversations
Conversations between buyers and your AI assistant are stored for up to 90 days. You can review these conversations in your Chat Analytics dashboard.

5. Data Retention & Withdrawal
You may disable the AI Storefront Assistant at any time by toggling it off. To request deletion of stored conversation data, contact privacy@fitmatch.ca.

6. Quebec Residents
If you are located in Quebec, by accepting this agreement you explicitly consent to the collection and processing of your information as described above, including transfer to the United States. You may withdraw consent at any time by contacting privacy@fitmatch.ca.`;

const PERSONAL_CONSENT_TEXT = `By enabling the Personal Assistant, you agree to the following terms:

1. AI-Powered Assistance
The Personal Assistant uses artificial intelligence (powered by OpenAI, Inc.) to help you manage your store on FitMatch.ca. Your questions and interactions are processed by AI — not a human.

2. Data Processing
Your product listings, Knowledge Base articles, and store information will be processed by OpenAI, Inc., located in the United States, to generate AI responses. Data stored in the US may be accessible to US government authorities under US law.

3. Your Data
Your questions, product data, and Knowledge Base articles are used to generate AI responses. Do not share sensitive personal information (such as banking details or government ID) in conversations with the assistant.

4. Data Retention & Withdrawal
You may disable the Personal Assistant at any time by toggling it off. To request deletion of stored conversation data, contact privacy@fitmatch.ca.

5. Quebec Residents
If you are located in Quebec, by accepting this agreement you explicitly consent to the collection and processing of your information as described above, including transfer to the United States. You may withdraw consent at any time by contacting privacy@fitmatch.ca.`;

function ConsentSection({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="mb-4">
      <h3 className="font-sans font-bold text-sm mb-1">
        {number}. {title}
      </h3>
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function StorefrontConsentBody() {
  return (
    <>
      <p className="text-sm leading-relaxed mb-4">
        By enabling the AI Storefront Assistant, you agree to the following terms:
      </p>
      <ConsentSection
        number="1"
        title="AI-Powered Interactions"
        text="The AI Storefront Assistant will interact with buyers visiting your product pages on FitMatch.ca on your behalf. It uses artificial intelligence (powered by OpenAI, Inc.) to generate responses — it is not a human representative."
      />
      <ConsentSection
        number="2"
        title="Data Processing"
        text="Your product listings, Knowledge Base articles, and store information will be processed by OpenAI, Inc., located in the United States, to generate AI responses. Data stored in the US may be accessible to US government authorities under US law."
      />
      <ConsentSection
        number="3"
        title="Your Responsibility"
        text="You are responsible for the accuracy of information in your Knowledge Base. FitMatch does not verify the content you provide. Inaccurate product specifications, pricing, or policies communicated by the AI assistant to buyers may result in legal liability under Canadian consumer protection laws."
      />
      <ConsentSection
        number="4"
        title="Buyer Conversations"
        text="Conversations between buyers and your AI assistant are stored for up to 90 days. You can review these conversations in your Chat Analytics dashboard."
      />
      <ConsentSection
        number="5"
        title="Data Retention & Withdrawal"
        text="You may disable the AI Storefront Assistant at any time by toggling it off. To request deletion of stored conversation data, contact privacy@fitmatch.ca."
      />
      <ConsentSection
        number="6"
        title="Quebec Residents"
        text="If you are located in Quebec, by accepting this agreement you explicitly consent to the collection and processing of your information as described above, including transfer to the United States. You may withdraw consent at any time by contacting privacy@fitmatch.ca."
      />
    </>
  );
}

function PersonalConsentBody() {
  return (
    <>
      <p className="text-sm leading-relaxed mb-4">
        By enabling the Personal Assistant, you agree to the following terms:
      </p>
      <ConsentSection
        number="1"
        title="AI-Powered Assistance"
        text="The Personal Assistant uses artificial intelligence (powered by OpenAI, Inc.) to help you manage your store on FitMatch.ca. Your questions and interactions are processed by AI — not a human."
      />
      <ConsentSection
        number="2"
        title="Data Processing"
        text="Your product listings, Knowledge Base articles, and store information will be processed by OpenAI, Inc., located in the United States, to generate AI responses. Data stored in the US may be accessible to US government authorities under US law."
      />
      <ConsentSection
        number="3"
        title="Your Data"
        text="Your questions, product data, and Knowledge Base articles are used to generate AI responses. Do not share sensitive personal information (such as banking details or government ID) in conversations with the assistant."
      />
      <ConsentSection
        number="4"
        title="Data Retention & Withdrawal"
        text="You may disable the Personal Assistant at any time by toggling it off. To request deletion of stored conversation data, contact privacy@fitmatch.ca."
      />
      <ConsentSection
        number="5"
        title="Quebec Residents"
        text="If you are located in Quebec, by accepting this agreement you explicitly consent to the collection and processing of your information as described above, including transfer to the United States. You may withdraw consent at any time by contacting privacy@fitmatch.ca."
      />
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

  if (!open) return null;

  const businessName = sellerBusinessName || sellerName || "Your Business";
  const fullName = sellerName || "Seller";
  const isPersonal = consentType === "personal_assistant";

  const modalTitle = isPersonal
    ? "Personal Assistant — Consent Agreement"
    : "AI Storefront Assistant — Consent Agreement";

  const consentText = isPersonal ? PERSONAL_CONSENT_TEXT : STOREFRONT_CONSENT_TEXT;

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
              <p>
                <strong>Seller:</strong> {businessName} ({fullName})
              </p>
              <p>
                <strong>Date:</strong> {currentDate}
              </p>
            </div>

            {/* Legal sections */}
            {isPersonal ? <PersonalConsentBody /> : <StorefrontConsentBody />}

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
                  disabled={!agreed || saving}
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
