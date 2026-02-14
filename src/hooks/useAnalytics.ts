import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { initSession, trackPageView, updateSessionActivity } from "@/lib/analytics";

/**
 * Hook to initialize analytics tracking.
 * Place this once in your App component.
 * Automatically tracks page views on route changes.
 */
export const useAnalytics = () => {
  const location = useLocation();
  const initialized = useRef(false);

  useEffect(() => {
    // Don't track admin pages
    if (location.pathname.startsWith("/admin")) return;

    if (!initialized.current) {
      initSession();
      initialized.current = true;
    }

    trackPageView(location.pathname);
    updateSessionActivity();
  }, [location.pathname]);
};
