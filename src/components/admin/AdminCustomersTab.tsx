import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Loader2 } from "lucide-react";
import SortableTableHead, { useTableSort } from "./SortableTableHead";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  user_type: string;
}

interface CustomerOrder {
  id: string;
  order_number: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
}

const AdminCustomersTab = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orderTotals, setOrderTotals] = useState<Record<string, { count: number; spent: number }>>({});
  const { sortKey, sortDirection, handleSort, sortData } = useTableSort<Profile & { _orders: number; _spent: number }>("created_at", "desc");

  // Detail sheet
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name, email, created_at, user_type")
      .order("created_at", { ascending: false });
    setProfiles((profs || []) as Profile[]);

    // Aggregate order data
    const { data: orders } = await supabase
      .from("orders")
      .select("user_id, total, payment_status");
    const totals: Record<string, { count: number; spent: number }> = {};
    (orders || []).forEach((o: any) => {
      if (!o.user_id) return;
      if (!totals[o.user_id]) totals[o.user_id] = { count: 0, spent: 0 };
      totals[o.user_id].count++;
      if (o.payment_status === "paid") totals[o.user_id].spent += Number(o.total);
    });
    setOrderTotals(totals);
    setLoading(false);
  };

  const filtered = profiles.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.full_name.toLowerCase().includes(s) || p.email.toLowerCase().includes(s);
  });

  const enriched = filtered.map((p) => {
    const stats = orderTotals[p.id] || { count: 0, spent: 0 };
    return { ...p, _orders: stats.count, _spent: stats.spent };
  });
  const sorted = sortData(enriched);

  const openDetail = async (profile: Profile) => {
    setSelectedProfile(profile);
    setSheetOpen(true);
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, total, status, payment_status, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });
    setCustomerOrders((data || []) as CustomerOrder[]);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 border-2 h-9 text-xs"
        />
      </div>

      <Card className="border-2 border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <SortableTableHead label="Name" sortKey="full_name" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                <SortableTableHead label="Email" sortKey="email" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                <SortableTableHead label="Role" sortKey="user_type" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} className="text-center" />
                <SortableTableHead label="Orders" sortKey="_orders" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} className="text-center" />
                <SortableTableHead label="Total Spent" sortKey="_spent" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} className="text-right" />
                <SortableTableHead label="Signed Up" sortKey="created_at" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((p) => (
                  <TableRow
                    key={p.id}
                    className="text-xs cursor-pointer hover:bg-accent"
                    onClick={() => openDetail(p)}
                  >
                    <TableCell className="py-2 px-3 font-medium">{p.full_name}</TableCell>
                    <TableCell className="py-2 px-3 text-muted-foreground max-w-[200px] truncate">
                      {p.email}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-center">
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                        {p.user_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-center">{p._orders}</TableCell>
                    <TableCell className="py-2 px-3 text-right font-mono">
                      ${p._spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("en-CA", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto border-l-2 border-border">
          {selectedProfile && (
            <div className="space-y-4 py-4">
              <SheetHeader>
                <SheetTitle>{selectedProfile.full_name}</SheetTitle>
                <p className="text-xs text-muted-foreground">{selectedProfile.email}</p>
              </SheetHeader>
              <div className="flex gap-3 text-xs">
                <Badge variant="secondary">{selectedProfile.user_type}</Badge>
                <span className="text-muted-foreground">
                  Joined {new Date(selectedProfile.created_at).toLocaleDateString("en-CA")}
                </span>
              </div>

              <Separator />

              <h4 className="text-xs font-semibold">Order History</h4>
              {customerOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground">No orders yet.</p>
              ) : (
                <div className="space-y-2">
                  {customerOrders.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between text-xs border-2 border-border p-2"
                    >
                      <div>
                        <p className="font-mono font-medium">{o.order_number}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(o.created_at).toLocaleDateString("en-CA", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-medium">
                          ${Number(o.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <Badge
                          variant={o.payment_status === "paid" ? "default" : "secondary"}
                          className="text-[8px] px-1 py-0"
                        >
                          {o.payment_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminCustomersTab;
