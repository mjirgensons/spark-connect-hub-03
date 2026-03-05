import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ImageUpload, MultiImageUpload } from "@/components/admin/ImageUpload";
import { PlusCircle, Pencil, Trash2, ArrowLeft, Package } from "lucide-react";

interface Variant {
  id: string;
  product_id: string;
  variant_name: string;
  color: string | null;
  material: string | null;
  finish: string | null;
  price_retail: number | null;
  price_discounted: number | null;
  stock_level: number | null;
  availability_status: string | null;
  sort_order: number | null;
  main_image_url: string | null;
  additional_image_urls: string[] | null;
  created_at: string;
  updated_at: string;
}

const AVAILABILITY_OPTIONS = ["In Stock", "Low Stock", "Out of Stock", "Preorder"];

const availabilityColor = (s: string | null) => {
  switch (s) {
    case "In Stock": return "bg-green-500/15 text-green-700 border-green-300";
    case "Low Stock": return "bg-yellow-500/15 text-yellow-700 border-yellow-300";
    case "Out of Stock": return "bg-red-500/15 text-red-700 border-red-300";
    case "Preorder": return "bg-blue-500/15 text-blue-700 border-blue-300";
    default: return "";
  }
};

const emptyForm = {
  variant_name: "",
  color: "",
  material: "",
  finish: "",
  price_retail: "",
  price_discounted: "",
  stock_level: "0",
  availability_status: "In Stock",
  sort_order: "0",
  main_image_url: null as string | null,
  additional_image_urls: [] as string[],
};

const SellerProductVariants = () => {
  const { id: productId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const adminViewId = searchParams.get("adminView");

  const [product, setProduct] = useState<{ product_name: string; product_code: string } | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [deleteTarget, setDeleteTarget] = useState<Variant | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const productsUrl = adminViewId ? `/seller/products?adminView=${adminViewId}` : "/seller/products";

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    const { data } = await supabase
      .from("products")
      .select("product_name, product_code")
      .eq("id", productId)
      .single();
    if (data) setProduct(data);
  }, [productId]);

  const fetchVariants = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    const { data } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (data) setVariants(data as unknown as Variant[]);
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    fetchProduct();
    fetchVariants();
  }, [fetchProduct, fetchVariants]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSheetOpen(true);
  };

  const openEdit = (v: Variant) => {
    setEditingId(v.id);
    setForm({
      variant_name: v.variant_name,
      color: v.color || "",
      material: v.material || "",
      finish: v.finish || "",
      price_retail: v.price_retail != null ? String(v.price_retail) : "",
      price_discounted: v.price_discounted != null ? String(v.price_discounted) : "",
      stock_level: String(v.stock_level ?? 0),
      availability_status: v.availability_status || "In Stock",
      sort_order: String(v.sort_order ?? 0),
      main_image_url: v.main_image_url,
      additional_image_urls: v.additional_image_urls || [],
    });
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!form.variant_name.trim()) {
      toast({ title: "Variant name is required", variant: "destructive" });
      return;
    }
    if (!form.price_retail || isNaN(Number(form.price_retail))) {
      toast({ title: "Valid retail price is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload: any = {
      variant_name: form.variant_name.trim(),
      color: form.color.trim() || null,
      material: form.material.trim() || null,
      finish: form.finish.trim() || null,
      price_retail: Number(form.price_retail),
      price_discounted: form.price_discounted ? Number(form.price_discounted) : null,
      stock_level: Number(form.stock_level) || 0,
      availability_status: form.availability_status,
      sort_order: Number(form.sort_order) || 0,
      main_image_url: form.main_image_url,
      additional_image_urls: form.additional_image_urls.length > 0 ? form.additional_image_urls : null,
    };

    if (editingId) {
      const { error } = await supabase.from("product_variants").update(payload).eq("id", editingId);
      if (error) {
        toast({ title: "Update failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Variant updated" });
        setSheetOpen(false);
        fetchVariants();
      }
    } else {
      payload.product_id = productId;
      const { error } = await supabase.from("product_variants").insert(payload);
      if (error) {
        toast({ title: "Create failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Variant created" });
        setSheetOpen(false);
        fetchVariants();
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    // Clean up storage files
    if (deleteTarget.main_image_url) {
      await deleteStorageFile(deleteTarget.main_image_url);
    }
    if (deleteTarget.additional_image_urls?.length) {
      for (const url of deleteTarget.additional_image_urls) {
        await deleteStorageFile(url);
      }
    }
    const { error } = await supabase.from("product_variants").delete().eq("id", deleteTarget.id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Variant deleted" }); fetchVariants(); }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const deleteStorageFile = async (url: string) => {
    try {
      const bucketPath = "product-images/";
      const idx = url.indexOf(bucketPath);
      if (idx === -1) return;
      const filePath = url.substring(idx + bucketPath.length);
      await supabase.storage.from("product-images").remove([filePath]);
    } catch (e) {
      console.error("Failed to delete file:", e);
    }
  };

  const discountPct = form.price_retail && form.price_discounted &&
    Number(form.price_retail) > 0 && Number(form.price_discounted) < Number(form.price_retail)
    ? Math.round((1 - Number(form.price_discounted) / Number(form.price_retail)) * 100)
    : null;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: "Products", href: productsUrl },
        { label: product?.product_name || "…" },
        { label: "Variants" },
      ]} />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to={productsUrl}><ArrowLeft className="w-4 h-4 mr-1" /> Back to Products</Link>
        </Button>
      </div>

      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold">
          Variants for {product?.product_name || "…"}
        </h1>
        {product?.product_code && (
          <p className="text-sm text-muted-foreground mt-1">Product Code: {product.product_code}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={openAdd}>
          <PlusCircle className="w-4 h-4 mr-2" /> Add Variant
        </Button>
      </div>

      {/* Variant Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-4 space-y-3">
              <Skeleton className="h-32 w-full rounded-md" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent></Card>
          ))}
        </div>
      ) : variants.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Package className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              No variants yet. Add your first variant to offer this product in different colors or finishes.
            </p>
            <Button onClick={openAdd}>
              <PlusCircle className="w-4 h-4 mr-2" /> Add Variant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {variants.map((v) => {
            const disc = v.price_retail && v.price_discounted && v.price_retail > 0 && v.price_discounted < v.price_retail
              ? Math.round((1 - v.price_discounted / v.price_retail) * 100)
              : null;
            return (
              <Card key={v.id} className="overflow-hidden">
                {v.main_image_url ? (
                  <img src={v.main_image_url} alt={v.variant_name} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-muted flex items-center justify-center">
                    <Package className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold truncate">{v.variant_name}</h3>
                    <Badge variant="outline" className={availabilityColor(v.availability_status)}>
                      {v.availability_status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    {v.color && <p>Color: {v.color}</p>}
                    {v.finish && <p>Finish: {v.finish}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">${Number(v.price_retail ?? 0).toLocaleString()}</span>
                    {v.price_discounted != null && (
                      <span className="text-sm text-muted-foreground">${Number(v.price_discounted).toLocaleString()}</span>
                    )}
                    {disc != null && (
                      <Badge variant="destructive" className="text-[10px] px-1 py-0">-{disc}%</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Stock: {v.stock_level ?? 0}</p>
                  <div className="flex justify-end gap-1 pt-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(v)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setDeleteTarget(v); setDeleteDialogOpen(true); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit Variant" : "Add Variant"}</SheetTitle>
            <SheetDescription>
              {editingId ? "Update this variant's details." : "Create a new color or finish variant."}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <Label>Variant Name *</Label>
              <Input value={form.variant_name} onChange={(e) => setForm({ ...form, variant_name: e.target.value })} placeholder="e.g. Espresso Walnut" />
            </div>
            <div>
              <Label>Color *</Label>
              <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="e.g. Espresso" />
            </div>
            <div>
              <Label>Material</Label>
              <Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="e.g. Walnut Veneer" />
            </div>
            <div>
              <Label>Finish</Label>
              <Input value={form.finish} onChange={(e) => setForm({ ...form, finish: e.target.value })} placeholder="e.g. Matte" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Retail Price (CAD) *</Label>
                <Input type="number" min="0" step="0.01" value={form.price_retail} onChange={(e) => setForm({ ...form, price_retail: e.target.value })} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label>Sale Price (CAD)</Label>
                  {discountPct != null && (
                    <Badge variant="destructive" className="text-[10px] px-1 py-0">-{discountPct}%</Badge>
                  )}
                </div>
                <Input type="number" min="0" step="0.01" value={form.price_discounted} onChange={(e) => setForm({ ...form, price_discounted: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Stock Level</Label>
                <Input type="number" min="0" value={form.stock_level} onChange={(e) => setForm({ ...form, stock_level: e.target.value })} />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input type="number" min="0" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Availability</Label>
              <Select value={form.availability_status} onValueChange={(v) => setForm({ ...form, availability_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <ImageUpload
              label="Main Image"
              value={form.main_image_url}
              onChange={(url) => setForm({ ...form, main_image_url: url })}
            />
            <MultiImageUpload
              label="Additional Images (up to 10)"
              value={form.additional_image_urls}
              onChange={(urls) => setForm({ ...form, additional_image_urls: urls.slice(0, 10) })}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Variant"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Variant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this variant? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SellerProductVariants;
