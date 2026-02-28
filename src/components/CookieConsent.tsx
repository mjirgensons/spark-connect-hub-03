import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Shield, ChevronDown } from "lucide-react";

interface CookieCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_required: boolean;
  sort_order: number;
}

interface CookieDefinition {
  id: string;
  category_id: string;
  name: string;
  provider: string;
  purpose: string;
  duration: string;
  type: string;
}

interface BannerSettings {
  cookie_banner_text: string;
  cookie_accept_text: string;
  cookie_reject_text: string;
  cookie_settings_text: string;
  cookie_policy_link_text: string;
  cookie_banner_version: string;
}

const DEFAULT_SETTINGS: BannerSettings = {
  cookie_banner_text: "We use cookies to improve your experience and analyze site traffic. You can manage your preferences at any time.",
  cookie_accept_text: "Accept All",
  cookie_reject_text: "Reject Non-Essential",
  cookie_settings_text: "Cookie Settings",
  cookie_policy_link_text: "Read our Cookie Policy",
  cookie_banner_version: "1.0",
};

type ConsentMap = Record<string, boolean>;

const STORAGE_KEY = "fm_cookie_consent";
const VERSION_KEY = "fm_cookie_banner_version";
const SESSION_KEY = "fm_session_id";

const getSessionId = (): string => {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

export const getCookieConsent = (): ConsentMap | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentMap;
  } catch {
    return null;
  }
};

const saveConsent = (prefs: ConsentMap, bannerVersion: string) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  localStorage.setItem(VERSION_KEY, bannerVersion);
  window.dispatchEvent(new Event("fm_consent_change"));
};

const logConsent = async (action: string, categories: ConsentMap, bannerVersion: string) => {
  try {
    await supabase.from("consent_logs").insert({
      session_id: getSessionId(),
      action,
      categories,
      page_url: window.location.href,
      banner_version: bannerVersion,
      user_agent: navigator.userAgent,
      ip_hash: null,
    } as any);
  } catch {
    // Silent fail
  }
};

const CookieConsent = () => {
  const location = useLocation();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [prefs, setPrefs] = useState<ConsentMap>({});
  const [isUpdate, setIsUpdate] = useState(false);

  const isAdmin = location.pathname.startsWith("/admin");

  // Fetch banner settings
  const { data: settings = DEFAULT_SETTINGS } = useQuery<BannerSettings>({
    queryKey: ["cookie_banner_settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", Object.keys(DEFAULT_SETTINGS));
      const result = { ...DEFAULT_SETTINGS };
      (data || []).forEach((row: any) => {
        if (row.key in result) (result as any)[row.key] = row.value;
      });
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch active categories
  const { data: categories = [] } = useQuery<CookieCategory[]>({
    queryKey: ["cookie_categories_active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cookie_categories")
        .select("id, name, slug, description, is_required, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      return (data as any) || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch active definitions
  const { data: definitions = [] } = useQuery<CookieDefinition[]>({
    queryKey: ["cookie_definitions_active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cookie_definitions")
        .select("id, category_id, name, provider, purpose, duration, type")
        .eq("is_active", true);
      return (data as any) || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const stored = getCookieConsent();
    const storedVersion = localStorage.getItem(VERSION_KEY);

    if (stored && storedVersion === settings.cookie_banner_version) {
      setConsentGiven(true);
      setPrefs(stored);
    } else {
      setShowBanner(true);
      setConsentGiven(false);
    }
  }, [settings.cookie_banner_version]);

  if (isAdmin) return null;

  const bannerVersion = settings.cookie_banner_version;

  const buildAllTrue = (): ConsentMap => {
    const map: ConsentMap = {};
    categories.forEach((c) => { map[c.slug] = true; });
    return map;
  };

  const buildRequiredOnly = (): ConsentMap => {
    const map: ConsentMap = {};
    categories.forEach((c) => { map[c.slug] = c.is_required; });
    return map;
  };

  const handleAcceptAll = () => {
    const all = buildAllTrue();
    saveConsent(all, bannerVersion);
    logConsent("accept_all", all, bannerVersion);
    setPrefs(all);
    setShowBanner(false);
    setShowSettings(false);
    setConsentGiven(true);
  };

  const handleRejectNonEssential = () => {
    const minimal = buildRequiredOnly();
    saveConsent(minimal, bannerVersion);
    logConsent("reject_non_essential", minimal, bannerVersion);
    setPrefs(minimal);
    setShowBanner(false);
    setConsentGiven(true);
  };

  const handleSavePreferences = () => {
    const finalPrefs = { ...prefs };
    categories.forEach((c) => {
      if (c.is_required) finalPrefs[c.slug] = true;
    });
    saveConsent(finalPrefs, bannerVersion);
    logConsent(isUpdate ? "update" : "custom", finalPrefs, bannerVersion);
    setPrefs(finalPrefs);
    setShowSettings(false);
    setShowBanner(false);
    setConsentGiven(true);
    setIsUpdate(false);
  };

  const handleOpenSettings = () => {
    setIsUpdate(false);
    if (!consentGiven) {
      setPrefs(buildRequiredOnly());
    }
    setShowSettings(true);
  };

  const handleReopenFromIcon = () => {
    const stored = getCookieConsent();
    if (stored) setPrefs(stored);
    setIsUpdate(true);
    setShowSettings(true);
  };

  const defsForCategory = (categoryId: string) =>
    definitions.filter((d) => d.category_id === categoryId);

  return (
    <>
      {/* Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] bg-foreground text-background border-t-2 border-background py-4 px-6">
          <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex-1 space-y-1">
                <p className="text-sm">{settings.cookie_banner_text}</p>
                <Link
                  to="/page/cookie-policy"
                  className="text-xs underline text-gray-400 hover:text-background transition-colors"
                >
                  {settings.cookie_policy_link_text}
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto shrink-0">
                <Button
                  onClick={handleAcceptAll}
                  className="bg-background text-foreground hover:bg-gray-200 border-0 w-full sm:w-auto"
                >
                  {settings.cookie_accept_text}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRejectNonEssential}
                  className="border-2 border-background text-background bg-transparent hover:bg-background/10 w-full sm:w-auto"
                >
                  {settings.cookie_reject_text}
                </Button>
                <button
                  onClick={handleOpenSettings}
                  className="text-sm underline text-gray-400 hover:text-background transition-colors py-2"
                >
                  {settings.cookie_settings_text}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating cookie icon */}
      {consentGiven && !showBanner && (
        <button
          onClick={handleReopenFromIcon}
          className="fixed bottom-4 left-4 z-[55] w-9 h-9 bg-foreground text-background border-2 border-border flex items-center justify-center hover:bg-gray-800 transition-colors"
          aria-label="Cookie settings"
          title="Cookie settings"
        >
          <Shield className="w-4 h-4" />
        </button>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {categories.map((cat) => {
              const catDefs = defsForCategory(cat.id);
              return (
                <div key={cat.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <Label className="font-bold text-sm">{cat.name}</Label>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                    <Switch
                      checked={cat.is_required ? true : (prefs[cat.slug] ?? false)}
                      disabled={cat.is_required}
                      className={cat.is_required ? "opacity-50" : ""}
                      onCheckedChange={(v) =>
                        setPrefs((p) => ({ ...p, [cat.slug]: v }))
                      }
                    />
                  </div>
                  {catDefs.length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronDown className="w-3 h-3" />
                        {catDefs.length} cookie{catDefs.length !== 1 ? "s" : ""} in this category
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 space-y-2 pl-2 border-l-2 border-border">
                          {catDefs.map((def) => (
                            <div key={def.id} className="space-y-0.5">
                              <p className="text-xs font-semibold font-mono">{def.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {def.provider} · {def.duration} · {def.type}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{def.purpose}</p>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              );
            })}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSavePreferences} className="flex-1">
                Save Preferences
              </Button>
              <Button variant="outline" onClick={handleAcceptAll} className="flex-1">
                {settings.cookie_accept_text}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;
