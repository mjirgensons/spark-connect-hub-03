import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Eye, ShoppingCart, FileText, PlusCircle } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

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

      // Active orders
      const { count: oCount } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", sellerId)
        .in("status", ["pending", "confirmed"]);
      setOrderCount(oCount ?? 0);

      // Pending RFQs — quote_requests doesn't have product_id directly,
      // so we count quotes where status = 'new' linked to seller's products via quote_request_items
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
    { label: "Total Views", value: "—", icon: Eye },
    { label: "Active Orders", value: String(orderCount), icon: ShoppingCart },
    { label: "Pending RFQs", value: String(rfqCount), icon: FileText },
  ];

  const addProductUrl = adminViewId ? `/seller/products/new?adminView=${adminViewId}` : "/seller/products/new";
  const productsUrl = adminViewId ? `/seller/products?adminView=${adminViewId}` : "/seller/products";
  const getCategoryName = (id: string | null) => categories.find((c) => c.id === id)?.name || "—";

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: "Dashboard" }]} />

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
            <Link to={`${productsUrl}&status=rejected`}>View Declined</Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => setDismissedBanner(true)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <h1 className="font-serif text-2xl md:text-3xl font-bold">
        Welcome back, {profile?.full_name?.split(" ")[0] || "there"}
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

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to={addProductUrl}><PlusCircle size={16} className="mr-2" /> Add New Product</Link>
        </Button>
        <Button variant="outline" className="border-2 border-foreground" asChild>
          <Link to={adminViewId ? `/seller/quotes?adminView=${adminViewId}` : "/seller/quotes"}>View Quotes</Link>
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
