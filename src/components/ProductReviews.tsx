import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";

interface ProductReviewsProps {
  productId: string;
}

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  reviewer_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  created_at: string;
}

const StarRating = ({ rating, max = 5 }: { rating: number; max?: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: max }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? "fill-foreground text-foreground" : i < rating ? "fill-foreground/50 text-foreground" : "text-muted-foreground/30"}`}
      />
    ))}
  </div>
);

const StarInput = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="p-0.5 transition-transform hover:scale-110"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              star <= (hover || value)
                ? "fill-foreground text-foreground"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [visibleCount, setVisibleCount] = useState(5);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  // Fetch approved reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
  });

  // Check if user already reviewed
  const { data: existingReview } = useQuery({
    queryKey: ["user-review", productId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Stats
  const stats = useMemo(() => {
    if (!reviews.length) return { avg: 0, total: 0, dist: [0, 0, 0, 0, 0] };
    const total = reviews.length;
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    const dist = [5, 4, 3, 2, 1].map(
      (star) => reviews.filter((r) => r.rating === star).length
    );
    return { avg: sum / total, total, dist };
  }, [reviews]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      // Get profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .single();

      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        user_id: user!.id,
        reviewer_name: profile?.full_name || "Anonymous",
        rating,
        title: title.trim() || null,
        body: body.trim() || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thank you! Your review has been submitted and will appear after moderation.");
      queryClient.invalidateQueries({ queryKey: ["user-review", productId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
      setRating(0);
      setTitle("");
      setBody("");
    },
    onError: () => {
      toast.error("Failed to submit review. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }
    submitMutation.mutate();
  };

  const visibleReviews = reviews.slice(0, visibleCount);

  return (
    <div className="space-y-8">
      {/* Summary Bar */}
      <Card className="border-2 shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
        <CardHeader>
          <CardTitle className="font-serif">Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.total === 0 ? (
            <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-8">
              {/* Left: Average */}
              <div className="flex flex-col items-center gap-1 min-w-[120px]">
                <span className="text-5xl font-bold text-foreground">{stats.avg.toFixed(1)}</span>
                <StarRating rating={stats.avg} />
                <span className="text-sm text-muted-foreground">Based on {stats.total} review{stats.total !== 1 ? "s" : ""}</span>
              </div>
              {/* Right: Distribution */}
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star, i) => {
                  const count = stats.dist[i];
                  const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-14 text-muted-foreground">{star} star{star !== 1 ? "s" : ""}</span>
                      <Progress value={pct} className="h-2.5 flex-1" />
                      <span className="w-8 text-right text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review List */}
      {visibleReviews.length > 0 && (
        <div className="space-y-4">
          {visibleReviews.map((review) => (
            <Card key={review.id} className="border-2">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <StarRating rating={review.rating} />
                    <span className="font-medium text-foreground">{review.reviewer_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                {review.title && <p className="font-semibold text-foreground">{review.title}</p>}
                {review.body && <p className="text-muted-foreground text-sm leading-relaxed">{review.body}</p>}
              </CardContent>
            </Card>
          ))}
          {reviews.length > visibleCount && (
            <Button
              variant="outline"
              className="w-full border-2"
              onClick={() => setVisibleCount((c) => c + 5)}
            >
              Show More Reviews
            </Button>
          )}
        </div>
      )}

      <Separator />

      {/* Write a Review */}
      <Card className="border-2 shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Write a Review</CardTitle>
        </CardHeader>
        <CardContent>
          {!user ? (
            <p className="text-muted-foreground">
              <Link to="/login" className="underline font-medium text-foreground hover:text-primary">Sign in</Link> to leave a review.
            </p>
          ) : existingReview ? (
            <p className="text-muted-foreground">You've already reviewed this product. Thank you!</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Your Rating *</label>
                <StarInput value={rating} onChange={setRating} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Title</label>
                <Input
                  placeholder="Summarize your experience"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Review</label>
                <Textarea
                  placeholder="Tell other buyers what you think about this product..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  className="border-2"
                />
              </div>
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="shadow-[2px_2px_0px_0px_hsl(var(--foreground))]"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductReviews;
