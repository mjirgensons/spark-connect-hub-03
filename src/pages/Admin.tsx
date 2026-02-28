import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, LogOut, Sparkles, AlertTriangle, ImageOff, RotateCcw, Trash, Power, PowerOff, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { ImageUpload, MultiImageUpload, getImageOptSummary } from "@/components/admin/ImageUpload";
import { FileUpload } from "@/components/admin/FileUpload";
import FooterPagesAdmin from "@/components/admin/FooterPagesAdmin";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import SiteSettingsAdmin from "@/components/admin/SiteSettingsAdmin";
import LegalPagesAdmin from "@/components/admin/LegalPagesAdmin";
import CookieCategoriesAdmin from "@/components/admin/CookieCategoriesAdmin";
import CookieRegistryAdmin from "@/components/admin/CookieRegistryAdmin";
import ConsentLogsAdmin from "@/components/admin/ConsentLogsAdmin";
import BannerSettingsAdmin from "@/components/admin/BannerSettingsAdmin";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  product_name: string;
  product_code: string;
  category_id: string | null;
  style: string;
  color: string;
  material: string;
  width_mm: number;
  height_mm: number;
  depth_mm: number;
  price_retail_usd: number;
  price_discounted_usd: number;
  discount_percentage: number;
  short_description: string | null;
  long_description: string | null;
  main_image_url: string | null;
  additional_image_urls: string[] | null;
  stock_level: number;
  availability_status: string;
  is_featured: boolean;
  compatible_kitchen_layouts: string[] | null;
  installation_instructions_url: string | null;
  tag: string | null;
  manufacturer: string | null;
  countertop_option: string;
  countertop_material: string | null;
  countertop_thickness: string | null;
  countertop_finish: string | null;
  countertop_stock: number;
  countertop_included: boolean;
  countertop_price_retail: number;
  countertop_price_discounted: number;
  countertop_discount_percentage: number;
  deleted_at?: string | null;
}

const emptyProduct: Omit<Product, "id"> = {
  product_name: "",
  product_code: "",
  category_id: null,
  style: "",
  color: "",
  material: "",
  width_mm: "" as unknown as number,
  height_mm: "" as unknown as number,
  depth_mm: "" as unknown as number,
  price_retail_usd: "" as unknown as number,
  price_discounted_usd: "" as unknown as number,
  discount_percentage: "" as unknown as number,
  short_description: "",
  long_description: "",
  main_image_url: "",
  additional_image_urls: [],
  stock_level: "" as unknown as number,
  availability_status: "In Stock",
  is_featured: false,
  compatible_kitchen_layouts: [],
  installation_instructions_url: "",
  tag: null,
  manufacturer: null,
  countertop_option: "no",
  countertop_material: null,
  countertop_thickness: null,
  countertop_finish: null,
  countertop_stock: "" as unknown as number,
  countertop_included: false,
  countertop_price_retail: "" as unknown as number,
  countertop_price_discounted: "" as unknown as number,
  countertop_discount_percentage: "" as unknown as number,
};

const Admin = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [deletedProducts, setDeletedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [manufacturers, setManufacturers] = useState<string[]>(["LA"]);
  const [newManufacturer, setNewManufacturer] = useState("");
  const [skuMode, setSkuMode] = useState<"auto" | "manual">("auto");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  type SortKey = "product_name" | "product_code" | "category" | "price_retail_usd" | "price_discounted_usd" | "stock_level" | "availability_status" | "is_featured";
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const sortedProducts = [...products].sort((a, b) => {
    if (!sortKey) return 0;
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "category") {
      const catA = categories.find(c => c.id === a.category_id)?.name || "";
      const catB = categories.find(c => c.id === b.category_id)?.name || "";
      return catA.localeCompare(catB) * dir;
    }
    if (sortKey === "is_featured") {
      return ((a.is_featured ? 1 : 0) - (b.is_featured ? 1 : 0)) * dir;
    }
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (typeof valA === "number" && typeof valB === "number") return (valA - valB) * dir;
    return String(valA || "").localeCompare(String(valB || "")) * dir;
  });

  // Check if current user is in admin_emails whitelist
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) { setIsAdmin(false); return; }
      const { data } = await supabase
        .from("admin_emails")
        .select("id")
        .eq("email", user.email || "")
        .maybeSingle();
      setIsAdmin(!!data);
    };
    if (user) checkAdmin();
  }, [user]);

  const generateSKU = (f: Omit<Product, "id">) => {
    // Clean: uppercase, remove ambiguous chars (O→0 already excluded, I→1 excluded)
    const clean = (s: string | null | undefined, len: number) => {
      const raw = (s || "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .replace(/[OI]/g, (c) => (c === "O" ? "0" : "1"))
        .slice(0, len);
      return raw;
    };

    const cat = categories.find((c) => c.id === f.category_id);
    // Top-level: 2-char category code
    const catCode = clean(cat?.slug || cat?.name, 2) || "GN";
    // Middle: 2-char style + 2-char color
    const styleCode = clean(f.style, 2) || "ST";
    const colorCode = clean(f.color, 2) || "CL";
    // Compact dimension: width in cm (drop mm precision)
    const wCm = f.width_mm ? String(Math.round(Number(f.width_mm) / 10)) : "0";
    // Sequential suffix: use last 2 digits of timestamp for uniqueness
    const seq = String(Date.now()).slice(-2);

    // Result: e.g. KC-SH-WH-90-07  (10 chars without hyphens, ~14 with)
    return `${catCode}-${styleCode}-${colorCode}-${wCm}-${seq}`;
  };

  useEffect(() => {
    if (!loading && !user) navigate("/admin/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchCategories();
      fetchManufacturers();
      autoCleanupBin();
    }
  }, [user]);

  const fetchProducts = async () => {
    const { data: active } = await supabase
      .from("products")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (active) setProducts(active as unknown as Product[]);

    const { data: deleted } = await supabase
      .from("products")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    if (deleted) setDeletedProducts(deleted as unknown as Product[]);
  };

  const autoCleanupBin = async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: expired } = await supabase
      .from("products")
      .select("*")
      .not("deleted_at", "is", null)
      .lt("deleted_at", sevenDaysAgo);
    if (expired && expired.length > 0) {
      for (const p of expired as unknown as Product[]) {
        await permanentlyDeleteProduct(p);
      }
      fetchProducts();
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data as unknown as Category[]);
  };

  const fetchManufacturers = async () => {
    const { data } = await supabase.from("products").select("manufacturer");
    if (data) {
      const unique = Array.from(new Set(data.map((d: any) => d.manufacturer).filter(Boolean))) as string[];
      if (!unique.includes("LA")) unique.unshift("LA");
      setManufacturers(unique);
    }
  };

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyProduct);
    setSkuMode("auto");
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({ ...product });
    setSkuMode(product.manufacturer === "LA" || !product.manufacturer ? "auto" : "manual");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.product_name || !form.product_code || !form.style || !form.color || !form.material) {
      toast({ title: "Missing fields", description: "Fill in all required fields.", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      ...form,
      width_mm: Number(form.width_mm) || 0,
      height_mm: Number(form.height_mm) || 0,
      depth_mm: Number(form.depth_mm) || 0,
      price_retail_usd: Number(form.price_retail_usd) || 0,
      price_discounted_usd: Number(form.price_discounted_usd) || 0,
      discount_percentage: Number(form.discount_percentage) || 0,
      stock_level: Number(form.stock_level) || 0,
      main_image_url: form.main_image_url || null,
      installation_instructions_url: form.installation_instructions_url || null,
      short_description: form.short_description || null,
      long_description: form.long_description || null,
      category_id: form.category_id || null,
      tag: form.tag || null,
      manufacturer: form.manufacturer || null,
      countertop_option: form.countertop_option || "no",
      countertop_material: form.countertop_material || null,
      countertop_thickness: form.countertop_thickness || null,
      countertop_finish: form.countertop_finish || null,
      countertop_stock: Number(form.countertop_stock) || 0,
      countertop_included: form.countertop_included || false,
      countertop_price_retail: Number(form.countertop_price_retail) || 0,
      countertop_price_discounted: Number(form.countertop_price_discounted) || 0,
      countertop_discount_percentage: Number(form.countertop_discount_percentage) || 0,
    };

    // Remove deleted_at from payload to avoid sending it during create/update
    delete (payload as any).deleted_at;

    if (editingProduct) {
      const { error } = await supabase.from("products").update(payload as any).eq("id", editingProduct.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Product updated" });
    } else {
      const { error } = await supabase.from("products").insert(payload as any);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Product created" });
    }

    setSaving(false);
    setDialogOpen(false);
    fetchProducts();
  };

  const deleteStorageFile = async (url: string, bucket: string) => {
    try {
      const bucketPath = `${bucket}/`;
      const idx = url.indexOf(bucketPath);
      if (idx === -1) return;
      const filePath = url.substring(idx + bucketPath.length);
      await supabase.storage.from(bucket).remove([filePath]);
    } catch (e) {
      console.error("Failed to delete file:", e);
    }
  };

  // Soft delete — moves to recycle bin
  const handleSoftDelete = async (id: string) => {
    if (!confirm("Move this product to the recycle bin?")) return;
    const { error } = await supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Product moved to recycle bin" });
      fetchProducts();
    }
  };

  // Restore from recycle bin
  const handleRestore = async (id: string) => {
    const { error } = await supabase
      .from("products")
      .update({ deleted_at: null } as any)
      .eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Product restored" });
      fetchProducts();
    }
  };

  // Permanently delete a single product and all its storage files
  const permanentlyDeleteProduct = async (product: Product) => {
    if (product.main_image_url) await deleteStorageFile(product.main_image_url, "product-images");
    if (product.additional_image_urls?.length) {
      for (const url of product.additional_image_urls) {
        await deleteStorageFile(url, "product-images");
      }
    }
    if (product.installation_instructions_url) await deleteStorageFile(product.installation_instructions_url, "product-documents");
    await supabase.from("products").delete().eq("id", product.id);
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("Permanently delete this product and all its files? This cannot be undone.")) return;
    const product = deletedProducts.find((p) => p.id === id);
    if (product) {
      await permanentlyDeleteProduct(product);
      toast({ title: "Product permanently deleted" });
      fetchProducts();
    }
  };

  const handleEmptyBin = async () => {
    if (!confirm(`Permanently delete all ${deletedProducts.length} items in the recycle bin? This cannot be undone.`)) return;
    for (const p of deletedProducts) {
      await permanentlyDeleteProduct(p);
    }
    toast({ title: "Recycle bin emptied" });
    fetchProducts();
  };

  const handleToggleActivation = async (product: Product) => {
    const isDeactivating = product.availability_status !== "Deactivated";
    const updatePayload: any = isDeactivating
      ? { availability_status: "Deactivated", stock_level: 0 }
      : { availability_status: "In Stock" };
    const { error } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", product.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: isDeactivating ? "Product deactivated — stock set to 0" : "Product activated — update stock in edit form" });
      fetchProducts();
    }
  };

  const clearCountertopFields = (obj: any) => {
    obj.countertop_material = null;
    obj.countertop_thickness = null;
    obj.countertop_finish = null;
    obj.countertop_stock = "" as unknown as number;
    obj.countertop_included = false;
    obj.countertop_price_retail = "" as unknown as number;
    obj.countertop_price_discounted = "" as unknown as number;
    obj.countertop_discount_percentage = "" as unknown as number;
  };

  const deleteCountertopStorageFiles = async (product: Product) => {
    // Delete additional images associated with countertop if needed
    // (additional images are shared, so we don't delete them here)
  };

  const updateField = (field: string, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      // When countertop is set to "no", clear all countertop data
      if (field === "countertop_option" && value === "no") {
        clearCountertopFields(next);
      }

      // Auto-switch SKU mode based on manufacturer
      if (field === "manufacturer") {
        const newMode = value === "LA" ? "auto" : "manual";
        setSkuMode(newMode);
        if (newMode === "auto") {
          next.product_code = generateSKU(next);
        }
      }

      // Auto-regenerate SKU when relevant fields change and mode is auto
      if (skuMode === "auto" && ["category_id", "style", "color", "width_mm"].includes(field)) {
        next.product_code = generateSKU(next);
      }

      // Main product pricing auto-calc
      const retail = Number(field === "price_retail_usd" ? value : prev.price_retail_usd) || 0;
      const discounted = Number(field === "price_discounted_usd" ? value : prev.price_discounted_usd) || 0;
      const discount = Number(field === "discount_percentage" ? value : prev.discount_percentage) || 0;

      if (field === "price_retail_usd") {
        if (discount) next.price_discounted_usd = Math.round(retail * (1 - discount / 100) * 100) / 100;
        else if (discounted && retail > 0) next.discount_percentage = Math.round((1 - discounted / retail) * 10000) / 100;
      } else if (field === "discount_percentage") {
        if (retail) next.price_discounted_usd = Math.round(retail * (1 - Number(value) / 100) * 100) / 100;
        else if (discounted && Number(value) < 100) next.price_retail_usd = Math.round(discounted / (1 - Number(value) / 100) * 100) / 100;
      } else if (field === "price_discounted_usd") {
        if (discount && Number(value) > 0 && discount < 100) next.price_retail_usd = Math.round(Number(value) / (1 - discount / 100) * 100) / 100;
        else if (retail > 0) next.discount_percentage = Math.round((1 - Number(value) / retail) * 10000) / 100;
      }

      // Countertop pricing auto-calc (mirrors main product logic exactly)
      const ctRetail = Number(field === "countertop_price_retail" ? value : prev.countertop_price_retail) || 0;
      const ctDiscounted = Number(field === "countertop_price_discounted" ? value : prev.countertop_price_discounted) || 0;
      const ctDiscount = Number(field === "countertop_discount_percentage" ? value : prev.countertop_discount_percentage) || 0;

      if (field === "countertop_price_retail") {
        if (ctDiscount) next.countertop_price_discounted = Math.round(ctRetail * (1 - ctDiscount / 100) * 100) / 100;
        else if (ctDiscounted && ctRetail > 0) next.countertop_discount_percentage = Math.round((1 - ctDiscounted / ctRetail) * 10000) / 100;
      } else if (field === "countertop_discount_percentage") {
        if (ctRetail) next.countertop_price_discounted = Math.round(ctRetail * (1 - Number(value) / 100) * 100) / 100;
        else if (ctDiscounted && Number(value) < 100) next.countertop_price_retail = Math.round(ctDiscounted / (1 - Number(value) / 100) * 100) / 100;
      } else if (field === "countertop_price_discounted") {
        if (ctDiscount && Number(value) > 0 && ctDiscount < 100) next.countertop_price_retail = Math.round(Number(value) / (1 - ctDiscount / 100) * 100) / 100;
        else if (ctRetail > 0) next.countertop_discount_percentage = Math.round((1 - Number(value) / ctRetail) * 10000) / 100;
      }

      return next;
    });
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deleteDate = new Date(deletedAt).getTime();
    const expiryDate = deleteDate + 7 * 24 * 60 * 60 * 1000;
    const remaining = Math.ceil((expiryDate - Date.now()) / (24 * 60 * 60 * 1000));
    return Math.max(0, remaining);
  };

  if (loading || isAdmin === null) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  if (!user) return null;
  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">Your account ({user.email}) is not authorized to access the admin panel.</p>
        <Button variant="outline" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Sign Out</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-serif font-bold text-foreground">Product Catalog Admin</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="products">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
              <TabsTrigger value="recycle-bin">
                Recycle Bin ({deletedProducts.length})
              </TabsTrigger>
              <TabsTrigger value="footer-pages">Footer Pages</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="site-settings">Site Settings</TabsTrigger>
              <TabsTrigger value="legal-pages">Legal Pages</TabsTrigger>
              <TabsTrigger value="cookie-manager">Cookie Manager</TabsTrigger>
            </TabsList>
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add Product</Button>
          </div>

          <TabsContent value="products">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="py-2 px-2 cursor-pointer select-none" onClick={() => handleSort("product_name")}>
                        <span className="inline-flex items-center">Name<SortIcon col="product_name" /></span>
                      </TableHead>
                      <TableHead className="py-2 px-2 cursor-pointer select-none" onClick={() => handleSort("product_code")}>
                        <span className="inline-flex items-center">SKU<SortIcon col="product_code" /></span>
                      </TableHead>
                      <TableHead className="py-2 px-2 cursor-pointer select-none" onClick={() => handleSort("category")}>
                        <span className="inline-flex items-center">Cat.<SortIcon col="category" /></span>
                      </TableHead>
                      <TableHead className="py-2 px-1 text-center">Img</TableHead>
                      <TableHead className="py-2 px-2 text-right cursor-pointer select-none" onClick={() => handleSort("price_retail_usd")}>
                        <span className="inline-flex items-center justify-end">Retail<SortIcon col="price_retail_usd" /></span>
                      </TableHead>
                      <TableHead className="py-2 px-2 text-right cursor-pointer select-none" onClick={() => handleSort("price_discounted_usd")}>
                        <span className="inline-flex items-center justify-end">Sale<SortIcon col="price_discounted_usd" /></span>
                      </TableHead>
                      <TableHead className="py-2 px-2 text-center cursor-pointer select-none" onClick={() => handleSort("stock_level")}>
                        <span className="inline-flex items-center">Stock<SortIcon col="stock_level" /></span>
                      </TableHead>
                      <TableHead className="py-2 px-2 text-center cursor-pointer select-none" onClick={() => handleSort("availability_status")}>
                        <span className="inline-flex items-center">Status<SortIcon col="availability_status" /></span>
                      </TableHead>
                      <TableHead className="py-2 px-1 text-center cursor-pointer select-none" onClick={() => handleSort("is_featured")}>
                        <span className="inline-flex items-center">⭐<SortIcon col="is_featured" /></span>
                      </TableHead>
                      <TableHead className="py-2 px-2 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProducts.map((p) => (
                      <TableRow key={p.id} className="text-xs">
                        <TableCell className="py-1.5 px-2 font-medium max-w-[140px] truncate">{p.product_name}</TableCell>
                        <TableCell className="py-1.5 px-2 text-muted-foreground max-w-[100px] truncate">{p.product_code}</TableCell>
                        <TableCell className="py-1.5 px-2 max-w-[80px] truncate">{categories.find(c => c.id === p.category_id)?.name || "—"}</TableCell>
                        <TableCell className="py-1.5 px-1 text-center">
                          {(() => {
                            const summary = getImageOptSummary(p);
                            if (summary.label === "no-images") return <span className="text-muted-foreground">—</span>;
                            if (summary.label === "all-optimized") return (
                              <Badge variant="default" className="text-[9px] px-1 py-0 gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> {summary.optimizedCount}/{summary.totalCount}
                              </Badge>
                            );
                            if (summary.label === "partial") return (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> {summary.optimizedCount}/{summary.totalCount}
                              </Badge>
                            );
                            return (
                              <Badge variant="destructive" className="text-[9px] px-1 py-0 gap-0.5">
                                <ImageOff className="w-2.5 h-2.5" /> 0/{summary.totalCount}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="py-1.5 px-2 text-right">${Number(p.price_retail_usd).toLocaleString()}</TableCell>
                        <TableCell className="py-1.5 px-2 text-right">${Number(p.price_discounted_usd).toLocaleString()}</TableCell>
                        <TableCell className="py-1.5 px-2 text-center">{p.stock_level}</TableCell>
                        <TableCell className="py-1.5 px-2 text-center">
                          {p.availability_status === "Deactivated" ? (
                            <Badge variant="destructive" className="text-[9px] px-1 py-0"><PowerOff className="w-2.5 h-2.5 mr-0.5" />Off</Badge>
                          ) : (
                            <Badge variant="default" className="text-[9px] px-1 py-0"><Power className="w-2.5 h-2.5 mr-0.5" />On</Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-1.5 px-1 text-center">{p.is_featured ? "⭐" : "—"}</TableCell>
                        <TableCell className="py-1.5 px-2 text-right">
                          <div className="flex justify-end gap-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title={p.availability_status === "Deactivated" ? "Activate" : "Deactivate"}
                              onClick={() => handleToggleActivation(p)}
                            >
                              {p.availability_status === "Deactivated" ? <Power className="w-3.5 h-3.5 text-primary" /> : <PowerOff className="w-3.5 h-3.5 text-muted-foreground" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSoftDelete(p.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {products.length === 0 && (
                      <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No products yet. Click "Add Product" to get started.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recycle-bin">
            <Card>
              {deletedProducts.length > 0 && (
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Items are permanently deleted after 7 days
                  </CardTitle>
                  <Button variant="destructive" size="sm" onClick={handleEmptyBin}>
                    <Trash className="w-4 h-4 mr-1" /> Empty Recycle Bin
                  </Button>
                </CardHeader>
              )}
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="py-2 px-2">Name</TableHead>
                      <TableHead className="py-2 px-2">SKU</TableHead>
                      <TableHead className="py-2 px-2">Cat.</TableHead>
                      <TableHead className="py-2 px-2 text-center">Days Left</TableHead>
                      <TableHead className="py-2 px-2 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedProducts.map((p) => (
                      <TableRow key={p.id} className="opacity-70 text-xs">
                        <TableCell className="py-1.5 px-2 font-medium max-w-[140px] truncate">{p.product_name}</TableCell>
                        <TableCell className="py-1.5 px-2 text-muted-foreground max-w-[100px] truncate">{p.product_code}</TableCell>
                        <TableCell className="py-1.5 px-2 max-w-[80px] truncate">{categories.find(c => c.id === p.category_id)?.name || "—"}</TableCell>
                        <TableCell className="py-1.5 px-2 text-center">
                          <Badge variant={getDaysRemaining(p.deleted_at!) <= 2 ? "destructive" : "secondary"} className="text-[9px] px-1 py-0">
                            {getDaysRemaining(p.deleted_at!)}d
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1.5 px-2 text-right">
                          <div className="flex justify-end gap-0">
                            <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => handleRestore(p.id)}>
                              <RotateCcw className="w-3 h-3 mr-1" /> Restore
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePermanentDelete(p.id)}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {deletedProducts.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Recycle bin is empty.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="footer-pages">
            <FooterPagesAdmin />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="site-settings">
            <SiteSettingsAdmin />
          </TabsContent>

          <TabsContent value="legal-pages">
            <LegalPagesAdmin />
          </TabsContent>

          <TabsContent value="cookie-manager">
            <div className="space-y-8">
              <CookieCategoriesAdmin />
              <CookieRegistryAdmin />
              <ConsentLogsAdmin />
            </div>
          </TabsContent>
        </Tabs>

        {/* Product Form Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div><Label>Product Name *</Label><Input value={form.product_name} onChange={(e) => updateField("product_name", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Style *</Label>
                  <Select value={form.style} onValueChange={(v) => updateField("style", v)}>
                    <SelectTrigger><SelectValue placeholder="Select style" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Modern">Modern</SelectItem>
                      <SelectItem value="Shaker">Shaker</SelectItem>
                      <SelectItem value="Flat Panel">Flat Panel</SelectItem>
                      <SelectItem value="Slab">Slab</SelectItem>
                      <SelectItem value="Transitional">Transitional</SelectItem>
                      <SelectItem value="Contemporary">Contemporary</SelectItem>
                      <SelectItem value="Minimalist">Minimalist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Color *</Label><Input value={form.color} onChange={(e) => updateField("color", e.target.value)} /></div>
                <div><Label>Material *</Label><Input value={form.material} onChange={(e) => updateField("material", e.target.value)} placeholder="e.g. Maple, MDF" /></div>
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={form.category_id || ""} onValueChange={(v) => updateField("category_id", v || null)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="New category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!newCategoryName.trim() || creatingCategory}
                    onClick={async () => {
                      setCreatingCategory(true);
                      const slug = newCategoryName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                      const { data, error } = await supabase.from("categories").insert({ name: newCategoryName.trim(), slug }).select().single();
                      if (error) {
                        toast({ title: "Error", description: error.message, variant: "destructive" });
                      } else if (data) {
                        await fetchCategories();
                        updateField("category_id", data.id);
                        setNewCategoryName("");
                        toast({ title: "Category created" });
                      }
                      setCreatingCategory(false);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
              </div>
              <div>
                <Label>Product Tag</Label>
                <Select value={form.tag || ""} onValueChange={(v) => updateField("tag", v || null)}>
                  <SelectTrigger><SelectValue placeholder="Select tag (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Popular">Popular</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Best Seller">Best Seller</SelectItem>
                    <SelectItem value="Limited">Limited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Manufacturer (internal only)</Label>
                <Select value={form.manufacturer || ""} onValueChange={(v) => updateField("manufacturer", v || null)}>
                  <SelectTrigger><SelectValue placeholder="Select manufacturer" /></SelectTrigger>
                  <SelectContent>
                    {manufacturers.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="New manufacturer..."
                    value={newManufacturer}
                    onChange={(e) => setNewManufacturer(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!newManufacturer.trim()}
                    onClick={() => {
                      const name = newManufacturer.trim();
                      if (!manufacturers.includes(name)) {
                        setManufacturers((prev) => [...prev, name]);
                      }
                      updateField("manufacturer", name);
                      setNewManufacturer("");
                      toast({ title: "Manufacturer added" });
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
              </div>
              <Separator className="my-1" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>SKU / Product Code *</Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sku-mode-switch" className="text-xs text-muted-foreground">
                      {skuMode === "auto" ? "Auto-generated" : "Manual entry"}
                    </Label>
                    <Switch
                      id="sku-mode-switch"
                      checked={skuMode === "manual"}
                      onCheckedChange={(checked) => {
                        const newMode = checked ? "manual" : "auto";
                        setSkuMode(newMode);
                        if (newMode === "auto") {
                          updateField("product_code", generateSKU(form));
                        }
                      }}
                    />
                  </div>
                </div>
                <Input
                  value={form.product_code}
                  onChange={(e) => updateField("product_code", e.target.value)}
                  disabled={skuMode === "auto"}
                  placeholder={skuMode === "auto" ? "Auto-generated from product details" : "Enter manufacturer SKU code"}
                  className={skuMode === "auto" ? "font-mono text-sm bg-muted" : "font-mono text-sm"}
                />
                {skuMode === "auto" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    SKU is auto-generated: Category–Style–Color–Width–Seq (8-12 chars). Avoids ambiguous characters (O/I).
                  </p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Width (mm)</Label><Input type="number" value={form.width_mm} onChange={(e) => updateField("width_mm", Number(e.target.value))} /></div>
                <div><Label>Height (mm)</Label><Input type="number" value={form.height_mm} onChange={(e) => updateField("height_mm", Number(e.target.value))} /></div>
                <div><Label>Depth (mm)</Label><Input type="number" value={form.depth_mm} onChange={(e) => updateField("depth_mm", Number(e.target.value))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Retail Price (CAD)</Label><Input type="number" step="0.01" value={form.price_retail_usd} onChange={(e) => updateField("price_retail_usd", e.target.value === "" ? "" : Number(e.target.value))} /></div>
                <div><Label>Discounted Price (CAD)</Label><Input type="number" step="0.01" value={form.price_discounted_usd} onChange={(e) => updateField("price_discounted_usd", e.target.value === "" ? "" : Number(e.target.value))} /></div>
                <div><Label>Discount %</Label><Input type="number" step="0.01" value={form.discount_percentage} onChange={(e) => updateField("discount_percentage", e.target.value === "" ? "" : Number(e.target.value))} /></div>
              </div>
              <div><Label>Short Description</Label><Input value={form.short_description || ""} onChange={(e) => updateField("short_description", e.target.value)} /></div>
              <div><Label>Long Description</Label><Textarea value={form.long_description || ""} onChange={(e) => updateField("long_description", e.target.value)} /></div>
              <ImageUpload label="Main Image" value={form.main_image_url || null} onChange={(url) => updateField("main_image_url", url || "")} />
              <FileUpload label="Installation Instructions (PDF)" value={form.installation_instructions_url || null} onChange={(url) => updateField("installation_instructions_url", url || "")} />
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Stock Level</Label><Input type="number" value={form.stock_level} onChange={(e) => updateField("stock_level", Number(e.target.value))} /></div>
                <div>
                  <Label>Availability</Label>
                  <Select value={form.availability_status} onValueChange={(v) => updateField("availability_status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In Stock">In Stock</SelectItem>
                      <SelectItem value="Low Stock">Low Stock</SelectItem>
                      <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch id="featured-switch" checked={form.is_featured} onCheckedChange={(v) => updateField("is_featured", v)} />
                  <Label htmlFor="featured-switch">Featured</Label>
                </div>
              </div>
              <div>
                <Label>Compatible Kitchen Layouts</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {["L-Shape", "U-Shape", "Galley", "Straight", "Island", "Peninsula", "G-Shape"].map((layout) => {
                    const selected = (form.compatible_kitchen_layouts || []).includes(layout);
                    return (
                      <Badge
                        key={layout}
                        variant={selected ? "default" : "outline"}
                        className="cursor-pointer select-none"
                        onClick={() => {
                          const current = form.compatible_kitchen_layouts || [];
                          updateField(
                            "compatible_kitchen_layouts",
                            selected ? current.filter((l) => l !== layout) : [...current, layout]
                          );
                        }}
                      >
                        {layout}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <Separator className="my-2" />
              <h3 className="font-semibold text-foreground">Countertop Options</h3>
              <div>
                <Label>Countertop Availability</Label>
                <Select value={form.countertop_option} onValueChange={(v) => updateField("countertop_option", v)}>
                  <SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="optional">Optional (Add-on)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(form.countertop_option === "yes" || form.countertop_option === "optional") && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label>Material</Label><Input value={form.countertop_material || ""} onChange={(e) => updateField("countertop_material", e.target.value)} placeholder="e.g. Quartz, Granite" /></div>
                    <div><Label>Thickness</Label><Input value={form.countertop_thickness || ""} onChange={(e) => updateField("countertop_thickness", e.target.value)} placeholder="e.g. 20mm, 30mm" /></div>
                    <div><Label>Finish</Label><Input value={form.countertop_finish || ""} onChange={(e) => updateField("countertop_finish", e.target.value)} placeholder="e.g. Polished, Matte" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Countertop Stock</Label><Input type="number" value={form.countertop_stock} onChange={(e) => updateField("countertop_stock", Number(e.target.value))} /></div>
                    {form.countertop_option === "yes" && (
                      <div className="flex items-center gap-2 pt-6">
                        <Switch id="ct-included" checked={form.countertop_included} onCheckedChange={(v) => updateField("countertop_included", v)} />
                        <Label htmlFor="ct-included">Included with product</Label>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label>CT Retail Price (CAD)</Label><Input type="number" step="0.01" value={form.countertop_price_retail} onChange={(e) => updateField("countertop_price_retail", e.target.value === "" ? "" : Number(e.target.value))} /></div>
                    <div><Label>CT Discounted Price (CAD)</Label><Input type="number" step="0.01" value={form.countertop_price_discounted} onChange={(e) => updateField("countertop_price_discounted", e.target.value === "" ? "" : Number(e.target.value))} /></div>
                    <div><Label>CT Discount %</Label><Input type="number" step="0.01" value={form.countertop_discount_percentage} onChange={(e) => updateField("countertop_discount_percentage", e.target.value === "" ? "" : Number(e.target.value))} /></div>
                  </div>
                </>
              )}
              <MultiImageUpload label="Additional Images" value={form.additional_image_urls || []} onChange={(urls) => updateField("additional_image_urls", urls)} />
              <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Admin;