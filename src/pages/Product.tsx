import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, Truck, MapPin, MessageSquare } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProductDetailSkeleton } from "@/components/ui/product-detail-skeleton";
import ProductReviews from "@/components/ProductReviews";
import ProductQA from "@/components/ProductQA";
import ContactSellerButton from "@/components/ContactSellerButton";

import { useProductData } from "@/hooks/useProductData";
import { useProductCart } from "@/hooks/useProductCart";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ChatWidget from "@/components/chat/ChatWidget";

import ProductHero from "@/components/product/ProductHero";
import ProductSpecs from "@/components/product/ProductSpecs";
import ProductAddOns from "@/components/product/ProductAddOns";
import ProductStickySidebar from "@/components/product/ProductStickySidebar";

const Product = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { product, isLoading, error, productOptions, productAppliances, relatedProducts } = useProductData(id);

  // Separate mobile check for chat widget (640px) vs general mobile (768px)
  const [isChatMobile, setIsChatMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsChatMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Dynamic SEO meta
  usePageMeta({
    title: product ? `${product.product_name} — FitMatch` : "Loading…",
    description: product
      ? ((product.short_description || product.long_description || "Premium European cabinet available at FitMatch.").slice(0, 155))
      : undefined,
    ogType: "product",
    ogImage: product?.main_image_url || undefined,
    ogUrl: id ? `https://fitmatch.ca/product/${id}` : undefined,
  });

  const {
    qtyInCart,
    checkedAddOns,
    toggleAddOn,
    deliveryChoice,
    setDeliveryChoice,
    displayOpts,
    addOnTotal,
    productPrice,
    grandTotal,
    handleAddToCart,
  } = useProductCart(product, productOptions);

  const [hwImageOpen, setHwImageOpen] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("specs");
  const [qaPrefill, setQaPrefill] = useState<{ text: string; optionId: string } | null>(null);

  // ── Chatbot widget settings from site_settings ──
  const { data: chatbotSettings } = useQuery({
    queryKey: ["chatbot-widget-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["chatbot_auto_open_delay_seconds", "chatbot_consent_modal_enabled"]);
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.key] = r.value; });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── Seller chatbot enabled check ──
  const sellerId = product?.seller_id;
  const { data: sellerProfile } = useQuery({
    queryKey: ["seller-chatbot-enabled", sellerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("ai_chatbot_enabled, company_name, full_name")
        .eq("id", sellerId!)
        .single();
      return data;
    },
    enabled: !!sellerId,
    staleTime: 5 * 60 * 1000,
  });

  const sellerChatbotEnabled = sellerProfile?.ai_chatbot_enabled === true;
  const sellerStoreName = (sellerProfile?.company_name || sellerProfile?.full_name || "this seller");
  const chatDelaySeconds = parseInt(chatbotSettings?.chatbot_auto_open_delay_seconds || "30", 10) || 30;
  const consentModalEnabled = chatbotSettings?.chatbot_consent_modal_enabled !== "false";

  // ── Chat widget delayed reveal ──
  const [showChat, setShowChat] = useState(false);
  const chatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sellerChatbotEnabled || isChatMobile) {
      setShowChat(false);
      return;
    }
    chatTimerRef.current = setTimeout(() => setShowChat(true), chatDelaySeconds * 1000);
    return () => {
      if (chatTimerRef.current) clearTimeout(chatTimerRef.current);
    };
  }, [sellerChatbotEnabled, isChatMobile, chatDelaySeconds]);


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

  // ── Tab data availability ──
  const hw = (product as any).hardware_details as any;
  const hasHw = hw && typeof hw === "object" && (hw.hinges?.brand || hw.drawer_slides?.brand || hw.handles?.type);
  const hasFlat = !hasHw && (product.hinge_brand || product.slide_brand);
  const hasHardware = hasHw || hasFlat;

  const af = (product as any).additional_features as any[];
  const hasFeatures = af?.length > 0;
  const hasCountertop = product.countertop_option && product.countertop_option !== "no";
  const hasAddOns = displayOpts.length > 0 || hasCountertop;
  const hasAppliances = productAppliances.length > 0;
  const hasDescription = !!product.long_description;

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* ═══ ZONE 1: HERO ═══ */}
        <ProductHero
          product={product}
          heroRef={heroRef}
          displayOpts={displayOpts}
          checkedAddOns={checkedAddOns}
          toggleAddOn={toggleAddOn}
          productPrice={productPrice}
          addOnTotal={addOnTotal}
          grandTotal={grandTotal}
          deliveryChoice={deliveryChoice}
          setDeliveryChoice={setDeliveryChoice}
          qtyInCart={qtyInCart}
          isDeactivated={isDeactivated}
          savings={savings}
          handleAddToCart={handleAddToCart}
        />

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
              <div className="flex gap-4 lg:gap-8">
                <div className="max-w-5xl mx-auto py-8 flex-1 min-w-0">
                  {/* SPECIFICATIONS */}
                  <TabsContent value="specs" className="mt-0">
                    <ProductSpecs product={product} />
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

                        {displayOpts.map((opt: any) => (
                          <ProductAddOns key={opt.id} opt={opt} compact={false} checkedAddOns={checkedAddOns} toggleAddOn={toggleAddOn} onAskAbout={handleAskAboutAddOn} />
                        ))}

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
          <ProductStickySidebar
            product={product}
            qtyInCart={qtyInCart}
            isDeactivated={isDeactivated}
            handleAddToCart={handleAddToCart}
            visible={showMiniSidebar}
          />
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
          {hwImageOpen && <img src={hwImageOpen} alt="Hardware detail" className="w-full h-full rounded" />}
        </DialogContent>
      </Dialog>

      <Footer />

      {/* Debug element for chat widget */}
      {product && !showChat && (
        <div id="chat-debug" style={{ display: 'none' }} data-seller-id={product.seller_id} data-show-chat={String(showChat)} data-seller-enabled={String(sellerChatbotEnabled)} data-is-chat-mobile={String(isChatMobile)} />
      )}

      {/* AI Chat Widget */}
      {showChat && product && (
        <div style={{ animation: "chat-launcher-fade 500ms ease-out" }}>
          <style>{`@keyframes chat-launcher-fade{from{opacity:0}to{opacity:1}}`}</style>
          <ChatWidget
            sellerId={product.seller_id}
            sellerName={sellerStoreName}
            productId={product.id}
            userRole={user ? "registered" : "guest"}
            skipConsent={!consentModalEnabled}
          />
        </div>
      )}
    </div>
  );
};

export default Product;
