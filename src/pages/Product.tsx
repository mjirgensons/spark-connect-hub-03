import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ArrowLeft, Package, Ruler, Palette, Layers, Info, ShoppingCart, Download, ChevronDown, MessageSquare } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import ProductGallery from "@/components/ProductGallery";
import { ProductDetailSkeleton } from "@/components/ui/product-detail-skeleton";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useCart } from "@/contexts/CartContext";
import TrustBadgeBar from "@/components/TrustBadgeBar";
import ProductReviews from "@/components/ProductReviews";
import WishlistButton from "@/components/WishlistButton";
import { toast } from "sonner";
import CompareButton from "@/components/CompareButton";
import ContactSellerButton from "@/components/ContactSellerButton";
import ProductQA from "@/components/ProductQA";

const MM_TO_INCH = 0.0393701;
const fmtDim = (mm: number) => {
  if (!mm || mm <= 0) return null;
  return `${mm}mm / ${(mm * MM_TO_INCH).toFixed(1)}″`;
};

const Product = () => {
  const { id } = useParams<{ id: string }>();
  usePageMeta();

  // ── Data queries ──
  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("id", id!)
        .is("deleted_at", null)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: productOptions = [] } = useQuery({
    queryKey: ["product-options", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_options")
        .select("*")
        .eq("product_id", id!)
        .order("sort_order");
      return data || [];
    },
    enabled: !!id,
  });

  const { data: productAppliances = [] } = useQuery({
    queryKey: ["product-appliances", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_compatible_appliances")
        .select("*")
        .eq("product_id", id!)
        .order("sort_order");
      return data || [];
    },
    enabled: !!id,
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ["related-products", product?.category_id, product?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, product_name, main_image_url, price_retail_usd, price_discounted_usd, discount_percentage")
        .eq("category_id", product!.category_id!)
        .eq("listing_status", "approved")
        .is("deleted_at", null)
        .neq("id", product!.id)
        .limit(6);
      return data || [];
    },
    enabled: !!product?.category_id,
  });

  useEffect(() => {
    if (product) {
      const desc = product.short_description || `${product.product_name} — ${product.color} ${product.material} cabinet. $${Number(product.price_discounted_usd).toLocaleString()} (${product.discount_percentage}% off). Available at FitMatch.`;
      document.title = `${product.product_name} | FitMatch`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", desc);
    }
  }, [product]);

  const { dispatch, getItemQuantity } = useCart();
  const qtyInCart = product ? getItemQuantity(product.id) : 0;
  const [hwImageOpen, setHwImageOpen] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("specs");
  const [qaPrefill, setQaPrefill] = useState<{ text: string; optionId: string } | null>(null);

  // ── Add-on checkbox state (shared between hero & tab) ──
  const [checkedAddOns, setCheckedAddOns] = useState<Set<string>>(new Set());

  // Initialize included add-ons as checked
  useEffect(() => {
    if (productOptions.length > 0) {
      const included = new Set<string>();
      productOptions.forEach((opt: any) => {
        if (opt.inclusion_status === "included") included.add(opt.id);
      });
      setCheckedAddOns(included);
    }
  }, [productOptions]);

  const toggleAddOn = (optId: string) => {
    setCheckedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(optId)) next.delete(optId);
      else next.add(optId);
      return next;
    });
  };

  // ── Sticky mini sidebar visibility ──
  const heroRef = useRef<HTMLDivElement>(null);
  const [showMiniSidebar, setShowMiniSidebar] = useState(false);

  useEffect(() => {
    if (!heroRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowMiniSidebar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [product]);

  // ── Early returns ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <ProductDetailSkeleton />
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-4">Product Not Found</h1>
          <Link to="/">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const searchParams = new URLSearchParams(window.location.search);
  const isAdminView = !!searchParams.get("adminView");
  const isNotApproved = product.listing_status !== "approved" && !isAdminView;

  if (isNotApproved) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-4">Product Not Available</h1>
          <p className="text-muted-foreground mb-6">This product is not currently available for viewing.</p>
          <Link to="/browse">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Browse Products</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const savings = product.price_retail_usd - product.price_discounted_usd;
  const isDeactivated = product.availability_status === "Deactivated";

  // ── Add-on pricing helpers ──
  const getOptPrice = (opt: any) => {
    if (opt.inclusion_status === "included") return 0;
    const disc = Number(opt.price_discounted);
    const retail = Number(opt.price_retail);
    return disc > 0 ? disc : retail > 0 ? retail : 0;
  };

  const addOnTotal = productOptions
    .filter((opt: any) => checkedAddOns.has(opt.id))
    .reduce((sum: number, opt: any) => sum + getOptPrice(opt), 0);

  const productPrice = Number(product.price_discounted_usd);
  const grandTotal = productPrice + addOnTotal;

  // ── Cart handler ──
  const handleAddToCart = () => {
    // Add main product
    dispatch({
      type: "ADD_ITEM",
      payload: {
        productId: product.id,
        name: product.product_name,
        image: product.main_image_url || "/placeholder.svg",
        price: product.price_discounted_usd,
        dimensions: `${product.width_mm} × ${product.height_mm} × ${product.depth_mm} mm`,
        maxStock: product.stock_level,
      },
    });

    // Add checked add-ons (non-included ones with price)
    productOptions
      .filter((opt: any) => checkedAddOns.has(opt.id) && opt.inclusion_status !== "included")
      .forEach((opt: any) => {
        const price = getOptPrice(opt);
        if (price > 0) {
          dispatch({
            type: "ADD_ITEM",
            payload: {
              productId: `${product.id}_option_${opt.id}`,
              name: `${opt.option_name} (for ${product.product_name})`,
              image: product.main_image_url || "/placeholder.svg",
              price,
              dimensions: "",
              maxStock: 999,
            },
          });
        }
      });

    toast.success("Added to cart", {
      action: { label: "View Cart", onClick: () => (window.location.href = "/cart") },
    });
  };

  // ── Tab data availability ──
  const hw = (product as any).hardware_details as any;
  const hasHw = hw && typeof hw === "object" && (hw.hinges?.brand || hw.drawer_slides?.brand || hw.handles?.type);
  const hasFlat = !hasHw && (product.hinge_brand || product.slide_brand);
  const hasHardware = hasHw || hasFlat;

  const af = (product as any).additional_features as any[];
  const hasFeatures = af?.length > 0;

  const displayOpts = productOptions.filter((o: any) => o.option_name);
  const hasCountertop = product.countertop_option && product.countertop_option !== "no";
  const hasAddOns = displayOpts.length > 0 || hasCountertop;

  const hasAppliances = productAppliances.length > 0;
  const hasDescription = !!product.long_description;

  // Spec items
  const dimParts: string[] = [];
  if (product.width_mm && product.width_mm > 0) dimParts.push(`${product.width_mm}`);
  if (product.height_mm && product.height_mm > 0) dimParts.push(`${product.height_mm}`);
  if (product.depth_mm && product.depth_mm > 0) dimParts.push(`${product.depth_mm}`);
  const hasDimensions = dimParts.length > 0;

  const hwSections = hasHw
    ? [
        { label: "Hinges", data: hw.hinges, fields: [["Brand", hw.hinges?.brand], ["Model", hw.hinges?.model]] as [string, string][] },
        { label: "Drawer Slides", data: hw.drawer_slides, fields: [["Brand", hw.drawer_slides?.brand], ["Model", hw.drawer_slides?.model]] as [string, string][] },
        { label: "Handles", data: hw.handles, fields: [["Type", hw.handles?.type], ["Finish", hw.handles?.finish]] as [string, string][] },
      ]
    : hasFlat
    ? [
        { label: "Hinges", data: null, fields: [["Brand", product.hinge_brand], ["Model", product.hinge_model]] as [string, string][] },
        { label: "Drawer Slides", data: null, fields: [["Brand", product.slide_brand], ["Model", product.slide_model]] as [string, string][] },
      ]
    : [];
  const activeHwSections = hwSections.filter((s) => s.fields.some(([, v]) => v));

  const specItems: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (hasDimensions) {
    const w = fmtDim(product.width_mm);
    const h = fmtDim(product.height_mm);
    const d = fmtDim(product.depth_mm);
    const parts = [w && `W: ${w}`, h && `H: ${h}`, d && `D: ${d}`].filter(Boolean);
    specItems.push({ icon: <Ruler className="w-4 h-4 text-muted-foreground" />, label: "Dimensions", value: parts.join("  ·  ") });
  }
  if (product.color) specItems.push({ icon: <Palette className="w-4 h-4 text-muted-foreground" />, label: "Color", value: product.color });
  if (product.material) specItems.push({ icon: <Layers className="w-4 h-4 text-muted-foreground" />, label: "Material", value: product.material });
  if (product.style) specItems.push({ icon: <Info className="w-4 h-4 text-muted-foreground" />, label: "Style", value: product.style });
  if (product.door_style) specItems.push({ icon: <Info className="w-4 h-4 text-muted-foreground" />, label: "Door Style", value: (product.door_style || "").replace(/_/g, " ") });
  if (product.door_material) specItems.push({ icon: <Layers className="w-4 h-4 text-muted-foreground" />, label: "Door Material", value: (product.door_material || "").replace(/_/g, " ") });
  if (product.finish_type) specItems.push({ icon: <Info className="w-4 h-4 text-muted-foreground" />, label: "Finish Type", value: product.finish_type });
  if (product.construction_type) specItems.push({ icon: <Info className="w-4 h-4 text-muted-foreground" />, label: "Construction", value: product.construction_type });
  if (product.condition) {
    let condVal = product.condition;
    if (product.condition_notes) condVal += ` — ${product.condition_notes}`;
    specItems.push({ icon: <Info className="w-4 h-4 text-muted-foreground" />, label: "Condition", value: condVal });
  }
  if (product.manufacturer) specItems.push({ icon: <Info className="w-4 h-4 text-muted-foreground" />, label: "Manufacturer", value: product.manufacturer });
  if (product.stock_level > 0) specItems.push({ icon: <Package className="w-4 h-4 text-muted-foreground" />, label: "Units in Stock", value: String(product.stock_level) });

  const tabs: { id: string; label: string }[] = [{ id: "specs", label: "Specifications" }];
  if (hasHardware) tabs.push({ id: "hardware", label: "Hardware" });
  if (hasFeatures) tabs.push({ id: "features", label: "Features" });
  if (hasAddOns) tabs.push({ id: "addons", label: "Add-Ons" });
  if (hasAppliances) tabs.push({ id: "appliances", label: "Appliances" });
  if (hasDescription) tabs.push({ id: "description", label: "Description" });
  tabs.push({ id: "qa", label: "Q&A" });
  tabs.push({ id: "reviews", label: "Reviews" });

  // ── Add-on row renderer (shared between hero compact & full tab) ──
  const renderAddOnRow = (opt: any, compact: boolean) => {
    const isIncluded = opt.inclusion_status === "included";
    const price = getOptPrice(opt);
    const hasDiscount = Number(opt.discount_percentage) > 0 && Number(opt.price_retail) > Number(opt.price_discounted);

    return (
      <div key={opt.id} className={`flex items-start gap-3 ${compact ? "py-2" : "border rounded-lg p-4"}`}>
        <Checkbox
          checked={checkedAddOns.has(opt.id)}
          disabled={isIncluded}
          onCheckedChange={() => toggleAddOn(opt.id)}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium text-foreground ${compact ? "" : "text-base"}`}>{opt.option_name}</span>
            {!compact && (
              <>
                <Badge variant="outline" className="text-[10px]">{(opt.option_type || "").replace(/_/g, " ")}</Badge>
                <Badge variant={isIncluded ? "default" : "secondary"} className="text-[10px]">
                  {isIncluded ? "Included" : opt.inclusion_status === "optional" ? "Optional" : "Not Included"}
                </Badge>
              </>
            )}
          </div>
          {!compact && opt.description && (
            <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          {isIncluded ? (
            <span className="text-xs text-muted-foreground">Included</span>
          ) : price > 0 ? (
            <div className="flex items-center gap-1.5">
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">${Number(opt.price_retail).toLocaleString()}</span>
              )}
              <span className="text-sm font-semibold text-foreground">${price.toLocaleString()}</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* ═══ ZONE 1: HERO ═══ */}
        <div ref={heroRef} className="min-h-[70vh] pt-24 md:pt-10">
          <div className="container mx-auto px-4 py-8">
            <Breadcrumbs
              items={[
                { label: "Browse", href: "/browse" },
                ...(product.categories?.name
                  ? [{ label: product.categories.name, href: `/browse?category=${(product.categories as any)?.slug || ""}` }]
                  : []),
                { label: product.product_name },
              ]}
            />
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              Back to all products
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
              {/* LEFT: Gallery */}
              <div className="relative">
                <ProductGallery
                  mainImage={product.main_image_url || "/placeholder.svg"}
                  additionalImages={product.additional_image_urls || []}
                  productName={product.product_name}
                  discountPercentage={isDeactivated ? 0 : product.discount_percentage}
                />
                {isDeactivated && (
                  <div className="absolute top-4 left-4 right-4 z-10">
                    <div className="bg-foreground/80 text-background text-lg font-bold px-4 py-3 rounded-md text-center">
                      Temporarily Unavailable
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: Purchase Decision */}
              <div className="space-y-4">
                {/* Category + Name + Wishlist */}
                <div className="relative">
                  {product.categories?.name && (
                    <Badge variant="outline" className="mb-2">{product.categories.name}</Badge>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                      {product.product_name}
                    </h1>
                    <WishlistButton productId={product.id} size="md" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">SKU: {product.product_code}</p>
                </div>

                {/* Price block */}
                <div className="border rounded-md p-4 space-y-1.5">
                  <div className="flex items-end gap-3">
                    <span className="text-2xl font-bold text-foreground">
                      ${Number(product.price_discounted_usd).toLocaleString()}
                    </span>
                    <span className="text-base text-muted-foreground line-through mb-0.5">
                      ${Number(product.price_retail_usd).toLocaleString()}
                    </span>
                  </div>
                  {savings > 0 && (
                    <p className="text-sm text-muted-foreground">
                      You save <span className="font-semibold text-foreground">${savings.toLocaleString()}</span>{" "}
                      <span className="text-xs">({product.discount_percentage}% off)</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">Plus applicable HST (13%)</p>
                  <Badge variant={product.availability_status === "In Stock" ? "default" : "secondary"} className="mt-1">
                    {product.availability_status}
                  </Badge>
                </div>

                {/* Short description */}
                {product.short_description && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{product.short_description}</p>
                )}

                {/* ── Add-On Quick Selector ── */}
                {displayOpts.length > 0 && (
                  <div className="border rounded-md p-4 space-y-2">
                    <p className="text-sm font-semibold text-foreground">Customize Your Order</p>
                    <div className="divide-y">
                      {displayOpts.map((opt: any) => renderAddOnRow(opt, true))}
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm pt-1">
                      <span className="text-muted-foreground">
                        Product: ${productPrice.toLocaleString()}
                        {addOnTotal > 0 && ` + Add-ons: $${addOnTotal.toLocaleString()}`}
                      </span>
                      <span className="font-bold text-foreground">Total: ${grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-3 pt-1">
                  <Button
                    size="lg"
                    className="w-full min-h-[48px] shadow-[2px_2px_0px_0px_hsl(var(--foreground))] sm:shadow-[4px_4px_0px_0px_hsl(var(--foreground))]"
                    disabled={isDeactivated || qtyInCart >= product.stock_level}
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {isDeactivated ? "Currently Unavailable" : qtyInCart > 0 ? `In Cart (${qtyInCart})` : "Add to Cart"}
                  </Button>
                  <div className="flex gap-2">
                    <CompareButton productId={product.id} variant="text" />
                    {product.seller_id && (
                      <ContactSellerButton productId={product.id} sellerId={product.seller_id} productName={product.product_name} />
                    )}
                  </div>
                  {product.installation_instructions_url && (
                    <a
                      href={isDeactivated ? undefined : product.installation_instructions_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={isDeactivated ? "pointer-events-none" : ""}
                    >
                      <Button variant="outline" size="sm" className="w-full text-xs" disabled={isDeactivated}>
                        <Download className="w-3 h-3 mr-2" />
                        Download Installation Instructions
                      </Button>
                    </a>
                  )}
                </div>

                <TrustBadgeBar />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ ZONE 2: DETAIL TABS ═══ */}
        <div className="relative">
          <Tabs defaultValue="specs">
            {/* Sticky tab bar */}
            <div className="sticky top-0 z-30 bg-background border-b shadow-sm">
              <div className="container mx-auto px-4">
                <TabsList className="bg-transparent h-auto p-0 gap-0 overflow-x-auto flex w-full justify-start rounded-none">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>

            {/* Tab content + optional mini sidebar */}
            <div className="container mx-auto px-4">
              <div className="flex gap-8">
                <div className="max-w-5xl mx-auto py-8 flex-1 min-w-0">
                  {/* SPECIFICATIONS */}
                  <TabsContent value="specs" className="mt-0">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {specItems.map((item, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 border rounded-md">
                            <div className="mt-0.5">{item.icon}</div>
                            <div>
                              <p className="text-xs text-muted-foreground">{item.label}</p>
                              <p className="text-sm font-medium text-foreground">{item.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {product.compatible_kitchen_layouts && product.compatible_kitchen_layouts.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold text-foreground">Compatible Kitchen Layouts</h3>
                          <p className="text-xs text-muted-foreground">This cabinet set fits the following kitchen configurations</p>
                          <div className="flex flex-wrap gap-1.5">
                            {product.compatible_kitchen_layouts.map((layout: string) => (
                              <Badge key={layout} variant="secondary" className="text-xs">{layout}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* HARDWARE */}
                  {hasHardware && (
                    <TabsContent value="hardware" className="mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {activeHwSections.map((sec) => (
                          <div key={sec.label} className="border rounded-lg p-4 space-y-3">
                            {sec.data?.image_url && (
                              <button
                                onClick={() => setHwImageOpen(sec.data.image_url)}
                                className="w-16 h-16 rounded overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                <img src={sec.data.image_url} alt={sec.label} className="w-full h-full object-cover" />
                              </button>
                            )}
                            <p className="text-sm font-semibold text-foreground">{sec.label}</p>
                            <div className="space-y-1">
                              {sec.fields.map(([label, val]) =>
                                val ? (
                                  <div key={label}>
                                    <span className="text-muted-foreground text-xs">{label}: </span>
                                    <span className="text-foreground text-sm">{val}</span>
                                  </div>
                                ) : null
                              )}
                            </div>
                            {sec.data?.specs?.length > 0 && (
                              <div className="pt-1 border-t space-y-0.5">
                                {sec.data.specs.map((sp: any, i: number) => (
                                  <p key={i} className="text-xs text-muted-foreground">
                                    {sp.key}: <span className="text-foreground">{sp.value}</span>
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  )}

                  {/* FEATURES */}
                  {hasFeatures && (
                    <TabsContent value="features" className="mt-0">
                      <div className="border rounded-md divide-y">
                        {af.map((feat: any, i: number) => (
                          <div key={i} className="flex justify-between px-4 py-3 text-sm">
                            <span className="text-muted-foreground">{feat.key}</span>
                            <span className="text-foreground font-medium">{feat.value}</span>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  )}

                  {/* ADD-ONS (full detail) */}
                  {hasAddOns && (
                    <TabsContent value="addons" className="mt-0">
                      <div className="space-y-4">
                        {/* Countertop sections */}
                        {product.countertop_option === "yes" && (
                          <div className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">Countertop</p>
                              <Badge variant={product.countertop_included ? "default" : "secondary"} className="text-[10px]">
                                {product.countertop_included ? "Included" : "Available separately"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              {product.countertop_material && <div><p className="text-xs text-muted-foreground">Material</p><p className="font-medium text-foreground">{product.countertop_material}</p></div>}
                              {product.countertop_thickness && <div><p className="text-xs text-muted-foreground">Thickness</p><p className="font-medium text-foreground">{product.countertop_thickness}</p></div>}
                              {product.countertop_finish && <div><p className="text-xs text-muted-foreground">Finish</p><p className="font-medium text-foreground">{product.countertop_finish}</p></div>}
                              {product.countertop_stock != null && product.countertop_stock > 0 && <div><p className="text-xs text-muted-foreground">Units in Stock</p><p className="font-medium text-foreground">{product.countertop_stock}</p></div>}
                            </div>
                          </div>
                        )}
                        {product.countertop_option === "optional" && (
                          <div className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">Countertop (Optional Add-on)</p>
                              <Badge variant="outline" className="text-[10px]">Optional</Badge>
                            </div>
                            <div className="flex items-end gap-3">
                              <span className="text-xl font-bold text-foreground">CA${Number(product.countertop_price_discounted).toLocaleString()}</span>
                              {Number(product.countertop_price_retail) > Number(product.countertop_price_discounted) && (
                                <span className="text-sm text-muted-foreground line-through">CA${Number(product.countertop_price_retail).toLocaleString()}</span>
                              )}
                              {Number(product.countertop_discount_percentage) > 0 && (
                                <Badge variant="destructive" className="text-xs">{product.countertop_discount_percentage}% OFF</Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              {product.countertop_material && <div><p className="text-xs text-muted-foreground">Material</p><p className="font-medium text-foreground">{product.countertop_material}</p></div>}
                              {product.countertop_thickness && <div><p className="text-xs text-muted-foreground">Thickness</p><p className="font-medium text-foreground">{product.countertop_thickness}</p></div>}
                              {product.countertop_finish && <div><p className="text-xs text-muted-foreground">Finish</p><p className="font-medium text-foreground">{product.countertop_finish}</p></div>}
                              {product.countertop_stock != null && product.countertop_stock > 0 && <div><p className="text-xs text-muted-foreground">Units in Stock</p><p className="font-medium text-foreground">{product.countertop_stock}</p></div>}
                            </div>
                          </div>
                        )}

                        {/* Product options — full detail cards with checkboxes */}
                        {displayOpts.map((opt: any) => renderAddOnRow(opt, false))}

                        {/* Running total */}
                        {displayOpts.length > 0 && (
                          <>
                            <Separator />
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Product: ${productPrice.toLocaleString()}
                                {addOnTotal > 0 && ` + Add-ons: $${addOnTotal.toLocaleString()}`}
                              </span>
                              <span className="font-bold text-foreground text-base">Total: ${grandTotal.toLocaleString()}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </TabsContent>
                  )}

                  {/* APPLIANCES */}
                  {hasAppliances && (
                    <TabsContent value="appliances" className="mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {productAppliances.map((app: any) => {
                          const dims = (app.dimensions as any) || {};
                          return (
                            <div key={app.id} className="border rounded-lg p-4 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{(app.appliance_type || "").replace(/_/g, " ")}</Badge>
                                {app.brand && <span className="text-sm font-semibold text-foreground">{app.brand}</span>}
                              </div>
                              {(app.model_name || app.model_number) && (
                                <p className="text-sm text-foreground">
                                  {app.model_name}{app.model_name && app.model_number && " · "}{app.model_number}
                                </p>
                              )}
                              {(dims.width_mm > 0 || dims.height_mm > 0 || dims.depth_mm > 0) && (
                                <p className="text-xs text-muted-foreground font-mono">
                                  {[dims.width_mm > 0 && `W: ${dims.width_mm}mm`, dims.height_mm > 0 && `H: ${dims.height_mm}mm`, dims.depth_mm > 0 && `D: ${dims.depth_mm}mm`].filter(Boolean).join(" · ")}
                                </p>
                              )}
                              {app.notes && <p className="text-xs text-muted-foreground">{app.notes}</p>}
                            </div>
                          );
                        })}
                      </div>
                    </TabsContent>
                  )}

                  {/* DESCRIPTION */}
                  {hasDescription && (
                    <TabsContent value="description" className="mt-0">
                      <div className="max-w-3xl">
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                          {product.long_description}
                        </p>
                      </div>
                    </TabsContent>
                  )}

                  {/* Q&A (placeholder) */}
                  <TabsContent value="qa" className="mt-0">
                    <div className="text-center py-12 space-y-4">
                      <h3 className="text-lg font-serif font-semibold text-foreground">Questions & Answers</h3>
                      <p className="text-muted-foreground text-sm">Have a question about this product? Sign in to ask the seller.</p>
                      <Link to="/login">
                        <Button variant="outline">Sign In to Ask</Button>
                      </Link>
                    </div>
                  </TabsContent>

                  {/* REVIEWS */}
                  <TabsContent value="reviews" className="mt-0">
                    <ProductReviews productId={product.id} />
                  </TabsContent>
                </div>
              </div>
            </div>
          </Tabs>

          {/* ── Desktop Sticky Mini Sidebar ── */}
          {showMiniSidebar && (
            <div className="hidden lg:block fixed right-6 top-20 z-40 w-72 border rounded-lg bg-background shadow-lg p-4 space-y-3 animate-in slide-in-from-right-5 duration-300">
              <p className="text-sm font-semibold text-foreground truncate">{product.product_name}</p>
              <p className="text-xl font-bold text-foreground">${Number(product.price_discounted_usd).toLocaleString()}</p>
              <Button
                size="sm"
                className="w-full"
                disabled={isDeactivated || qtyInCart >= product.stock_level}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {qtyInCart > 0 ? `In Cart (${qtyInCart})` : "Add to Cart"}
              </Button>
            </div>
          )}
        </div>

        {/* ═══ ZONE 3: RELATED PRODUCTS ═══ */}
        {relatedProducts.length > 0 && (
          <div className="container mx-auto px-4 py-12">
            <h2 className="text-xl font-serif font-bold text-foreground mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedProducts.map((rp: any) => (
                <Link key={rp.id} to={`/product/${rp.id}`} className="group">
                  <div className="border rounded-md overflow-hidden bg-secondary/20 hover:shadow-md transition-shadow">
                    <div className="aspect-square overflow-hidden">
                      <img src={rp.main_image_url || "/placeholder.svg"} alt={rp.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-foreground truncate">{rp.product_name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-sm font-bold text-foreground">${Number(rp.price_discounted_usd).toLocaleString()}</span>
                        {Number(rp.discount_percentage) > 0 && (
                          <Badge variant="destructive" className="text-[9px] px-1 py-0">{rp.discount_percentage}%</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Hardware image lightbox */}
      <Dialog open={!!hwImageOpen} onOpenChange={() => setHwImageOpen(null)}>
        <DialogContent className="max-w-lg p-2">
          {hwImageOpen && <img src={hwImageOpen} alt="Hardware detail" className="w-full h-auto rounded" />}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Product;
