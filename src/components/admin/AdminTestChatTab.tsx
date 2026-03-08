import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Send, RefreshCw, Trash2, Loader2, AlertTriangle, BookOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

function generateUUID() {
  return crypto.randomUUID();
}

interface ChatMessage {
  id: string;
  role: "user" | "bot" | "error";
  content: string;
  timestamp: Date;
  escalated?: boolean;
}

const DEFAULT_SELLER_ID = "2bde57a1-c549-4dbf-b793-753ed552962b";
const TEST_URL = "https://sundeco.app.n8n.cloud/webhook-test/seller-chatbot";
const PROD_URL = "https://sundeco.app.n8n.cloud/webhook/seller-chatbot";

const USER_ROLE_OPTIONS = [
  { value: "guest", label: "Guest Buyer", description: "Anonymous visitor. 3 free AI responses before email gate. No history persistence." },
  { value: "authenticated_buyer", label: "Authenticated Buyer", description: "Logged-in buyer. Unlimited responses, persistent history, can trigger escalation." },
  { value: "authenticated_seller", label: "Authenticated Seller", description: "Seller testing their own chatbot. Unlimited. Verifies AI uses their KB correctly." },
  { value: "admin", label: "Admin", description: "Platform admin. Full access, no rate limits, debug info in responses." },
];

const CHATBOT_MODE_OPTIONS = [
  { value: "buyer_inquiry", label: "Buyer Inquiry", description: "Default. AI answers product questions: dimensions, pricing, availability, materials, shipping." },
  { value: "product_support", label: "Product Support", description: "Post-purchase mode. AI focuses on installation, warranty, care instructions, troubleshooting." },
  { value: "general", label: "General", description: "Open-ended. AI answers about store, brand, policies, lead times — not limited to specific products." },
];

const FieldHint = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs text-muted-foreground mt-1">{children}</p>
);

const AdminTestChatTab = () => {
  const isMobile = useIsMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sellerId, setSellerId] = useState(DEFAULT_SELLER_ID);
  const [sessionId, setSessionId] = useState<string>(() => generateUUID());
  const [useProduction, setUseProduction] = useState(false);
  const [buyerId, setBuyerId] = useState("");
  const [userRole, setUserRole] = useState("guest");
  const [chatbotMode, setChatbotMode] = useState("buyer_inquiry");
  const [guideOpen, setGuideOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const webhookUrl = useProduction ? PROD_URL : TEST_URL;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const regenerateSession = useCallback(() => setSessionId(generateUUID() as string), []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  const newSession = useCallback(() => {
    setMessages([]);
    regenerateSession();
  }, [regenerateSession]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = { id: generateUUID(), role: "user", content: text, timestamp: new Date() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatInput: text,
          seller_id: sellerId,
          session_id: sessionId,
          buyer_id: buyerId || null,
          user_role: userRole,
          chatbot_mode: chatbotMode,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: generateUUID(),
        role: "bot",
        content: data.output || "(empty response)",
        timestamp: new Date(),
        escalated: data.should_escalate === true,
      };
      setMessages((m) => [...m, botMsg]);
    } catch (err: any) {
      const errorContent = err.name === "AbortError" ? "Request timed out after 30 seconds." : err.message || "Unknown error";
      setMessages((m) => [...m, { id: generateUUID(), role: "error", content: errorContent, timestamp: new Date() }]);
    } finally {
      clearTimeout(timeout);
      setSending(false);
    }
  }, [input, sending, webhookUrl, sellerId, sessionId, buyerId, userRole, chatbotMode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectedRole = USER_ROLE_OPTIONS.find((r) => r.value === userRole);
  const selectedMode = CHATBOT_MODE_OPTIONS.find((m) => m.value === chatbotMode);

  const testGuide = (
    <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs">
          <BookOpen className="w-3.5 h-3.5" />
          Test Guide
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-2 text-xs text-muted-foreground">
        <div>
          <p className="font-medium text-foreground mb-1">What is this page?</p>
          <p>The Test Console sends real HTTP POST requests to WF-23. Messages go through the full pipeline: Pinecone vector search, GPT-4o-mini, confidence check. Messages are logged to chat_messages, sessions tracked in chat_sessions.</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Quick start</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Ensure WF-23 is active in n8n (or use Test URL in listening mode).</li>
            <li>Set Seller ID.</li>
            <li>Pick Role and Mode.</li>
            <li>Type a question and Send. Response appears in 2-5 seconds.</li>
          </ol>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Test scenarios</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li><span className="font-medium">Guest flow:</span> Guest Buyer role, empty Buyer ID, email gate after 3 messages.</li>
            <li><span className="font-medium">Escalation:</span> type "speak to a person" or "damaged".</li>
            <li><span className="font-medium">PII:</span> type an email/phone — AI should mask it.</li>
          </ul>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

  const configPanel = (
    <div className="space-y-4">
      {testGuide}
      <div>
        <Label htmlFor="seller-id">Seller ID</Label>
        <Input id="seller-id" value={sellerId} onChange={(e) => setSellerId(e.target.value)} className="font-mono text-xs mt-1" />
        <FieldHint>UUID of the seller whose AI chatbot you are testing. Each seller has an isolated Pinecone namespace (seller_&#123;id&#125;).</FieldHint>
      </div>
      <div>
        <Label htmlFor="session-id">Session ID</Label>
        <div className="flex gap-2 mt-1">
          <Input id="session-id" value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="font-mono text-xs" />
          <Button variant="outline" size="icon" onClick={regenerateSession} title="New Session ID">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <FieldHint>Unique conversation identifier. All messages share this ID. Used by WF-23 to fetch chat history and maintain context.</FieldHint>
      </div>
      <div>
        <Label>Webhook URL</Label>
        <div className="flex items-center gap-2 mt-1">
          <Button variant={!useProduction ? "default" : "outline"} size="sm" onClick={() => setUseProduction(false)}>Test</Button>
          <Button variant={useProduction ? "default" : "outline"} size="sm" onClick={() => setUseProduction(true)}>Production</Button>
        </div>
        <p className="text-[10px] font-mono text-muted-foreground mt-1 break-all">{webhookUrl}</p>
        <FieldHint>Test URL (webhook-test/) works only while WF-23 is in listening mode in n8n. Production URL (webhook/) works when WF-23 is active.</FieldHint>
      </div>
      <div>
        <Label htmlFor="buyer-id">Buyer ID (Optional)</Label>
        <Input id="buyer-id" value={buyerId} onChange={(e) => setBuyerId(e.target.value)} className="font-mono text-xs mt-1" placeholder="Leave empty" />
        <FieldHint>UUID of a specific buyer from profiles table. Leave empty = anonymous guest. Enter a UUID = test as that buyer with their history and rate limits.</FieldHint>
      </div>
      <div>
        <Label>User Role</Label>
        <Select value={userRole} onValueChange={setUserRole}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {USER_ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedRole && <FieldHint>{selectedRole.description}</FieldHint>}
      </div>
      <div>
        <Label>Chatbot Mode</Label>
        <Select value={chatbotMode} onValueChange={setChatbotMode}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CHATBOT_MODE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedMode && <FieldHint>{selectedMode.description}</FieldHint>}
      </div>
      <div className="flex gap-2 pt-2">
        <div className="flex-1 space-y-1">
          <Button variant="outline" size="sm" onClick={clearChat} className="w-full">
            <Trash2 className="w-3 h-3 mr-1" /> Clear Chat
          </Button>
          <FieldHint>Removes messages from display only. Backend still has old messages. Visual cleanup.</FieldHint>
        </div>
        <div className="flex-1 space-y-1">
          <Button variant="outline" size="sm" onClick={newSession} className="w-full">
            <RefreshCw className="w-3 h-3 mr-1" /> New Session
          </Button>
          <FieldHint>Creates new session ID and clears chat. Backend treats as fresh conversation — no prior context.</FieldHint>
        </div>
      </div>
    </div>
  );

  const chatPanel = (
    <Card className="flex flex-col h-[calc(100vh-200px)] min-h-[400px]">
      <CardHeader className="py-3 border-b border-border">
        <CardTitle className="text-sm font-mono">Chat — {sessionId.slice(0, 8)}…</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">Send a message to start testing the chatbot.</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] px-3 py-2 text-sm whitespace-pre-wrap",
                msg.role === "user" && "bg-primary text-primary-foreground",
                msg.role === "bot" && "bg-muted text-foreground",
                msg.role === "error" && "bg-destructive text-destructive-foreground"
              )}
            >
              {msg.role === "error" && <AlertTriangle className="w-3 h-3 inline mr-1" />}
              {msg.content}
              {msg.escalated && <Badge variant="outline" className="ml-2 text-[10px] border-border">Escalated</Badge>}
              <div className={cn("text-[10px] mt-1 opacity-60", msg.role === "user" ? "text-right" : "text-left")}>
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-muted px-4 py-2 text-sm flex items-center gap-1">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse [animation-delay:200ms]">●</span>
              <span className="animate-pulse [animation-delay:400ms]">●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <div className="border-t border-border p-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          disabled={sending}
          className="flex-1"
        />
        <Button onClick={sendMessage} disabled={sending || !input.trim()} size="icon">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </Card>
  );

  if (isMobile) {
    return (
      <div className="space-y-4">
        <Accordion type="single" collapsible>
          <AccordionItem value="config">
            <AccordionTrigger className="text-sm font-medium">Chatbot Test Console — Config</AccordionTrigger>
            <AccordionContent>{configPanel}</AccordionContent>
          </AccordionItem>
        </Accordion>
        {chatPanel}
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <Card className="w-[300px] shrink-0">
        <CardHeader className="py-3 border-b border-border">
          <CardTitle className="text-sm">Chatbot Test Console</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">{configPanel}</CardContent>
      </Card>
      <div className="flex-1 min-w-0">{chatPanel}</div>
    </div>
  );
};

export default AdminTestChatTab;
