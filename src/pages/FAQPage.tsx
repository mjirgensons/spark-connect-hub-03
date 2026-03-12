import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  id: string;
  group_id: string;
  group_title: string;
  question: string;
  answer: string;
  sort_order: number;
}

const FAQPage = () => {
  usePageMeta("FAQ", "Frequently asked questions about FitMatch — how dimension matching works, pricing, delivery, returns, and joining as a contractor or seller.");

  const { data, isLoading } = useQuery({
    queryKey: ["faq-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq_items")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as FAQItem[];
    },
    staleTime: 300_000,
  });

  const faqGroups = useMemo(() => {
    if (!data) return [];
    const groupMap = new Map<string, { id: string; title: string; items: FAQItem[] }>();
    const groupOrder: string[] = [];
    data.forEach((item) => {
      if (!groupMap.has(item.group_id)) {
        groupMap.set(item.group_id, { id: item.group_id, title: item.group_title, items: [] });
        groupOrder.push(item.group_id);
      }
      groupMap.get(item.group_id)!.items.push(item);
    });
    return groupOrder.map((id) => groupMap.get(id)!);
  }, [data]);

  const jsonLd = useMemo(() => {
    if (!data || data.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: data.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

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
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-md" />
              ))}
            </>
          ) : faqGroups.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              FAQ content is being updated. Please check back soon.
            </p>
          ) : (
            faqGroups.map((group) => (
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
                    <AccordionItem key={item.id} value={`${group.id}-${i}`}>
                      <AccordionTrigger className="font-medium text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            ))
          )}

          {/* CTA */}
          <Separator />
          <div className="text-center py-8">
            <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
              Still have questions?
            </h2>
            <p className="text-muted-foreground mb-6">
              Our team is happy to help — reach out anytime.
            </p>
            <Button size="lg" asChild className="min-h-[48px]">
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
