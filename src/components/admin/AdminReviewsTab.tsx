import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Star, Check, X, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  reviewer_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  products: { product_name: string } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  approved: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
};

const AdminReviewsTab = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [viewReview, setViewReview] = useState<Review | null>(null);
  const [rejectReview, setRejectReview] = useState<Review | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [deleteReview, setDeleteReview] = useState<Review | null>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*, products(product_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
  });

  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  };

  const filtered = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, admin_note }: { id: string; status: string; admin_note?: string }) => {
      const update: Record<string, string> = { status };
      if (admin_note !== undefined) update.admin_note = admin_note;
      const { error } = await supabase.from("product_reviews").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(`Review ${vars.status}`);
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: () => toast.error("Action failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      setDeleteReview(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const handleApprove = (id: string) => updateMutation.mutate({ id, status: "approved" });
  const handleReject = () => {
    if (!rejectReview) return;
    updateMutation.mutate({ id: rejectReview.id, status: "rejected", admin_note: rejectNote.trim() || undefined });
    setRejectReview(null);
    setRejectNote("");
  };

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="font-serif">Review Moderation</CardTitle>
        <CardDescription>Approve, reject, or delete customer reviews.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              className="border-2"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <Badge variant="secondary" className="ml-1.5 text-xs">{counts[f.key]}</Badge>
            </Button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-muted-foreground py-8 text-center">Loading reviews...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">No reviews found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium max-w-[150px] truncate">
                      {review.products?.product_name || "—"}
                    </TableCell>
                    <TableCell>{review.reviewer_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      {review.body ? (
                        <div className="flex items-center gap-1">
                          <span className="truncate text-sm">{review.title || review.body.slice(0, 60)}</span>
                          {(review.body.length > 60 || review.title) && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setViewReview(review)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">{review.title || "—"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs border ${statusColors[review.status] || ""}`}>
                        {review.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(review.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {review.status !== "approved" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs border-2 text-green-700 hover:bg-green-50" onClick={() => handleApprove(review.id)}>
                            <Check className="w-3 h-3 mr-1" /> Approve
                          </Button>
                        )}
                        {review.status !== "rejected" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs border-2 text-red-700 hover:bg-red-50" onClick={() => { setRejectReview(review); setRejectNote(""); }}>
                            <X className="w-3 h-3 mr-1" /> Reject
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => setDeleteReview(review)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* View Full Review Dialog */}
      <Dialog open={!!viewReview} onOpenChange={() => setViewReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Review Details</DialogTitle>
          </DialogHeader>
          {viewReview && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < viewReview.rating ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">by {viewReview.reviewer_name}</span>
              </div>
              {viewReview.title && <p className="font-semibold">{viewReview.title}</p>}
              {viewReview.body && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewReview.body}</p>}
              {viewReview.admin_note && (
                <div className="border-t pt-2">
                  <p className="text-xs font-medium text-muted-foreground">Admin Note:</p>
                  <p className="text-sm">{viewReview.admin_note}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectReview} onOpenChange={() => setRejectReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Reject Review</DialogTitle>
            <DialogDescription>Optionally provide a reason for rejection.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (internal note)"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={3}
            className="border-2"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectReview(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>Reject Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteReview} onOpenChange={() => setDeleteReview(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The review will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteReview && deleteMutation.mutate(deleteReview.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default AdminReviewsTab;
