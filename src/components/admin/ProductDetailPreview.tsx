import { useState, useCallback, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Package, Ruler, Palette, Layers, Info, ChevronDown, MessageSquare, Eye, Truck, MapPin } from "lucide-react";
import ProductGallery from "@/components/ProductGallery";

const ProductReviews = lazy(() => import("@/components/ProductReviews"));
const ProductQA = lazy(() => import("@/components/ProductQA"));

const MM_TO_INCH = 0.0393701;
const fmtDim = (mm: number) => {
  if (!mm || mm <= 0) return null;
  return `${mm}mm / ${(mm * MM_TO_INCH).toFixed(1)}″`;
};

interface ProductDetailPreviewProps {
  product: any;
  productOptions: any[];
}

const ProductDetailPreview = ({ product, productOptions }: ProductDetailPreviewProps) => {
  const [hwImageOpen, setHwImageOpen] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("specs");
  const [qaPrefill, setQaPrefill] = useState<{ text: string; optionId: string } | null>(null);
  const [checkedAddOns, setCheckedAddOns] = useState<Set<string>>(() => {
    const included = new Set<string>();
    productOptions.forEach((opt: any) => {
      if (opt.inclusion_status === "included") included.add(opt.id);
    });
    return included;
  });

  const { data: productAppliances = [] } = useQuery({
    queryKey: ["admin-preview-appliances", product.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_compatible_appliances")
        .select("*")
        .eq("product_id", product.id)
        .order("sort_order");
      return data || [];
    },
    enabled: !!product?.id,
  });

  const toggleAddOn = (optId: string) => {
    setCheckedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(optId)) next.delete(optId);
      else next.add(optId);
      return next;
    });
  };

  const isDeactivated = product.availability_status === "Deactivated";

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
  const savings = product.price_retail_usd - product.price_discounted_usd;

  // Dimensions
  const hasSimpleWidth = product.width_mm && product.width_mm > 0;
  const hasWallA = product.wall_a_length_mm && product.wall_a_length_mm > 0;
  const hasWallB = product.wall_b_length_mm && product.wall_b_length_mm > 0;
  const hasWallC = product.wall_c_length_mm && product.wall_c_length_mm > 0;
  const hasMultiWall = hasWallA;
  const hasAnyWidth = hasSimpleWidth || hasMultiWall;
  const hasHeight = product.height_mm && product.height_mm > 0;
  const hasDepth = product.depth_mm && product.depth_mm > 0;
  const hasDimensions = hasAnyWidth || hasHeight || hasDepth;

  // Spec items
  const specItems: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (hasDimensions) {
    if (hasMultiWall && !hasSimpleWidth) {
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

  // Hardware
  const hw = product.hardware_details as any;
  const hasHw = hw && typeof hw === "object" && (hw.hinges?.brand || hw.drawer_slides?.brand || hw.handles?.type);
  const hasFlat = !hasHw && (product.hinge_brand || product.slide_brand);
  const hasHardware = hasHw || hasFlat;

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

  const af = product.additional_features as any[];
  const hasFeatures = af?.length > 0;

  const displayOpts = productOptions.filter((o: any) => o.option_name);
  const hasCountertop = product.countertop_option && product.countertop_option !== "no";
  const hasAddOns = displayOpts.length > 0 || hasCountertop;
  const hasAppliances = productAppliances.length > 0;
  const hasDescription = !!product.long_description;

  // Tabs
  const tabs: { id: string; label: string }[] = [{ id: "specs", label: "Specifications" }];
  if (hasHardware) tabs.push({ id: "hardware", label: "Hardware" });
  if (hasFeatures) tabs.push({ id: "features", label: "Features" });
  if (hasAddOns) tabs.push({ id: "addons", label: "Add-Ons" });
  if (hasAppliances) tabs.push({ id: "appliances", label: "Appliances" });
  if (hasDescription) tabs.push({ id: "description", label: "Description" });
  tabs.push({ id: "qa", label: "Q&A" });
  tabs.push({ id: "reviews", label: "Reviews" });

  const handleAskAboutAddOn = useCallback((opt: any) => {
    setQaPrefill({ text: `Question about: ${opt.option_name} — `, optionId: opt.id });
    setActiveTab("qa");
  }, []);

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
    <div className="border rounded-lg bg-background overflow-hidden">
      {/* Preview banner */}
      <div className="bg-muted px-4 py-2 text-xs text-muted-foreground text-center border-b flex items-center justify-center gap-2">
        <Eye className="w-3 h-3" />
        Storefront Preview — this is how customers will see this product
      </div>

      {/* ═══ ZONE 1: HERO ═══ */}
      <div className="p-4 md:p-8">
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

          {/* RIGHT: Purchase Decision (read-only preview) */}
          <div className="space-y-4">
            <div>
              {product.categories?.name && (
                <Badge variant="outline" className="mb-2">{product.categories.name}</Badge>
              )}
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                {product.product_name}
              </h1>
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

            {product.short_description && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{product.short_description}</p>
            )}

            {/* Add-On Quick Selector */}
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

            {/* No cart/wishlist/compare buttons — admin preview */}
            <div className="border rounded-md p-3 bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Cart, wishlist, and contact buttons appear here for customers</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ZONE 2: DETAIL TABS ═══ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="sticky top-0 z-30 bg-background border-b shadow-sm">
          <div className="px-4 md:px-8">
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

        <div className="px-4 md:px-8 py-8 max-w-5xl">
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

          {/* ADD-ONS */}
          {hasAddOns && (
            <TabsContent value="addons" className="mt-0">
              <div className="space-y-4">
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
                {displayOpts.map((opt: any) => renderAddOnRow(opt, false))}
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

          {/* Q&A */}
          <TabsContent value="qa" className="mt-0">
            <Suspense fallback={<div className="py-8 text-center text-muted-foreground text-sm">Loading Q&A...</div>}>
              <ProductQA
                productId={product.id}
                prefillText={qaPrefill?.text}
                prefillOptionId={qaPrefill?.optionId}
                onPrefillConsumed={() => setQaPrefill(null)}
              />
            </Suspense>
          </TabsContent>

          {/* REVIEWS */}
          <TabsContent value="reviews" className="mt-0">
            <Suspense fallback={<div className="py-8 text-center text-muted-foreground text-sm">Loading Reviews...</div>}>
              <ProductReviews productId={product.id} />
            </Suspense>
          </TabsContent>
        </div>
      </Tabs>

      {/* Hardware image lightbox */}
      <Dialog open={!!hwImageOpen} onOpenChange={() => setHwImageOpen(null)}>
        <DialogContent className="max-w-lg p-2">
          {hwImageOpen && <img src={hwImageOpen} alt="Hardware detail" className="w-full h-auto rounded" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetailPreview;
