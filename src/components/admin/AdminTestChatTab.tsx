import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Send, RefreshCw, Trash2, Loader2, AlertTriangle } from "lucide-react";
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

const AdminTestChatTab = () => {
  const isMobile = useIsMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sellerId, setSellerId] = useState(DEFAULT_SELLER_ID);
  const [sessionId, setSessionId] = useState(generateUUID);
  const [useProduction, setUseProduction] = useState(false);
  const [buyerId, setBuyerId] = useState("");
  const [userRole, setUserRole] = useState("guest");
  const [chatbotMode, setChatbotMode] = useState("buyer_inquiry");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const webhookUrl = useProduction ? PROD_URL : TEST_URL;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const regenerateSession = useCallback(() => setSessionId(generateUUID()), []);

  const clearChat = useCallback(() => {
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

  const configPanel = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="seller-id">Seller ID</Label>
        <Input id="seller-id" value={sellerId} onChange={(e) => setSellerId(e.target.value)} className="font-mono text-xs mt-1" />
      </div>
      <div>
        <Label htmlFor="session-id">Session ID</Label>
        <div className="flex gap-2 mt-1">
          <Input id="session-id" value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="font-mono text-xs" />
          <Button variant="outline" size="icon" onClick={regenerateSession} title="Regenerate">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div>
        <Label>Webhook URL</Label>
        <div className="flex items-center gap-2 mt-1">
          <Button variant={!useProduction ? "default" : "outline"} size="sm" onClick={() => setUseProduction(false)}>Test</Button>
          <Button variant={useProduction ? "default" : "outline"} size="sm" onClick={() => setUseProduction(true)}>Production</Button>
        </div>
        <p className="text-[10px] font-mono text-muted-foreground mt-1 break-all">{webhookUrl}</p>
      </div>
      <div>
        <Label htmlFor="buyer-id">Buyer ID (optional)</Label>
        <Input id="buyer-id" value={buyerId} onChange={(e) => setBuyerId(e.target.value)} className="font-mono text-xs mt-1" placeholder="Leave empty" />
      </div>
      <div>
        <Label>User Role</Label>
        <Select value={userRole} onValueChange={setUserRole}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="guest">guest</SelectItem>
            <SelectItem value="authenticated">authenticated</SelectItem>
            <SelectItem value="admin">admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Chatbot Mode</Label>
        <Select value={chatbotMode} onValueChange={setChatbotMode}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="buyer_inquiry">buyer_inquiry</SelectItem>
            <SelectItem value="product_support">product_support</SelectItem>
            <SelectItem value="general">general</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={clearChat} className="flex-1">
          <Trash2 className="w-3 h-3 mr-1" /> Clear Chat
        </Button>
        <Button variant="outline" size="sm" onClick={regenerateSession} className="flex-1">
          <RefreshCw className="w-3 h-3 mr-1" /> New Session
        </Button>
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
              {msg.escalated && <Badge variant="outline" className="ml-2 text-[10px] border-orange-500 text-orange-500">Escalated</Badge>}
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
