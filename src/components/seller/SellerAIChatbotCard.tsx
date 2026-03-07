import { useState, useEffect } from "react";
import { Bot, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    const fetch = async () => {
      setLoading(true);
      const [profileRes, kbRes, prodRes] = await Promise.all([
        supabase.from("profiles").select("ai_chatbot_enabled").eq("id", sellerId).single(),
        supabase.from("seller_knowledge_base").select("id", { count: "exact", head: true }).eq("seller_id", sellerId),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("seller_id", sellerId).eq("pinecone_synced", true),
      ]);
      const enabled = !!(profileRes.data as any)?.ai_chatbot_enabled;
      setChatbotEnabled(enabled);
      if (enabled) setConsentAccepted(true);
      setKbCount(kbRes.count ?? 0);
      setSyncedProductCount(prodRes.count ?? 0);
      setLoading(false);
    };
    fetch();
  }, [sellerId]);

  const hasKb = kbCount >= 3;
  const hasSyncedProducts = syncedProductCount > 0;
  const allChecks = hasKb && hasSyncedProducts && consentAccepted;

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      if (!consentAccepted) {
        setShowConsent(true);
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
    setConsentAccepted(true);
    setShowConsent(false);
    await updateEnabled(true);
  };

  const checkIcon = (ok: boolean) => (
    <CheckCircle className={`w-5 h-5 shrink-0 ${ok ? "text-green-600" : "text-muted-foreground/40"}`} />
  );

  if (loading) return null;

  return (
    <>
      <Card className="border-2 border-foreground p-6" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-primary flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <p className="font-sans font-bold text-lg">AI Chatbot</p>
        </div>

        {chatbotEnabled ? (
          /* STATE B — ON */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Enable AI Chatbot</span>
              <Switch checked onCheckedChange={handleToggle} />
            </div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              Your AI assistant is LIVE on your product pages
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span>0 conversations this week</span>
              <span>0 messages handled</span>
            </div>
            <Button variant="outline" className="border-2 border-foreground" asChild>
              <Link to="/seller/knowledge-base">Manage Knowledge Base</Link>
            </Button>
          </div>
        ) : (
          /* STATE A — OFF */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Enable AI Chatbot</span>
              <Switch checked={false} disabled={!allChecks} onCheckedChange={handleToggle} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {checkIcon(hasKb)}
                <span>Add at least 3 Knowledge Base articles</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {checkIcon(hasSyncedProducts)}
                <span>Products synced to AI</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {checkIcon(consentAccepted)}
                <span>Review and accept AI consent terms</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Complete all steps above to activate your AI assistant
            </p>

            <Button variant="outline" className="border-2 border-foreground" asChild>
              <Link to="/seller/knowledge-base">Manage Knowledge Base</Link>
            </Button>
          </div>
        )}
      </Card>

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
