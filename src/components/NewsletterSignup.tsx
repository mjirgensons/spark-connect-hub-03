import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

const CONSENT_TEXT = "I agree to receive marketing emails from FitMatch. You can unsubscribe at any time.";

interface NewsletterSignupProps {
  source?: string;
}

const NewsletterSignup = ({ source = "footer" }: NewsletterSignupProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      toast({ title: "Consent required", description: "Please agree to receive emails to subscribe.", variant: "destructive" });
      return;
    }
    if (!email.trim()) return;

    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers" as any).insert({
      email: email.trim().toLowerCase(),
      source,
      consent_text: CONSENT_TEXT,
    } as any);
    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already subscribed!", description: "You're already on our list. Watch your inbox for updates." });
      } else {
        toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
      }
      return;
    }

    toast({ title: "Thanks for subscribing!", description: "Watch your inbox for updates." });
    setEmail("");
    setConsent(false);
  };

  return (
    <div>
      <h4 className="font-serif text-lg font-bold mb-1">Stay Updated</h4>
      <p className="text-sm text-muted-foreground mb-3">Get notified about new inventory, deals, and renovation tips.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-background text-foreground border-2 border-foreground/30 flex-1 text-sm"
          />
          <Button type="submit" size="sm" disabled={loading} className="shrink-0">
            <Mail className="w-4 h-4 mr-1" /> Subscribe
          </Button>
        </div>
        <div className="flex items-start gap-2">
          <Checkbox
            id="newsletter-consent-new"
            checked={consent}
            onCheckedChange={(v) => setConsent(v === true)}
            className="mt-0.5"
          />
          <label htmlFor="newsletter-consent-new" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            {CONSENT_TEXT}
          </label>
        </div>
      </form>
    </div>
  );
};

export default NewsletterSignup;
