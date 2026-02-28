import { useParams, Link, Navigate } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  author_name: string;
  category: string | null;
  tags: string[] | null;
  status: string;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug!)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!slug,
  });

  // Related posts
  const { data: relatedPosts = [] } = useQuery({
    queryKey: ["blog-related", post?.category, post?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, cover_image_url, author_name, category, published_at")
        .eq("status", "published")
        .eq("category", post!.category!)
        .neq("id", post!.id)
        .order("published_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    enabled: !!post?.category && !!post?.id,
  });

  // usePageMeta must be called unconditionally
  usePageMeta(
    post?.meta_title || post?.title || "Blog Post",
    post?.meta_description || post?.excerpt || undefined
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-3xl">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-6 w-64 mb-8" />
          <Skeleton className="aspect-[16/9] w-full mb-8" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full mb-3" />
          ))}
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-serif font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-6">This blog post doesn't exist or is no longer published.</p>
          <Button asChild variant="outline" className="border-2">
            <Link to="/blog"><ArrowLeft className="w-4 h-4 mr-2" />Back to Blog</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || "",
    datePublished: post.published_at,
    dateModified: post.published_at,
    author: { "@type": "Person", name: post.author_name },
    publisher: { "@type": "Organization", name: "FitMatch", url: "https://fitmatch.ca" },
    url: `https://fitmatch.ca/blog/${post.slug}`,
    ...(post.cover_image_url && { image: post.cover_image_url }),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto">
          <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />

          {/* Cover image */}
          {post.cover_image_url && (
            <div className="aspect-[16/9] bg-muted overflow-hidden border-2 border-foreground mb-8" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
              <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {post.category && (
              <Badge variant="outline" className="border-foreground text-xs">{post.category}</Badge>
            )}
            {post.tags && post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
            ))}
          </div>

          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">{post.title}</h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{post.author_name}</span>
            {post.published_at && (
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{format(new Date(post.published_at), "MMMM d, yyyy")}</span>
            )}
          </div>

          {/* Content */}
          <div
            className="blog-content space-y-4 text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Back link */}
          <div className="mt-12 pt-8 border-t-2 border-border">
            <Link to="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to Blog
            </Link>
          </div>
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="max-w-3xl mx-auto mt-16">
            <h2 className="font-serif text-2xl font-bold mb-6">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((related: any) => (
                <Link key={related.id} to={`/blog/${related.slug}`} className="group">
                  <Card
                    className="border-2 border-foreground overflow-hidden transition-transform group-hover:-translate-y-1"
                    style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
                  >
                    <div className="aspect-[16/9] bg-muted overflow-hidden">
                      {related.cover_image_url ? (
                        <img src={related.cover_image_url} alt={related.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-accent flex items-center justify-center">
                          <span className="font-serif text-xl font-bold text-muted-foreground/30">FM</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <h3 className="font-serif font-bold text-sm leading-tight line-clamp-2">{related.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {related.published_at ? format(new Date(related.published_at), "MMM d, yyyy") : ""}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BlogPostPage;
