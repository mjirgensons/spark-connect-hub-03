import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Shield, Download, Plus, Users, UserCheck, UserX } from "lucide-react";
import { format, subDays } from "date-fns";

interface ConsentLog {
  id: string;
  email: string;
  consent_type: string;
  consent_category: string;
  granted: boolean;
  source: string;
  consent_text: string;
  user_id: string | null;
  created_at: string;
}

const EmailConsentTab = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<ConsentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ express: 0, implied: 0, withdrawn: 0 });

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [grantedFilter, setGrantedFilter] = useState("all");

  // Grant dialog
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantForm, setGrantForm] = useState({
    email: "",
    user_id: "",
    consent_type: "express",
    consent_category: "marketing",
    consent_text: "I agree to receive marketing emails from FitMatch. You can unsubscribe at any time.",
  });
  const [granting, setGranting] = useState(false);

  const fetchStats = useCallback(async () => {
    const since = subDays(new Date(), 30).toISOString();
    const [expressRes, impliedRes, withdrawnRes] = await Promise.all([
      supabase.from("email_consent_log").select("*", { count: "exact", head: true }).eq("consent_type", "express").eq("granted", true),
      supabase.from("email_consent_log").select("*", { count: "exact", head: true }).in("consent_type", ["implied_purchase", "implied_inquiry"]).eq("granted", true),
      supabase.from("email_consent_log").select("*", { count: "exact", head: true }).eq("granted", false).gte("created_at", since),
    ]);
    setStats({ express: expressRes.count || 0, implied: impliedRes.count || 0, withdrawn: withdrawnRes.count || 0 });
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("email_consent_log").select("*").order("created_at", { ascending: false }).limit(200);
    if (search) query = query.ilike("email", `%${search}%`);
    if (typeFilter !== "all") query = query.eq("consent_type", typeFilter);
    if (categoryFilter !== "all") query = query.eq("consent_category", categoryFilter);
    if (grantedFilter === "active") query = query.eq("granted", true);
    if (grantedFilter === "withdrawn") query = query.eq("granted", false);

    const { data, error } = await query;
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setLogs((data || []) as unknown as ConsentLog[]);
    setLoading(false);
  }, [search, typeFilter, categoryFilter, grantedFilter, toast]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleGrant = async () => {
    if (!grantForm.email) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }
    setGranting(true);
    const payload: any = {
      email: grantForm.email,
      consent_type: grantForm.consent_type,
      consent_category: grantForm.consent_category,
      consent_text: grantForm.consent_text,
      source: "admin",
      granted: true,
    };
    if (grantForm.user_id.trim()) payload.user_id = grantForm.user_id.trim();

    const { error } = await supabase.from("email_consent_log").insert([payload] as any);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Consent granted" });
      setGrantOpen(false);
      setGrantForm({ email: "", user_id: "", consent_type: "express", consent_category: "marketing", consent_text: "I agree to receive marketing emails from FitMatch. You can unsubscribe at any time." });
      fetchLogs();
      fetchStats();
    }
    setGranting(false);
  };

  const handleExportCSV = () => {
    const headers = ["email", "consent_type", "consent_category", "granted", "source", "created_at"];
    const rows = logs.map(l => [l.email, l.consent_type, l.consent_category, l.granted, l.source, l.created_at].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-consent-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported" });
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: "Express Consents", value: stats.express, icon: UserCheck },
          { label: "Implied Consents", value: stats.implied, icon: Users },
          { label: "Withdrawn (30d)", value: stats.withdrawn, icon: UserX },
        ].map(s => (
          <Card key={s.label} className="border-2 border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <s.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-serif font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email..." className="w-48 border-2" />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44 border-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="express">Express</SelectItem>
            <SelectItem value="implied_purchase">Implied (Purchase)</SelectItem>
            <SelectItem value="implied_inquiry">Implied (Inquiry)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 border-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="newsletter">Newsletter</SelectItem>
            <SelectItem value="product_updates">Product Updates</SelectItem>
            <SelectItem value="transactional">Transactional</SelectItem>
          </SelectContent>
        </Select>
        <Select value={grantedFilter} onValueChange={setGrantedFilter}>
          <SelectTrigger className="w-36 border-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" className="border-2" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
          <Button size="sm" className="border-2" onClick={() => setGrantOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Grant Consent
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border-2 border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Email</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Source</TableHead>
              <TableHead className="text-xs">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No consent records found.</TableCell></TableRow>
            ) : logs.map(log => (
              <TableRow key={log.id}>
                <TableCell className="text-sm">{log.email}</TableCell>
                <TableCell><Badge variant="outline" className="border-2 text-xs capitalize">{log.consent_type.replace("_", " ")}</Badge></TableCell>
                <TableCell><Badge variant="outline" className="border-2 text-xs capitalize">{log.consent_category.replace("_", " ")}</Badge></TableCell>
                <TableCell>
                  <Badge className={log.granted ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                    {log.granted ? "Active" : "Withdrawn"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground capitalize">{log.source}</TableCell>
                <TableCell className="text-xs">{format(new Date(log.created_at), "MMM d, yyyy HH:mm")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Grant Dialog */}
      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Grant Email Consent</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Email *</Label><Input value={grantForm.email} onChange={e => setGrantForm(p => ({ ...p, email: e.target.value }))} placeholder="user@example.com" /></div>
            <div><Label>User ID (optional)</Label><Input value={grantForm.user_id} onChange={e => setGrantForm(p => ({ ...p, user_id: e.target.value }))} placeholder="UUID from profiles" className="font-mono text-sm" /></div>
            <div>
              <Label>Consent Type</Label>
              <Select value={grantForm.consent_type} onValueChange={v => setGrantForm(p => ({ ...p, consent_type: v }))}>
                <SelectTrigger className="border-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="express">Express</SelectItem>
                  <SelectItem value="implied_purchase">Implied (Purchase)</SelectItem>
                  <SelectItem value="implied_inquiry">Implied (Inquiry)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Consent Category</Label>
              <Select value={grantForm.consent_category} onValueChange={v => setGrantForm(p => ({ ...p, consent_category: v }))}>
                <SelectTrigger className="border-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="product_updates">Product Updates</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Consent Text</Label><Textarea value={grantForm.consent_text} onChange={e => setGrantForm(p => ({ ...p, consent_text: e.target.value }))} rows={3} /></div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleGrant} disabled={granting} className="border-2">{granting ? "Saving..." : "Grant Consent"}</Button>
              <Button variant="ghost" onClick={() => setGrantOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailConsentTab;
