import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getCookieConsent } from "./CookieConsent";

export const HideChatOnAdmin = () => {
  const { pathname } = useLocation();
  const [consentTick, setConsentTick] = useState<number>(0);

  // Re-check on consent changes
  useEffect(() => {
    const handler = () => setConsentTick((t) => t + 1);
    window.addEventListener("fm_consent_change", handler);
    return () => window.removeEventListener("fm_consent_change", handler);
  }, []);

  useEffect(() => {
    const widget = document.querySelector("elevenlabs-convai") as HTMLElement | null;
    if (!widget) return;

    const isAdminRoute = pathname.startsWith("/admin");
    const consent = getCookieConsent();
    const functionalAllowed = consent?.functional === true;

    widget.style.display = "none";
  }, [pathname, consentTick]);

  return null;
};
