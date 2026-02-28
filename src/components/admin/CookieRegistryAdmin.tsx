import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface CookieCategory {
  id: string;
  name: string;
  slug: string;
}

interface CookieDefinition {
  id: string;
  category_id: string;
  name: string;
  provider: string;
  purpose: string;
  duration: string;
  type: string;
  is_active: boolean;
  cookie_categories?: { name: string; slug: string } | null;
}

interface FormState {
  name: string;
  category_id: string;
  provider: string;
  purpose: string;
  duration: string;
  type: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  name: "",
  category_id: "",
  provider: "",
  purpose: "",
  duration: "Session",
  type: "First-party",
  is_active: true,
};

const CookieRegistryAdmin = () => {
  const { toast } = useToast();
  const [definitions, setDefinitions] = useState<CookieDefinition[]>([]);
  const [categories, setCategories] = useState<CookieCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchAll = async () => {
    const [defRes, catRes] = await Promise.all([
      supabase
        .from("cookie_definitions")
        .select("*, cookie_categories(name, slug)")
        .order("name", { ascending: true }),
      supabase
        .from("cookie_categories")
        .select("id, name, slug")
        .order("sort_order", { ascending: true }),
    ]);
    if (defRes.data) setDefinitions(defRes.data as any);
    if (catRes.data) setCategories(catRes.data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered =
    filterCategory === "all"
      ? definitions
      : definitions.filter((d) => d.category_id === filterCategory);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (def: CookieDefinition) => {
    setEditingId(def.id);
    setForm({
      name: def.name,
      category_id: def.category_id,
      provider: def.provider,
      purpose: def.purpose,
      duration: def.duration,
      type: def.type,
      is_active: def.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category_id || !form.provider || !form.purpose) {
      toast({ title: "Missing fields", description: "Fill in all required fields.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      category_id: form.category_id,
      provider: form.provider,
      purpose: form.purpose,
      duration: form.duration,
      type: form.type,
      is_active: form.is_active,
    };

    if (editingId) {
      const { error } = await supabase.from("cookie_definitions").update(payload as any).eq("id", editingId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Cookie updated" });
    } else {
      const { error } = await supabase.from("cookie_definitions").insert(payload as any);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Cookie added" });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("cookie_definitions").delete().eq("id", id);
    setDeleteConfirmId(null);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Cookie deleted" });
      fetchAll();
    }
  };

  const handleToggleActive = async (def: CookieDefinition) => {
    const { error } = await supabase
      .from("cookie_definitions")
      .update({ is_active: !def.is_active } as any)
      .eq("id", def.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchAll();
  };

  if (loading) return <p className="text-muted-foreground text-sm py-4">Loading cookie registry…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Cookie Registry</h3>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add Cookie
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs font-semibold shrink-0">Filter by category:</Label>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border-2 border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Cookie Name</TableHead>
              <TableHead className="text-xs">Provider</TableHead>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Purpose</TableHead>
              <TableHead className="text-xs">Duration</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Active</TableHead>
              <TableHead className="text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground text-sm py-8">
                  No cookies found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((def) => (
                <TableRow key={def.id}>
                  <TableCell className="text-xs font-mono">{def.name}</TableCell>
                  <TableCell className="text-xs">{def.provider}</TableCell>
                  <TableCell className="text-xs">{def.cookie_categories?.name || "—"}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate" title={def.purpose}>
                    {def.purpose.length > 60 ? def.purpose.slice(0, 60) + "…" : def.purpose}
                  </TableCell>
                  <TableCell className="text-xs">{def.duration}</TableCell>
                  <TableCell className="text-xs">{def.type}</TableCell>
                  <TableCell>
                    <Switch checked={def.is_active} onCheckedChange={() => handleToggleActive(def)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(def)} className="h-7 px-2">
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(def.id)} className="h-7 px-2 text-destructive border-destructive hover:bg-destructive/10">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Cookie" : "Add Cookie"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. fm_session_id" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Category *</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm((p) => ({ ...p, category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Provider *</Label>
              <Input value={form.provider} onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))} placeholder="e.g. FitMatch" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Purpose *</Label>
              <Textarea rows={3} value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))} placeholder="Describe what this cookie does" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Duration</Label>
                <Input value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} placeholder="e.g. Session, 1 year" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First-party">First-party</SelectItem>
                    <SelectItem value="Third-party">Third-party</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))} />
              <Label className="text-xs">Active</Label>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update Cookie" : "Add Cookie"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Cookie Definition?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CookieRegistryAdmin;
