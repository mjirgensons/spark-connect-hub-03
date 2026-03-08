import { Link } from "react-router-dom";
import { Instagram, Facebook, Linkedin, MapPin, Mail, Phone } from "lucide-react";
import NewsletterSignup from "@/components/NewsletterSignup";

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
      { label: "Blog", to: "/blog" },
      { label: "Careers", to: "/page/careers" },
      { label: "Contact", to: "/about" },
    ],
  },
  {
    title: "SUPPORT",
    links: [
      { label: "Help Center", to: "#" },
      { label: "FAQ", to: "/faq" },
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

  return (
    <footer className="bg-foreground text-background">
      {/* ROW 1 — Brand + Social */}
      <div className="container mx-auto px-4 pt-16 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="flex items-start gap-1.5">
            <div className="w-10 h-10 bg-background flex items-center justify-center shrink-0">
              <span className="font-serif font-bold text-xl text-foreground">F</span>
            </div>
            <div>
              <span className="font-serif text-xl font-semibold">Fit-Match</span>
              <span className="block text-xs text-muted-foreground -mt-1">Luxury Cabinet Exchange</span>
              <p className="text-sm text-muted-foreground mt-3 max-w-md">
                GTA's premier marketplace for premium European cabinetry at 50-80% off retail.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-background transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-background transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-background transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* ROW 2 — Link Grid */}
      <div className="border-t border-border">
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
              <NewsletterSignup source="footer" />
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
