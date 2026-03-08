import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function ChatConsentModal({ onAccept, onDecline }: ChatConsentModalProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-3 text-sm text-foreground font-sans">
          <p className="font-bold">Before we start</p>
          <p>
            You are about to chat with FitMatch AI, an automated assistant — not a human.
          </p>
          <p>
            This assistant may collect information you share (such as room dimensions, cabinet
            preferences, and product questions) to help match you with listings on FitMatch.ca.
          </p>
          <p>
            Your conversation data is processed by OpenAI, Inc., located in the United States.
          </p>
          <p>
            Conversations are stored for up to 90 days. Contact{" "}
            <a href="mailto:privacy@fitmatch.ca" className="underline font-medium">
              privacy@fitmatch.ca
            </a>{" "}
            to request access or deletion.
          </p>
          <p className="font-semibold">
            Please do not share payment details or government ID in this chat.
          </p>
        </div>
      </ScrollArea>

      <div className="p-4 space-y-2 border-t border-border">
        <button
          onClick={onAccept}
          className="w-full h-11 bg-foreground text-background font-bold text-sm font-sans border-2 border-foreground hover:opacity-90 transition-opacity"
          style={{ borderRadius: 0 }}
        >
          Start Chat — I understand
        </button>
        <button
          onClick={onDecline}
          className="w-full h-11 bg-background text-foreground font-sans text-sm border-2 border-foreground hover:bg-secondary transition-colors"
          style={{ borderRadius: 0 }}
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
