import { useState, useMemo } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";

const CATEGORIES = ["All", "Renovation Tips", "Buying Guide", "Industry News", "Contractor Resources", "Company News"];

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string;
  category: string | null;
  tags: string[] | null;
  published_at: string | null;
}

const BlogPage = () => {
  usePageMeta("Blog", "Expert tips on kitchen renovation, cabinet installation, and buying luxury European cabinetry at 50-80% off retail in the GTA.");
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, cover_image_url, author_name, category, tags, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
    staleTime: 300_000,
  });

  const filtered = useMemo(() => {
    if (activeCategory === "All") return posts;
    return posts.filter((p) => p.category === activeCategory);
  }, [posts, activeCategory]);

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "FitMatch Blog",
    description: "Expert tips on kitchen renovation, cabinet installation, and buying luxury European cabinetry.",
    url: "https://fitmatch.ca/blog",
    publisher: { "@type": "Organization", name: "FitMatch" },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.excerpt || "",
      datePublished: p.published_at,
      author: { "@type": "Person", name: p.author_name },
      url: `https://fitmatch.ca/blog/${p.slug}`,
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        <Breadcrumbs items={[{ label: "Blog" }]} />

        <div className="mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">FitMatch Blog</h1>
          <p className="text-muted-foreground text-lg">Tips, guides, and insights for smarter kitchen renovations.</p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              className="border-2"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-2 overflow-hidden">
                <Skeleton className="aspect-[16/9] w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-20 border-2 border-foreground max-w-lg mx-auto"
            style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
          >
            <p className="font-bold text-lg mb-2">
              {posts.length === 0
                ? "Blog posts coming soon."
                : "No posts in this category yet."}
            </p>
            <p className="text-sm text-muted-foreground">
              {posts.length === 0
                ? "Check back for renovation tips, buying guides, and industry insights."
                : "Try selecting a different category."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                <Card
                  className="border-2 border-foreground overflow-hidden transition-transform group-hover:-translate-y-1 h-full flex flex-col"
                  style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
                >
                  {/* Cover image */}
                  <div className="aspect-[16/9] bg-muted overflow-hidden">
                    {post.cover_image_url ? (
                      <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-accent flex items-center justify-center">
                        <span className="font-serif text-2xl font-bold text-muted-foreground/30">FM</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col">
                    {post.category && (
                      <Badge variant="outline" className="text-[10px] w-fit border-foreground">{post.category}</Badge>
                    )}
                    <h2 className="font-serif font-bold text-lg leading-tight line-clamp-2">{post.title}</h2>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between pt-2 mt-auto">
                      <p className="text-xs text-muted-foreground">
                        {post.author_name} · {post.published_at ? format(new Date(post.published_at), "MMM d, yyyy") : ""}
                      </p>
                      <span className="text-sm font-medium text-foreground flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read More <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BlogPage;
