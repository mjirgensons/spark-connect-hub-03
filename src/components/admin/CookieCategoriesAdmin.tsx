import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface CookieCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_required: boolean;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const CookieCategoriesAdmin = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CookieCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("cookie_categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      toast({ title: "Error loading categories", description: error.message, variant: "destructive" });
    } else {
      setCategories((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const updateLocal = (id: string, field: keyof CookieCategory, value: any) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, [field]: value };
        if (field === "name" && !categories.find((x) => x.id === id)?.slug) {
          updated.slug = slugify(value);
        }
        return updated;
      })
    );
  };

  const handleSave = async (cat: CookieCategory) => {
    setSavingId(cat.id);
    const { error } = await supabase
      .from("cookie_categories")
      .update({
        name: cat.name,
        description: cat.description,
        is_required: cat.is_required,
        is_default: cat.is_default,
        sort_order: cat.sort_order,
        is_active: cat.is_active,
      } as any)
      .eq("id", cat.id);
    setSavingId(null);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Category saved" });
    }
  };

  const handleAdd = async () => {
    const newSlug = slugify("new-category-" + Date.now().toString().slice(-4));
    const { error } = await supabase.from("cookie_categories").insert({
      name: "",
      slug: newSlug,
      description: "",
      is_required: false,
      is_default: false,
      sort_order: categories.length + 1,
      is_active: true,
    } as any);
    if (error) {
      toast({ title: "Error adding category", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Category added" });
      fetchCategories();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("cookie_categories").delete().eq("id", id);
    setDeleteConfirmId(null);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Category deleted" });
      fetchCategories();
    }
  };

  if (loading) return <p className="text-muted-foreground text-sm py-4">Loading categories…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Cookie Categories</h3>
        <Button onClick={handleAdd} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add Category
        </Button>
      </div>

      {categories.map((cat) => (
        <Card key={cat.id} className="border-2 border-border">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Name</Label>
                <Input
                  value={cat.name}
                  onChange={(e) => updateLocal(cat.id, "name", e.target.value)}
                  placeholder="Category name"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Slug</Label>
                <Input
                  value={cat.slug}
                  readOnly
                  className="font-mono text-muted-foreground bg-muted/30"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea
                rows={3}
                value={cat.description}
                onChange={(e) => updateLocal(cat.id, "description", e.target.value)}
                placeholder="Describe this cookie category"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={cat.is_required}
                  onCheckedChange={(v) => updateLocal(cat.id, "is_required", v)}
                />
                <Label className="text-xs">Required</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={cat.is_default}
                  onCheckedChange={(v) => updateLocal(cat.id, "is_default", v)}
                />
                <Label className="text-xs">Default On</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={cat.is_active}
                  onCheckedChange={(v) => updateLocal(cat.id, "is_active", v)}
                />
                <Label className="text-xs">Active</Label>
              </div>
              <div>
                <Label className="text-xs font-semibold">Sort Order</Label>
                <Input
                  type="number"
                  value={cat.sort_order}
                  onChange={(e) => updateLocal(cat.id, "sort_order", Number(e.target.value))}
                  className="w-20"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              {!cat.is_required && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirmId(cat.id)}
                  className="text-destructive border-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => handleSave(cat)}
                disabled={savingId === cat.id}
              >
                {savingId === cat.id ? "Saving…" : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Cookie Category?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this category and all its cookie definitions. This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CookieCategoriesAdmin;
