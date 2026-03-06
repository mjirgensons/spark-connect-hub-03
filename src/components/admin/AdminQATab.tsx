import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, differenceInDays } from "date-fns";

const AdminQATab = () => {
  const { data: pendingQuestions = [] } = useQuery({
    queryKey: ["admin-pending-questions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_questions")
        .select("*, products(product_name, seller_id, profiles:seller_id(company_name, full_name))")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      return data || [];
    },
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="font-serif">Q&A Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-3xl font-bold text-foreground">{pendingQuestions.length}</p>
              <p className="text-xs text-muted-foreground">Pending Questions</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-destructive">
                {pendingQuestions.filter((q: any) => differenceInDays(new Date(), new Date(q.created_at)) > 3).length}
              </p>
              <p className="text-xs text-muted-foreground">Overdue (&gt;3 days)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Unanswered Questions</h3>
        {pendingQuestions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">All questions answered! 🎉</p>
        ) : (
          pendingQuestions.map((q: any) => {
            const days = differenceInDays(new Date(), new Date(q.created_at));
            const overdue = days > 3;
            const seller = (q.products as any)?.profiles;
            return (
              <div key={q.id} className={`border rounded-md p-3 ${overdue ? "border-destructive bg-destructive/5" : ""}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{q.products?.product_name}</span>
                    {overdue && <Badge variant="destructive" className="text-[10px]">Overdue ({days}d)</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(q.created_at), "MMM d, yyyy")}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Seller: {seller?.company_name || seller?.full_name || "Unknown"}
                </p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{q.question_text}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminQATab;
