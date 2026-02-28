import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Download, Trash2 } from "lucide-react";

const AdminNewsletterTab = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const perPage = 25;

  const { data: subscribers = [], refetch } = useQuery({
    queryKey: ["admin-newsletter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers" as any)
        .select("*")
        .order("subscribed_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = subscribers.filter((s: any) =>
    !search || s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalActive = subscribers.filter((s: any) => s.is_active).length;
  const thisMonth = subscribers.filter((s: any) => {
    const d = new Date(s.subscribed_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleToggle = async (sub: any) => {
    const newActive = !sub.is_active;
    const { error } = await supabase
      .from("newsletter_subscribers" as any)
      .update({
        is_active: newActive,
        unsubscribed_at: newActive ? null : new Date().toISOString(),
      } as any)
      .eq("id", sub.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: newActive ? "Reactivated" : "Unsubscribed" });
    refetch();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("newsletter_subscribers" as any).delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Subscriber deleted" });
    refetch();
  };

  const handleExport = () => {
    const header = "email,name,source,subscribed_at,is_active\n";
    const rows = subscribers.map((s: any) =>
      `"${s.email}","${s.name || ""}","${s.source}","${s.subscribed_at}","${s.is_active}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg font-bold">Newsletter Subscribers</h3>
        <p className="text-sm text-muted-foreground">View and manage email subscribers.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border-2 border-foreground p-4" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
          <p className="text-2xl font-bold">{subscribers.length}</p>
          <p className="text-sm text-muted-foreground">Total Subscribers</p>
        </div>
        <div className="border-2 border-foreground p-4" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
          <p className="text-2xl font-bold">{totalActive}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
        <div className="border-2 border-foreground p-4" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
          <p className="text-2xl font-bold">{thisMonth}</p>
          <p className="text-sm text-muted-foreground">This Month</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Input placeholder="Search by email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="max-w-xs border-2" />
        <Button variant="outline" size="sm" onClick={handleExport} className="border-2">
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </div>

      <div className="border-2 border-foreground overflow-x-auto" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscribed</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No subscribers yet</TableCell></TableRow>
            ) : paged.map((sub: any) => (
              <TableRow key={sub.id}>
                <TableCell className="font-mono text-sm">{sub.email}</TableCell>
                <TableCell>{sub.name || "—"}</TableCell>
                <TableCell><Badge variant="outline">{sub.source}</Badge></TableCell>
                <TableCell>
                  <Badge variant={sub.is_active ? "default" : "secondary"}>
                    {sub.is_active ? "Active" : "Unsubscribed"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{new Date(sub.subscribed_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleToggle(sub)}>
                      {sub.is_active ? "Unsubscribe" : "Reactivate"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete subscriber?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently remove {sub.email}.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(sub.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
};

export default AdminNewsletterTab;
