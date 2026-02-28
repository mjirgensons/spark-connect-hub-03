import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
}

const STORAGE_KEY = "fm_cookie_consent";

export const getCookieConsent = (): CookiePreferences | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookiePreferences;
  } catch {
    return null;
  }
};

const saveConsent = (prefs: CookiePreferences) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
};

const CookieConsent = () => {
  const location = useLocation();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    functional: false,
  });

  // Don't render on admin routes
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    const stored = getCookieConsent();
    if (stored) {
      setConsentGiven(true);
      setPrefs(stored);
    } else {
      setShowBanner(true);
    }
  }, []);

  if (isAdmin) return null;

  const handleAcceptAll = () => {
    const all: CookiePreferences = { essential: true, analytics: true, functional: true };
    saveConsent(all);
    setPrefs(all);
    setShowBanner(false);
    setConsentGiven(true);
  };

  const handleRejectNonEssential = () => {
    const minimal: CookiePreferences = { essential: true, analytics: false, functional: false };
    saveConsent(minimal);
    setPrefs(minimal);
    setShowBanner(false);
    setConsentGiven(true);
  };

  const handleSavePreferences = () => {
    saveConsent(prefs);
    setShowSettings(false);
    setShowBanner(false);
    setConsentGiven(true);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleReopenFromIcon = () => {
    const stored = getCookieConsent();
    if (stored) setPrefs(stored);
    setShowSettings(true);
  };

  return (
    <>
      {/* Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] bg-foreground text-background border-t-2 border-background py-4 px-6">
          <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex-1 space-y-1">
                <p className="text-sm">
                  We use cookies to improve your experience and analyze site traffic. You can manage your preferences at any time.
                </p>
                <Link
                  to="/page/cookie-policy"
                  className="text-xs underline text-gray-400 hover:text-background transition-colors"
                >
                  Cookie Policy
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto shrink-0">
                <Button
                  onClick={handleAcceptAll}
                  className="bg-background text-foreground hover:bg-gray-200 border-0 w-full sm:w-auto"
                >
                  Accept All
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRejectNonEssential}
                  className="border-2 border-background text-background bg-transparent hover:bg-background/10 w-full sm:w-auto"
                >
                  Reject Non-Essential
                </Button>
                <button
                  onClick={handleOpenSettings}
                  className="text-sm underline text-gray-400 hover:text-background transition-colors py-2"
                >
                  Cookie Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating cookie icon (after consent given) */}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Essential */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-bold text-sm">Essential Cookies</Label>
                <p className="text-xs text-muted-foreground">
                  Required for the site to function. These cannot be disabled.
                </p>
              </div>
              <Switch checked disabled className="opacity-50" />
            </div>

            {/* Analytics */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-bold text-sm">Analytics Cookies</Label>
                <p className="text-xs text-muted-foreground">
                  Help us understand how you use our site so we can improve it.
                </p>
              </div>
              <Switch
                checked={prefs.analytics}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
              />
            </div>

            {/* Functional */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-bold text-sm">Functional Cookies</Label>
                <p className="text-xs text-muted-foreground">
                  Enable enhanced features like voice chat and remembering your preferences.
                </p>
              </div>
              <Switch
                checked={prefs.functional}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, functional: v }))}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSavePreferences} className="flex-1">
                Save Preferences
              </Button>
              <Button variant="outline" onClick={handleAcceptAll} className="flex-1">
                Accept All
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;
