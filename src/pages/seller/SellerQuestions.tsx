import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import Breadcrumbs from "@/components/Breadcrumbs";

const SellerQuestions = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const adminViewId = searchParams.get("adminView");
  const sellerId = adminViewId || user?.id;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedQ, setSelectedQ] = useState<any>(null);
  const [response, setResponse] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["seller-questions", sellerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_questions")
        .select("*, products(product_name, id), product_options(option_name)")
        .order("created_at", { ascending: true });
      // Filter to seller's products client-side since we join
      return (data || []).filter((q: any) => q.products);
    },
    enabled: !!sellerId,
  });

  const answerMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("product_questions")
        .update({
          seller_response: response.trim(),
          status: "answered",
          response_date: new Date().toISOString(),
          is_public: isPublic,
        })
        .eq("id", selectedQ.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Answer sent!");
      setSelectedQ(null);
      setResponse("");
      queryClient.invalidateQueries({ queryKey: ["seller-questions", sellerId] });
    },
    onError: () => toast.error("Failed to send answer."),
  });

  const filtered = questions.filter((q: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      q.products?.product_name?.toLowerCase().includes(s) ||
      q.question_text?.toLowerCase().includes(s) ||
      q.buyer_name?.toLowerCase().includes(s)
    );
  });

  const pending = filtered.filter((q: any) => q.status === "pending");
  const answered = filtered.filter((q: any) => q.status === "answered");

  const renderList = (items: any[]) => {
    if (items.length === 0) return <p className="text-sm text-muted-foreground py-8 text-center">No questions found.</p>;
    return (
      <div className="space-y-2">
        {items.map((q: any) => {
          const days = differenceInDays(new Date(), new Date(q.created_at));
          const overdue = q.status === "pending" && days > 3;
          return (
            <div
              key={q.id}
              className={`border rounded-md p-4 cursor-pointer hover:bg-accent/50 transition-colors ${overdue ? "border-destructive" : ""}`}
              onClick={() => {
                setSelectedQ(q);
                setResponse(q.seller_response || "");
                setIsPublic(q.is_public ?? true);
              }}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{q.products?.product_name}</span>
                  <Badge variant={q.status === "answered" ? "default" : "secondary"} className="text-[10px]">
                    {q.status === "answered" ? "Answered" : "Pending"}
                  </Badge>
                  {q.product_options?.option_name && (
                    <Badge variant="outline" className="text-[10px]">
                      {q.product_options.option_name}
                    </Badge>
                  )}
                  {overdue && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(q.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {q.buyer_name || "Customer"}: {q.question_text}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Seller Portal", href: "/seller/dashboard" }, { label: "Questions" }]} />

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-serif font-bold text-foreground">Product Questions</h1>
        <Input
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs border-2"
        />
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="bg-transparent p-0 gap-0 border-b rounded-none w-full justify-start">
          <TabsTrigger value="pending" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="answered" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            Answered ({answered.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            All ({filtered.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">{renderList(pending)}</TabsContent>
        <TabsContent value="answered" className="mt-4">{renderList(answered)}</TabsContent>
        <TabsContent value="all" className="mt-4">{renderList(filtered)}</TabsContent>
      </Tabs>

      {/* Answer dialog */}
      <Dialog open={!!selectedQ} onOpenChange={(open) => !open && setSelectedQ(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Answer Question</DialogTitle>
          </DialogHeader>
          {selectedQ && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Product</p>
                <p className="text-sm font-medium text-foreground">{selectedQ.products?.product_name}</p>
              </div>
              {selectedQ.product_options?.option_name && (
                <div>
                  <p className="text-xs text-muted-foreground">Regarding</p>
                  <Badge variant="outline" className="text-xs">{selectedQ.product_options.option_name}</Badge>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">
                  {selectedQ.buyer_name || "Customer"} · {format(new Date(selectedQ.created_at), "MMM d, yyyy")}
                </p>
                <p className="text-sm text-foreground mt-1">{selectedQ.question_text}</p>
              </div>
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Type your answer..."
                rows={4}
                className="border-2"
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isPublic}
                  onCheckedChange={(v) => setIsPublic(!!v)}
                  id="public-toggle"
                />
                <label htmlFor="public-toggle" className="text-sm text-muted-foreground">
                  Make answer public (visible to all buyers)
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedQ(null)}>Cancel</Button>
            <Button
              onClick={() => answerMutation.mutate()}
              disabled={answerMutation.isPending || !response.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              {answerMutation.isPending ? "Sending..." : "Send Answer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerQuestions;
