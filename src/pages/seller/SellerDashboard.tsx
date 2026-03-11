import { useEffect, useState } from "react";
import { DollarSign, CreditCard, ExternalLink, Loader2, CheckCircle2, MessageSquare } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingCart, FileText, PlusCircle, AlertTriangle, X } from "lucide-react";
import SellerHealthCard from "@/components/seller/SellerHealthCard";
import SellerAIChatbotCard from "@/components/seller/SellerAIChatbotCard";
import { toast } from "sonner";
import Breadcrumbs from "@/components/Breadcrumbs";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.round((seconds % 86400) / 3600);
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
}

interface TopProduct {
  id: string;
  product_name: string;
  category_id: string | null;
  price_retail_usd: number;
  stock_level: number;
  availability_status: string;
}

interface Category {
  id: string;
  name: string;
}

const availabilityColor = (s: string) => {
  switch (s) {
    case "In Stock": return "bg-green-500/15 text-green-700 border-green-300";
    case "Low Stock": return "bg-yellow-500/15 text-yellow-700 border-yellow-300";
    case "Out of Stock": return "bg-red-500/15 text-red-700 border-red-300";
    case "Preorder": return "bg-blue-500/15 text-blue-700 border-blue-300";
    default: return "";
  }
};

const SellerDashboard = () => {
  const { profile } = useProfile();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const adminViewId = searchParams.get("adminView");
  const sellerId = adminViewId || user?.id;

  const [productCount, setProductCount] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [rfqCount, setRfqCount] = useState<number>(0);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [declinedCount, setDeclinedCount] = useState(0);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [msgStats, setMsgStats] = useState<{ total: number; responded: number; avgTime: number | null } | null>(null);

  // Stripe Connect state
  const [stripeStatus, setStripeStatus] = useState<{
    connected: boolean;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    onboarding_status: string;
  } | null>(null);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [connectingStripe, setConnectingStripe] = useState(false);

  useEffect(() => {
    const checkStripeStatus = async () => {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) return;

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-connect-status`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({}),
          }
        );
        const data = await res.json();
        if (res.ok) setStripeStatus(data);
      } catch (err) {
        console.error("Failed to check Stripe status:", err);
      } finally {
        setStripeLoading(false);
      }
    };
    checkStripeStatus();
  }, []);

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        toast.error("Please sign in first.");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-connect-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({}),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start Stripe setup");

      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setConnectingStripe(false);
    }
  };

  useEffect(() => {
    if (!sellerId) return;
    const fetchData = async () => {
      setLoading(true);
      // Products count + top products
      const { data: prods } = await supabase
        .from("products")
        .select("id, product_name, category_id, price_retail_usd, stock_level, availability_status")
        .eq("seller_id", sellerId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5);
      if (prods) {
        setTopProducts(prods as TopProduct[]);
      }
      // Full count
      const { count: pCount } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", sellerId)
        .is("deleted_at", null);
      setProductCount(pCount ?? 0);

      // Active orders — count distinct orders containing this seller's products
      const { data: sellerOrderItems } = await supabase
        .from("order_items")
        .select("order_id, orders!inner(id, status, payment_status), products!inner(seller_id)")
        .eq("products.seller_id", sellerId)
        .in("orders.status", ["pending", "confirmed", "shipped"]);
      const activeOrderIds = new Set((sellerOrderItems || []).map((r: any) => r.order_id));
      setOrderCount(activeOrderIds.size);

      // Revenue — sum of seller's items in paid orders
      const { data: revenueItems } = await supabase
        .from("order_items")
        .select("unit_price, quantity, orders!inner(payment_status), products!inner(seller_id)")
        .eq("products.seller_id", sellerId)
        .eq("orders.payment_status", "paid");
      const calcRevenue = (revenueItems || []).reduce(
        (sum: number, r: any) => sum + (r.unit_price * r.quantity), 0
      );
      setTotalRevenue(calcRevenue);

      // Pending RFQs
      const { data: sellerProductIds } = await supabase
        .from("products")
        .select("id")
        .eq("seller_id", sellerId)
        .is("deleted_at", null);
      if (sellerProductIds?.length) {
        const ids = sellerProductIds.map((p) => p.id);
        const { data: qItems } = await supabase
          .from("quote_request_items")
          .select("quote_request_id, product_id")
          .in("product_id", ids);
        if (qItems?.length) {
          const qrIds = [...new Set(qItems.map((q) => q.quote_request_id))];
          const { count: qCount } = await supabase
            .from("quote_requests")
            .select("id", { count: "exact", head: true })
            .in("id", qrIds)
            .eq("status", "new");
          setRfqCount(qCount ?? 0);
        } else {
          setRfqCount(0);
        }
      } else {
        setRfqCount(0);
      }

      // Declined products count
      const { count: dCount } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", sellerId)
        .eq("listing_status", "rejected")
        .is("deleted_at", null);
      setDeclinedCount(dCount ?? 0);

      // Categories
      const { data: cats } = await supabase.from("categories").select("id, name");
      if (cats) setCategories(cats);

      setLoading(false);
    };
    fetchData();
  }, [sellerId]);

  const stats = [
    { label: "Products Listed", value: String(productCount), icon: Package },
    { label: "Total Revenue", value: totalRevenue > 0 ? `CA$${totalRevenue.toFixed(2)}` : "CA$0.00", icon: DollarSign },
    { label: "Active Orders", value: String(orderCount), icon: ShoppingCart },
    { label: "Pending RFQs", value: String(rfqCount), icon: FileText },
  ];

  const addProductUrl = adminViewId ? `/seller/products/new?adminView=${adminViewId}` : "/seller/products/new";
  const productsUrl = adminViewId ? `/seller/products?adminView=${adminViewId}` : "/seller/products";
  const getCategoryName = (id: string | null) => categories.find((c) => c.id === id)?.name || "—";

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 space-y-8">
      <Breadcrumbs items={[{ label: "Dashboard" }]} />

      {/* Stripe Connect Status */}
      {!stripeLoading && stripeStatus && (
        <>
          {stripeStatus.onboarding_status === "complete" && stripeStatus.charges_enabled && stripeStatus.payouts_enabled ? (
            <Card className="border-2 border-green-300 bg-green-500/10 p-5" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
                <div>
                  <p className="font-bold text-green-800 dark:text-green-300">Stripe Connected</p>
                  <p className="text-sm text-green-700 dark:text-green-400">Your account is set up to receive payouts from sales.</p>
                </div>
              </div>
            </Card>
          ) : stripeStatus.onboarding_status === "under_review" ? (
            <Card className="border-2 border-amber-300 bg-amber-500/10 p-5" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Loader2 className="w-8 h-8 text-amber-600 shrink-0 animate-spin" />
                  <div>
                    <p className="font-bold text-amber-800 dark:text-amber-300">Stripe Under Review</p>
                    <p className="text-sm text-amber-700 dark:text-amber-400">Your account details have been submitted and are being reviewed by Stripe.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-amber-300 shrink-0" onClick={handleConnectStripe}>
                  <ExternalLink className="w-4 h-4 mr-1" /> Update Info
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="border-2 border-foreground p-6" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <p className="font-bold text-lg">Set Up Payouts</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connect your bank account through Stripe to receive payouts when customers purchase your products. This takes about 5 minutes.
                </p>
                {stripeStatus.connected && !stripeStatus.charges_enabled && (
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">You started setup but haven't completed it yet.</span>
                  </div>
                )}
                <Button onClick={handleConnectStripe} disabled={connectingStripe}>
                  {connectingStripe ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : stripeStatus.connected ? (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Complete Stripe Setup
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Connect with Stripe
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Declined products alert banner */}
      {declinedCount > 0 && !dismissedBanner && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-red-300 bg-red-500/10">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              ⚠ You have {declinedCount} declined product{declinedCount > 1 ? "s" : ""} that need attention.
            </p>
            <p className="text-xs text-red-700">Review and fix them to resubmit.</p>
          </div>
          <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100" asChild>
            <Link to={adminViewId ? `${productsUrl}&status=rejected` : `${productsUrl}?status=rejected`}>View Declined</Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => setDismissedBanner(true)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <h1 className="font-serif text-2xl md:text-3xl font-bold">
        Welcome, {profile?.full_name?.split(" ")[0] || "there"}
      </h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-2 border-foreground p-5 flex items-center gap-4" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
            <div className="w-10 h-10 bg-primary flex items-center justify-center shrink-0">
              <s.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-mono text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {sellerId && <SellerAIChatbotCard sellerId={sellerId} />}

      {sellerId && <SellerHealthCard sellerId={sellerId} />}

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to={addProductUrl}><PlusCircle size={16} className="mr-2" /> Add New Product</Link>
        </Button>
        <Button variant="outline" className="border-2 border-foreground" asChild>
          <Link to={adminViewId ? `/seller/quotes?adminView=${adminViewId}` : "/seller/quotes"}>View Quotes</Link>
        </Button>
        <Button variant="outline" className="border-2 border-foreground" asChild>
          <Link to={adminViewId ? `/seller/payouts?adminView=${adminViewId}` : "/seller/payouts"}>
            <DollarSign size={16} className="mr-2" /> View Payouts
          </Link>
        </Button>
      </div>

      <Card className="border-2 border-foreground p-8" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
        <p className="font-sans font-bold text-lg mb-4">Top Products</p>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>
        ) : productCount === 0 ? (
          <div className="text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">List your first product to start selling on FitMatch.</p>
            <Button variant="outline" className="border-2 border-foreground" asChild>
              <Link to={addProductUrl}>Add Your First Product</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {topProducts.map((p) => (
              <Link
                key={p.id}
                to={productsUrl}
                className="flex items-center justify-between p-3 border border-border rounded hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.product_name}</p>
                  <p className="text-xs text-muted-foreground">{getCategoryName(p.category_id)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-sm font-mono">${Number(p.price_retail_usd).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">Stock: {p.stock_level}</span>
                  <Badge variant="outline" className={`text-[10px] capitalize ${availabilityColor(p.availability_status)}`}>
                    {p.availability_status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SellerDashboard;
