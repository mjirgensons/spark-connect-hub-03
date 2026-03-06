import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PlusCircle, Pencil, Trash2, Copy, Sparkles, AlertTriangle, ImageOff,
  RotateCcw, Trash, ArrowUp, ArrowDown, ArrowUpDown, Star, Layers, Search,
  Check, X as XIcon,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { getImageOptSummary } from "@/components/admin/ImageUpload";

// ── Types ──
interface Category { id: string; name: string; }

interface Product {
  id: string;
  product_name: string;
  product_code: string;
  category_id: string | null;
  price_retail_usd: number;
  price_discounted_usd: number;
  discount_percentage: number;
  stock_level: number;
  availability_status: string;
  listing_status: string;
  is_featured: boolean;
  main_image_url: string | null;
  additional_image_urls: string[] | null;
  installation_instructions_url: string | null;
  technical_drawings_url: string | null;
  deleted_at: string | null;
  seller_id: string | null;
  [key: string]: unknown;
}

// ── Sorting ──
type SortKey = "product_name" | "product_code" | "category" | "price_retail_usd" | "price_discounted_usd" | "stock_level" | "availability_status" | "is_featured" | "listing_status";

const statusBadge = (status: string) => {
  switch (status) {
    case "In Stock":
      return <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-green-500/15 text-green-700 border-green-300 whitespace-nowrap">{status}</Badge>;
    case "Low Stock":
      return <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-yellow-500/15 text-yellow-700 border-yellow-300 whitespace-nowrap">{status}</Badge>;
    case "Out of Stock":
    case "Deactivated":
      return <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-red-500/15 text-red-700 border-red-300 whitespace-nowrap">{status}</Badge>;
    case "Preorder":
      return <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-500/15 text-blue-700 border-blue-300 whitespace-nowrap">{status}</Badge>;
    default:
      return <Badge variant="outline" className="text-[9px] px-1.5 py-0 whitespace-nowrap">{status}</Badge>;
  }
};

const listingStatusBadge = (status: string, rejectionReason?: string | null) => {
  switch (status) {
    case "approved":
      return <Badge className="text-[9px] px-1.5 py-0 bg-green-600 text-green-50 hover:bg-green-700 whitespace-nowrap border-0">Live</Badge>;
    case "pending_review":
      return <Badge className="text-[9px] px-1.5 py-0 bg-amber-500 text-amber-50 hover:bg-amber-600 whitespace-nowrap border-0">In Review</Badge>;
    case "rejected":
      return (
        <span title={rejectionReason ? `Reason: ${rejectionReason}` : "No reason provided"} className="cursor-help">
          <Badge className="text-[9px] px-1.5 py-0 bg-red-600 text-red-50 hover:bg-red-700 whitespace-nowrap border-0">Declined</Badge>
        </span>
      );
    case "draft":
      return <Badge className="text-[9px] px-1.5 py-0 bg-yellow-400 text-yellow-900 hover:bg-yellow-500 whitespace-nowrap border-0">Draft</Badge>;
    default:
      return <Badge variant="outline" className="text-[9px] px-1.5 py-0 whitespace-nowrap">{status}</Badge>;
  }
};

const SellerProducts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const adminViewId = searchParams.get("adminView");
  const sellerId = adminViewId || user?.id;

  const [products, setProducts] = useState<Product[]>([]);
  const [deletedProducts, setDeletedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tab, setTab] = useState<"active" | "bin">("active");

  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Product | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [emptyBinDialogOpen, setEmptyBinDialogOpen] = useState(false);
  const [permDeleteTarget, setPermDeleteTarget] = useState<Product | null>(null);
  const [permDeleteDialogOpen, setPermDeleteDialogOpen] = useState(false);

  // ── Fetch ──
  const fetchProducts = useCallback(async () => {
    if (!sellerId) return;
    const { data: active } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", sellerId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (active) setProducts(active as unknown as Product[]);

    const { data: deleted } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", sellerId)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    if (deleted) setDeletedProducts(deleted as unknown as Product[]);
  }, [sellerId]);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from("categories").select("id, name").order("name");
    if (data) setCategories(data);
  }, []);

  // ── Auto-cleanup expired bin items ──
  const autoCleanupBin = useCallback(async () => {
    if (!sellerId) return;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: expired } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", sellerId)
      .not("deleted_at", "is", null)
      .lt("deleted_at", sevenDaysAgo);
    if (expired?.length) {
      for (const p of expired as unknown as Product[]) {
        await permanentlyDeleteProduct(p);
      }
      fetchProducts();
    }
  }, [sellerId]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    autoCleanupBin();
  }, [fetchProducts, fetchCategories, autoCleanupBin]);

  // ── Category sidebar data ──
  const sellerCategories = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const p of products) {
      if (p.category_id) {
        countMap.set(p.category_id, (countMap.get(p.category_id) || 0) + 1);
      }
    }
    return categories
      .filter((c) => countMap.has(c.id))
      .map((c) => ({ ...c, count: countMap.get(c.id)! }));
  }, [products, categories]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { approved: 0, draft: 0, pending_review: 0, rejected: 0 };
    for (const p of products) { counts[p.listing_status || "draft"] = (counts[p.listing_status || "draft"] || 0) + 1; }
    return counts;
  }, [products]);

  // ── Sort ──
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  // ── Filtering + Sorting ──
  const filteredAndSorted = useMemo(() => {
    let list = [...products];

    // Category filter
    if (selectedCategoryId) {
      list = list.filter((p) => p.category_id === selectedCategoryId);
    }

    // Status filter
    if (selectedStatus) {
      list = list.filter((p) => (p.listing_status || "draft") === selectedStatus);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.product_name.toLowerCase().includes(q) ||
          p.product_code.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortKey) {
      const dir = sortDir === "asc" ? 1 : -1;
      list.sort((a, b) => {
        if (sortKey === "category") {
          const catA = categories.find((c) => c.id === a.category_id)?.name || "";
          const catB = categories.find((c) => c.id === b.category_id)?.name || "";
          return catA.localeCompare(catB) * dir;
        }
        if (sortKey === "is_featured") return ((a.is_featured ? 1 : 0) - (b.is_featured ? 1 : 0)) * dir;
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (typeof valA === "number" && typeof valB === "number") return (valA - valB) * dir;
        return String(valA || "").localeCompare(String(valB || "")) * dir;
      });
    }

    return list;
  }, [products, selectedCategoryId, selectedStatus, searchQuery, sortKey, sortDir, categories]);

  // ── Storage helpers ──
  const deleteStorageFile = async (url: string, bucket: string) => {
    try {
      const bucketPath = `${bucket}/`;
      const idx = url.indexOf(bucketPath);
      if (idx === -1) return;
      const filePath = url.substring(idx + bucketPath.length);
      await supabase.storage.from(bucket).remove([filePath]);
    } catch (e) { console.error("Failed to delete file:", e); }
  };

  const permanentlyDeleteProduct = async (product: Product) => {
    if (product.main_image_url) await deleteStorageFile(product.main_image_url, "product-images");
    if (product.additional_image_urls?.length) {
      for (const url of product.additional_image_urls) await deleteStorageFile(url, "product-images");
    }
    if (product.installation_instructions_url) await deleteStorageFile(product.installation_instructions_url, "product-documents");
    if (product.technical_drawings_url) await deleteStorageFile(product.technical_drawings_url, "product-documents");
    await supabase.from("product_options").delete().eq("product_id", product.id);
    await supabase.from("product_compatible_appliances").delete().eq("product_id", product.id);
    await supabase.from("products").delete().eq("id", product.id);
  };

  // ── Actions ──
  const handleSoftDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("id", deleteTarget.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Product moved to recycle bin" }); fetchProducts(); }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const handleRestore = async (id: string) => {
    const { error } = await supabase.from("products").update({ deleted_at: null } as any).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Product restored" }); fetchProducts(); }
  };

  const handlePermanentDelete = async () => {
    if (!permDeleteTarget) return;
    await permanentlyDeleteProduct(permDeleteTarget);
    toast({ title: "Product permanently deleted" });
    fetchProducts();
    setPermDeleteDialogOpen(false);
    setPermDeleteTarget(null);
  };

  const handleEmptyBin = async () => {
    for (const p of deletedProducts) await permanentlyDeleteProduct(p);
    toast({ title: "Recycle bin emptied" });
    fetchProducts();
    setEmptyBinDialogOpen(false);
  };

  const handleToggleActivation = async (product: Product) => {
    const isDeactivating = product.availability_status !== "Deactivated";
    const payload: any = isDeactivating
      ? { availability_status: "Deactivated", stock_level: 0 }
      : { availability_status: "In Stock" };
    const { error } = await supabase.from("products").update(payload).eq("id", product.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: isDeactivating ? "Product deactivated — stock set to 0" : "Product activated — remember to update stock level" });
      fetchProducts();
    }
  };

  const handleApproveProduct = async (product: Product) => {
    const { error } = await supabase.from("products").update({ listing_status: "approved" } as any).eq("id", product.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `"${product.product_name}" approved` }); fetchProducts(); }
  };

  const handleRejectProduct = async () => {
    if (!rejectTarget) return;
    const { error } = await supabase.from("products").update({
      listing_status: "rejected",
      listing_rejection_reason: rejectReason || null,
    } as any).eq("id", rejectTarget.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `"${rejectTarget.product_name}" rejected` }); fetchProducts(); }
    setRejectDialogOpen(false);
    setRejectTarget(null);
    setRejectReason("");
  };

  const handleDuplicate = async (product: Product) => {
    const { id: _id, deleted_at: _da, created_at: _ca, updated_at: _ua, ...rest } = product as any;
    const newName = `${product.product_name} (Copy)`;
    const newCode = `${product.product_code}-CP`;
    const { data: newProd, error } = await supabase
      .from("products")
      .insert({ ...rest, product_name: newName, product_code: newCode } as any)
      .select("id")
      .single();
    if (error || !newProd) {
      toast({ title: "Duplicate failed", description: error?.message, variant: "destructive" });
      return;
    }
    const { data: opts } = await supabase.from("product_options").select("*").eq("product_id", product.id);
    if (opts?.length) {
      const newOpts = opts.map(({ id: _id, product_id: _pid, created_at: _ca, ...o }: any) => ({
        ...o, product_id: newProd.id,
      }));
      await supabase.from("product_options").insert(newOpts as any);
    }
    const { data: apps } = await supabase.from("product_compatible_appliances").select("*").eq("product_id", product.id);
    if (apps?.length) {
      const newApps = apps.map(({ id: _id, product_id: _pid, created_at: _ca, ...a }: any) => ({
        ...a, product_id: newProd.id,
      }));
      await supabase.from("product_compatible_appliances").insert(newApps as any);
    }
    toast({ title: "Product duplicated" });
    fetchProducts();
  };

  const getDaysRemaining = (deletedAt: string) => {
    const expiryDate = new Date(deletedAt).getTime() + 7 * 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((expiryDate - Date.now()) / (24 * 60 * 60 * 1000)));
  };

  const addProductUrl = adminViewId ? `/seller/products/new?adminView=${adminViewId}` : "/seller/products/new";
  const editUrl = (id: string) => adminViewId ? `/seller/products/${id}?adminView=${adminViewId}` : `/seller/products/${id}`;
  const variantsUrl = (id: string) => adminViewId ? `/seller/products/${id}/variants?adminView=${adminViewId}` : `/seller/products/${id}/variants`;

  const isFiltered = !!selectedCategoryId || !!searchQuery.trim();

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: adminViewId ? `/seller/dashboard?adminView=${adminViewId}` : "/seller/dashboard" }, { label: "Products" }]} />

      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <Button
            variant={tab === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("active")}
          >
            Active ({products.length})
          </Button>
          <Button
            variant={tab === "bin" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("bin")}
          >
            Recycle Bin ({deletedProducts.length})
          </Button>
        </div>
        <Button asChild>
          <Link to={addProductUrl}><PlusCircle className="w-4 h-4 mr-2" /> Add Product</Link>
        </Button>
      </div>

      {/* ── Active Products with Sidebar ── */}
      {tab === "active" && (
        <div className="flex gap-6">
          {/* Category Sidebar */}
          <div className="hidden md:block w-[220px] shrink-0">
            <Card className="sticky top-4">
              <CardContent className="p-3 space-y-1">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-md transition-colors ${
                    !selectedCategoryId
                      ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  All Products ({products.length})
                </button>
                {sellerCategories.length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-3 pb-1">
                      Categories
                    </p>
                    {sellerCategories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategoryId(c.id === selectedCategoryId ? null : c.id)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-md transition-colors ${
                          selectedCategoryId === c.id
                            ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        {c.name} ({c.count})
                      </button>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Search + Category Filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or SKU…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <Select
                value={selectedCategoryId || "all"}
                onValueChange={(v) => setSelectedCategoryId(v === "all" ? null : v)}
              >
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {sellerCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.count})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isFiltered && (
                <p className="text-xs text-muted-foreground">
                  Showing {filteredAndSorted.length} of {products.length} products
                </p>
              )}
            </div>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="py-2 px-2 w-[180px] cursor-pointer select-none" onClick={() => handleSort("product_name")}>
                        <span className="inline-flex items-center">Name<SortIcon col="product_name" /></span>
                      </TableHead>
                      <TableHead className="py-2 px-2 w-[110px] cursor-pointer select-none" onClick={() => handleSort("product_code")}>
                        <span className="inline-flex items-center">SKU<SortIcon col="product_code" /></span>
                      </TableHead>
                      <TableHead className="py-2 px-2 w-[100px] cursor-pointer select-none" onClick={() => handleSort("category")}>
                        <span className="inline-flex items-center">Category<SortIcon col="category" /></span>
                      </TableHead>
                      <TableHead className="py-2 px-1 w-[60px] text-center">Img</TableHead>
                      <TableHead className="py-2 px-2 w-[80px] text-right cursor-pointer select-none" onClick={() => handleSort("price_retail_usd")}>
                        <span className="inline-flex items-center justify-end w-full">Retail<SortIcon col="price_retail_usd" /></span>
                      </TableHead>
                      <TableHead className="py-2 px-2 w-[80px] text-right cursor-pointer select-none" onClick={() => handleSort("price_discounted_usd")}>
                        <span className="inline-flex items-center justify-end w-full">Sale<SortIcon col="price_discounted_usd" /></span>
                      </TableHead>
                      <TableHead className="py-2 px-2 w-[55px] text-center cursor-pointer select-none" onClick={() => handleSort("stock_level")}>
                        <span className="inline-flex items-center justify-center w-full">Stock<SortIcon col="stock_level" /></span>
                      </TableHead>
                      <TableHead className="py-2 px-2 w-[90px] text-center cursor-pointer select-none" onClick={() => handleSort("availability_status")}>
                        <span className="inline-flex items-center justify-center w-full">Status<SortIcon col="availability_status" /></span>
                      </TableHead>
                      <TableHead className="py-2 px-2 w-[90px] text-center">Listing</TableHead>
                      <TableHead className="py-2 px-1 w-[40px] text-center cursor-pointer select-none" onClick={() => handleSort("is_featured")}>
                        <span className="inline-flex items-center justify-center w-full"><Star className="w-3 h-3" /><SortIcon col="is_featured" /></span>
                      </TableHead>
                      <TableHead className="py-2 px-2 w-[160px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSorted.map((p) => {
                      const imgSummary = getImageOptSummary(p);
                      return (
                        <TableRow key={p.id} className="text-xs">
                          <TableCell className="py-1.5 px-2 font-medium max-w-[180px] truncate">{p.product_name}</TableCell>
                          <TableCell className="py-1.5 px-2 text-muted-foreground max-w-[110px] truncate">{p.product_code}</TableCell>
                          <TableCell className="py-1.5 px-2 max-w-[100px] truncate">{categories.find((c) => c.id === p.category_id)?.name || "—"}</TableCell>
                          <TableCell className="py-1.5 px-1 text-center">
                            {imgSummary.label === "no-images" && <span className="text-muted-foreground">—</span>}
                            {imgSummary.label === "all-optimized" && (
                              <Badge variant="default" className="text-[9px] px-1 py-0 gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> {imgSummary.optimizedCount}/{imgSummary.totalCount}
                              </Badge>
                            )}
                            {imgSummary.label === "partial" && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> {imgSummary.optimizedCount}/{imgSummary.totalCount}
                              </Badge>
                            )}
                            {imgSummary.label === "none" && (
                              <Badge variant="destructive" className="text-[9px] px-1 py-0 gap-0.5">
                                <ImageOff className="w-2.5 h-2.5" /> 0/{imgSummary.totalCount}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-1.5 px-2 text-right font-mono">${Number(p.price_retail_usd).toLocaleString()}</TableCell>
                          <TableCell className="py-1.5 px-2 text-right font-mono">${Number(p.price_discounted_usd).toLocaleString()}</TableCell>
                          <TableCell className="py-1.5 px-2 text-center">{p.stock_level}</TableCell>
                          <TableCell className="py-1.5 px-2 text-center">
                            <button onClick={() => handleToggleActivation(p)} className="cursor-pointer" title="Toggle activation">
                              {statusBadge(p.availability_status)}
                            </button>
                          </TableCell>
                          <TableCell className="py-1.5 px-2 text-center">
                            {listingStatusBadge(p.listing_status || 'pending_review')}
                          </TableCell>
                          <TableCell className="py-1.5 px-1 text-center">
                            {p.is_featured ? <Star className="w-3.5 h-3.5 text-primary fill-primary mx-auto" /> : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="py-1.5 px-2 text-right">
                            <div className="flex justify-end gap-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Variants" onClick={() => navigate(variantsUrl(p.id))}>
                                <Layers className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Duplicate" onClick={() => handleDuplicate(p)}>
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => navigate(editUrl(p.id))}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                               <Button variant="ghost" size="icon" className="h-7 w-7" title="Delete" onClick={() => { setDeleteTarget(p); setDeleteDialogOpen(true); }}>
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                              {adminViewId && p.listing_status !== "approved" && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" title="Approve" onClick={() => handleApproveProduct(p)}>
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {adminViewId && p.listing_status !== "rejected" && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Reject" onClick={() => { setRejectTarget(p); setRejectDialogOpen(true); }}>
                                  <XIcon className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredAndSorted.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                          <div className="space-y-2">
                            {products.length === 0 ? (
                              <>
                                <p className="font-medium">No products yet</p>
                                <p className="text-xs">Click "Add Product" to list your first product.</p>
                              </>
                            ) : (
                              <>
                                <p className="font-medium">No products match your filters</p>
                                <p className="text-xs">Try adjusting your search or category filter.</p>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Recycle Bin ── */}
      {tab === "bin" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Items permanently deleted after 7 days
            </CardTitle>
            {deletedProducts.length > 0 && (
              <Button variant="destructive" size="sm" onClick={() => setEmptyBinDialogOpen(true)}>
                <Trash className="w-4 h-4 mr-1" /> Empty Bin
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2 px-2">Name</TableHead>
                  <TableHead className="py-2 px-2">SKU</TableHead>
                  <TableHead className="py-2 px-2">Deleted</TableHead>
                  <TableHead className="py-2 px-2 text-center">Days Left</TableHead>
                  <TableHead className="py-2 px-2 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletedProducts.map((p) => (
                  <TableRow key={p.id} className="opacity-70 text-xs">
                    <TableCell className="py-1.5 px-2 font-medium max-w-[160px] truncate">{p.product_name}</TableCell>
                    <TableCell className="py-1.5 px-2 text-muted-foreground max-w-[110px] truncate">{p.product_code}</TableCell>
                    <TableCell className="py-1.5 px-2 text-muted-foreground">
                      {p.deleted_at ? new Date(p.deleted_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="py-1.5 px-2 text-center">
                      <Badge variant={getDaysRemaining(p.deleted_at!) <= 2 ? "destructive" : "secondary"} className="text-[9px] px-1 py-0">
                        {getDaysRemaining(p.deleted_at!)}d
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5 px-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => handleRestore(p.id)}>
                          <RotateCcw className="w-3 h-3 mr-1" /> Restore
                        </Button>
                        <Button variant="destructive" size="sm" className="h-7 text-xs px-2" onClick={() => { setPermDeleteTarget(p); setPermDeleteDialogOpen(true); }}>
                          <Trash className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {deletedProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Recycle bin is empty
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Soft Delete Confirmation ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to recycle bin?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.product_name}" will be moved to the recycle bin and permanently deleted after 7 days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSoftDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Permanent Delete Confirmation ── */}
      <AlertDialog open={permDeleteDialogOpen} onOpenChange={setPermDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete?</AlertDialogTitle>
            <AlertDialogDescription>
              "{permDeleteTarget?.product_name}" and all its files will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Empty Bin Confirmation ── */}
      <AlertDialog open={emptyBinDialogOpen} onOpenChange={setEmptyBinDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Empty recycle bin?</AlertDialogTitle>
            <AlertDialogDescription>
              All {deletedProducts.length} items will be permanently deleted with their files. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEmptyBin} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Empty Bin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Reject Product Dialog ── */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={(open) => { setRejectDialogOpen(open); if (!open) { setRejectTarget(null); setRejectReason(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject product listing?</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejecting "{rejectTarget?.product_name}". The seller will see this reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Rejection reason (optional)…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SellerProducts;
