import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, CheckCircle, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";

const KB_TYPES = [
  { value: "product_faq", label: "Product FAQ" },
  { value: "policy", label: "Policy" },
  { value: "installation_guide", label: "Installation Guide" },
  { value: "lead_times", label: "Lead Times" },
  { value: "custom", label: "Custom" },
] as const;

const kbTypeLabel = (t: string) => KB_TYPES.find((k) => k.value === t)?.label ?? t;

interface KBArticle {
  id: string;
  seller_id: string;
  title: string;
  content: string;
  kb_type: string;
  pinecone_synced: boolean;
  created_at: string;
  updated_at: string;
}

export default function SellerKnowledgeBase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editArticle, setEditArticle] = useState<KBArticle | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [kbType, setKbType] = useState("product_faq");
  const [content, setContent] = useState("");

  const { data: articles, isLoading } = useQuery({
    queryKey: ["seller-kb", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_knowledge_base")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as KBArticle[];
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editArticle) {
        const contentChanged = content !== editArticle.content;
        const { error } = await supabase
          .from("seller_knowledge_base")
          .update({
            title,
            kb_type: kbType,
            content,
            ...(contentChanged ? { pinecone_synced: false } : {}),
          })
          .eq("id", editArticle.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("seller_knowledge_base").insert({
          seller_id: user!.id,
          title,
          kb_type: kbType,
          content,
          pinecone_synced: false,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-kb"] });
      toast({ title: editArticle ? "Article updated" : "Article created" });
      closeDialog();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("seller_knowledge_base").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-kb"] });
      toast({ title: "Article deleted" });
      setDeleteId(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openNew = () => {
    setEditArticle(null);
    setTitle("");
    setKbType("product_faq");
    setContent("");
    setDialogOpen(true);
  };

  const openEdit = (a: KBArticle) => {
    setEditArticle(a);
    setTitle(a.title);
    setKbType(a.kb_type);
    setContent(a.content);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditArticle(null);
  };

  const canSave = title.trim().length > 0 && content.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Knowledge Base</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Teach your AI assistant about your products and policies
          </p>
        </div>
        <Button onClick={openNew} className="font-heading">
          <Plus className="w-4 h-4 mr-2" /> Add Article
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !articles || articles.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No articles yet. Add your first article to start training your AI assistant.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sync Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{kbTypeLabel(a.kb_type)}</Badge>
                    </TableCell>
                    <TableCell>
                      {a.pinecone_synced ? (
                        <span className="flex items-center gap-1 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" /> Synced
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-yellow-600">
                          <Clock className="w-4 h-4" /> Pending
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(a.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(a.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editArticle ? "Edit Article" : "Add Article"}</DialogTitle>
            <DialogDescription>
              {editArticle ? "Update this knowledge base article." : "Create a new knowledge base article."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="kb-title">Title</Label>
              <Input id="kb-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Shipping Policy" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-type">Type</Label>
              <Select value={kbType} onValueChange={setKbType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KB_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-content">Content</Label>
              <Textarea
                id="kb-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write the content for your AI assistant..."
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button disabled={!canSave || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>Are you sure? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
