import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import AuthGateModal from "@/components/AuthGateModal";

interface ProductQAProps {
  productId: string;
  prefillText?: string;
  prefillOptionId?: string;
  onPrefillConsumed?: () => void;
}

const ProductQA = ({ productId, prefillText, prefillOptionId, onPrefillConsumed }: ProductQAProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [questionText, setQuestionText] = useState(prefillText || "");
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Consume prefill
  if (prefillText && questionText !== prefillText && !questionText.startsWith("Question about:")) {
    setQuestionText(prefillText);
  }

  // Fetch user's own questions
  const { data: myQuestions = [] } = useQuery({
    queryKey: ["my-product-questions", productId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_questions")
        .select("*, product_options(option_name)")
        .eq("product_id", productId)
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch public answered questions
  const { data: publicQuestions = [] } = useQuery({
    queryKey: ["public-product-questions", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_questions")
        .select("*, product_options(option_name)")
        .eq("product_id", productId)
        .eq("status", "answered")
        .eq("is_public", true)
        .order("response_date", { ascending: false });
      return data || [];
    },
  });

  // Get buyer name from profile
  const { data: profile } = useQuery({
    queryKey: ["my-profile-name", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("product_questions").insert({
        product_id: productId,
        buyer_id: user!.id,
        buyer_name: profile?.full_name || "Customer",
        question_text: questionText.trim(),
        option_id: prefillOptionId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Question submitted! The seller will be notified.");
      setQuestionText("");
      onPrefillConsumed?.();
      queryClient.invalidateQueries({ queryKey: ["my-product-questions", productId, user?.id] });
    },
    onError: () => toast.error("Failed to submit question."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!questionText.trim()) {
      toast.error("Please enter a question.");
      return;
    }
    submitMutation.mutate();
  };

  return (
    <div className="space-y-8">
      {/* Ask form */}
      <Card className="border-2">
        <CardContent className="p-5">
          <h3 className="text-lg font-serif font-semibold text-foreground mb-3">
            <MessageSquare className="w-5 h-5 inline mr-2" />
            Ask a Question
          </h3>
          {!user ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-3">
                Have a question? Sign in to ask the seller.
              </p>
              <Button variant="outline" onClick={() => setShowAuthModal(true)}>
                Sign In to Ask
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Textarea
                  value={questionText}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) setQuestionText(e.target.value);
                  }}
                  placeholder="Ask a question about this product..."
                  rows={3}
                  className="border-2"
                />
                <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
                  {questionText.length}/500
                </span>
              </div>
              <Button type="submit" disabled={submitMutation.isPending || !questionText.trim()}>
                {submitMutation.isPending ? "Submitting..." : "Submit Question"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* My questions */}
      {user && myQuestions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Your Questions</h4>
          {myQuestions.map((q: any) => (
            <Card key={q.id} className="border">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={q.status === "answered" ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {q.status === "answered" ? "Answered" : "Pending"}
                  </Badge>
                  {q.product_options?.option_name && (
                    <Badge variant="outline" className="text-[10px]">
                      About: {q.product_options.option_name}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(q.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="text-sm text-foreground">{q.question_text}</p>
                {q.seller_response && (
                  <div className="bg-muted/50 rounded p-3 mt-2">
                    <p className="text-xs font-semibold text-foreground mb-1">Seller Response</p>
                    <p className="text-sm text-muted-foreground">{q.seller_response}</p>
                    {q.response_date && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(q.response_date), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Separator />

      {/* Public Q&A */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Questions & Answers</h4>
        {publicQuestions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No questions have been answered yet. Be the first to ask!
          </p>
        ) : (
          publicQuestions.map((q: any) => (
            <Card key={q.id} className="border">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {q.buyer_name || "Customer"}
                  </span>
                  {q.product_options?.option_name && (
                    <Badge variant="outline" className="text-[10px]">
                      About: {q.product_options.option_name}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-foreground font-medium">Q: {q.question_text}</p>
                <div className="bg-muted/50 rounded p-3">
                  <p className="text-sm text-muted-foreground">A: {q.seller_response}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AuthGateModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title="Sign in to ask a question"
        description="Create an account or sign in to ask the seller about this product."
        redirectTo={`/product/${productId}`}
      />
    </div>
  );
};

export default ProductQA;
