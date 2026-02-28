import { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Linkedin, MapPin, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const linkColumns = [
  {
    title: "SHOP",
    links: [
      { label: "Browse Catalog", to: "/browse" },
      { label: "Kitchen Cabinets", to: "/browse" },
      { label: "Vanity Cabinets", to: "/browse" },
      { label: "Storage", to: "/browse" },
      { label: "All Categories", to: "/browse" },
    ],
  },
  {
    title: "FOR PROS",
    links: [
      { label: "For Contractors", to: "/for-contractors" },
      { label: "For Sellers", to: "/for-sellers" },
      { label: "For Builders", to: "/browse" },
      { label: "Seller Agreement", to: "/page/seller-agreement" },
    ],
  },
  {
    title: "COMPANY",
    links: [
      { label: "About Us", to: "/page/about-us" },
      { label: "Our Story", to: "/page/our-story" },
      { label: "How It Works", to: "/how-it-works" },
      { label: "Careers", to: "/page/careers" },
      { label: "Contact", to: "/about" },
    ],
  },
  {
    title: "SUPPORT",
    links: [
      { label: "Help Center", to: "#" },
      { label: "Get a Quote", to: "/quote-request" },
      { label: "Warranty Info", to: "/page/warranty-information" },
      { label: "Installation FAQ", to: "/page/installation-guide" },
      { label: "Shipping Info", to: "/page/shipping-delivery" },
    ],
  },
  {
    title: "LEGAL",
    links: [
      { label: "Privacy Policy", to: "/page/privacy-policy" },
      { label: "Terms of Service", to: "/page/terms-of-service" },
      { label: "Cookie Policy", to: "/page/cookie-policy" },
      { label: "Return & Refund Policy", to: "/page/return-refund-policy" },
      { label: "Accessibility", to: "/page/accessibility" },
      { label: "Disclaimer", to: "/page/disclaimer" },
    ],
  },
];

const Footer = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      toast({
        title: "Consent required",
        description: "Please consent to receive emails to subscribe.",
        variant: "destructive",
      });
      return;
    }
    if (!email.trim()) return;
    toast({ title: "Thanks for subscribing!", description: "We'll keep you updated." });
    setEmail("");
    setConsent(false);
  };

  return (
    <footer className="bg-foreground text-background">
      {/* ROW 1 — Brand + Social */}
      <div className="container mx-auto px-4 pt-16 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-background flex items-center justify-center shrink-0">
              <span className="font-serif font-bold text-xl text-foreground">F</span>
            </div>
            <div>
              <span className="font-serif text-xl font-semibold">Fit-Match</span>
              <span className="block text-xs text-gray-400 -mt-1">Luxury Cabinet Exchange</span>
              <p className="text-sm text-gray-400 mt-3 max-w-md">
                GTA's premier marketplace for premium European cabinetry at 50-80% off retail.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-background transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-background transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" aria-label="LinkedIn" className="text-gray-400 hover:text-background transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* ROW 2 — Link Grid */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            {linkColumns.map((col) => (
              <div key={col.title}>
                <h4 className="font-sans font-bold text-sm tracking-wider uppercase mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-1">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.to === "#" ? (
                        <a href="#" className="text-sm text-gray-400 hover:text-background transition-colors inline-block min-h-[44px] py-2">
                          {link.label}
                        </a>
                      ) : (
                        <Link to={link.to} className="text-sm text-gray-400 hover:text-background transition-colors inline-block min-h-[44px] py-2">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3 — Newsletter + Contact */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Newsletter */}
            <div>
              <h4 className="font-sans font-bold text-sm tracking-wider uppercase mb-4">
                Stay Updated
              </h4>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background text-foreground border-2 border-background flex-1"
                  />
                  <Button
                    type="submit"
                    className="bg-foreground text-background border-2 border-background hover:bg-gray-900 shrink-0"
                  >
                    Subscribe
                  </Button>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="newsletter-consent"
                    checked={consent}
                    onCheckedChange={(v) => setConsent(v === true)}
                    className="mt-0.5 border-gray-400 data-[state=checked]:bg-background data-[state=checked]:text-foreground"
                  />
                  <label htmlFor="newsletter-consent" className="text-xs text-gray-400 leading-relaxed cursor-pointer">
                    I consent to receive marketing emails from FitMatch about products, promotions, and renovation tips. I can unsubscribe at any time.
                  </label>
                </div>
              </form>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-sans font-bold text-sm tracking-wider uppercase mb-4">
                Contact Us
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>137 Chrislea Rd, Woodbridge, ON L4L 8N6</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href="mailto:info@fitmatch.ca" className="text-gray-400 hover:text-background transition-colors">
                    info@fitmatch.ca
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href="tel:+14168541412" className="text-gray-400 hover:text-background transition-colors">
                    +1 (416) 854-1412
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 4 — Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-500">
            <span>© {new Date().getFullYear()} The Fit-Match Luxury Cabinet Exchange. All rights reserved.</span>
            <span>All prices in CAD. HST (13%) not included.</span>
            <span>Built in Toronto 🇨🇦</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
