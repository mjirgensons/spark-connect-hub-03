import { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ChatWidget from "./ChatWidget";

/**
 * GlobalChatWidget renders the ChatWidget on all public pages.
 * On product detail pages, it extracts seller context from the product.
 * On all other pages, it runs in platform-wide mode (no sellerId).
 * It is hidden on /admin/* and /seller/* routes, and on mobile <640px.
 */
export default function GlobalChatWidget() {
  const location = useLocation();
  const { user } = useAuth();

  // Hide on admin and seller dashboard routes
  const path = location.pathname;
  if (path.startsWith("/admin") || path.startsWith("/seller")) {
    return null;
  }

  // Check if we're on a product detail page
  const productMatch = path.match(/^\/product\/([^/]+)/);
  const productId = productMatch?.[1] || null;

  // If on a product page, the Product.tsx component renders its own ChatWidget
  // with full seller context, so we skip here to avoid duplicates
  if (productId) {
    return null;
  }

  return <PlatformChatWidget userRole={user ? "registered" : "guest"} />;
}

function PlatformChatWidget({ userRole }: { userRole: string }) {
  const [isChatMobile, setIsChatMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsChatMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isChatMobile) return null;

  // Fetch consent modal setting from site_settings
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

  const consentModalEnabled = consentSetting ?? true;

  return (
    <ChatWidget
      userRole={userRole}
      skipConsent={!consentModalEnabled}
      chatbotActive={true}
    />
  );
}
