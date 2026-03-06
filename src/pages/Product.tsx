import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, Package, Ruler, Palette, Layers, Info, ShoppingCart, Wrench, X } from "lucide-react";
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

const MM_TO_INCH = 0.0393701;
const fmtDim = (mm: number) => {
  if (!mm || mm <= 0) return null;
  return `${mm}mm / ${(mm * MM_TO_INCH).toFixed(1)}″`;
};

const Product = () => {
  const { id } = useParams<{ id: string }>();
  usePageMeta();

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

  // Check if product is approved for public viewing
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

  const handleAddToCart = () => {
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
    toast.success("Added to cart", {
      action: { label: "View Cart", onClick: () => window.location.href = "/cart" },
    });
  };

  // ── Compute tab data availability ──
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

  // Dimensions display helper
  const dimParts: string[] = [];
  if (product.width_mm && product.width_mm > 0) dimParts.push(`${product.width_mm}`);
  if (product.height_mm && product.height_mm > 0) dimParts.push(`${product.height_mm}`);
  if (product.depth_mm && product.depth_mm > 0) dimParts.push(`${product.depth_mm}`);
  const hasDimensions = dimParts.length > 0;

  // Hardware sections
  const hwSections = hasHw ? [
    { label: "Hinges", data: hw.hinges, fields: [["Brand", hw.hinges?.brand], ["Model", hw.hinges?.model]] as [string, string][] },
    { label: "Drawer Slides", data: hw.drawer_slides, fields: [["Brand", hw.drawer_slides?.brand], ["Model", hw.drawer_slides?.model]] as [string, string][] },
    { label: "Handles", data: hw.handles, fields: [["Type", hw.handles?.type], ["Finish", hw.handles?.finish]] as [string, string][] },
  ] : hasFlat ? [
    { label: "Hinges", data: null, fields: [["Brand", product.hinge_brand], ["Model", product.hinge_model]] as [string, string][] },
    { label: "Drawer Slides", data: null, fields: [["Brand", product.slide_brand], ["Model", product.slide_model]] as [string, string][] },
  ] : [];
  const activeHwSections = hwSections.filter(s => s.fields.some(([, v]) => v));

  // Spec items
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

  // Available tabs
  const tabs: { id: string; label: string }[] = [
    { id: "specs", label: "Specifications" },
  ];
  if (hasHardware) tabs.push({ id: "hardware", label: "Hardware" });
  if (hasFeatures) tabs.push({ id: "features", label: "Features" });
  if (hasAddOns) tabs.push({ id: "addons", label: "Add-Ons" });
  if (hasAppliances) tabs.push({ id: "appliances", label: "Appliances" });
  if (hasDescription) tabs.push({ id: "description", label: "Description" });
  tabs.push({ id: "reviews", label: "Reviews" });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-10 pt-24 md:pt-10">
        <Breadcrumbs
          items={[
            { label: "Browse", href: "/browse" },
            ...(product.categories?.name
              ? [{ label: product.categories.name, href: `/browse?category=${(product.categories as any)?.slug || ""}` }]
              : []),
            { label: product.product_name },
          ]}
        />
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to all products
        </Link>

        {/* ═══ HERO SECTION ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
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

          {/* RIGHT: Product info */}
          <div className="space-y-6">
            <div>
              {product.categories?.name && (
                <Badge variant="outline" className="mb-2">{product.categories.name}</Badge>
              )}
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                  {product.product_name}
                </h1>
                <WishlistButton productId={product.id} size="md" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">SKU: {product.product_code}</p>
            </div>

            {/* Pricing */}
            <div className="border p-5 space-y-2">
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold text-foreground">
                  ${Number(product.price_discounted_usd).toLocaleString()}
                </span>
                <span className="text-lg text-muted-foreground line-through mb-0.5">
                  ${Number(product.price_retail_usd).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Plus applicable HST (13%)</p>
              <p className="text-sm text-muted-foreground">
                You save <span className="font-semibold text-foreground">${savings.toLocaleString()}</span>
              </p>
              <Badge variant={product.availability_status === "In Stock" ? "default" : "secondary"}>
                {product.availability_status}
              </Badge>
            </div>

            {/* Short description */}
            {product.short_description && (
              <p className="text-muted-foreground leading-relaxed">{product.short_description}</p>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                size="lg"
                className="w-full sm:flex-1 min-h-[48px] shadow-[2px_2px_0px_0px_hsl(var(--foreground))] sm:shadow-[4px_4px_0px_0px_hsl(var(--foreground))]"
                disabled={isDeactivated || qtyInCart >= product.stock_level}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {isDeactivated ? "Currently Unavailable" : qtyInCart > 0 ? `In Cart (${qtyInCart})` : "Add to Cart"}
              </Button>
              <CompareButton productId={product.id} variant="text" />
              {product.seller_id && (
                <ContactSellerButton productId={product.id} sellerId={product.seller_id} productName={product.product_name} />
              )}
              {product.installation_instructions_url && (
                <a
                  href={isDeactivated ? undefined : product.installation_instructions_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full sm:flex-1 ${isDeactivated ? "pointer-events-none" : ""}`}
                >
                  <Button variant="outline" size="sm" className="w-full h-full min-h-[44px] text-xs shadow-[0_4px_12px_hsla(var(--muted-foreground),0.3)]" disabled={isDeactivated}>
                    Download Installation Instructions
                  </Button>
                </a>
              )}
            </div>

            <TrustBadgeBar />
          </div>
        </div>

        {/* ═══ TABBED SECTION ═══ */}
        <div className="mt-12">
          <Tabs defaultValue="specs">
            <div className="sticky top-0 z-30 bg-background border-b">
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

            <div className="max-w-4xl mx-auto py-8">
              {/* SPECIFICATIONS TAB */}
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

                  {/* Compatible Layouts */}
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

              {/* HARDWARE TAB */}
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
                          {sec.fields.map(([label, val]) => val ? (
                            <div key={label}>
                              <span className="text-muted-foreground text-xs">{label}: </span>
                              <span className="text-foreground text-sm">{val}</span>
                            </div>
                          ) : null)}
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

              {/* FEATURES TAB */}
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

              {/* ADD-ONS TAB */}
              {hasAddOns && (
                <TabsContent value="addons" className="mt-0">
                  <div className="space-y-4">
                    {/* Countertop */}
                    {product.countertop_option === "yes" && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">Countertop</p>
                            <Badge variant={product.countertop_included ? "default" : "secondary"} className="text-[10px]">
                              {product.countertop_included ? "Included" : "Available separately"}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {product.countertop_stock != null && product.countertop_stock > 0 && (
                            <div><p className="text-xs text-muted-foreground">Units in Stock</p><p className="font-medium text-foreground">{product.countertop_stock}</p></div>
                          )}
                          {product.countertop_material && (
                            <div><p className="text-xs text-muted-foreground">Material</p><p className="font-medium text-foreground">{product.countertop_material}</p></div>
                          )}
                          {product.countertop_thickness && (
                            <div><p className="text-xs text-muted-foreground">Thickness</p><p className="font-medium text-foreground">{product.countertop_thickness}</p></div>
                          )}
                          {product.countertop_finish && (
                            <div><p className="text-xs text-muted-foreground">Finish</p><p className="font-medium text-foreground">{product.countertop_finish}</p></div>
                          )}
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
                          <span className="text-xl font-bold text-foreground">
                            CA${Number(product.countertop_price_discounted).toLocaleString()}
                          </span>
                          {Number(product.countertop_price_retail) > Number(product.countertop_price_discounted) && (
                            <span className="text-sm text-muted-foreground line-through">
                              CA${Number(product.countertop_price_retail).toLocaleString()}
                            </span>
                          )}
                          {Number(product.countertop_discount_percentage) > 0 && (
                            <Badge variant="destructive" className="text-xs">{product.countertop_discount_percentage}% OFF</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {product.countertop_stock != null && product.countertop_stock > 0 && (
                            <div><p className="text-xs text-muted-foreground">Units in Stock</p><p className="font-medium text-foreground">{product.countertop_stock}</p></div>
                          )}
                          {product.countertop_material && (
                            <div><p className="text-xs text-muted-foreground">Material</p><p className="font-medium text-foreground">{product.countertop_material}</p></div>
                          )}
                          {product.countertop_thickness && (
                            <div><p className="text-xs text-muted-foreground">Thickness</p><p className="font-medium text-foreground">{product.countertop_thickness}</p></div>
                          )}
                          {product.countertop_finish && (
                            <div><p className="text-xs text-muted-foreground">Finish</p><p className="font-medium text-foreground">{product.countertop_finish}</p></div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Product Options */}
                    {displayOpts.map((opt: any) => {
                      const hasDiscount = Number(opt.discount_percentage) > 0 && Number(opt.price_retail) > Number(opt.price_discounted);
                      return (
                        <div key={opt.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{opt.option_name}</p>
                              <Badge variant="outline" className="text-[10px]">{(opt.option_type || "").replace(/_/g, " ")}</Badge>
                              <Badge variant={opt.inclusion_status === "included" ? "default" : "secondary"} className="text-[10px]">
                                {opt.inclusion_status === "included" ? "Included" : opt.inclusion_status === "optional" ? "Optional" : "Not Included"}
                              </Badge>
                            </div>
                            {opt.inclusion_status === "optional" && Number(opt.price_discounted) > 0 && (
                              <div className="flex items-center gap-2">
                                {hasDiscount && (
                                  <>
                                    <span className="text-xs text-muted-foreground line-through">${Number(opt.price_retail).toLocaleString()}</span>
                                    <Badge variant="destructive" className="text-[10px]">-{opt.discount_percentage}%</Badge>
                                  </>
                                )}
                                <span className="text-sm font-bold text-foreground">${Number(opt.price_discounted).toLocaleString()}</span>
                              </div>
                            )}
                            {opt.inclusion_status === "optional" && !Number(opt.price_discounted) && Number(opt.price_retail) > 0 && (
                              <span className="text-sm font-bold text-foreground">${Number(opt.price_retail).toLocaleString()}</span>
                            )}
                          </div>
                          {opt.description && <p className="text-xs text-muted-foreground">{opt.description}</p>}
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              )}

              {/* APPLIANCES TAB */}
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

              {/* DESCRIPTION TAB */}
              {hasDescription && (
                <TabsContent value="description" className="mt-0">
                  <div className="prose max-w-none">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {product.long_description}
                    </p>
                  </div>
                </TabsContent>
              )}

              {/* REVIEWS TAB */}
              <TabsContent value="reviews" className="mt-0">
                <ProductReviews productId={product.id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      {/* Hardware image lightbox */}
      <Dialog open={!!hwImageOpen} onOpenChange={() => setHwImageOpen(null)}>
        <DialogContent className="max-w-lg p-2">
          {hwImageOpen && (
            <img src={hwImageOpen} alt="Hardware detail" className="w-full h-auto rounded" />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Product;
