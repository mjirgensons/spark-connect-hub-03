import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const CATEGORIES = ["Renovation Tips", "Buying Guide", "Industry News", "Contractor Resources", "Company News"];
const STATUSES = ["draft", "published", "archived"];

const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 border-yellow-300",
  published: "bg-green-100 text-green-800 border-green-300",
  archived: "bg-gray-100 text-gray-600 border-gray-300",
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  author_name: string;
  category: string | null;
  tags: string[] | null;
  status: string;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  author_name: "FitMatch Team",
  category: "",
  tags: "",
  status: "draft",
  meta_title: "",
  meta_description: "",
};

const AdminBlogTab = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [slugManual, setSlugManual] = useState(false);
  const [preview, setPreview] = useState(false);
  const [deletePost, setDeletePost] = useState<BlogPost | null>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setSlugManual(false);
    setPreview(false);
    setFormOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditing(post);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      cover_image_url: post.cover_image_url || "",
      author_name: post.author_name,
      category: post.category || "",
      tags: (post.tags || []).join(", "),
      status: post.status,
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
    });
    setSlugManual(true);
    setPreview(false);
    setFormOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      ...(slugManual ? {} : { slug: slugify(title) }),
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const tagsArray = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt || null,
        content: form.content,
        cover_image_url: form.cover_image_url || null,
        author_name: form.author_name,
        category: form.category || null,
        tags: tagsArray,
        status: form.status,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
      };

      // Auto-set published_at
      const finalPayload = form.status === "published" && (!editing || editing.status !== "published")
        ? { ...payload, published_at: new Date().toISOString() }
        : payload;

      if (editing) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Post updated" : "Post created");
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      setFormOpen(false);
    },
    onError: (err: any) => {
      if (err.message?.includes("duplicate key") || err.message?.includes("unique")) {
        toast.error("A post with this slug already exists. Please use a unique slug.");
      } else {
        toast.error("Failed to save post");
      }
    },
  });

  const togglePublish = useMutation({
    mutationFn: async (post: BlogPost) => {
      const newStatus = post.status === "published" ? "draft" : "published";
      const update: Record<string, any> = { status: newStatus };
      if (newStatus === "published" && !post.published_at) {
        update.published_at = new Date().toISOString();
      }
      const { error } = await supabase.from("blog_posts").update(update).eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      setDeletePost(null);
    },
    onError: () => toast.error("Failed to delete"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      toast.error("Title, slug, and content are required.");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-serif">Blog Management</CardTitle>
            <CardDescription>Create, edit, and manage blog posts.</CardDescription>
          </div>
          <Button onClick={openNew} className="shadow-[2px_2px_0px_0px_hsl(var(--foreground))]">
            <Plus className="w-4 h-4 mr-1" /> New Post
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No blog posts yet. Create your first one!</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium max-w-[250px] truncate">{post.title}</TableCell>
                    <TableCell>
                      {post.category ? <Badge variant="outline" className="text-xs border-foreground">{post.category}</Badge> : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs border ${statusColors[post.status] || ""}`}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {post.published_at ? format(new Date(post.published_at), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs border-2" onClick={() => openEdit(post)}>
                          <Pencil className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-2"
                          onClick={() => togglePublish.mutate(post)}
                        >
                          {post.status === "published" ? <><EyeOff className="w-3 h-3 mr-1" /> Unpublish</> : <><Eye className="w-3 h-3 mr-1" /> Publish</>}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => setDeletePost(post)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit/Create Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Edit Post" : "New Blog Post"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Post title"
                  className="border-2"
                  required
                />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => { setSlugManual(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
                  placeholder="url-friendly-slug"
                  className="border-2 font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Excerpt <span className="text-muted-foreground text-xs">({form.excerpt.length}/160)</span></Label>
              <Textarea
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value.slice(0, 160) }))}
                placeholder="Short description for listing page and SEO"
                rows={2}
                className="border-2"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Content * <span className="text-muted-foreground text-xs">(HTML)</span></Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setPreview(!preview)}>
                  {preview ? "Edit" : "Preview"}
                </Button>
              </div>
              {!preview ? (
                <>
                  <p className="text-xs text-muted-foreground mb-1">
                    Use HTML tags: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;&lt;li&gt;, &lt;a href=""&gt;
                  </p>
                  <Textarea
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    placeholder="<h2>Your heading</h2><p>Your content...</p>"
                    rows={12}
                    className="border-2 font-mono text-sm"
                    required
                  />
                </>
              ) : (
                <div
                  className="border-2 border-border p-4 min-h-[200px] blog-content space-y-4"
                  dangerouslySetInnerHTML={{ __html: form.content }}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Cover Image URL</Label>
                <Input
                  value={form.cover_image_url}
                  onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))}
                  placeholder="https://..."
                  className="border-2"
                />
              </div>
              <div>
                <Label>Author</Label>
                <Input
                  value={form.author_name}
                  onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
                  className="border-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger className="border-2"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tags <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="kitchen, budget, european"
                  className="border-2"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger className="border-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>SEO Title</Label>
                <Input
                  value={form.meta_title}
                  onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
                  placeholder="Custom SEO title (falls back to post title)"
                  className="border-2"
                />
              </div>
              <div>
                <Label>SEO Description</Label>
                <Input
                  value={form.meta_description}
                  onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
                  placeholder="Custom SEO description (falls back to excerpt)"
                  className="border-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" className="border-2" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending} className="shadow-[2px_2px_0px_0px_hsl(var(--foreground))]">
                {saveMutation.isPending ? "Saving..." : editing ? "Update Post" : "Create Post"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePost} onOpenChange={() => setDeletePost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete "{deletePost?.title}". This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletePost && deleteMutation.mutate(deletePost.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default AdminBlogTab;
