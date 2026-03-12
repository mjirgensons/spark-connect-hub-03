import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  Package, Wrench, Target, TrendingDown, Shield, Lock, Award,
  Users, Star, DollarSign, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Package, Wrench, Target, TrendingDown, Shield, Lock, Award,
  Users, Star, DollarSign, Zap,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

interface TrustSignal {
  id: string;
  type: string;
  icon_name: string;
  title: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm = { icon_name: "Package", title: "", label: "", sort_order: 0, is_active: true };

const AdminTrustSignalsTab = () => {
  const { toast } = useToast();
  const [signals, setSignals] = useState<TrustSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<"stat" | "guarantee">("stat");
  const [form, setForm] = useState(emptyForm);

  const fetchSignals = async () => {
    const { data, error } = await supabase
      .from("trust_signals")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setSignals(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchSignals(); }, []);

  const openAdd = (type: "stat" | "guarantee") => {
    setEditingId(null);
    setEditType(type);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s: TrustSignal) => {
    setEditingId(s.id);
    setEditType(s.type as "stat" | "guarantee");
    setForm({ icon_name: s.icon_name, title: s.title, label: s.label, sort_order: s.sort_order, is_active: s.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!ICON_OPTIONS.includes(form.icon_name)) {
      toast({ title: "Invalid icon", description: "Please select a supported icon.", variant: "destructive" });
      return;
    }
    if (!form.title.trim() || !form.label.trim()) {
      toast({ title: "Missing fields", description: "Title and label are required.", variant: "destructive" });
      return;
    }

    if (editingId) {
      const { error } = await supabase.from("trust_signals").update({
        icon_name: form.icon_name, title: form.title, label: form.label,
        sort_order: form.sort_order, is_active: form.is_active,
      }).eq("id", editingId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Updated" });
    } else {
      const { error } = await supabase.from("trust_signals").insert({
        type: editType, icon_name: form.icon_name, title: form.title,
        label: form.label, sort_order: form.sort_order, is_active: form.is_active,
      });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Created" });
    }
    setDialogOpen(false);
    fetchSignals();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("trust_signals").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchSignals(); }
  };

  const handleToggle = async (id: string, current: boolean) => {
    const { error } = await supabase.from("trust_signals").update({ is_active: !current }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchSignals();
  };

  const stats = signals.filter((s) => s.type === "stat");
  const guarantees = signals.filter((s) => s.type === "guarantee");

  const renderTable = (items: TrustSignal[], type: "stat" | "guarantee") => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Icon</TableHead>
          <TableHead>{type === "stat" ? "Number" : "Title"}</TableHead>
          <TableHead>{type === "stat" ? "Label" : "Description"}</TableHead>
          <TableHead>Order</TableHead>
          <TableHead>Active</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((s) => {
          const Icon = ICON_MAP[s.icon_name] || Package;
          return (
            <TableRow key={s.id}>
              <TableCell><Icon className="w-5 h-5 text-primary" /></TableCell>
              <TableCell className="font-medium">{s.title}</TableCell>
              <TableCell className="max-w-[200px] truncate">{s.label}</TableCell>
              <TableCell>{s.sort_order}</TableCell>
              <TableCell>
                <Switch checked={s.is_active} onCheckedChange={() => handleToggle(s.id, s.is_active)} />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this {type}?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(s.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
        {items.length === 0 && (
          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No {type}s yet.</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-8">
      {/* Stats */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Trust Stats</CardTitle>
              <CardDescription>Numbers displayed on the homepage trust section.</CardDescription>
            </div>
            <Button onClick={() => openAdd("stat")} className="border-2"><Plus className="w-4 h-4 mr-1" /> Add Stat</Button>
          </div>
        </CardHeader>
        <CardContent>{renderTable(stats, "stat")}</CardContent>
      </Card>

      {/* Guarantees */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Guarantee Badges</CardTitle>
              <CardDescription>Trust badges displayed below the stats on the homepage.</CardDescription>
            </div>
            <Button onClick={() => openAdd("guarantee")} className="border-2"><Plus className="w-4 h-4 mr-1" /> Add Badge</Button>
          </div>
        </CardHeader>
        <CardContent>{renderTable(guarantees, "guarantee")}</CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} {editType === "stat" ? "Stat" : "Badge"}</DialogTitle>
            <DialogDescription>Fill in the details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Icon</Label>
              <Select value={form.icon_name} onValueChange={(v) => setForm({ ...form, icon_name: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((name) => {
                    const I = ICON_MAP[name];
                    return (
                      <SelectItem key={name} value={name}>
                        <span className="flex items-center gap-2"><I className="w-4 h-4" /> {name}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{editType === "stat" ? "Number" : "Title"}</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={editType === "stat" ? "e.g. 500+" : "e.g. 30-Day Returns"} />
            </div>
            <div>
              <Label>{editType === "stat" ? "Label" : "Description"}</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder={editType === "stat" ? "e.g. Cabinets Matched" : "e.g. Full refund within 30 days."} />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTrustSignalsTab;
