import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, Store, MoreVertical, ExternalLink, Package, ShoppingCart, Mail, ShieldCheck, ShieldX, ShieldOff, RotateCcw, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

type SellerStatus = "pending" | "approved" | "suspended" | "rejected";

interface SellerProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  created_at: string;
  seller_status: string | null;
  business_type: string | null;
  gst_hst_number: string | null;
  business_address: Record<string, string> | null;
  website: string | null;
  bio: string | null;
  product_count: number;
  auto_approve_products: boolean;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  approved: "bg-green-100 text-green-800 border-green-300",
  suspended: "bg-red-100 text-red-800 border-red-300",
  rejected: "bg-muted text-muted-foreground border-border",
};

const AdminSellersTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedSeller, setSelectedSeller] = useState<SellerProfile | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    sellerId: string;
    action: SellerStatus;
    companyName: string;
  } | null>(null);

  const { data: sellers = [], isLoading } = useQuery({
    queryKey: ["admin-sellers", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .or("user_type.eq.seller,seller_status.not.is.null")
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("seller_status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const sellerIds = (data || []).map((s) => s.id);
      let productCounts: Record<string, number> = {};

      if (sellerIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("seller_id")
          .in("seller_id", sellerIds);

        if (products) {
          for (const p of products) {
            if (p.seller_id) {
              productCounts[p.seller_id] = (productCounts[p.seller_id] || 0) + 1;
            }
          }
        }
      }

      return (data || []).map((s) => ({
        ...s,
        product_count: productCounts[s.id] || 0,
        business_address: s.business_address as Record<string, string> | null,
        auto_approve_products: (s as any).auto_approve_products ?? false,
      })) as SellerProfile[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ sellerId, status }: { sellerId: string; status: SellerStatus }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ seller_status: status } as Record<string, unknown>)
        .eq("id", sellerId);
      if (error) throw error;
      return { sellerId, status };
    },
    onSuccess: (_, variables) => {
      const labels: Record<string, string> = {
        approved: "Seller approved",
        rejected: "Seller rejected",
        suspended: "Seller suspended",
      };
      toast({ title: labels[variables.status] || "Seller reactivated" });
      queryClient.invalidateQueries({ queryKey: ["admin-sellers"] });
      setSelectedSeller(null);
      setConfirmAction(null);

      if (variables.status === "approved") {
        try {
          supabase
            .from("profiles")
            .select("full_name, company_name, email, id")
            .eq("id", variables.sellerId)
            .single()
            .then(({ data: sellerProfile }) => {
              if (sellerProfile) {
                supabase.functions
                  .invoke("notify-seller-approval", {
                    body: {
                      seller_name: sellerProfile.full_name,
                      company_name: sellerProfile.company_name,
                      email: sellerProfile.email,
                      user_id: sellerProfile.id,
                    },
                  })
                  .catch((err) =>
                    console.warn("[webhook] notify-seller-approval failed:", err)
                  );
              }
            });
        } catch (err) {
          console.warn("[webhook] notify-seller-approval error:", err);
        }
      }
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const filtered = sellers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.company_name || "").toLowerCase().includes(q) ||
      s.full_name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  const handleAction = (sellerId: string, action: SellerStatus, companyName: string) => {
    setConfirmAction({ sellerId, action, companyName });
  };

  const formatAddress = (addr: Record<string, string> | null) => {
    if (!addr) return "Not provided";
    const parts = [addr.street, addr.city, addr.province, addr.postal_code].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Not provided";
  };

  const confirmLabels: Record<string, { title: string; desc: string }> = {
    approved: { title: "Approve Seller", desc: "Are you sure you want to approve this seller? They will gain access to the seller portal." },
    rejected: { title: "Reject Seller", desc: "Are you sure you want to reject this seller? They will lose access to the seller portal." },
    suspended: { title: "Suspend Seller", desc: "Are you sure you want to suspend this seller? Their products will remain but they won't be able to manage them." },
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Store className="w-5 h-5" />
            Seller Management
            <Badge variant="secondary" className="ml-2 text-xs">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by company, name, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-2 border-foreground"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] border-2 border-foreground">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No sellers found{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}.
            </div>
          ) : (
            <div className="border-2 border-foreground overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-foreground bg-muted/50">
                    <TableHead className="font-bold w-[18%]">Company</TableHead>
                    <TableHead className="font-bold w-[15%]">Owner</TableHead>
                    <TableHead className="font-bold w-[22%]">Email</TableHead>
                    <TableHead className="font-bold w-[12%]">Registered</TableHead>
                    <TableHead className="font-bold w-[10%] text-center">Status</TableHead>
                    <TableHead className="font-bold w-[8%] text-center">Products</TableHead>
                    <TableHead className="font-bold w-[5%] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((seller) => {
                    const status = seller.seller_status as SellerStatus;
                    const name = seller.company_name || seller.full_name;
                    return (
                      <TableRow key={seller.id} className="border-b border-border">
                        <TableCell>
                          <button
                            className="text-sm font-medium text-primary hover:underline text-left"
                            onClick={() => setSelectedSeller(seller)}
                          >
                            {seller.company_name || "—"}
                          </button>
                        </TableCell>
                        <TableCell className="text-sm">{seller.full_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{seller.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(seller.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[seller.seller_status || "pending"]}`}>
                            {seller.seller_status || "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm">{seller.product_count}</TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <a href={`/seller/dashboard?adminView=${seller.id}`}>
                                  <ExternalLink className="w-4 h-4 mr-2" /> Enter Portal
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={`/seller/products?adminView=${seller.id}`}>
                                  <Package className="w-4 h-4 mr-2" /> View Products
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={`/seller/orders?adminView=${seller.id}`}>
                                  <ShoppingCart className="w-4 h-4 mr-2" /> View Orders
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={`mailto:${seller.email}`} target="_blank" rel="noopener noreferrer">
                                  <Mail className="w-4 h-4 mr-2" /> Email Seller
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {(status === "pending" || status === "rejected") && (
                                <DropdownMenuItem onClick={() => handleAction(seller.id, "approved", name)}>
                                  <ShieldCheck className="w-4 h-4 mr-2" /> Approve Seller
                                </DropdownMenuItem>
                              )}
                              {status === "approved" && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleAction(seller.id, "suspended", name)}
                                >
                                  <ShieldOff className="w-4 h-4 mr-2" /> Suspend Seller
                                </DropdownMenuItem>
                              )}
                              {status === "suspended" && (
                                <DropdownMenuItem onClick={() => handleAction(seller.id, "approved", name)}>
                                  <RotateCcw className="w-4 h-4 mr-2" /> Reactivate Seller
                                </DropdownMenuItem>
                              )}
                              {status === "pending" && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleAction(seller.id, "rejected", name)}
                                >
                                  <ShieldX className="w-4 h-4 mr-2" /> Reject Seller
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selectedSeller} onOpenChange={() => setSelectedSeller(null)}>
        <SheetContent className="overflow-y-auto">
          {selectedSeller && (
            <>
              <SheetHeader>
                <SheetTitle className="font-serif text-xl">
                  {selectedSeller.company_name || "Unnamed Seller"}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                <DetailRow label="Owner" value={selectedSeller.full_name} />
                <DetailRow label="Email" value={selectedSeller.email} />
                <DetailRow label="Phone" value={selectedSeller.phone || "Not provided"} />
                <DetailRow label="Business Type" value={selectedSeller.business_type || "Not provided"} />
                <DetailRow label="GST/HST" value={selectedSeller.gst_hst_number || "Not provided"} />
                <DetailRow label="Website" value={selectedSeller.website || "Not provided"} />
                <DetailRow label="Address" value={formatAddress(selectedSeller.business_address)} />
                <DetailRow label="Bio" value={selectedSeller.bio || "No description"} />
                <DetailRow label="Registration Date" value={format(new Date(selectedSeller.created_at), "MMM d, yyyy")} />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-muted-foreground w-28">Status</span>
                  <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[selectedSeller.seller_status || "pending"]}`}>
                    {selectedSeller.seller_status || "pending"}
                  </Badge>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction ? confirmLabels[confirmAction.action]?.title || "Confirm" : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction
                ? `${confirmLabels[confirmAction.action]?.desc || "Proceed?"} (${confirmAction.companyName})`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction) {
                  updateStatus.mutate({ sellerId: confirmAction.sellerId, status: confirmAction.action });
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-2">
    <span className="text-sm font-semibold text-muted-foreground w-28 shrink-0">{label}</span>
    <span className="text-sm text-foreground">{value}</span>
  </div>
);

export default AdminSellersTab;
