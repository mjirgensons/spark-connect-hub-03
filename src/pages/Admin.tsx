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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, LogOut } from "lucide-react";
import { ImageUpload, MultiImageUpload } from "@/components/admin/ImageUpload";
import { FileUpload } from "@/components/admin/FileUpload";

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
};

const Admin = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/admin/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchCategories();
    }
  }, [user]);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data as unknown as Product[]);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data as unknown as Category[]);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyProduct);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({ ...product });
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
    };

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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product and all associated files?")) return;
    const product = products.find((p) => p.id === id);
    if (product) {
      if (product.main_image_url) await deleteStorageFile(product.main_image_url, "product-images");
      if (product.additional_image_urls?.length) {
        for (const url of product.additional_image_urls) {
          await deleteStorageFile(url, "product-images");
        }
      }
      if (product.installation_instructions_url) await deleteStorageFile(product.installation_instructions_url, "product-documents");
    }
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Product and files deleted" });
      fetchProducts();
    }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
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
      return next;
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  if (!user) return null;

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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Products ({products.length})</h2>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add Product</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Style</TableHead>
                  <TableHead className="text-right">Retail</TableHead>
                  <TableHead className="text-right">Discounted</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.product_name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.product_code}</TableCell>
                    <TableCell>{p.style}</TableCell>
                    <TableCell className="text-right">CA${Number(p.price_retail_usd).toLocaleString()}</TableCell>
                    <TableCell className="text-right">CA${Number(p.price_discounted_usd).toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={p.availability_status === "In Stock" ? "default" : "destructive"}>
                        {p.stock_level} — {p.availability_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{p.is_featured ? "⭐" : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No products yet. Click "Add Product" to get started.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Product Form Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Product Name *</Label><Input value={form.product_name} onChange={(e) => updateField("product_name", e.target.value)} /></div>
                <div><Label>Product Code *</Label><Input value={form.product_code} onChange={(e) => updateField("product_code", e.target.value)} /></div>
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
                <div className="flex items-end gap-2 pb-2">
                  <Switch checked={form.is_featured} onCheckedChange={(v) => updateField("is_featured", v)} />
                  <Label>Featured</Label>
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
