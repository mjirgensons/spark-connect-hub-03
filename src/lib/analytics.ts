import { supabase } from "@/integrations/supabase/client";

// Check if analytics cookies are consented
const hasAnalyticsConsent = (): boolean => {
  try {
    const raw = localStorage.getItem("fm_cookie_consent");
    if (!raw) return false;
    const prefs = JSON.parse(raw);
    return prefs?.analytics === true;
  } catch {
    return false;
  }
};

// Generate a unique session ID
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// Get or create session ID from sessionStorage
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("fm_session_id");
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem("fm_session_id", sessionId);
  }
  return sessionId;
};

// Parse UTM parameters from URL
const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || null,
    utm_medium: params.get("utm_medium") || null,
    utm_campaign: params.get("utm_campaign") || null,
    utm_term: params.get("utm_term") || null,
    utm_content: params.get("utm_content") || null,
  };
};

// Common event data
const getCommonData = () => {
  const utm = getUTMParams();
  return {
    session_id: getSessionId(),
    page_path: window.location.pathname,
    referrer: document.referrer || null,
    user_agent: navigator.userAgent,
    screen_width: window.innerWidth,
    screen_height: window.innerHeight,
    ...utm,
  };
};

// Track a generic event
export const trackEvent = async (
  eventType: string,
  eventCategory?: string,
  eventLabel?: string,
  eventValue?: number,
  metadata?: Record<string, unknown>
) => {
  try {
    await supabase.from("analytics_events").insert({
      ...getCommonData(),
      event_type: eventType,
      event_category: eventCategory || null,
      event_label: eventLabel || null,
      event_value: eventValue ?? null,
      metadata: metadata || {},
    } as any);
  } catch (e) {
    // Silently fail — analytics should never break the app
    console.debug("Analytics track error:", e);
  }
};

// Track page view
export const trackPageView = (path?: string) => {
  trackEvent("page_view", "navigation", path || window.location.pathname);
};

// Track CTA click
export const trackCTAClick = (buttonLabel: string) => {
  trackEvent("click", "cta", buttonLabel);
};

// Track product view
export const trackProductView = (productId: string, productName?: string) => {
  trackEvent("product_view", "product", productId, undefined, { product_name: productName });
};

// Track form events
export const trackFormView = (formName: string) => {
  trackEvent("form_view", "form", formName);
};

export const trackFormSubmit = (formName: string, metadata?: Record<string, unknown>) => {
  trackEvent("form_submit", "form", formName, undefined, metadata);
};

// Track scroll depth
export const trackScrollDepth = (sectionName: string, depthPercent: number) => {
  trackEvent("scroll", "section", sectionName, depthPercent);
};

// Track section visibility
export const trackSectionView = (sectionName: string) => {
  trackEvent("section_view", "section", sectionName);
};

// Initialize session tracking
let sessionInitialized = false;

export const initSession = async () => {
  if (sessionInitialized) return;
  sessionInitialized = true;

  const common = getCommonData();

  try {
    // Try to insert a new session
    const { error } = await supabase.from("analytics_sessions").insert({
      session_id: common.session_id,
      first_page: common.page_path,
      last_page: common.page_path,
      referrer: common.referrer,
      utm_source: common.utm_source,
      utm_medium: common.utm_medium,
      utm_campaign: common.utm_campaign,
      user_agent: common.user_agent,
      screen_width: common.screen_width,
      screen_height: common.screen_height,
    } as any);

    if (error && error.code === "23505") {
      // Session already exists (unique constraint), update it
      await supabase
        .from("analytics_sessions")
        .update({
          last_page: common.page_path,
          last_activity_at: new Date().toISOString(),
          is_bounce: false,
        } as any)
        .eq("session_id", common.session_id);
    }
  } catch (e) {
    console.debug("Session init error:", e);
  }
};

// Update session activity (call on navigation / interactions)
export const updateSessionActivity = async () => {
  const sessionId = getSessionId();
  try {
    await supabase
      .from("analytics_sessions")
      .update({
        last_page: window.location.pathname,
        last_activity_at: new Date().toISOString(),
        is_bounce: false,
      } as any)
      .eq("session_id", sessionId);
  } catch (e) {
    console.debug("Session update error:", e);
  }
};
