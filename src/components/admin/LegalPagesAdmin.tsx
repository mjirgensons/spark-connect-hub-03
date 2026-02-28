import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, ExternalLink } from "lucide-react";

interface LegalPage {
  id: string;
  slug: string;
  title: string;
  section: string;
  content: string;
  updated_at: string;
}

const LegalPagesAdmin = () => {
  const { toast } = useToast();
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [editingPage, setEditingPage] = useState<LegalPage | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchPages = async () => {
    const { data } = await supabase
      .from("footer_pages")
      .select("*")
      .eq("section", "legal")
      .order("title");
    if (data) setPages(data as LegalPage[]);
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const openEdit = (page: LegalPage) => {
    setEditingPage(page);
    setEditContent(page.content);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingPage) return;
    setSaving(true);
    const { error } = await supabase
      .from("footer_pages")
      .update({ content: editContent } as any)
      .eq("id", editingPage.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Page saved", description: `"${editingPage.title}" updated successfully.` });
      setDialogOpen(false);
      fetchPages();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {pages.length === 0 && (
        <Card className="border-2">
          <CardContent className="p-8 text-center text-muted-foreground">
            No legal pages found.
          </CardContent>
        </Card>
      )}

      {pages.map((page) => (
        <Card key={page.id} className="border-2">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <h4 className="font-bold text-sm">{page.title}</h4>
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`/page/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-muted-foreground hover:text-foreground underline"
                >
                  /page/{page.slug}
                </a>
                <Badge variant="secondary" className="text-[9px] px-1 py-0">
                  {formatDate(page.updated_at)}
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => openEdit(page)}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </CardContent>
        </Card>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {editingPage && (
            <>
              <DialogHeader>
                <DialogTitle>{editingPage.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    <p className="text-sm font-medium">{editingPage.title}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Slug</Label>
                    <p className="text-sm font-mono">{editingPage.slug}</p>
                  </div>
                </div>
                <div>
                  <Label>Content (Markdown)</Label>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={20}
                    className="font-mono text-xs mt-1"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/page/${editingPage.slug}`, "_blank")}
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> Preview
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LegalPagesAdmin;
