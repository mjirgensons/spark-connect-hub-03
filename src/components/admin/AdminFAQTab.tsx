import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus } from "lucide-react";

interface FAQItem {
  id: string;
  group_id: string;
  group_title: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

const GROUP_COLORS: Record<string, string> = {
  "how-it-works": "default",
  "ordering": "secondary",
  "delivery": "outline",
  "contractors": "destructive",
  "sellers": "default",
};

const emptyForm = {
  group_id: "how-it-works",
  group_title: "",
  question: "",
  answer: "",
  sort_order: 0,
  is_active: true,
  new_group_id: "",
};

const AdminFAQTab = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [useNewGroup, setUseNewGroup] = useState(false);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("faq_items")
      .select("*")
      .order("group_id")
      .order("sort_order", { ascending: true });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const existingGroups = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((i) => map.set(i.group_id, i.group_title));
    return map;
  }, [items]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setUseNewGroup(false);
    setDialogOpen(true);
  };

  const openEdit = (item: FAQItem) => {
    setEditingId(item.id);
    setForm({
      group_id: item.group_id,
      group_title: item.group_title,
      question: item.question,
      answer: item.answer,
      sort_order: item.sort_order,
      is_active: item.is_active,
      new_group_id: "",
    });
    setUseNewGroup(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const groupId = useNewGroup ? form.new_group_id.trim() : form.group_id;
    const groupTitle = useNewGroup ? form.group_title.trim() : (existingGroups.get(form.group_id) || form.group_title.trim());

    if (!groupId || !groupTitle || !form.question.trim() || !form.answer.trim()) {
      toast({ title: "Missing fields", description: "All fields are required.", variant: "destructive" });
      return;
    }

    const payload = {
      group_id: groupId,
      group_title: groupTitle,
      question: form.question.trim(),
      answer: form.answer.trim(),
      sort_order: form.sort_order,
      is_active: form.is_active,
    };

    if (editingId) {
      const { error } = await supabase.from("faq_items").update(payload).eq("id", editingId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Updated" });
    } else {
      const { error } = await supabase.from("faq_items").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Created" });
    }
    setDialogOpen(false);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("faq_items").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchItems(); }
  };

  const handleToggle = async (id: string, current: boolean) => {
    const { error } = await supabase.from("faq_items").update({ is_active: !current }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchItems();
  };

  const handleGroupSelect = (value: string) => {
    if (value === "__new__") {
      setUseNewGroup(true);
      setForm({ ...form, group_id: "", group_title: "", new_group_id: "" });
    } else {
      setUseNewGroup(false);
      setForm({ ...form, group_id: value, group_title: existingGroups.get(value) || "" });
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>FAQ Management</CardTitle>
              <CardDescription>Manage frequently asked questions displayed on the FAQ page. Questions are grouped by category.</CardDescription>
            </div>
            <Button onClick={openAdd} className="border-2"><Plus className="w-4 h-4 mr-1" /> Add Question</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant={GROUP_COLORS[item.group_id] as any || "secondary"}>
                      {item.group_title}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate font-medium">{item.question}</TableCell>
                  <TableCell>{item.sort_order}</TableCell>
                  <TableCell>
                    <Switch checked={item.is_active} onCheckedChange={() => handleToggle(item.id, item.is_active)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No FAQ items yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} FAQ Question</DialogTitle>
            <DialogDescription>Fill in the details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Group</Label>
              <Select
                value={useNewGroup ? "__new__" : form.group_id}
                onValueChange={handleGroupSelect}
              >
                <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                <SelectContent>
                  {Array.from(existingGroups.entries()).map(([id, title]) => (
                    <SelectItem key={id} value={id}>{title} ({id})</SelectItem>
                  ))}
                  <SelectItem value="__new__">+ New Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {useNewGroup && (
              <>
                <div>
                  <Label>New Group ID</Label>
                  <Input
                    value={form.new_group_id}
                    onChange={(e) => setForm({ ...form, new_group_id: e.target.value })}
                    placeholder="e.g. shipping"
                  />
                </div>
                <div>
                  <Label>Group Title</Label>
                  <Input
                    value={form.group_title}
                    onChange={(e) => setForm({ ...form, group_title: e.target.value })}
                    placeholder="e.g. Shipping & Logistics"
                  />
                </div>
              </>
            )}
            <div>
              <Label>Question</Label>
              <Input
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="Enter the question"
              />
            </div>
            <div>
              <Label>Answer</Label>
              <Textarea
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                placeholder="Enter the answer"
                rows={4}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                />
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

export default AdminFAQTab;
