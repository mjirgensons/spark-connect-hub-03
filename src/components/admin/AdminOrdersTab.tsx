import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { dispatchWebhook } from "@/lib/webhookDispatcher";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  shipping_name: string;
  guest_email: string | null;
  user_id: string | null;
  total: number;
  status: string;
  payment_status: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  shipping_method: string | null;
  shipping_address_line_1: string;
  shipping_address_line_2: string | null;
  shipping_city: string;
  shipping_province: string;
  shipping_postal_code: string;
  shipping_phone: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  estimated_delivery: string | null;
  notes: string | null;
  stripe_payment_intent_id: string | null;
  pinecone_synced: boolean;
  pinecone_synced_at: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_sku: string | null;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface WebhookLog {
  id: string;
  event_type: string;
  status: string;
  created_at: string;
  duration_ms: number | null;
}

const paymentBadgeVariant: Record<string, string> = {
  paid: "default",
  unpaid: "secondary",
  failed: "destructive",
  refunded: "outline",
};

const statusBadgeVariant: Record<string, string> = {
  pending: "secondary",
  confirmed: "default",
  preparing: "default",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  refunded: "destructive",
};

const DATE_FILTERS = [
  { label: "Today", value: "today" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "All time", value: "all" },
];

const ORDER_STATUSES = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled", "refunded"];
const PAYMENT_STATUSES = ["unpaid", "paid", "failed", "refunded"];

const PAGE_SIZE = 20;

const AdminOrdersTab = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  // Detail sheet
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tracking, setTracking] = useState({ number: "", url: "", delivery: "" });
  const [adminNotes, setAdminNotes] = useState("");
  const [savingTracking, setSavingTracking] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, pinecone_synced, pinecone_synced_at")
      .order("created_at", { ascending: false });
    setOrders((data || []) as unknown as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filters
  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (paymentFilter !== "all" && o.payment_status !== paymentFilter) return false;
    if (dateFilter !== "all") {
      const now = Date.now();
      const created = new Date(o.created_at).getTime();
      if (dateFilter === "today") {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        if (created < todayStart.getTime()) return false;
      } else if (dateFilter === "7d" && now - created > 7 * 86400000) return false;
      else if (dateFilter === "30d" && now - created > 30 * 86400000) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      if (
        !o.order_number.toLowerCase().includes(s) &&
        !o.shipping_name.toLowerCase().includes(s) &&
        !(o.guest_email || "").toLowerCase().includes(s)
      )
        return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Count items per order (batch)
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    const fetchCounts = async () => {
      const { data } = await supabase.from("order_items").select("order_id, quantity");
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((d: any) => {
          counts[d.order_id] = (counts[d.order_id] || 0) + d.quantity;
        });
        setItemCounts(counts);
      }
    };
    fetchCounts();
  }, []);

  const openDetail = async (order: Order) => {
    setSelectedOrder(order);
    setTracking({
      number: order.tracking_number || "",
      url: order.tracking_url || "",
      delivery: order.estimated_delivery || "",
    });
    setAdminNotes(order.notes || "");
    setSheetOpen(true);

    // Fetch items
    const { data: items } = await supabase
      .from("order_items")
      .select("id, product_name, product_sku, product_image, quantity, unit_price, total_price")
      .eq("order_id", order.id);
    setOrderItems((items || []) as OrderItem[]);

    // Fetch webhook logs
    const { data: logs } = await supabase
      .from("webhook_logs")
      .select("id, event_type, status, created_at, duration_ms")
      .or(`request_payload->>order_id.eq.${order.id},request_payload->data->>order_id.eq.${order.id}`)
      .order("created_at", { ascending: false })
      .limit(20);
    setWebhookLogs((logs || []) as WebhookLog[]);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    const oldStatus = selectedOrder.status;
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", selectedOrder.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Status updated to ${newStatus}`);
      setSelectedOrder({ ...selectedOrder, status: newStatus });

      // Fire webhook
      dispatchWebhook(
        {
          eventType: "order.status_changed",
          data: {
            order_id: selectedOrder.id,
            order_number: selectedOrder.order_number,
            new_status: newStatus,
            old_status: oldStatus,
            tracking_number: tracking.number || null,
            tracking_url: tracking.url || null,
          },
        },
        "/webhook/order-status-changed"
      );

      fetchOrders();
    }
    setUpdatingStatus(false);
  };

  const handleSaveTracking = async () => {
    if (!selectedOrder) return;
    setSavingTracking(true);
    const { error } = await supabase
      .from("orders")
      .update({
        tracking_number: tracking.number || null,
        tracking_url: tracking.url || null,
        estimated_delivery: tracking.delivery || null,
      })
      .eq("id", selectedOrder.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Tracking info saved");
      setSelectedOrder({
        ...selectedOrder,
        tracking_number: tracking.number || null,
        tracking_url: tracking.url || null,
        estimated_delivery: tracking.delivery || null,
      });

      // Fire shipped webhook if status is shipped
      if (selectedOrder.status === "shipped") {
        dispatchWebhook(
          {
            eventType: "order.shipped",
            data: {
              order_id: selectedOrder.id,
              order_number: selectedOrder.order_number,
              tracking_number: tracking.number,
              tracking_url: tracking.url,
              estimated_delivery: tracking.delivery,
              customer_email: selectedOrder.guest_email,
            },
          },
          "/webhook/order-shipped"
        );
      }
      fetchOrders();
    }
    setSavingTracking(false);
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;
    setSavingNotes(true);
    const { error } = await supabase
      .from("orders")
      .update({ notes: adminNotes || null })
      .eq("id", selectedOrder.id);
    if (error) toast.error(error.message);
    else toast.success("Notes saved");
    setSavingNotes(false);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex gap-1">
          {DATE_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={dateFilter === f.value ? "default" : "outline"}
              size="sm"
              className="border-2 text-xs"
              onClick={() => { setDateFilter(f.value); setPage(0); }}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36 border-2 h-9 text-xs">
            <SelectValue placeholder="Order Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36 border-2 h-9 text-xs">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search order #, name, email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-8 border-2 h-9 text-xs"
          />
        </div>
      </div>

      {/* Orders Table */}
      <Card className="border-2 border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2 px-3">Order #</TableHead>
                  <TableHead className="py-2 px-3">Date</TableHead>
                  <TableHead className="py-2 px-3">Customer</TableHead>
                  <TableHead className="py-2 px-3 text-center">Items</TableHead>
                  <TableHead className="py-2 px-3 text-right">Total</TableHead>
                  <TableHead className="py-2 px-3 text-center">Payment</TableHead>
                  <TableHead className="py-2 px-3 text-center">Status</TableHead>
                  <TableHead className="py-2 px-3 text-center">AI</TableHead>
                  <TableHead className="py-2 px-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((o) => (
                  <TableRow key={o.id} className="text-xs">
                    <TableCell
                      className="py-2 px-3 font-mono font-medium cursor-pointer hover:underline"
                      onClick={() => openDetail(o)}
                    >
                      {o.order_number}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("en-CA", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="py-2 px-3 max-w-[150px]">
                      <p className="truncate font-medium">{o.shipping_name}</p>
                      <p className="truncate text-muted-foreground text-[10px]">
                        {o.guest_email || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-center">
                      {itemCounts[o.id] || 0}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right font-mono">
                      ${Number(o.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-center">
                      <Badge
                        variant={(paymentBadgeVariant[o.payment_status] as any) || "secondary"}
                        className="text-[9px] px-1.5 py-0"
                      >
                        {o.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-center">
                      <Badge
                        variant={(statusBadgeVariant[o.status] as any) || "secondary"}
                        className="text-[9px] px-1.5 py-0"
                      >
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right">
                      <Button variant="outline" size="sm" className="h-7 text-xs border-2" onClick={() => openDetail(o)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 border-2"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 border-2"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Order Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-l-2 border-border">
          {selectedOrder && (
            <div className="space-y-6 py-4">
              <SheetHeader>
                <SheetTitle className="font-mono text-lg">{selectedOrder.order_number}</SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {new Date(selectedOrder.created_at).toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </SheetHeader>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Order Status</Label>
                <Select
                  value={selectedOrder.status}
                  onValueChange={handleStatusChange}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Payment:</Label>
                  <Badge variant={(paymentBadgeVariant[selectedOrder.payment_status] as any) || "secondary"} className="text-[10px]">
                    {selectedOrder.payment_status}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Customer */}
              <div className="space-y-1">
                <h4 className="text-xs font-semibold">Customer</h4>
                <p className="text-sm text-foreground">{selectedOrder.shipping_name}</p>
                <p className="text-xs text-muted-foreground">{selectedOrder.guest_email || "—"}</p>
                {selectedOrder.shipping_phone && (
                  <p className="text-xs text-muted-foreground">{selectedOrder.shipping_phone}</p>
                )}
              </div>

              <Separator />

              {/* Shipping */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold">Shipping</h4>
                <p className="text-xs text-muted-foreground">
                  {selectedOrder.shipping_address_line_1}
                  {selectedOrder.shipping_address_line_2 && `, ${selectedOrder.shipping_address_line_2}`}
                  <br />
                  {selectedOrder.shipping_city}, {selectedOrder.shipping_province}{" "}
                  {selectedOrder.shipping_postal_code}
                </p>
                <p className="text-xs text-muted-foreground">
                  Method: {selectedOrder.shipping_method || "standard"}
                </p>
                <div className="space-y-2 pt-2">
                  <div>
                    <Label className="text-xs">Tracking Number</Label>
                    <Input
                      value={tracking.number}
                      onChange={(e) => setTracking({ ...tracking, number: e.target.value })}
                      className="border-2 h-8 text-xs"
                      placeholder="e.g. 1Z999AA10123456784"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tracking URL</Label>
                    <Input
                      value={tracking.url}
                      onChange={(e) => setTracking({ ...tracking, url: e.target.value })}
                      className="border-2 h-8 text-xs"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Estimated Delivery</Label>
                    <Input
                      value={tracking.delivery}
                      onChange={(e) => setTracking({ ...tracking, delivery: e.target.value })}
                      className="border-2 h-8 text-xs"
                      placeholder="e.g. March 5, 2026"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-2 text-xs"
                    onClick={handleSaveTracking}
                    disabled={savingTracking}
                  >
                    <Save className="w-3 h-3 mr-1" />
                    {savingTracking ? "Saving..." : "Save Tracking"}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold">Items</h4>
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs">
                      {item.product_image ? (
                        <img src={item.product_image} alt="" className="w-8 h-8 object-cover border border-border" />
                      ) : (
                        <div className="w-8 h-8 bg-muted border border-border" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{item.product_name}</p>
                        {item.product_sku && <p className="text-[10px] text-muted-foreground">{item.product_sku}</p>}
                      </div>
                      <span className="text-muted-foreground">×{item.quantity}</span>
                      <span className="font-mono">${Number(item.unit_price).toLocaleString()}</span>
                      <span className="font-mono font-medium">${Number(item.total_price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">${Number(selectedOrder.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-mono">{Number(selectedOrder.shipping_cost) === 0 ? "FREE" : `$${Number(selectedOrder.shipping_cost).toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-mono">${Number(selectedOrder.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-sm">
                  <span>Total</span>
                  <span className="font-mono">${Number(selectedOrder.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <Separator />

              {/* Admin Notes */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold">Admin Notes</h4>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="border-2 text-xs min-h-[80px]"
                  placeholder="Internal notes…"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="border-2 text-xs"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                >
                  <Save className="w-3 h-3 mr-1" />
                  {savingNotes ? "Saving..." : "Save Notes"}
                </Button>
              </div>

              <Separator />

              {/* Webhook Activity */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold">Webhook Activity</h4>
                {webhookLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No webhook events for this order.</p>
                ) : (
                  <div className="space-y-1">
                    {webhookLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between text-[10px] py-1 border-b border-border last:border-0">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={log.status === "delivered" ? "default" : "destructive"}
                            className="text-[8px] px-1 py-0"
                          >
                            {log.status}
                          </Badge>
                          <span className="text-muted-foreground">{log.event_type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {log.duration_ms != null && <span>{log.duration_ms}ms</span>}
                          <span>
                            {new Date(log.created_at).toLocaleTimeString("en-CA", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminOrdersTab;
