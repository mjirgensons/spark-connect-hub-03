import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

interface ConsentLog {
  id: string;
  session_id: string;
  action: string;
  categories: Record<string, boolean>;
  page_url: string | null;
  banner_version: string | null;
  user_agent: string | null;
  created_at: string;
}

interface CookieCategory {
  id: string;
  name: string;
  slug: string;
}

type DateRange = "7d" | "30d" | "all";

const getDateFilter = (range: DateRange): string | null => {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const actionBadge = (action: string) => {
  const map: Record<string, { label: string; className: string }> = {
    accept_all: { label: "Accept All", className: "bg-green-600 text-white hover:bg-green-700" },
    reject_non_essential: { label: "Reject", className: "bg-red-600 text-white hover:bg-red-700" },
    custom: { label: "Custom", className: "bg-yellow-600 text-white hover:bg-yellow-700" },
    update: { label: "Update", className: "bg-blue-600 text-white hover:bg-blue-700" },
  };
  const m = map[action] || { label: action, className: "" };
  return <Badge className={m.className}>{m.label}</Badge>;
};

const PAGE_SIZE = 20;

const ConsentLogsAdmin = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<ConsentLog[]>([]);
  const [allLogs, setAllLogs] = useState<ConsentLog[]>([]);
  const [categories, setCategories] = useState<CookieCategory[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  // Stats
  const [totalCount, setTotalCount] = useState(0);
  const [acceptAllCount, setAcceptAllCount] = useState(0);
  const [rejectCount, setRejectCount] = useState(0);
  const [customCount, setCustomCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setPage(0);
    const dateFilter = getDateFilter(dateRange);

    // Fetch categories
    const { data: cats } = await supabase
      .from("cookie_categories")
      .select("id, name, slug")
      .order("sort_order", { ascending: true });
    if (cats) setCategories(cats as any);

    // Fetch all logs for stats & export (respecting 1000 limit awareness)
    let query = supabase
      .from("consent_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (dateFilter) query = query.gte("created_at", dateFilter);
    const { data, error } = await query;

    if (error) {
      toast({ title: "Error loading consent logs", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const all = (data || []) as unknown as ConsentLog[];
    setAllLogs(all);
    setLogs(all);
    setTotalCount(all.length);
    setAcceptAllCount(all.filter((l) => l.action === "accept_all").length);
    setRejectCount(all.filter((l) => l.action === "reject_non_essential").length);
    setCustomCount(all.filter((l) => l.action === "custom").length);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  // Category acceptance breakdown
  const categoryBreakdown = categories.map((cat) => {
    const accepted = allLogs.filter((l) => l.categories && l.categories[cat.slug] === true).length;
    const rejected = allLogs.filter((l) => l.categories && l.categories[cat.slug] === false).length;
    const total = accepted + rejected;
    return {
      name: cat.name,
      slug: cat.slug,
      accepted,
      rejected,
      rate: total > 0 ? Math.round((accepted / total) * 100) : 0,
    };
  });

  // Pagination
  const pagedLogs = logs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(logs.length / PAGE_SIZE);

  // CSV export
  const exportCSV = () => {
    const headers = ["Session ID", "Action", "Categories", "Page URL", "Banner Version", "User Agent", "Timestamp"];
    const rows = allLogs.map((l) => [
      l.session_id,
      l.action,
      JSON.stringify(l.categories),
      l.page_url || "",
      l.banner_version || "",
      l.user_agent || "",
      l.created_at,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `consent-logs-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pct = (count: number) => (totalCount > 0 ? Math.round((count / totalCount) * 100) : 0);

  if (loading) return <p className="text-muted-foreground text-sm py-4">Loading consent data…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Consent Logs & Analytics</h3>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Consents", value: totalCount.toLocaleString() },
          { label: "Accept All Rate", value: `${pct(acceptAllCount)}%` },
          { label: "Reject Rate", value: `${pct(rejectCount)}%` },
          { label: "Custom Preferences", value: `${pct(customCount)}%` },
        ].map((s) => (
          <Card key={s.label} className="border-2 border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category breakdown table */}
      <div className="border-2 border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Accepted</TableHead>
              <TableHead className="text-xs">Rejected</TableHead>
              <TableHead className="text-xs">Acceptance Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoryBreakdown.map((cb) => (
              <TableRow key={cb.slug}>
                <TableCell className="text-xs font-semibold">{cb.name}</TableCell>
                <TableCell className="text-xs">{cb.accepted}</TableCell>
                <TableCell className="text-xs">{cb.rejected}</TableCell>
                <TableCell className="text-xs">{cb.rate}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Consent log table */}
      <h4 className="text-sm font-semibold text-foreground pt-2">Consent Log</h4>
      <div className="border-2 border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Session</TableHead>
              <TableHead className="text-xs">Action</TableHead>
              <TableHead className="text-xs">Categories</TableHead>
              <TableHead className="text-xs">Page URL</TableHead>
              <TableHead className="text-xs">Version</TableHead>
              <TableHead className="text-xs">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-8">
                  No consent logs found.
                </TableCell>
              </TableRow>
            ) : (
              pagedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs font-mono">{log.session_id.slice(0, 8)}…</TableCell>
                  <TableCell>{actionBadge(log.action)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {log.categories && Object.entries(log.categories).map(([key, val]) => (
                        <Badge
                          key={key}
                          variant="outline"
                          className={val
                            ? "border-green-600 text-green-700 bg-green-50 text-[10px] px-1.5 py-0"
                            : "border-red-600 text-red-700 bg-red-50 text-[10px] px-1.5 py-0"
                          }
                        >
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate" title={log.page_url || ""}>
                    {log.page_url ? (log.page_url.length > 30 ? log.page_url.slice(0, 30) + "…" : log.page_url) : "—"}
                  </TableCell>
                  <TableCell className="text-xs">{log.banner_version || "—"}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{formatDate(log.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages} ({logs.length} total)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsentLogsAdmin;
