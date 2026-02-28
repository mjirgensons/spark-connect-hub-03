import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { dispatchWebhook } from "@/lib/webhookDispatcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileText, Eye, Loader2, Send } from "lucide-react";
import { format } from "date-fns";

interface QuoteRequest {
  id: string;
  quote_number: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  company_name: string | null;
  project_type: string | null;
  project_timeline: string | null;
  delivery_address: string | null;
  notes: string | null;
  status: string;
  admin_notes: string | null;
  quoted_total: number | null;
  quoted_at: string | null;
  created_at: string;
}

interface QuoteItem {
  id: string;
  product_name: string;
  quantity: number;
  notes: string | null;
  product_id: string | null;
}

interface WebhookLog {
  id: string;
  event_type: string;
  status: string;
  created_at: string;
  response_status: number | null;
  error_message: string | null;
}

const statusOptions = ["new", "reviewing", "quoted", "accepted", "declined", "expired"];
const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  reviewing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  quoted: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  expired: "bg-muted text-muted-foreground",
};

const AdminQuotesTab = () => {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editQuotedTotal, setEditQuotedTotal] = useState("");
  const [editAdminNotes, setEditAdminNotes] = useState("");
  const [emailPromptOpen, setEmailPromptOpen] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("quote_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setQuotes((data || []) as QuoteRequest[]);
    setLoading(false);
  };

  const openQuote = async (quote: QuoteRequest) => {
    setSelectedQuote(quote);
    setEditStatus(quote.status);
    setEditQuotedTotal(quote.quoted_total?.toString() || "");
    setEditAdminNotes(quote.admin_notes || "");
    setSheetOpen(true);

    // Fetch items
    const { data: items } = await supabase
      .from("quote_request_items")
      .select("*")
      .eq("quote_request_id", quote.id);
    setQuoteItems((items || []) as QuoteItem[]);

    // Fetch webhook logs for this quote
    const { data: logs } = await supabase
      .from("webhook_logs")
      .select("id, event_type, status, created_at, response_status, error_message")
      .or(`event_type.eq.quote.created,event_type.eq.quote.status_changed`)
      .order("created_at", { ascending: false })
      .limit(20);
    // Filter client-side for this quote (payload contains quote_request_id)
    setWebhookLogs((logs || []) as WebhookLog[]);
  };

  const handleSave = async () => {
    if (!selectedQuote) return;
    setSaving(true);

    const updates: any = {
      status: editStatus,
      admin_notes: editAdminNotes.trim() || null,
      quoted_total: editQuotedTotal ? parseFloat(editQuotedTotal) : null,
    };

    if (editStatus === "quoted" && !selectedQuote.quoted_at) {
      updates.quoted_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("quote_requests")
      .update(updates)
      .eq("id", selectedQuote.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Fire webhook on status change
    if (editStatus !== selectedQuote.status) {
      dispatchWebhook(
        {
          eventType: "quote.status_changed",
          data: {
            quote_request_id: selectedQuote.id,
            quote_number: selectedQuote.quote_number,
            new_status: editStatus,
            quoted_total: editQuotedTotal ? parseFloat(editQuotedTotal) : null,
            contact_name: selectedQuote.contact_name,
            contact_email: selectedQuote.contact_email,
          },
        },
        "/webhook/quote-status-changed"
      );

      // Prompt email when status is 'quoted'
      if (editStatus === "quoted") {
        setEmailPromptOpen(true);
      }
    }

    toast({ title: "Quote updated" });
    setSaving(false);
    fetchQuotes();
    setSelectedQuote({ ...selectedQuote, ...updates });
  };

  const sendQuoteEmail = () => {
    if (!selectedQuote) return;
    dispatchWebhook(
      {
        eventType: "quote.send_email",
        data: {
          quote_request_id: selectedQuote.id,
          quote_number: selectedQuote.quote_number,
          contact_name: selectedQuote.contact_name,
          contact_email: selectedQuote.contact_email,
          quoted_total: editQuotedTotal ? parseFloat(editQuotedTotal) : null,
        },
      },
      "/webhook/quote-send-email"
    );
    toast({ title: "Email webhook dispatched" });
    setEmailPromptOpen(false);
  };

  const countByStatus = (s: string) => quotes.filter((q) => q.status === s).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "New Requests", status: "new", color: "text-blue-600" },
          { label: "Under Review", status: "reviewing", color: "text-yellow-600" },
          { label: "Quoted", status: "quoted", color: "text-purple-600" },
        ].map((s) => (
          <Card key={s.status} className="border-2 border-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{countByStatus(s.status)}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground/30" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="border-2 border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="py-2 px-3">Quote #</TableHead>
                <TableHead className="py-2 px-3">Date</TableHead>
                <TableHead className="py-2 px-3">Contact</TableHead>
                <TableHead className="py-2 px-3 text-center">Items</TableHead>
                <TableHead className="py-2 px-3">Type</TableHead>
                <TableHead className="py-2 px-3">Status</TableHead>
                <TableHead className="py-2 px-3 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">No quote requests yet.</TableCell>
                </TableRow>
              ) : (
                quotes.map((q) => (
                  <TableRow key={q.id} className="text-xs">
                    <TableCell className="py-2 px-3 font-mono font-medium">{q.quote_number}</TableCell>
                    <TableCell className="py-2 px-3 text-muted-foreground">{format(new Date(q.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell className="py-2 px-3">
                      <span className="font-medium">{q.contact_name}</span>
                      {q.company_name && <span className="block text-muted-foreground">{q.company_name}</span>}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-center">—</TableCell>
                    <TableCell className="py-2 px-3">
                      {q.project_type ? (
                        <Badge variant="outline" className="text-[10px] capitalize">{q.project_type.replace("_", " ")}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <Badge className={`text-[10px] capitalize ${statusColors[q.status] || ""}`}>{q.status}</Badge>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openQuote(q)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-l-2 border-border">
          {selectedQuote && (
            <div className="space-y-6 pt-4">
              <SheetHeader>
                <SheetTitle className="font-serif">Quote {selectedQuote.quote_number}</SheetTitle>
              </SheetHeader>

              {/* Contact */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Contact</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> {selectedQuote.contact_name}</p>
                  <p><span className="text-muted-foreground">Email:</span> {selectedQuote.contact_email}</p>
                  {selectedQuote.contact_phone && <p><span className="text-muted-foreground">Phone:</span> {selectedQuote.contact_phone}</p>}
                  {selectedQuote.company_name && <p><span className="text-muted-foreground">Company:</span> {selectedQuote.company_name}</p>}
                </div>
              </div>

              <Separator />

              {/* Project */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Project</h3>
                <div className="text-sm space-y-1">
                  {selectedQuote.project_type && <p><span className="text-muted-foreground">Type:</span> <span className="capitalize">{selectedQuote.project_type.replace("_", " ")}</span></p>}
                  {selectedQuote.project_timeline && <p><span className="text-muted-foreground">Timeline:</span> {selectedQuote.project_timeline}</p>}
                  {selectedQuote.delivery_address && <p><span className="text-muted-foreground">Address:</span> {selectedQuote.delivery_address}</p>}
                  {selectedQuote.notes && <p><span className="text-muted-foreground">Notes:</span> {selectedQuote.notes}</p>}
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Items ({quoteItems.length})</h3>
                {quoteItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start border border-border p-2 text-sm">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                    </div>
                    <Badge variant="secondary" className="text-xs">×{item.quantity}</Badge>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Admin Controls */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Update Quote</h3>
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Quoted Total ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editQuotedTotal}
                    onChange={(e) => setEditQuotedTotal(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Admin Notes</Label>
                  <Textarea
                    value={editAdminNotes}
                    onChange={(e) => setEditAdminNotes(e.target.value)}
                    rows={3}
                    maxLength={1000}
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>

              <Separator />

              {/* Webhook Activity */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Webhook Activity</h3>
                {webhookLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No webhook activity.</p>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {webhookLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between text-xs border border-border p-1.5 rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.status === "delivered" ? "default" : "destructive"} className="text-[9px] px-1 py-0">
                            {log.status}
                          </Badge>
                          <span className="text-muted-foreground">{log.event_type}</span>
                        </div>
                        <span className="text-muted-foreground">{format(new Date(log.created_at), "MMM d HH:mm")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Email Prompt Dialog */}
      <Dialog open={emailPromptOpen} onOpenChange={setEmailPromptOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle className="font-serif">Send Quote Email?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Send the quoted amount to <strong>{selectedQuote?.contact_email}</strong> via email?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-2" onClick={() => setEmailPromptOpen(false)}>Skip</Button>
            <Button onClick={sendQuoteEmail}>
              <Send className="w-4 h-4 mr-1" /> Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminQuotesTab;
