import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ArrowLeft, Package, Ruler, Palette, Layers, Info, ShoppingCart, Download, ChevronDown, MessageSquare, Truck, MapPin, RefreshCw } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  const [deliveryChoice, setDeliveryChoice] = useState<'delivery' | 'pickup'>('delivery');

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
    // Determine delivery info for main product
    const dOpt = product.delivery_option || 'pickup_only';
    const effectiveChoice: 'delivery' | 'pickup' | null =
      dOpt === 'delivery' ? 'delivery'
      : dOpt === 'pickup_only' ? 'pickup'
      : deliveryChoice; // 'both' — user selected

    dispatch({
      type: "ADD_ITEM",
      payload: {
        productId: product.id,
        name: product.product_name,
        image: product.main_image_url || "/placeholder.svg",
        price: product.price_discounted_usd,
        dimensions: hasSimpleWidth
          ? `${product.width_mm} × ${product.height_mm} × ${product.depth_mm} mm`
          : hasWallA
          ? `A: ${product.wall_a_length_mm}${hasWallB ? ` × B: ${product.wall_b_length_mm}` : ""} | H: ${product.height_mm} × D: ${product.depth_mm} mm`
          : `${product.height_mm} × ${product.depth_mm} mm`,
        maxStock: product.stock_level,
        deliveryChoice: effectiveChoice,
        deliveryPrice: effectiveChoice === 'delivery' ? Number(product.delivery_price) || 0 : 0,
        deliveryPrepDays: effectiveChoice === 'delivery' ? (product.delivery_prep_days || 5) : (product.pickup_prep_days || 5),
        pickupAddress: product.pickup_address || '',
        pickupCity: product.pickup_city || '',
        pickupProvince: product.pickup_province || 'Ontario',
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

    toast.success(qtyInCart > 0 ? "Cart updated" : "Added to cart", {
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

  // Spec items — handle multi-wall layouts
  const hasSimpleWidth = product.width_mm && product.width_mm > 0;
  const hasWallA = product.wall_a_length_mm && product.wall_a_length_mm > 0;
  const hasWallB = product.wall_b_length_mm && product.wall_b_length_mm > 0;
  const hasWallC = product.wall_c_length_mm && product.wall_c_length_mm > 0;
  const hasMultiWall = hasWallA;
  const hasAnyWidth = hasSimpleWidth || hasMultiWall;
  const hasHeight = product.height_mm && product.height_mm > 0;
  const hasDepth = product.depth_mm && product.depth_mm > 0;
  const hasDimensions = hasAnyWidth || hasHeight || hasDepth;

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
    if (hasMultiWall && !hasSimpleWidth) {
      // Multi-wall format
      const wallParts = [
        hasWallA && `Wall A: ${fmtDim(product.wall_a_length_mm!)}`,
        hasWallB && `Wall B: ${fmtDim(product.wall_b_length_mm!)}`,
        hasWallC && `Wall C: ${fmtDim(product.wall_c_length_mm!)}`,
      ].filter(Boolean);
      const otherParts = [
        hasHeight && `H: ${fmtDim(product.height_mm)}`,
        hasDepth && `D: ${fmtDim(product.depth_mm)}`,
      ].filter(Boolean);
      specItems.push({ icon: <Ruler className="w-4 h-4 text-muted-foreground" />, label: "Dimensions", value: [...wallParts, ...otherParts].join("  ·  ") });
    } else {
      // Simple W × H × D format
      const w = fmtDim(product.width_mm);
      const h = fmtDim(product.height_mm);
      const d = fmtDim(product.depth_mm);
      const parts = [w && `W: ${w}`, h && `H: ${h}`, d && `D: ${d}`].filter(Boolean);
      specItems.push({ icon: <Ruler className="w-4 h-4 text-muted-foreground" />, label: "Dimensions", value: parts.join("  ·  ") });
    }
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
  tabs.push({ id: "delivery", label: "Delivery" });
  if (hasAppliances) tabs.push({ id: "appliances", label: "Appliances" });
  if (hasDescription) tabs.push({ id: "description", label: "Description" });
  tabs.push({ id: "qa", label: "Q&A" });
  tabs.push({ id: "reviews", label: "Reviews" });

  const handleAskAboutAddOn = (opt: any) => {
    setQaPrefill({ text: `Question about: ${opt.option_name} — `, optionId: opt.id });
    setActiveTab("qa");
  };

  // ── Add-on row renderer (shared between hero compact & full tab) ──
  const renderAddOnRow = (opt: any, compact: boolean) => {
    const isIncluded = opt.inclusion_status === "included";
    const price = getOptPrice(opt);
    const hasDiscount = Number(opt.discount_percentage) > 0 && Number(opt.price_retail) > Number(opt.price_discounted);
    const hasExtraDetails = !!opt.description;

    return (
      <div key={opt.id} className={`${compact ? "py-2" : "border rounded-lg p-4"}`}>
        <div className="flex items-start gap-3">
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
            {/* Enhanced: collapsible details + ask link (full mode only) */}
            {!compact && (
              <div className="flex items-center gap-4 mt-2">
                {hasExtraDetails && (
                  <Collapsible>
                    <CollapsibleTrigger className="text-xs text-primary hover:underline flex items-center gap-1">
                      <ChevronDown className="w-3 h-3" /> More Details
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 text-xs text-muted-foreground bg-muted/30 rounded p-3">
                      {opt.description}
                    </CollapsibleContent>
                  </Collapsible>
                )}
                <button
                  onClick={() => handleAskAboutAddOn(opt)}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" /> Ask about this
                </button>
              </div>
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

                {/* ── Delivery & Pickup ── */}
                {(() => {
                  const dOpt = product.delivery_option;
                  const hasDeliveryInfo = dOpt && dOpt !== 'pickup_only' || dOpt === 'pickup_only';
                  const hasAnyDeliveryField = dOpt === 'delivery' || dOpt === 'pickup_only' || dOpt === 'both';

                  if (!hasAnyDeliveryField) {
                    // Legacy product without delivery info
                    return (
                      <div className="border rounded-md p-4 bg-muted/30">
                        <p className="text-sm font-semibold text-foreground mb-2">Delivery & Pickup</p>
                        <p className="text-xs text-muted-foreground mb-3">Contact seller for delivery and pickup arrangements</p>
                        {product.seller_id && (
                          <ContactSellerButton productId={product.id} sellerId={product.seller_id} productName={product.product_name} />
                        )}
                      </div>
                    );
                  }

                  if (dOpt === 'delivery') {
                    return (
                      <div className="border rounded-md p-4 space-y-2">
                        <p className="text-sm font-semibold text-foreground">Delivery & Pickup</p>
                        <div className="flex items-start gap-2">
                          <Truck className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Delivery Available</p>
                            <p className="text-xs text-muted-foreground">
                              ${Number(product.delivery_price || 0).toFixed(2)} — {product.delivery_zone || 'Local area'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Estimated {product.delivery_prep_days || 5} business days preparation
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (dOpt === 'pickup_only') {
                    return (
                      <div className="border rounded-md p-4 space-y-2">
                        <p className="text-sm font-semibold text-foreground">Delivery & Pickup</p>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Pickup Only</p>
                            <p className="text-xs text-muted-foreground">
                              {[product.pickup_address, product.pickup_city, product.pickup_province, product.pickup_postal_code].filter(Boolean).join(', ')}
                            </p>
                            {product.pickup_phone && (
                              <p className="text-xs text-muted-foreground">Phone: {product.pickup_phone}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Estimated {product.pickup_prep_days || 5} business days preparation
                            </p>
                            <p className="text-[10px] text-muted-foreground/70 mt-1">
                              We'll notify you when your order is ready for pickup. Please do not visit before receiving confirmation.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // dOpt === 'both'
                  return (
                    <div className="border rounded-md p-4 space-y-3">
                      <p className="text-sm font-semibold text-foreground">Delivery & Pickup</p>
                      <RadioGroup value={deliveryChoice} onValueChange={(v) => setDeliveryChoice(v as 'delivery' | 'pickup')}>
                        <label className={`flex items-start gap-3 border rounded-md p-3 cursor-pointer transition-colors ${deliveryChoice === 'delivery' ? 'border-foreground bg-muted/30' : 'border-border'}`}>
                          <RadioGroupItem value="delivery" id="del-delivery" className="mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                              <Label htmlFor="del-delivery" className="text-sm font-medium cursor-pointer">
                                Delivery — ${Number(product.delivery_price || 0).toFixed(2)}
                              </Label>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{product.delivery_zone || 'Local area'}</p>
                            <p className="text-xs text-muted-foreground">Est. {product.delivery_prep_days || 5} business days prep</p>
                          </div>
                        </label>
                        <label className={`flex items-start gap-3 border rounded-md p-3 cursor-pointer transition-colors ${deliveryChoice === 'pickup' ? 'border-foreground bg-muted/30' : 'border-border'}`}>
                          <RadioGroupItem value="pickup" id="del-pickup" className="mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                              <Label htmlFor="del-pickup" className="text-sm font-medium cursor-pointer">Pickup — Free</Label>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {[product.pickup_address, product.pickup_city, product.pickup_province].filter(Boolean).join(', ')}
                            </p>
                            {product.pickup_phone && <p className="text-xs text-muted-foreground">Phone: {product.pickup_phone}</p>}
                            <p className="text-xs text-muted-foreground">Est. {product.pickup_prep_days || 5} business days prep</p>
                          </div>
                        </label>
                      </RadioGroup>
                    </div>
                  );
                })()}

                {/* Action buttons */}
                <div className="space-y-3 pt-1">
                  <Button
                    size="lg"
                    className="w-full min-h-[48px] shadow-[2px_2px_0px_0px_hsl(var(--foreground))] sm:shadow-[4px_4px_0px_0px_hsl(var(--foreground))]"
                    disabled={isDeactivated || qtyInCart >= product.stock_level}
                    onClick={handleAddToCart}
                  >
                    {qtyInCart > 0 ? <RefreshCw className="w-4 h-4 mr-2" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
                    {isDeactivated ? "Currently Unavailable" : qtyInCart > 0 ? "Update Cart" : "Add to Cart"}
                  </Button>
                  {qtyInCart > 0 && (
                    <p className="text-xs text-muted-foreground text-center mt-1">This will update your current cart selections for this product</p>
                  )}
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
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

                  {/* DELIVERY TAB */}
                  <TabsContent value="delivery" className="mt-0">
                    <div className="space-y-6">
                      {product.delivery_option === 'delivery' && (
                        <Card className="border-2">
                          <CardContent className="p-5 space-y-3">
                            <div className="flex items-center gap-2">
                              <Truck className="w-5 h-5 text-primary" />
                              <h3 className="text-lg font-serif font-semibold text-foreground">Delivery Available</h3>
                            </div>
                            <p className="text-2xl font-bold text-foreground">${Number(product.delivery_price || 0).toFixed(2)} CAD</p>
                            {product.delivery_zone && <p className="text-sm text-muted-foreground">Delivery Zone: {product.delivery_zone}</p>}
                            <p className="text-sm text-muted-foreground">Estimated Preparation Time: {product.delivery_prep_days || 5} business days</p>
                            <p className="text-xs text-muted-foreground">The seller will prepare your order and deliver it to your address. You will receive a notification when your order is being prepared.</p>
                          </CardContent>
                        </Card>
                      )}

                      {product.delivery_option === 'pickup_only' && (
                        <Card className="border-2">
                          <CardContent className="p-5 space-y-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-5 h-5 text-primary" />
                              <h3 className="text-lg font-serif font-semibold text-foreground">Pickup Only</h3>
                            </div>
                            <p className="text-sm text-foreground">{[product.pickup_address, product.pickup_city, product.pickup_province, product.pickup_postal_code].filter(Boolean).join(", ")}</p>
                            {product.pickup_phone && <p className="text-sm text-muted-foreground">Phone: {product.pickup_phone}</p>}
                            <p className="text-sm text-muted-foreground">Estimated Preparation Time: {product.pickup_prep_days || 5} business days</p>
                            <p className="text-xs text-muted-foreground">The seller will prepare your order for pickup at the address above. You will be notified when your order is ready. Please do not visit the pickup location before receiving confirmation.</p>
                          </CardContent>
                        </Card>
                      )}

                      {product.delivery_option === 'both' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="border-2">
                            <CardContent className="p-5 space-y-3">
                              <div className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-serif font-semibold text-foreground">Delivery</h3>
                              </div>
                              <p className="text-2xl font-bold text-foreground">${Number(product.delivery_price || 0).toFixed(2)} CAD</p>
                              {product.delivery_zone && <p className="text-sm text-muted-foreground">Delivery Zone: {product.delivery_zone}</p>}
                              <p className="text-sm text-muted-foreground">Estimated Preparation Time: {product.delivery_prep_days || 5} business days</p>
                              <p className="text-xs text-muted-foreground">The seller will prepare your order and deliver it to your address. You will receive a notification when your order is being prepared.</p>
                            </CardContent>
                          </Card>
                          <Card className="border-2">
                            <CardContent className="p-5 space-y-3">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-serif font-semibold text-foreground">Pickup (Free)</h3>
                              </div>
                              <p className="text-sm text-foreground">{[product.pickup_address, product.pickup_city, product.pickup_province, product.pickup_postal_code].filter(Boolean).join(", ")}</p>
                              {product.pickup_phone && <p className="text-sm text-muted-foreground">Phone: {product.pickup_phone}</p>}
                              <p className="text-sm text-muted-foreground">Estimated Preparation Time: {product.pickup_prep_days || 5} business days</p>
                              <p className="text-xs text-muted-foreground">The seller will prepare your order for pickup at the address above. You will be notified when your order is ready.</p>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {(!product.delivery_option || !['delivery', 'pickup_only', 'both'].includes(product.delivery_option)) && (
                        <Card className="border">
                          <CardContent className="p-5 text-center space-y-3">
                            <p className="text-sm text-muted-foreground">Delivery and pickup details have not been configured for this product. Please contact the seller for arrangements.</p>
                            {product.seller_id && (
                              <ContactSellerButton productId={product.id} sellerId={product.seller_id} productName={product.product_name} />
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {product.delivery_option === 'both' && (
                        <p className="text-xs text-muted-foreground text-center">You can select your preferred option when adding to cart.</p>
                      )}

                      {/* Ask about Delivery */}
                      <Card className="border">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm text-foreground font-medium">Have questions about delivery or pickup for this product?</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setQaPrefill({ text: "Question about delivery: ", optionId: "" });
                              setActiveTab("qa");
                            }}
                          >
                            Ask a Question about Delivery
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

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

                  {/* Q&A */}
                  <TabsContent value="qa" className="mt-0">
                    <ProductQA
                      productId={product.id}
                      prefillText={qaPrefill?.text}
                      prefillOptionId={qaPrefill?.optionId}
                      onPrefillConsumed={() => setQaPrefill(null)}
                    />
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
