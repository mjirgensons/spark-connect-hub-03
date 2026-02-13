import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, ExternalLink } from "lucide-react";

interface FooterPage {
  id: string;
  slug: string;
  title: string;
  section: string;
  content: string;
}

const sectionColors: Record<string, string> = {
  company: "default",
  services: "secondary",
  resources: "outline",
};

const FooterPagesAdmin = () => {
  const { toast } = useToast();
  const [pages, setPages] = useState<FooterPage[]>([]);
  const [editingPage, setEditingPage] = useState<FooterPage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    const { data } = await supabase
      .from("footer_pages")
      .select("*")
      .order("section")
      .order("title");
    if (data) setPages(data as unknown as FooterPage[]);
  };

  const openEdit = (page: FooterPage) => {
    setEditingPage(page);
    setTitle(page.title);
    setContent(page.content);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingPage) return;
    setSaving(true);
    const { error } = await supabase
      .from("footer_pages")
      .update({ title, content } as any)
      .eq("id", editingPage.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Page updated" });
      setDialogOpen(false);
      fetchPages();
    }
    setSaving(false);
  };

  const grouped = {
    company: pages.filter(p => p.section === "company"),
    services: pages.filter(p => p.section === "services"),
    resources: pages.filter(p => p.section === "resources"),
  };

  return (
    <div className="space-y-6">
      {(["company", "services", "resources"] as const).map(section => (
        <Card key={section}>
          <CardHeader>
            <CardTitle className="capitalize text-lg">{section}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {grouped[section].map(page => (
                <div key={page.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">{page.title}</span>
                    <Badge variant={sectionColors[page.section] as any} className="text-[10px]">
                      /{page.slug}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/page/${page.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(page)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit: {editingPage?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Page Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Content</Label>
              <p className="text-xs text-muted-foreground mb-1">
                Use **bold** for headings, • for bullet points, and blank lines for paragraphs.
              </p>
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FooterPagesAdmin;
