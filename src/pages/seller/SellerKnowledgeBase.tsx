import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
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

const STOREFRONT_KB_TYPES = [
  { value: "product_faq", label: "Product FAQ" },
  { value: "policy", label: "Policy" },
  { value: "installation_guide", label: "Installation Guide" },
  { value: "lead_times", label: "Lead Times" },
  { value: "custom", label: "Custom" },
] as const;

const PERSONAL_KB_TYPES = [
  { value: "internal_note", label: "Internal Note" },
  { value: "process_guide", label: "Process Guide" },
  { value: "reference", label: "Reference" },
  { value: "custom", label: "Custom" },
] as const;

const ALL_KB_TYPES = [...STOREFRONT_KB_TYPES, ...PERSONAL_KB_TYPES];
const kbTypeLabel = (t: string) => ALL_KB_TYPES.find((k) => k.value === t)?.label ?? t;

interface KBArticle {
  id: string;
  seller_id: string;
  title: string;
  content: string;
  kb_type: string;
  kb_scope: string;
  pinecone_synced: boolean;
  created_at: string;
  updated_at: string;
}

type Scope = "storefront" | "personal";

export default function SellerKnowledgeBase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeScope: Scope = searchParams.get("scope") === "personal" ? "personal" : "storefront";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editArticle, setEditArticle] = useState<KBArticle | null>(null);

  const [title, setTitle] = useState("");
  const [kbType, setKbType] = useState("");
  const [content, setContent] = useState("");

  const currentKbTypes = activeScope === "storefront" ? STOREFRONT_KB_TYPES : PERSONAL_KB_TYPES;
  const defaultKbType = currentKbTypes[0].value;

  const { data: articles, isLoading } = useQuery({
    queryKey: ["seller-kb", user?.id, activeScope],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("seller_knowledge_base")
        .select("*")
        .eq("kb_scope", activeScope)
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
        const { error } = await (supabase as any)
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
        const { error } = await (supabase as any).from("seller_knowledge_base").insert({
          seller_id: user!.id,
          title,
          kb_type: kbType,
          content,
          kb_scope: activeScope,
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
    setKbType(defaultKbType);
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

  const setScope = (scope: Scope) => {
    setSearchParams({ scope });
  };

  const canSave = title.trim().length > 0 && content.trim().length > 0;

  const descriptionText = activeScope === "storefront"
    ? "Articles here are used by your AI Storefront Assistant to answer buyer questions on your product pages. Add FAQs, shipping policies, return information, installation guides, and anything buyers might ask about."
    : "Articles here are used by your Personal Assistant in the dashboard. Add internal notes, portal guides, process documentation, or any reference material you want to quickly access through your assistant.";

  const emptyText = activeScope === "storefront"
    ? "No storefront articles yet. Add your first article to start training your AI Storefront Assistant."
    : "No personal articles yet. Add your first article to start training your Personal Assistant.";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Knowledge Base</h1>
        </div>
        <Button onClick={openNew} className="font-heading">
          <Plus className="w-4 h-4 mr-2" /> Add Article
        </Button>
      </div>

      {/* Scope Tabs */}
      <div className="flex border-b-2 border-foreground">
        <button
          onClick={() => setScope("storefront")}
          className={`px-4 py-2 text-sm font-sans font-bold border-b-2 -mb-[2px] transition-colors ${
            activeScope === "storefront"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Storefront KB
        </button>
        <button
          onClick={() => setScope("personal")}
          className={`px-4 py-2 text-sm font-sans font-bold border-b-2 -mb-[2px] transition-colors ${
            activeScope === "personal"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Personal Assistant KB
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground">{descriptionText}</p>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !articles || articles.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {emptyText}
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
                  {currentKbTypes.map((t) => (
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
