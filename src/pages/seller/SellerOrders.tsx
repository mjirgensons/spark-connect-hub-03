import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  ShoppingCart, ChevronDown, ChevronUp, ArrowUpDown, Package, Truck, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { format } from "date-fns";

interface OrderItem {
  id: string;
  product_name: string;
  product_sku: string | null;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  delivery_option: string | null;
  delivery_price: number | null;
  delivery_prep_days: number | null;
  pickup_available: boolean | null;
  pickup_prep_days: number | null;
  pickup_city: string | null;
  pickup_province: string | null;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  payment_status: string;
  shipping_name: string;
  shipping_address_line_1: string;
  shipping_address_line_2: string | null;
  shipping_city: string;
  shipping_province: string;
  shipping_postal_code: string;
  shipping_country: string;
  shipping_phone: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  notes: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
}

interface GroupedOrder {
  order: Order;
  items: OrderItem[];
  sellerTotal: number;
}

type SortKey = "order_number" | "created_at" | "sellerTotal" | "status";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-700 border-yellow-300",
  confirmed: "bg-blue-500/15 text-blue-700 border-blue-300",
  shipped: "bg-indigo-500/15 text-indigo-700 border-indigo-300",
  delivered: "bg-green-500/15 text-green-700 border-green-300",
  cancelled: "bg-red-500/15 text-red-700 border-red-300",
  refunded: "bg-red-500/15 text-red-700 border-red-300",
};

const paymentColors: Record<string, string> = {
  unpaid: "bg-muted text-muted-foreground border-border",
  paid: "bg-green-500/15 text-green-700 border-green-300",
  refunded: "bg-red-500/15 text-red-700 border-red-300",
  failed: "bg-red-500/15 text-red-700 border-red-300",
};

const SellerOrders = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const adminViewId = searchParams.get("adminView");
  const effectiveId = adminViewId || user?.id;

  const [grouped, setGrouped] = useState<GroupedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // dialogs
  const [shipDialog, setShipDialog] = useState<string | null>(null);
  const [trackNum, setTrackNum] = useState("");
  const [trackUrl, setTrackUrl] = useState("");
  const [deliverDialog, setDeliverDialog] = useState<string | null>(null);
  const [cancelDialog, setCancelDialog] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!effectiveId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("order_items")
      .select("id, product_name, product_sku, product_image, quantity, unit_price, total_price, order_id, orders!inner(id, order_number, created_at, status, payment_status, shipping_name, shipping_address_line_1, shipping_address_line_2, shipping_city, shipping_province, shipping_postal_code, shipping_country, shipping_phone, tracking_number, tracking_url, notes, shipped_at, delivered_at, cancelled_at, cancellation_reason), products!inner(seller_id)")
      .eq("products.seller_id", effectiveId);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const map = new Map<string, GroupedOrder>();
    for (const row of data || []) {
      const o = row.orders as any as Order;
      if (!map.has(o.id)) {
        map.set(o.id, { order: o, items: [], sellerTotal: 0 });
      }
      const g = map.get(o.id)!;
      g.items.push({
        id: row.id,
        product_name: row.product_name,
        product_sku: row.product_sku,
        product_image: row.product_image,
        quantity: row.quantity,
        unit_price: row.unit_price,
        total_price: row.total_price,
      });
      g.sellerTotal += row.unit_price * row.quantity;
    }
    setGrouped(Array.from(map.values()));
    setLoading(false);
  }, [effectiveId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = useMemo(() => {
    let list = grouped;
    if (tab !== "all") list = list.filter((g) => g.order.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) =>
          g.order.order_number.toLowerCase().includes(q) ||
          g.order.shipping_name.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "order_number") cmp = a.order.order_number.localeCompare(b.order.order_number);
      else if (sortKey === "created_at") cmp = new Date(a.order.created_at).getTime() - new Date(b.order.created_at).getTime();
      else if (sortKey === "sellerTotal") cmp = a.sellerTotal - b.sellerTotal;
      else if (sortKey === "status") cmp = a.order.status.localeCompare(b.order.status);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [grouped, tab, search, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const updateStatus = async (orderId: string, updates: Record<string, any>) => {
    setUpdating(true);
    const { error } = await supabase.from("orders").update(updates).eq("id", orderId);
    setUpdating(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Order updated" });
      setShipDialog(null); setDeliverDialog(null); setCancelDialog(null);
      setTrackNum(""); setTrackUrl(""); setCancelReason("");
      await fetchOrders();
    }
  };

  const SortHeader = ({ label, sk, className }: { label: string; sk: SortKey; className?: string }) => (
    <TableHead className={className}>
      <button className="flex items-center gap-1 font-medium" onClick={() => toggleSort(sk)}>
        {label} <ArrowUpDown className="h-3 w-3" />
      </button>
    </TableHead>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/seller/dashboard" }, { label: "Orders" }]} />
        <h1 className="font-serif text-2xl md:text-3xl font-bold">Orders</h1>
        <Card className="p-8 text-center text-muted-foreground">Loading orders…</Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: adminViewId ? `/seller/dashboard?adminView=${adminViewId}` : "/seller/dashboard" }, { label: "Orders" }]} />
      <h1 className="font-serif text-2xl md:text-3xl font-bold">Orders</h1>

      {grouped.length === 0 ? (
        <Card className="border-2 border-foreground p-8 text-center" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-sans font-bold text-lg mb-2">No orders yet</p>
          <p className="text-sm text-muted-foreground">Orders will appear here when customers purchase your products.</p>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="all">All ({grouped.length})</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="shipped">Shipped</TabsTrigger>
                <TabsTrigger value="delivered">Delivered</TabsTrigger>
              </TabsList>
            </Tabs>
            <Input placeholder="Search order # or customer…" className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {search || tab !== "all" ? (
            <p className="text-sm text-muted-foreground">Showing {filtered.length} of {grouped.length} orders</p>
          ) : null}

          <Card className="border-2 border-foreground overflow-hidden" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHeader label="Order #" sk="order_number" className="w-[140px]" />
                  <SortHeader label="Date" sk="created_at" className="w-[110px]" />
                  <TableHead className="w-[150px]">Customer</TableHead>
                  <TableHead className="w-[70px] text-center">Items</TableHead>
                  <SortHeader label="Seller Total" sk="sellerTotal" className="w-[120px] text-right" />
                  <SortHeader label="Status" sk="status" className="w-[110px] text-center" />
                  <TableHead className="w-[100px] text-center">Payment</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((g) => {
                  const expanded = expandedId === g.order.id;
                  return (
                    <>
                      <TableRow key={g.order.id} className="cursor-pointer" onClick={() => setExpandedId(expanded ? null : g.order.id)}>
                        <TableCell className="font-mono text-xs">{g.order.order_number}</TableCell>
                        <TableCell className="text-sm">{format(new Date(g.order.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-sm truncate max-w-[150px]">{g.order.shipping_name}</TableCell>
                        <TableCell className="text-center">{g.items.length}</TableCell>
                        <TableCell className="text-right font-medium">${g.sellerTotal.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={statusColors[g.order.status] || ""}>{g.order.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={paymentColors[g.order.payment_status] || ""}>{g.order.payment_status}</Badge>
                        </TableCell>
                        <TableCell>{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</TableCell>
                      </TableRow>

                      {expanded && (
                        <TableRow key={`${g.order.id}-detail`}>
                          <TableCell colSpan={8} className="bg-muted/30 p-4">
                            <div className="grid md:grid-cols-2 gap-6">
                              {/* Shipping */}
                              <div className="space-y-2">
                                <h4 className="font-semibold text-sm flex items-center gap-1"><Package className="h-4 w-4" /> Shipping Address</h4>
                                <div className="text-sm text-muted-foreground space-y-0.5">
                                  <p>{g.order.shipping_name}</p>
                                  <p>{g.order.shipping_address_line_1}</p>
                                  {g.order.shipping_address_line_2 && <p>{g.order.shipping_address_line_2}</p>}
                                  <p>{g.order.shipping_city}, {g.order.shipping_province} {g.order.shipping_postal_code}</p>
                                  <p>{g.order.shipping_country}</p>
                                  {g.order.shipping_phone && <p>Phone: {g.order.shipping_phone}</p>}
                                </div>

                                {g.order.notes && (
                                  <div className="mt-3">
                                    <h4 className="font-semibold text-sm">Notes</h4>
                                    <p className="text-sm text-muted-foreground">{g.order.notes}</p>
                                  </div>
                                )}

                                {(g.order.tracking_number || g.order.tracking_url) && (
                                  <div className="mt-3">
                                    <h4 className="font-semibold text-sm flex items-center gap-1"><Truck className="h-4 w-4" /> Tracking</h4>
                                    {g.order.tracking_number && <p className="text-sm text-muted-foreground">Number: {g.order.tracking_number}</p>}
                                    {g.order.tracking_url && <a href={g.order.tracking_url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Track shipment</a>}
                                  </div>
                                )}

                                {/* Timestamps */}
                                {g.order.shipped_at && <p className="text-xs text-muted-foreground">Shipped: {format(new Date(g.order.shipped_at), "MMM d, yyyy h:mm a")}</p>}
                                {g.order.delivered_at && <p className="text-xs text-muted-foreground">Delivered: {format(new Date(g.order.delivered_at), "MMM d, yyyy h:mm a")}</p>}
                                {g.order.cancelled_at && (
                                  <div>
                                    <p className="text-xs text-destructive">Cancelled: {format(new Date(g.order.cancelled_at), "MMM d, yyyy h:mm a")}</p>
                                    {g.order.cancellation_reason && <p className="text-xs text-muted-foreground">Reason: {g.order.cancellation_reason}</p>}
                                  </div>
                                )}
                              </div>

                              {/* Items */}
                              <div className="space-y-2">
                                <h4 className="font-semibold text-sm">Your Items</h4>
                                <div className="space-y-2">
                                  {g.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 border rounded-md p-2 bg-background">
                                      {item.product_image ? (
                                        <img src={item.product_image} alt="" className="w-10 h-10 rounded object-cover" />
                                      ) : (
                                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{item.product_name}</p>
                                        {item.product_sku && <p className="text-xs text-muted-foreground">SKU: {item.product_sku}</p>}
                                      </div>
                                      <div className="text-right text-sm">
                                        <p>{item.quantity} × ${item.unit_price.toFixed(2)}</p>
                                        <p className="font-medium">${(item.quantity * item.unit_price).toFixed(2)}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {g.order.status === "pending" && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4" /> Awaiting payment confirmation</p>
                                  )}
                                  {g.order.status === "confirmed" && (
                                    <>
                                      <Button size="sm" onClick={(e) => { e.stopPropagation(); setShipDialog(g.order.id); }}>
                                        <Truck className="h-4 w-4 mr-1" /> Mark as Shipped
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); setCancelDialog(g.order.id); }}>
                                        <XCircle className="h-4 w-4 mr-1" /> Cancel Order
                                      </Button>
                                    </>
                                  )}
                                  {g.order.status === "shipped" && (
                                    <>
                                      <Button size="sm" onClick={(e) => { e.stopPropagation(); setDeliverDialog(g.order.id); }}>
                                        <CheckCircle2 className="h-4 w-4 mr-1" /> Mark as Delivered
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); setCancelDialog(g.order.id); }}>
                                        <XCircle className="h-4 w-4 mr-1" /> Cancel Order
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* Ship Dialog */}
      <Dialog open={!!shipDialog} onOpenChange={(o) => { if (!o) setShipDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Shipped</DialogTitle>
            <DialogDescription>Add optional tracking information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tracking Number (optional)</Label>
              <Input value={trackNum} onChange={(e) => setTrackNum(e.target.value)} placeholder="e.g. 1Z999AA10123456784" />
            </div>
            <div>
              <Label>Tracking URL (optional)</Label>
              <Input value={trackUrl} onChange={(e) => setTrackUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShipDialog(null)}>Cancel</Button>
            <Button disabled={updating} onClick={() => shipDialog && updateStatus(shipDialog, {
              status: "shipped",
              shipped_at: new Date().toISOString(),
              ...(trackNum && { tracking_number: trackNum }),
              ...(trackUrl && { tracking_url: trackUrl }),
            })}>
              Confirm Shipped
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deliver Dialog */}
      <Dialog open={!!deliverDialog} onOpenChange={(o) => { if (!o) setDeliverDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Delivered</DialogTitle>
            <DialogDescription>Confirm this order has been delivered to the customer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliverDialog(null)}>Cancel</Button>
            <Button disabled={updating} onClick={() => deliverDialog && updateStatus(deliverDialog, {
              status: "delivered",
              delivered_at: new Date().toISOString(),
            })}>
              Confirm Delivered
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelDialog} onOpenChange={(o) => { if (!o) setCancelDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>This action cannot be undone. Provide a reason for cancellation.</DialogDescription>
          </DialogHeader>
          <div>
            <Label>Cancellation Reason</Label>
            <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason for cancelling…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(null)}>Go Back</Button>
            <Button variant="destructive" disabled={updating || !cancelReason.trim()} onClick={() => cancelDialog && updateStatus(cancelDialog, {
              status: "cancelled",
              cancelled_at: new Date().toISOString(),
              cancellation_reason: cancelReason.trim(),
            })}>
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerOrders;
