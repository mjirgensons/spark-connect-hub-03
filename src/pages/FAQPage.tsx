import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqGroups = [
  {
    id: "how-it-works",
    title: "How FitMatch Works",
    items: [
      {
        q: "What is FitMatch?",
        a: "FitMatch is a marketplace connecting buyers with surplus and overstock premium European cabinetry at 50–80% off retail prices. We serve the Greater Toronto Area with complete cabinet solutions including installation drawings, contractor matching, and bundled countertops and appliances.",
      },
      {
        q: "How does dimension matching work?",
        a: "Enter your opening dimensions (width, height, and depth) into our matching tool. Our system searches all available inventory to find cabinets that fit your space. If your wall opening doesn't match standard sizes, our approach is to rebuild the wall to fit the cabinets — this is significantly cheaper than ordering custom cabinetry.",
      },
      {
        q: "Why are the prices so low?",
        a: "Our inventory comes from cancelled luxury development projects, overstock from European manufacturers, and showroom display models. These are the same cabinets installed in $500K+ kitchens — we simply connect you to surplus inventory that would otherwise go to waste.",
      },
      {
        q: "Do you serve areas outside the GTA?",
        a: "Currently, delivery and contractor matching are available within the Greater Toronto Area (roughly 100 km from downtown Toronto). Buyers outside this area can still purchase cabinets but would need to arrange their own delivery and installation.",
      },
    ],
  },
  {
    id: "ordering",
    title: "Ordering & Payment",
    items: [
      {
        q: "How do I place an order?",
        a: "Browse our catalog, find cabinets that match your space, add them to your cart, and check out. You can pay with credit card via our secure Stripe checkout. For bulk or B2B orders, use our Request a Quote form for custom pricing.",
      },
      {
        q: "Can I request a custom quote for a large project?",
        a: "Yes. Our quote request system is designed for contractors, builders, and developers who need bulk pricing or multi-unit solutions. Submit your project details and we'll respond within 1–2 business days with a tailored quote.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit and debit cards through Stripe. For B2B clients, we also support invoicing through our quote request process.",
      },
      {
        q: "Is my payment information secure?",
        a: "Absolutely. All transactions are processed through Stripe with PCI-compliant 256-bit SSL encryption. We never store your card details on our servers.",
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery & Returns",
    items: [
      {
        q: "How long does delivery take?",
        a: "Standard preparation takes approximately 7 business days, followed by delivery within the GTA. Exact timelines depend on the specific product and your location.",
      },
      {
        q: "What is your return policy?",
        a: "We offer a 30-day return policy. If the cabinets don't meet your expectations, contact us within 30 days of delivery for a full refund. Items must be in original condition. See our full Return Policy page for details.",
      },
      {
        q: "Do you deliver and install?",
        a: "We handle delivery within the GTA. For installation, we match you with verified contractors from our network who specialize in cabinet installation, plumbing, electrical, and related trades.",
      },
    ],
  },
  {
    id: "contractors",
    title: "For Contractors & Builders",
    items: [
      {
        q: "How do I join as a contractor?",
        a: "Register on our platform as a contractor and specify your trade type and service area. Once verified, you'll receive project notifications and access to installation drawings and technical specifications.",
      },
      {
        q: "What kind of documentation do you provide?",
        a: "Every cabinet model comes with detailed MEP (Mechanical, Electrical, Plumbing) rough-in drawings, installation guides, and appliance compatibility lists. Contractors can access these through their dashboard.",
      },
      {
        q: "How does contractor matching work?",
        a: "When a client purchases cabinets and needs installation, our system matches them with verified contractors based on trade type, service area, and availability. Contractors receive project invitations with full specifications.",
      },
    ],
  },
  {
    id: "sellers",
    title: "For Sellers",
    items: [
      {
        q: "How can I list my cabinets on FitMatch?",
        a: "Register as a seller and upload your product catalog through our seller dashboard. Include dimensions, photos, installation drawings, and appliance compatibility data. Our system automatically makes your products available for dimension matching across the platform.",
      },
      {
        q: "What does it cost to sell on FitMatch?",
        a: "Basic seller accounts are free. We operate on a commission model — details are available when you register as a seller.",
      },
    ],
  },
];

const allQuestions = faqGroups.flatMap((g) => g.items);

const FAQPage = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allQuestions.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="container mx-auto px-4 py-10 pt-24 md:pt-10">
        <Breadcrumbs items={[{ label: "FAQ" }]} />

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about buying, matching, and installing premium European cabinetry.
          </p>
        </div>

        {/* FAQ Groups */}
        <div className="max-w-3xl mx-auto space-y-10">
          {faqGroups.map((group) => (
            <Card
              key={group.id}
              id={group.id}
              className="border-2 border-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))] sm:shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-5 md:p-8"
            >
              <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
                {group.title}
              </h2>
              <Accordion type="multiple" className="w-full">
                {group.items.map((item, i) => (
                  <AccordionItem key={i} value={`${group.id}-${i}`}>
                    <AccordionTrigger className="font-medium text-left">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          ))}

          {/* CTA */}
          <Separator />
          <div className="text-center py-8">
            <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
              Still have questions?
            </h2>
            <p className="text-muted-foreground mb-6">
              Our team is happy to help — reach out anytime.
            </p>
            <Button size="lg" asChild className="min-h-[48px] shadow-[2px_2px_0px_0px_hsl(var(--foreground))] sm:shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
              <Link to="/about">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;
