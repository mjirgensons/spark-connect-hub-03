import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ArrowLeft } from "lucide-react";

const FooterPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<{ title: string; content: string; section: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      const { data } = await supabase
        .from("footer_pages")
        .select("title, content, section")
        .eq("slug", slug || "")
        .maybeSingle();
      setPage(data);
      setLoading(false);
    };
    fetchPage();
  }, [slug]);

  const renderContent = (content: string) => {
    return content.split("\n\n").map((block, i) => {
      // Handle markdown-style bold headers
      const rendered = block.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      
      if (block.startsWith("•") || block.startsWith("- ")) {
        const items = block.split("\n").map(line => line.replace(/^[•\-]\s*/, ""));
        return (
          <ul key={i} className="list-disc list-inside space-y-1 text-muted-foreground">
            {items.map((item, j) => (
              <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
            ))}
          </ul>
        );
      }

      if (block.match(/^\d+\./)) {
        const items = block.split("\n");
        return (
          <ol key={i} className="list-decimal list-inside space-y-1 text-muted-foreground">
            {items.map((item, j) => (
              <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/^\d+\.\s*/, "").replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
            ))}
          </ol>
        );
      }

      return (
        <p key={i} className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: rendered }} />
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>
        <Footer />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Page Not Found</h1>
          <Link to="/" className="text-primary hover:underline">← Back to Home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const sectionLabel = page.section === "company" ? "Company" : page.section === "services" ? "Services" : "Resources";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-primary">{sectionLabel}</span>
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-8">{page.title}</h1>
        <div className="space-y-4">
          {renderContent(page.content)}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FooterPage;
