import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Send, RefreshCw, Trash2, Loader2, AlertTriangle, BookOpen, MessageSquare, History, ArrowLeft, Info } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import SessionHistoryTab from "./SessionHistoryTab";

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

const InfoTip = ({ text }: { text: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help shrink-0" />
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-[260px] text-xs">
      {text}
    </TooltipContent>
  </Tooltip>
);

interface AdminTestChatTabProps {
  onNavigateToChatbotSettings?: () => void;
}

const AdminTestChatTab = ({ onNavigateToChatbotSettings }: AdminTestChatTabProps) => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState("console");
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
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const regenerateSession = useCallback(() => setSessionId(generateUUID() as string), []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  const newSession = useCallback(() => {
    setMessages([]);
    regenerateSession();
  }, [regenerateSession]);

  const handleLoadSession = useCallback((data: {
    seller_id: string;
    session_id: string;
    user_role: string;
    chatbot_mode: string;
    messages: Array<{ role: "user" | "bot" | "error"; content: string; timestamp: Date; id: string }>;
  }) => {
    setSellerId(data.seller_id);
    setSessionId(data.session_id);
    setUserRole(data.user_role);
    setChatbotMode(data.chatbot_mode);
    setMessages(data.messages.map((m) => ({ ...m, escalated: false })));
    setActiveTab("console");
    toast({ title: "Session loaded — you can continue this conversation" });
  }, [toast]);

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
    <TooltipProvider delayDuration={200}>
      <div className="space-y-3">
        {testGuide}
        <div>
          <div className="flex items-center gap-1.5">
            <Label htmlFor="seller-id" className="text-xs">Seller ID</Label>
            <InfoTip text="UUID of the seller whose AI chatbot you are testing. Each seller has an isolated Pinecone namespace (seller_{id})." />
          </div>
          <Input id="seller-id" value={sellerId} onChange={(e) => setSellerId(e.target.value)} className="font-mono text-xs mt-1" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <Label htmlFor="session-id" className="text-xs">Session ID</Label>
            <InfoTip text="Unique conversation identifier. All messages share this ID. Used by WF-23 to fetch chat history and maintain context." />
          </div>
          <div className="flex gap-2 mt-1">
            <Input id="session-id" value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={regenerateSession} title="New Session ID">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <Label className="text-xs">Webhook URL</Label>
            <InfoTip text="Test URL (webhook-test/) works only while WF-23 is in listening mode in n8n. Production URL (webhook/) works when WF-23 is active." />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Button variant={!useProduction ? "default" : "outline"} size="sm" onClick={() => setUseProduction(false)}>Test</Button>
            <Button variant={useProduction ? "default" : "outline"} size="sm" onClick={() => setUseProduction(true)}>Prod</Button>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground mt-1 break-all">{webhookUrl}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <Label htmlFor="buyer-id" className="text-xs">Buyer ID</Label>
            <InfoTip text="UUID of a specific buyer from profiles table. Leave empty = anonymous guest. Enter a UUID = test as that buyer with their history and rate limits." />
          </div>
          <Input id="buyer-id" value={buyerId} onChange={(e) => setBuyerId(e.target.value)} className="font-mono text-xs mt-1" placeholder="Optional" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <Label className="text-xs">User Role</Label>
            <InfoTip text={selectedRole?.description || "Select a user role to simulate."} />
          </div>
          <Select value={userRole} onValueChange={setUserRole}>
            <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {USER_ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <Label className="text-xs">Chatbot Mode</Label>
            <InfoTip text={selectedMode?.description || "Select a chatbot mode."} />
          </div>
          <Select value={chatbotMode} onValueChange={setChatbotMode}>
            <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CHATBOT_MODE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 pt-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={clearChat} className="flex-1">
                <Trash2 className="w-3 h-3 mr-1" /> Clear
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Removes messages from display only. Backend still has old messages.</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={newSession} className="flex-1">
                <RefreshCw className="w-3 h-3 mr-1" /> New Session
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Creates new session ID and clears chat. Backend treats as fresh conversation.</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );

  const chatPanel = (
    <div className="flex flex-col h-full border rounded-lg bg-card overflow-hidden">
      <div className="py-2 px-4 border-b border-border shrink-0">
        <p className="text-sm font-mono font-medium">Chat — {sessionId.slice(0, 8)}…</p>
      </div>
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
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
      </div>
      <div className="border-t border-border p-3 flex gap-2 shrink-0">
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
    </div>
  );

  const consoleContent = isMobile ? (
    <div className="space-y-4">
      <Accordion type="single" collapsible>
        <AccordionItem value="config">
          <AccordionTrigger className="text-sm font-medium">Chatbot Test Console — Config</AccordionTrigger>
          <AccordionContent>{configPanel}</AccordionContent>
        </AccordionItem>
      </Accordion>
      {chatPanel}
    </div>
  ) : (
    <div className="flex gap-4 h-[calc(100vh-180px)] overflow-hidden">
      <Card className="w-[35%] min-w-[260px] max-w-[340px] shrink-0 flex flex-col overflow-hidden">
        <CardHeader className="py-3 border-b border-border shrink-0">
          <CardTitle className="text-sm">Chatbot Test Console</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 pb-3 overflow-y-auto flex-1">{configPanel}</CardContent>
      </Card>
      <div className="flex-1 min-w-0">{chatPanel}</div>
    </div>
  );

  return (
    <div>
      {onNavigateToChatbotSettings && (
        <button
          onClick={onNavigateToChatbotSettings}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3 h-3" /> Chatbot Settings
        </button>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="console" className="gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Chat Console
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="w-3.5 h-3.5" /> Session History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="console" className="mt-3">
          {consoleContent}
        </TabsContent>
        <TabsContent value="history" className="mt-3">
          <SessionHistoryTab onLoadSession={handleLoadSession} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTestChatTab;
