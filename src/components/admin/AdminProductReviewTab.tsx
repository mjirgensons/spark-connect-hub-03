import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Check, X, Eye, Search, ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import ProductDetailPreview from "./ProductDetailPreview";

type StatusFilter = "pending_review" | "all" | "approved" | "rejected";

const statusBadge = (status: string) => {
  switch (status) {
    case "approved": return <Badge className="bg-green-600 text-white border-0">Live</Badge>;
    case "pending_review": return <Badge className="bg-amber-500 text-white border-0">In Review</Badge>;
    case "rejected": return <Badge className="bg-red-600 text-white border-0">Declined</Badge>;
    case "draft": return <Badge className="bg-yellow-500 text-foreground border-0">Draft</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const AdminProductReviewTab = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>("pending_review");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-product-review", filter],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("*, categories(name, slug), profiles!products_seller_id_fkey(full_name, company_name, auto_approve_products, created_at, seller_status)")
        .order("updated_at", { ascending: false });

      if (filter === "pending_review") q = q.eq("listing_status", "pending_review");
      else if (filter === "approved") q = q.eq("listing_status", "approved");
      else if (filter === "rejected") q = q.eq("listing_status", "rejected");
      // "all" = no filter

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["admin-pending-review-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("listing_status", "pending_review")
        .is("deleted_at", null);
      if (error) throw error;
      return count || 0;
    },
  });

  const filtered = products.filter((p: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const sellerName = (p.profiles as any)?.company_name || (p.profiles as any)?.full_name || "";
    return (
      p.product_name?.toLowerCase().includes(s) ||
      p.product_code?.toLowerCase().includes(s) ||
      sellerName.toLowerCase().includes(s)
    );
  });

  const handleApprove = async (productId: string) => {
    setActionLoading(true);
    const { error } = await supabase.from("products").update({
      listing_status: "approved",
      listing_rejection_reason: null,
    } as any).eq("id", productId);
    setActionLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Product approved", description: "The product is now live on the store." });
    queryClient.invalidateQueries({ queryKey: ["admin-product-review"] });
    queryClient.invalidateQueries({ queryKey: ["admin-pending-review-count"] });
    setSelectedProduct(null);
  };

  const handleDecline = async (productId: string) => {
    if (!declineReason.trim()) { toast({ title: "Please provide a reason", variant: "destructive" }); return; }
    setActionLoading(true);
    const { error } = await supabase.from("products").update({
      listing_status: "rejected",
      listing_rejection_reason: declineReason.trim(),
    } as any).eq("id", productId);
    setActionLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Product declined", description: "The seller has been notified." });
    setDeclineDialogOpen(false);
    setDeclineReason("");
    queryClient.invalidateQueries({ queryKey: ["admin-product-review"] });
    queryClient.invalidateQueries({ queryKey: ["admin-pending-review-count"] });
    setSelectedProduct(null);
  };

  // Fetch product options for selected product
  const { data: selectedProductOptions = [] } = useQuery({
    queryKey: ["admin-review-options", selectedProduct?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_options")
        .select("*")
        .eq("product_id", selectedProduct!.id)
        .order("sort_order");
      return data || [];
    },
    enabled: !!selectedProduct?.id,
  });

  // Detail view
  if (selectedProduct) {
    const p = selectedProduct;
    const seller = p.profiles || {};

    const actionBar = (
      <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
        <Button
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => handleApprove(p.id)}
          disabled={actionLoading}
        >
          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
          Approve
        </Button>
        <Button
          variant="destructive"
          onClick={() => { setDeclineDialogOpen(true); setDeclineReason(""); }}
          disabled={actionLoading}
        >
          <X className="w-4 h-4 mr-1" /> Decline
        </Button>
        <Button
          variant="outline"
          onClick={() => window.open(`/seller/products/${p.id}?adminView=${p.seller_id}`, "_blank")}
        >
          <ExternalLink className="w-4 h-4 mr-1" /> Edit in Seller Portal
        </Button>
      </div>
    );

    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to list
        </Button>

        {/* Seller info + status */}
        <div className="p-4 rounded-lg border bg-muted/50 space-y-1">
          <p className="text-sm font-semibold">{seller.company_name || seller.full_name || "Unknown Seller"}</p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground items-center">
            <span>Status: {statusBadge(p.listing_status)}</span>
            <span>Trust: {seller.auto_approve_products ? "✅ Trusted" : "Standard"}</span>
            {seller.created_at && <span>Joined: {format(new Date(seller.created_at), "MMM d, yyyy")}</span>}
            {(p as any).resubmission_count > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-400 text-amber-700">
                Resubmission #{(p as any).resubmission_count}
              </Badge>
            )}
          </div>
          {p.deleted_at && (
            <div className="mt-2 p-2 rounded bg-red-50 border border-red-200">
              <p className="text-xs font-medium text-red-800">⚠ This product has been soft-deleted ({format(new Date(p.deleted_at), "MMM d, yyyy")})</p>
            </div>
          )}
          {(p as any).previous_rejection_reason && (
            <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200">
              <p className="text-xs font-medium text-amber-800">Previously declined:</p>
              <p className="text-xs text-amber-700">{(p as any).previous_rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Top action bar */}
        {actionBar}

        {/* Inline product detail preview */}
        <ProductDetailPreview product={p} productOptions={selectedProductOptions} />

        {/* Bottom action bar */}
        {actionBar}

        {/* Decline dialog */}
        <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Decline Product</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Provide a reason for declining "{p.product_name}". The seller will see this reason.</p>
            <Textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Reason for decline..."
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleDecline(p.id)} disabled={actionLoading || !declineReason.trim()}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Decline Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending_review">Pending Review ({pendingCount})</SelectItem>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="approved">Approved / Live</SelectItem>
            <SelectItem value="rejected">Declined</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, SKU, seller..."
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading products...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          {filter === "pending_review" ? "No products pending review 🎉" : "No products found."}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Retail</TableHead>
                <TableHead className="text-right">Sale</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p: any) => {
                const seller = p.profiles || {};
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {p.main_image_url && (
                          <img src={p.main_image_url} alt="" className="w-8 h-8 object-cover rounded border" />
                        )}
                        <div>
                          <p className="font-medium text-sm truncate max-w-[200px]">{p.product_name}</p>
                          <p className="text-xs text-muted-foreground">{p.product_code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{seller.company_name || seller.full_name || "—"}</TableCell>
                    <TableCell className="text-sm">{(p.categories as any)?.name || "—"}</TableCell>
                    <TableCell className="text-right text-sm">${Number(p.price_retail_usd || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm">${Number(p.price_discounted_usd || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {statusBadge(p.listing_status)}
                        {(p as any).resubmission_count > 0 && p.listing_status === "pending_review" && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-400 text-amber-700">
                            Re #{(p as any).resubmission_count}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.updated_at ? format(new Date(p.updated_at), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(p)}>
                          <Eye className="w-4 h-4 mr-1" /> Review
                        </Button>
                        {p.listing_status === "pending_review" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleApprove(p.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => { setSelectedProduct(p); setDeclineDialogOpen(true); setDeclineReason(""); }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminProductReviewTab;
