import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ChatWidget from "./ChatWidget";

/**
 * GlobalChatWidget renders the ChatWidget on all public pages.
 * On product detail pages (/product/:id), it defers to Product.tsx's own ChatWidget.
 * On /admin/* and /seller/* routes it is hidden.
 * On all other pages it runs in platform-wide mode (no sellerId).
 */
export default function GlobalChatWidget() {
  const location = useLocation();
  const { user } = useAuth();
  const path = location.pathname;

  // Determine visibility
  const isHidden =
    path.startsWith("/admin") ||
    path.startsWith("/seller") ||
    /^\/product\/[^/]+/.test(path); // Product.tsx renders its own ChatWidget

  // Mobile check (<640px hides widget)
  const [isChatMobile, setIsChatMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsChatMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fetch consent modal setting
  const { data: consentSetting } = useQuery({
    queryKey: ["site-setting-consent-modal"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings" as any)
        .select("value")
        .eq("key", "chatbot_consent_modal_enabled")
        .maybeSingle();
      return (data as any)?.value !== "false";
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isHidden || isChatMobile) return null;

  const consentModalEnabled = consentSetting ?? true;

  return (
    <ChatWidget
      userRole={user ? "registered" : "guest"}
      skipConsent={!consentModalEnabled}
      chatbotActive={true}
    />
  );
}
