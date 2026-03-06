import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Save, Plus, Trash2, Info, X, Eye, Check, AlertTriangle, SendHorizontal, Undo2 } from "lucide-react";
import { ImageUpload, MultiImageUpload } from "@/components/admin/ImageUpload";
import { FileUpload } from "@/components/admin/FileUpload";
import HardwareSection, { emptyHardwareDetails, type HardwareDetails } from "./HardwareSection";
import AdditionalFeaturesSection, { type FeatureItem } from "./AdditionalFeaturesSection";

// ── helpers ──
const sanitizeSku = (s: string) => s.replace(/O/g, "X").replace(/I/g, "Y");
const skuSegment = (val: string, len = 2) => sanitizeSku(val.replace(/[^A-Za-z]/g, "").slice(0, len).toUpperCase()).padEnd(len, "X");
const generateSmartCode = (catName: string, style: string, color: string, widthMm: string) => {
  const cat = skuSegment(catName || "", 2);
  const sty = skuSegment(style || "", 2);
  const col = skuSegment(color || "", 2);
  const widthCm = widthMm ? String(Math.round(Number(widthMm) / 10)) : "0";
  return `${cat}-${sty}-${col}-${widthCm}-30`;
};
const inToMm = (v: number) => Math.round(v * 25.4);
const mmToIn = (v: number) => +(v / 25.4).toFixed(2);

// ── option lists ──
const kitchenLayoutOptions = ["L-Shape", "U-Shape", "Galley", "Straight", "Island", "Peninsula", "G-Shape"];
const doorStyles = ["shaker", "slab", "raised_panel", "recessed_panel", "beadboard", "louvered", "glass_front", "other"];
const doorMaterials = ["solid_wood", "mdf", "thermofoil", "plywood", "particleboard", "other"];
const finishTypes = ["paint", "stain", "lacquer", "laminate", "veneer", "melamine", "acrylic", "other"];
const conditions = ["NEW", "NEW-OB", "OVERSTK", "DISC", "EX-DISP", "FLOOR", "RETURN", "REFURB", "USED-A", "USED-B", "USED-C", "AS-IS", "PART"];
const optionTypes = ["countertop", "sink", "faucet", "appliance", "installation", "delivery", "backsplash", "hardware", "lighting"];
const applianceTypes = ["refrigerator", "range", "wall_oven", "cooktop", "dishwasher", "microwave", "range_hood", "wine_cooler", "trash_compactor", "warming_drawer", "ice_maker"];
const availabilityStatuses = ["In Stock", "Low Stock", "Deactivated"];

// ── types ──
interface ProductOption {
  option_type: string; option_name: string; inclusion_status: string;
  price_retail: string; price_discounted: string; discount_pct: string; description: string;
  specs: { key: string; value: string }[];
}
interface CompatAppliance {
  appliance_type: string; brand: string; model_number: string; model_name: string;
  width_mm: string; height_mm: string; depth_mm: string; notes: string; reference_url: string;
}

interface SellerProductFormProps {
  productId?: string;
}

// ── section save state tracking ──
type SectionKey = "basic" | "dimensions" | "hardware" | "features" | "pricing" | "addons" | "appliances" | "images" | "details";

// ── layout visual ──
const LayoutVisual = ({ type, dims }: { type: string; dims: Record<string, string> }) => {
  const base = "border-2 border-primary/60 rounded text-[10px] flex items-center justify-center text-muted-foreground";
  if (type === "straight") return <div className="flex items-end gap-1 py-4"><div className={`${base} w-40 h-10`}>{dims.width_mm || "W"}</div></div>;
  if (type === "l_shape") return <div className="py-4 relative w-40 h-28"><div className={`${base} absolute bottom-0 left-0 w-40 h-10`}>{dims.wall_a || "A"}</div><div className={`${base} absolute bottom-0 left-0 w-10 h-28`}>{dims.wall_b || "B"}</div></div>;
  if (type === "u_shape") return <div className="py-4 relative w-44 h-28"><div className={`${base} absolute bottom-0 left-0 w-44 h-10`}>{dims.wall_a || "A"}</div><div className={`${base} absolute bottom-0 left-0 w-10 h-28`}>{dims.wall_c || "C"}</div><div className={`${base} absolute bottom-0 right-0 w-10 h-28`}>{dims.wall_b || "B"}</div></div>;
  return <div className="flex items-end gap-1 py-4"><div className={`${base} w-20 h-16`}>{dims.width_mm || "W"}</div></div>;
};

// ── Save Section Button ──
const SaveSectionButton = ({ onClick, saving, saved, dirty }: { onClick: () => void; saving: boolean; saved: boolean; dirty: boolean }) => (
  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50 mt-3">
    {saved && !dirty && <span className="text-[10px] text-green-600 flex items-center gap-1"><Check className="w-3 h-3" />Saved</span>}
    {dirty && <span className="text-[10px] text-yellow-600 flex items-center gap-1">● Unsaved changes</span>}
    <Button variant="outline" size="sm" onClick={onClick} disabled={saving} className="h-7 text-xs px-3">
      {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
      Save Section
    </Button>
  </div>
);

// ── main component ──
const SellerProductForm = ({ productId: initialProductId }: SellerProductFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<SectionKey | null>(null);
  const [useInches, setUseInches] = useState(false);
  const [autoSku, setAutoSku] = useState(true);
  const [editDataLoaded, setEditDataLoaded] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  // Track the live product ID (may start null for new products, then set on first save)
  const [liveProductId, setLiveProductId] = useState<string | undefined>(initialProductId);
  

  // Track section save states
  const [sectionSaved, setSectionSaved] = useState<Record<SectionKey, boolean>>({
    basic: false, dimensions: false, hardware: false, features: false,
    pricing: false, addons: false, appliances: false, images: false, details: false,
  });
  const [sectionDirty, setSectionDirty] = useState<Record<SectionKey, boolean>>({
    basic: false, dimensions: false, hardware: false, features: false,
    pricing: false, addons: false, appliances: false, images: false, details: false,
  });

  // Track listing status
  const [listingStatus, setListingStatus] = useState<string>("draft");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [autoApprove, setAutoApprove] = useState(false);

  const markDirty = useCallback((section: SectionKey) => {
    setSectionDirty(p => ({ ...p, [section]: true }));
  }, []);

  // S1-S4 form state
  const [f, setF] = useState({
    product_name: "", product_code: "", category_id: "", style: "", color: "", material: "",
    door_style: "", door_material: "", finish_type: "", construction_type: "", condition: "NEW",
    condition_notes: "", manufacturer: "",
    width_mm: "", height_mm: "", depth_mm: "",
    wall_a_length_mm: "", wall_b_length_mm: "", wall_c_length_mm: "",
    hinge_brand: "", hinge_model: "", slide_brand: "", slide_model: "",
    handle_type: "", handle_finish: "",
    price_retail: "", price_sale: "", discount_pct: "", lead_time_days: "", is_custom_order: false,
  });
  const [kitchenLayouts, setKitchenLayouts] = useState<string[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [hardware, setHardware] = useState<HardwareDetails>(emptyHardwareDetails);
  const [additionalFeatures, setAdditionalFeatures] = useState<FeatureItem[]>([]);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [appliances, setAppliances] = useState<CompatAppliance[]>([]);
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [techDrawingUrl, setTechDrawingUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [s8, setS8] = useState({
    short_description: "", long_description: "", stock_level: "0",
    availability_status: "In Stock", visibility: "draft",
  });

  const set = (key: string, val: string | boolean) => setF((p) => ({ ...p, [key]: val }));
  const setS8Val = (key: string, val: string) => setS8((p) => ({ ...p, [key]: val }));

  // Dirty-tracking wrappers
  const setWithDirty = (section: SectionKey, key: string, val: string | boolean) => { set(key, val); markDirty(section); };
  const setS8ValDirty = (key: string, val: string) => { setS8Val(key, val); markDirty("details"); };

  const handleNameChange = (name: string) => { setF((p) => ({ ...p, product_name: name })); markDirty("basic"); };

  const { data: categories = [] } = useQuery({
    queryKey: ["seller-categories"],
    queryFn: async () => { const { data } = await supabase.from("categories").select("*"); return data || []; },
  });

  // Fetch seller's auto_approve flag
  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("auto_approve_products").eq("id", user.id).single()
      .then(({ data }) => { if (data) setAutoApprove(data.auto_approve_products === true); });
  }, [user?.id]);

  // ── EDIT MODE: Fetch product data ──
  const { data: existingProduct, isLoading: loadingProduct, error: productError } = useQuery({
    queryKey: ["edit-product", liveProductId],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", liveProductId!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!liveProductId,
  });

  const { data: existingOptions = [] } = useQuery({
    queryKey: ["edit-product-options", liveProductId],
    queryFn: async () => {
      const { data } = await supabase.from("product_options").select("*").eq("product_id", liveProductId!).order("sort_order");
      return data || [];
    },
    enabled: !!liveProductId,
  });

  const { data: existingAppliances = [] } = useQuery({
    queryKey: ["edit-product-appliances", liveProductId],
    queryFn: async () => {
      const { data } = await supabase.from("product_compatible_appliances").select("*").eq("product_id", liveProductId!).order("sort_order");
      return data || [];
    },
    enabled: !!liveProductId,
  });

  // Pre-populate form with existing product data
  useEffect(() => {
    if (!liveProductId || !existingProduct || editDataLoaded) return;
    const p = existingProduct;
    setAutoSku(false);
    setListingStatus(p.listing_status || "draft");
    setRejectionReason((p as any).listing_rejection_reason || "");
    setF({
      product_name: p.product_name || "", product_code: p.product_code || "",
      category_id: p.category_id || "", style: p.style || "", color: p.color || "",
      material: p.material || "", door_style: p.door_style || "", door_material: p.door_material || "",
      finish_type: p.finish_type || "", construction_type: p.construction_type || "",
      condition: p.condition || "NEW", condition_notes: p.condition_notes || "",
      manufacturer: p.manufacturer || "",
      width_mm: p.width_mm ? String(p.width_mm) : "", height_mm: p.height_mm ? String(p.height_mm) : "",
      depth_mm: p.depth_mm ? String(p.depth_mm) : "",
      wall_a_length_mm: p.wall_a_length_mm ? String(p.wall_a_length_mm) : "",
      wall_b_length_mm: p.wall_b_length_mm ? String(p.wall_b_length_mm) : "",
      wall_c_length_mm: p.wall_c_length_mm ? String(p.wall_c_length_mm) : "",
      hinge_brand: p.hinge_brand || "", hinge_model: p.hinge_model || "",
      slide_brand: p.slide_brand || "", slide_model: p.slide_model || "",
      handle_type: "", handle_finish: "",
      price_retail: p.price_retail_usd ? String(p.price_retail_usd) : "",
      price_sale: p.price_discounted_usd ? String(p.price_discounted_usd) : "",
      discount_pct: p.discount_percentage ? String(p.discount_percentage) : "",
      lead_time_days: p.lead_time_days ? String(p.lead_time_days) : "",
      is_custom_order: p.is_custom_order || false,
    });
    setKitchenLayouts(p.compatible_kitchen_layouts || []);
    setIsFeatured(p.is_featured || false);
    setMainImageUrl(p.main_image_url || null);
    setGalleryUrls(p.additional_image_urls || []);
    setTechDrawingUrl(p.technical_drawings_url || null);
    setS8({
      short_description: p.short_description || "", long_description: p.long_description || "",
      stock_level: p.stock_level != null ? String(p.stock_level) : "0",
      availability_status: p.availability_status || "In Stock", visibility: p.tag || "draft",
    });
    const hw = (p as any).hardware_details as any;
    if (hw && typeof hw === "object" && hw.hinges) {
      setHardware({
        hinges: { brand: hw.hinges?.brand || "", model: hw.hinges?.model || "", image_url: hw.hinges?.image_url || "", specs: hw.hinges?.specs || [] },
        drawer_slides: { brand: hw.drawer_slides?.brand || "", model: hw.drawer_slides?.model || "", image_url: hw.drawer_slides?.image_url || "", specs: hw.drawer_slides?.specs || [] },
        handles: { type: hw.handles?.type || "", finish: hw.handles?.finish || "", image_url: hw.handles?.image_url || "", specs: hw.handles?.specs || [] },
      });
    } else {
      setHardware({
        hinges: { brand: p.hinge_brand || "", model: p.hinge_model || "", image_url: "", specs: [] },
        drawer_slides: { brand: p.slide_brand || "", model: p.slide_model || "", image_url: "", specs: [] },
        handles: { type: "", finish: "", image_url: "", specs: [] },
      });
    }
    const af = (p as any).additional_features as any;
    if (Array.isArray(af)) setAdditionalFeatures(af);
    // Mark all sections as saved initially for edit mode
    setSectionSaved({ basic: true, dimensions: true, hardware: true, features: true, pricing: true, addons: true, appliances: true, images: true, details: true });
    setEditDataLoaded(true);
  }, [liveProductId, existingProduct, editDataLoaded]);

  useEffect(() => {
    if (!editDataLoaded || !liveProductId) return;
    if (existingOptions.length) {
      setOptions(existingOptions.map((o: any) => ({
        option_type: o.option_type || "", option_name: o.option_name || "",
        inclusion_status: o.inclusion_status || "not_included",
        price_retail: o.price_retail ? String(o.price_retail) : "",
        price_discounted: o.price_discounted ? String(o.price_discounted) : "",
        discount_pct: o.discount_percentage ? String(o.discount_percentage) : "",
        description: o.description || "",
        specs: o.specifications ? Object.entries(o.specifications as Record<string, string>).map(([key, value]) => ({ key, value })) : [],
      })));
    }
    if (existingAppliances.length) {
      setAppliances(existingAppliances.map((a: any) => {
        const dims = (a.dimensions as any) || {};
        return {
          appliance_type: a.appliance_type || "", brand: a.brand || "",
          model_number: a.model_number || "", model_name: a.model_name || "",
          width_mm: dims.width_mm ? String(dims.width_mm) : "",
          height_mm: dims.height_mm ? String(dims.height_mm) : "",
          depth_mm: dims.depth_mm ? String(dims.depth_mm) : "",
          notes: a.notes || "", reference_url: a.reference_url || "",
        };
      }));
    }
  }, [editDataLoaded, liveProductId, existingOptions, existingAppliances]);

  const selectedCategory = useMemo(() => categories.find((c: any) => c.id === f.category_id), [categories, f.category_id]);
  const layoutType: string = selectedCategory?.layout_type || "standard";
  const categoryName = selectedCategory?.name || "";
  const autoSkuValue = useMemo(() => generateSmartCode(categoryName, f.style, f.color, f.width_mm), [categoryName, f.style, f.color, f.width_mm]);
  useEffect(() => {
    if (autoSku && !liveProductId) setF((p) => ({ ...p, product_code: autoSkuValue }));
  }, [autoSku, autoSkuValue, liveProductId]);

  // Bidirectional pricing handlers
  const handleRetailChange = (val: string) => {
    const r = parseFloat(val); const d = parseFloat(f.discount_pct);
    const newSale = r > 0 && d > 0 && d < 100 ? (r * (1 - d / 100)).toFixed(2) : f.price_sale;
    setF((p) => ({ ...p, price_retail: val, price_sale: newSale })); markDirty("pricing");
  };
  const handleSaleChange = (val: string) => {
    const r = parseFloat(f.price_retail); const s = parseFloat(val);
    const newDisc = r > 0 && s > 0 && s <= r ? String(Math.round((1 - s / r) * 100)) : "";
    setF((p) => ({ ...p, price_sale: val, discount_pct: newDisc })); markDirty("pricing");
  };
  const handleDiscountChange = (val: string) => {
    const r = parseFloat(f.price_retail); const d = parseFloat(val);
    const newSale = r > 0 && d >= 0 && d < 100 ? (r * (1 - d / 100)).toFixed(2) : f.price_sale;
    setF((p) => ({ ...p, discount_pct: val, price_sale: newSale })); markDirty("pricing");
  };

  const toggleLayout = (layout: string) => { setKitchenLayouts((p) => p.includes(layout) ? p.filter((l) => l !== layout) : [...p, layout]); markDirty("basic"); };
  const dimVal = (key: string) => { const raw = (f as any)[key] as string; if (!raw) return ""; return useInches ? String(mmToIn(Number(raw))) : raw; };
  const setDim = (key: string, val: string) => { if (useInches) { set(key, val ? String(inToMm(Number(val))) : ""); } else { set(key, val); } markDirty("dimensions"); };

  // S6 helpers
  const addOption = () => { setOptions((p) => [...p, { option_type: "", option_name: "", inclusion_status: "not_included", price_retail: "", price_discounted: "", discount_pct: "", description: "", specs: [] }]); markDirty("addons"); };
  const handleOptionRetailChange = (i: number, val: string) => {
    setOptions((p) => p.map((o, idx) => { if (idx !== i) return o; const r = parseFloat(val); const d = parseFloat(o.discount_pct); const newSale = r > 0 && d > 0 && d < 100 ? (r * (1 - d / 100)).toFixed(2) : o.price_discounted; return { ...o, price_retail: val, price_discounted: newSale }; })); markDirty("addons");
  };
  const handleOptionSaleChange = (i: number, val: string) => {
    setOptions((p) => p.map((o, idx) => { if (idx !== i) return o; const r = parseFloat(o.price_retail); const s = parseFloat(val); const newDisc = r > 0 && s > 0 && s <= r ? String(Math.round((1 - s / r) * 100)) : ""; return { ...o, price_discounted: val, discount_pct: newDisc }; })); markDirty("addons");
  };
  const handleOptionDiscountChange = (i: number, val: string) => {
    setOptions((p) => p.map((o, idx) => { if (idx !== i) return o; const r = parseFloat(o.price_retail); const d = parseFloat(val); const newSale = r > 0 && d >= 0 && d < 100 ? (r * (1 - d / 100)).toFixed(2) : o.price_discounted; return { ...o, discount_pct: val, price_discounted: newSale }; })); markDirty("addons");
  };
  const removeOption = (i: number) => { setOptions((p) => p.filter((_, idx) => idx !== i)); markDirty("addons"); };
  const updateOption = (i: number, key: string, val: string) => { setOptions((p) => p.map((o, idx) => idx === i ? { ...o, [key]: val } : o)); markDirty("addons"); };
  const addSpec = (i: number) => { setOptions((p) => p.map((o, idx) => idx === i ? { ...o, specs: [...o.specs, { key: "", value: "" }] } : o)); markDirty("addons"); };
  const removeSpec = (oi: number, si: number) => { setOptions((p) => p.map((o, idx) => idx === oi ? { ...o, specs: o.specs.filter((_, j) => j !== si) } : o)); markDirty("addons"); };
  const updateSpec = (oi: number, si: number, field: "key" | "value", val: string) => { setOptions((p) => p.map((o, idx) => idx === oi ? { ...o, specs: o.specs.map((s, j) => j === si ? { ...s, [field]: val } : s) } : o)); markDirty("addons"); };

  // S7 helpers
  const addAppliance = () => { setAppliances((p) => [...p, { appliance_type: "", brand: "", model_number: "", model_name: "", width_mm: "", height_mm: "", depth_mm: "", notes: "", reference_url: "" }]); markDirty("appliances"); };
  const removeAppliance = (i: number) => { setAppliances((p) => p.filter((_, idx) => idx !== i)); markDirty("appliances"); };
  const updateAppliance = (i: number, key: string, val: string) => { setAppliances((p) => p.map((a, idx) => idx === i ? { ...a, [key]: val } : a)); markDirty("appliances"); };

  // ── Ensure product row exists (for section saves on new products) ──
  const ensureProductExists = async (): Promise<string> => {
    if (liveProductId) return liveProductId;
    if (!user) throw new Error("Not authenticated");
    const row: Record<string, unknown> = {
      seller_id: user.id,
      product_name: f.product_name || "Untitled Product",
      product_code: f.product_code || "DRAFT",
      category_id: f.category_id || null,
      style: f.style || "N/A", color: f.color || "N/A", material: f.material || "N/A",
      width_mm: 0, height_mm: 0, depth_mm: 0,
      price_retail_usd: 0, price_discounted_usd: 0,
      listing_status: "draft", tag: "draft",
    };
    const { data, error } = await supabase.from("products").insert(row as any).select("id").single();
    if (error || !data) throw new Error(error?.message || "Failed to create product");
    setLiveProductId(data.id);
    setListingStatus("draft");
    // Update URL without reload
    navigate(`/seller/products/${data.id}`, { replace: true });
    return data.id;
  };

  // ── Validation helpers ──
  const validateSection = (section: SectionKey): string[] => {
    const errors: string[] = [];
    if (section === "basic") {
      if (!f.product_name.trim()) errors.push("Product Name is required");
      if (!f.product_code.trim()) errors.push("Product Code (SKU) is required");
      if (!f.category_id) errors.push("Category must be selected");
    }
    if (section === "dimensions") {
      if (!f.width_mm || Number(f.width_mm) <= 0) errors.push("Width must be greater than 0");
      if (!f.height_mm || Number(f.height_mm) <= 0) errors.push("Height must be greater than 0");
      if (!f.depth_mm || Number(f.depth_mm) <= 0) errors.push("Depth must be greater than 0");
    }
    return errors;
  };

  const [sectionErrors, setSectionErrors] = useState<Record<SectionKey, string[]>>({
    basic: [], dimensions: [], hardware: [], features: [],
    pricing: [], addons: [], appliances: [], images: [], details: [],
  });

  // ── Section save handlers ──
  const saveSectionToDb = async (section: SectionKey) => {
    // Validate before saving
    const errors = validateSection(section);
    setSectionErrors(p => ({ ...p, [section]: errors }));
    if (errors.length > 0) {
      toast({ title: "Validation error", description: errors.join(". "), variant: "destructive" });
      return;
    }

    setSavingSection(section);
    try {
      const pid = await ensureProductExists();
      if (section === "basic") {
        await supabase.from("products").update({
          product_name: f.product_name, product_code: f.product_code, category_id: f.category_id || null,
          manufacturer: f.manufacturer || null, style: f.style || "N/A", color: f.color || "N/A",
          material: f.material || "N/A", door_style: f.door_style || null, door_material: f.door_material || null,
          finish_type: f.finish_type || null, construction_type: f.construction_type || null,
          condition: f.condition, condition_notes: f.condition !== "NEW" ? f.condition_notes || null : null,
          compatible_kitchen_layouts: kitchenLayouts.length ? kitchenLayouts : [],
        } as any).eq("id", pid);
      } else if (section === "dimensions") {
        await supabase.from("products").update({
          width_mm: f.width_mm ? Number(f.width_mm) : 0, height_mm: f.height_mm ? Number(f.height_mm) : 0,
          depth_mm: f.depth_mm ? Number(f.depth_mm) : 0,
          wall_a_length_mm: f.wall_a_length_mm ? Number(f.wall_a_length_mm) : null,
          wall_b_length_mm: f.wall_b_length_mm ? Number(f.wall_b_length_mm) : null,
          wall_c_length_mm: f.wall_c_length_mm ? Number(f.wall_c_length_mm) : null,
          measurement_standard: useInches ? "imperial" : "metric",
        } as any).eq("id", pid);
      } else if (section === "hardware") {
        await supabase.from("products").update({
          hardware_details: hardware,
          hinge_brand: hardware.hinges.brand || null, hinge_model: hardware.hinges.model || null,
          slide_brand: hardware.drawer_slides.brand || null, slide_model: hardware.drawer_slides.model || null,
        } as any).eq("id", pid);
      } else if (section === "features") {
        await supabase.from("products").update({
          additional_features: additionalFeatures.length ? additionalFeatures : null,
        } as any).eq("id", pid);
      } else if (section === "pricing") {
        await supabase.from("products").update({
          price_retail_usd: f.price_retail ? parseFloat(f.price_retail) : 0,
          price_discounted_usd: f.price_sale ? parseFloat(f.price_sale) : (f.price_retail ? parseFloat(f.price_retail) : 0),
          discount_percentage: f.discount_pct ? Number(f.discount_pct) : 0,
          lead_time_days: f.is_custom_order && f.lead_time_days ? Number(f.lead_time_days) : null,
          is_custom_order: f.is_custom_order,
        } as any).eq("id", pid);
      } else if (section === "addons") {
        await supabase.from("product_options").delete().eq("product_id", pid);
        if (options.length) {
          const optRows = options.filter((o) => o.option_type && o.option_name).map((o, i) => ({
            product_id: pid, option_type: o.option_type, option_name: o.option_name,
            inclusion_status: o.inclusion_status,
            price_retail: o.inclusion_status === "optional" && o.price_retail ? parseFloat(o.price_retail) : 0,
            price_discounted: o.inclusion_status === "optional" && o.price_discounted ? parseFloat(o.price_discounted) : 0,
            discount_percentage: o.inclusion_status === "optional" && o.discount_pct ? parseFloat(o.discount_pct) : 0,
            description: o.description || null,
            specifications: o.specs.reduce((acc, s) => (s.key ? { ...acc, [s.key]: s.value } : acc), {} as Record<string, string>),
            sort_order: i,
          }));
          if (optRows.length) await supabase.from("product_options").insert(optRows as any);
        }
      } else if (section === "appliances") {
        await supabase.from("product_compatible_appliances").delete().eq("product_id", pid);
        if (appliances.length) {
          const appRows = appliances.filter((a) => a.appliance_type).map((a, i) => ({
            product_id: pid, appliance_type: a.appliance_type, brand: a.brand || null,
            model_number: a.model_number || null, model_name: a.model_name || null,
            dimensions: { width_mm: Number(a.width_mm) || 0, height_mm: Number(a.height_mm) || 0, depth_mm: Number(a.depth_mm) || 0 },
            notes: a.notes || null, reference_url: a.reference_url || null, sort_order: i,
          }));
          if (appRows.length) await supabase.from("product_compatible_appliances").insert(appRows as any);
        }
      } else if (section === "images") {
        await supabase.from("products").update({
          main_image_url: mainImageUrl || null,
          additional_image_urls: galleryUrls.length ? galleryUrls : [],
          technical_drawings_url: techDrawingUrl || null,
        } as any).eq("id", pid);
      } else if (section === "details") {
        await supabase.from("products").update({
          short_description: s8.short_description || null, long_description: s8.long_description || null,
          stock_level: Number(s8.stock_level) || 0, availability_status: s8.availability_status,
          is_featured: isFeatured,
        } as any).eq("id", pid);
      }
      setSectionSaved(p => ({ ...p, [section]: true }));
      setSectionDirty(p => ({ ...p, [section]: false }));
      toast({ title: "Section saved" });
    } catch (err: any) {
      toast({ title: "Error saving section", description: err.message, variant: "destructive" });
    } finally {
      setSavingSection(null);
    }
  };

  // ── FULL SUBMIT ──
  const handleFullSave = async (targetStatus: "draft" | "pending_review" | "approved") => {
    if (!user) { toast({ title: "Not authenticated", variant: "destructive" }); return; }

    // On submit for review / publish, validate all mandatory sections
    if (targetStatus !== "draft") {
      const basicErrs = validateSection("basic");
      const dimErrs = validateSection("dimensions");
      setSectionErrors(p => ({ ...p, basic: basicErrs, dimensions: dimErrs }));
      const failedSections: string[] = [];
      if (basicErrs.length) failedSections.push("Basic Information");
      if (dimErrs.length) failedSections.push("Dimensions");
      if (failedSections.length) {
        toast({ title: "Missing required fields", description: `Fix errors in: ${failedSections.join(", ")}`, variant: "destructive" });
        return;
      }
    }
    setSaving(true);
    try {
      const pid = await ensureProductExists();

      const row: Record<string, unknown> = {
        product_name: f.product_name, product_code: f.product_code, category_id: f.category_id || null,
        style: f.style || "N/A", color: f.color || "N/A", material: f.material || "N/A",
        door_style: f.door_style || null, door_material: f.door_material || null,
        finish_type: f.finish_type || null, construction_type: f.construction_type || null,
        condition: f.condition, condition_notes: f.condition !== "NEW" ? f.condition_notes || null : null,
        manufacturer: f.manufacturer || null,
        width_mm: f.width_mm ? Number(f.width_mm) : 0, height_mm: f.height_mm ? Number(f.height_mm) : 0,
        depth_mm: f.depth_mm ? Number(f.depth_mm) : 0,
        wall_a_length_mm: f.wall_a_length_mm ? Number(f.wall_a_length_mm) : null,
        wall_b_length_mm: f.wall_b_length_mm ? Number(f.wall_b_length_mm) : null,
        wall_c_length_mm: f.wall_c_length_mm ? Number(f.wall_c_length_mm) : null,
        hinge_brand: hardware.hinges.brand || f.hinge_brand || null,
        hinge_model: hardware.hinges.model || f.hinge_model || null,
        slide_brand: hardware.drawer_slides.brand || f.slide_brand || null,
        slide_model: hardware.drawer_slides.model || f.slide_model || null,
        hardware_details: hardware,
        additional_features: additionalFeatures.length ? additionalFeatures : null,
        price_retail_usd: f.price_retail ? parseFloat(f.price_retail) : 0,
        price_discounted_usd: f.price_sale ? parseFloat(f.price_sale) : (f.price_retail ? parseFloat(f.price_retail) : 0),
        discount_percentage: f.discount_pct ? Number(f.discount_pct) : 0,
        lead_time_days: f.is_custom_order && f.lead_time_days ? Number(f.lead_time_days) : null,
        is_custom_order: f.is_custom_order,
        is_featured: isFeatured,
        compatible_kitchen_layouts: kitchenLayouts.length ? kitchenLayouts : [],
        availability_status: s8.availability_status,
        stock_level: Number(s8.stock_level) || 0,
        short_description: s8.short_description || null, long_description: s8.long_description || null,
        tag: targetStatus === "draft" ? "draft" : "published",
        main_image_url: mainImageUrl || null,
        additional_image_urls: galleryUrls.length ? galleryUrls : [],
        technical_drawings_url: techDrawingUrl || null,
        listing_status: targetStatus,
      };

      const { error: updateErr } = await supabase.from("products").update(row as any).eq("id", pid);
      if (updateErr) throw new Error(updateErr.message);

      // Save options
      await supabase.from("product_options").delete().eq("product_id", pid);
      if (options.length) {
        const optRows = options.filter((o) => o.option_type && o.option_name).map((o, i) => ({
          product_id: pid, option_type: o.option_type, option_name: o.option_name,
          inclusion_status: o.inclusion_status,
          price_retail: o.inclusion_status === "optional" && o.price_retail ? parseFloat(o.price_retail) : 0,
          price_discounted: o.inclusion_status === "optional" && o.price_discounted ? parseFloat(o.price_discounted) : 0,
          discount_percentage: o.inclusion_status === "optional" && o.discount_pct ? parseFloat(o.discount_pct) : 0,
          description: o.description || null,
          specifications: o.specs.reduce((acc, s) => (s.key ? { ...acc, [s.key]: s.value } : acc), {} as Record<string, string>),
          sort_order: i,
        }));
        if (optRows.length) await supabase.from("product_options").insert(optRows as any);
      }

      // Save appliances
      await supabase.from("product_compatible_appliances").delete().eq("product_id", pid);
      if (appliances.length) {
        const appRows = appliances.filter((a) => a.appliance_type).map((a, i) => ({
          product_id: pid, appliance_type: a.appliance_type, brand: a.brand || null,
          model_number: a.model_number || null, model_name: a.model_name || null,
          dimensions: { width_mm: Number(a.width_mm) || 0, height_mm: Number(a.height_mm) || 0, depth_mm: Number(a.depth_mm) || 0 },
          notes: a.notes || null, reference_url: a.reference_url || null, sort_order: i,
        }));
        if (appRows.length) await supabase.from("product_compatible_appliances").insert(appRows as any);
      }

      setListingStatus(targetStatus);
      setSectionDirty({ basic: false, dimensions: false, hardware: false, features: false, pricing: false, addons: false, appliances: false, images: false, details: false });
      setSectionSaved({ basic: true, dimensions: true, hardware: true, features: true, pricing: true, addons: true, appliances: true, images: true, details: true });

      if (targetStatus === "draft") {
        toast({ title: "Saved as draft" });
      } else if (targetStatus === "pending_review") {
        toast({ title: "Submitted for review", description: "Your product has been submitted for admin review." });
      } else if (targetStatus === "approved") {
        toast({ title: "Published to store", description: "Your product is now live." });
      }
      navigate("/seller/products");
    } catch (err: any) {
      toast({ title: "Error saving product", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleWithdrawReview = async () => {
    if (!liveProductId) return;
    const { error } = await supabase.from("products").update({ listing_status: "draft" } as any).eq("id", liveProductId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setListingStatus("draft");
    toast({ title: "Withdrawn from review", description: "Product is now a draft. You can edit and resubmit." });
  };

  const handleEditResubmit = async () => {
    if (!liveProductId) return;
    const { error } = await supabase.from("products").update({ listing_status: "draft", listing_rejection_reason: null } as any).eq("id", liveProductId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setListingStatus("draft");
    setRejectionReason("");
    toast({ title: "Product unlocked for editing" });
  };

  const handleSaveApproved = async () => {
    if (autoApprove) {
      await handleFullSave("approved");
    } else {
      await handleFullSave("pending_review");
      toast({ title: "Changes submitted for re-review", description: "Your changes require admin approval." });
    }
  };

  // Read-only if pending review
  const isReadOnly = listingStatus === "pending_review";

  // ── Loading / error states for edit mode ──
  if (initialProductId && loadingProduct) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading product data...</span>
      </div>
    );
  }

  if (initialProductId && (productError || (!loadingProduct && !existingProduct))) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-destructive">Product Not Found</h2>
        <p className="text-muted-foreground">The product you're trying to edit doesn't exist or you don't have access.</p>
        <Button variant="outline" onClick={() => navigate("/seller/products")}>Back to Products</Button>
      </div>
    );
  }

  const labelCls = "text-xs font-semibold";
  const inputCls = "mt-1";

  // Section header indicator
  const SectionIndicator = ({ section }: { section: SectionKey }) => (
    <span className="ml-2 inline-flex items-center">
      {sectionSaved[section] && !sectionDirty[section] && <Check className="w-3.5 h-3.5 text-green-600" />}
      {sectionDirty[section] && <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />}
    </span>
  );

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-24">
      {/* Status banners */}
      {listingStatus === "pending_review" && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-yellow-300 bg-yellow-500/10">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-800">Pending Admin Review</p>
            <p className="text-xs text-yellow-700">This product is awaiting review. Editing is disabled until review is complete.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleWithdrawReview}>
            <Undo2 className="w-3.5 h-3.5 mr-1" />Withdraw
          </Button>
        </div>
      )}
      {listingStatus === "rejected" && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-red-300 bg-red-500/10">
          <X className="w-5 h-5 text-red-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Product Declined</p>
            {rejectionReason && <p className="text-xs text-red-700 mt-1">Reason: {rejectionReason}</p>}
          </div>
          <Button variant="outline" size="sm" onClick={handleEditResubmit}>
            Edit & Resubmit
          </Button>
        </div>
      )}
      {listingStatus === "approved" && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-green-300 bg-green-500/10">
          <Check className="w-4 h-4 text-green-600 shrink-0" />
          <p className="text-sm text-green-800 font-medium">This product is live on the store.</p>
        </div>
      )}

      <Accordion type="multiple" defaultValue={["basic", "dimensions", "hardware", "features", "pricing", "addons", "appliances", "images", "details"]} className="space-y-3">

        {/* ═══ SECTION 1 — BASIC INFO ═══ */}
        <AccordionItem value="basic" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">1 · Basic Information <SectionIndicator section="basic" /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <fieldset disabled={isReadOnly}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label className={labelCls}>Product Name *</Label><Input value={f.product_name} onChange={(e) => handleNameChange(e.target.value)} className={inputCls} />
                {sectionErrors.basic.includes("Product Name is required") && <p className="text-xs text-destructive mt-1">Required — must not be empty</p>}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className={labelCls}>Product Code (SKU) *</Label>
                  {!liveProductId && (
                    <div className="flex items-center gap-1.5">
                      <Label className="text-[10px] text-muted-foreground">Auto</Label>
                      <Switch checked={autoSku} onCheckedChange={(v) => { setAutoSku(v); if (v) setF((p) => ({ ...p, product_code: autoSkuValue })); }} className="scale-75" />
                    </div>
                  )}
                </div>
                <Input value={f.product_code} onChange={(e) => setWithDirty("basic", "product_code", e.target.value)} className={inputCls} placeholder={autoSku && !liveProductId ? "Auto-generated" : "Enter SKU manually"} readOnly={autoSku && !liveProductId} />
                {autoSku && !liveProductId && <p className="text-[10px] text-muted-foreground mt-1">Auto: Category-Style-Color-Width-Seq (avoids O/I)</p>}
              </div>
              <div><Label className={labelCls}>Category *</Label>
                <Select value={f.category_id} onValueChange={(v) => { set("category_id", v); markDirty("basic"); }}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className={labelCls}>Manufacturer</Label><Input value={f.manufacturer} onChange={(e) => setWithDirty("basic", "manufacturer", e.target.value)} className={inputCls} /></div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div><Label className={labelCls}>Style</Label><Input value={f.style} onChange={(e) => setWithDirty("basic", "style", e.target.value)} className={inputCls} placeholder="e.g. Shaker" /></div>
              <div><Label className={labelCls}>Color</Label><Input value={f.color} onChange={(e) => setWithDirty("basic", "color", e.target.value)} className={inputCls} placeholder="e.g. White" /></div>
              <div><Label className={labelCls}>Material</Label><Input value={f.material} onChange={(e) => setWithDirty("basic", "material", e.target.value)} className={inputCls} placeholder="e.g. Solid Wood" /></div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div><Label className={labelCls}>Door Style</Label><Select value={f.door_style} onValueChange={(v) => { set("door_style", v); markDirty("basic"); }}><SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{doorStyles.map((o) => <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className={labelCls}>Door Material</Label><Select value={f.door_material} onValueChange={(v) => { set("door_material", v); markDirty("basic"); }}><SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{doorMaterials.map((o) => <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className={labelCls}>Finish Type</Label><Select value={f.finish_type} onValueChange={(v) => { set("finish_type", v); markDirty("basic"); }}><SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{finishTypes.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label className={labelCls}>Construction Type</Label>
              <RadioGroup value={f.construction_type} onValueChange={(v) => { set("construction_type", v); markDirty("basic"); }} className="flex gap-6 mt-1">
                <div className="flex items-center gap-2"><RadioGroupItem value="framed" id="ct-framed" /><Label htmlFor="ct-framed">Framed</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="frameless" id="ct-frameless" /><Label htmlFor="ct-frameless">Frameless</Label></div>
              </RadioGroup>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label className={labelCls}>Condition</Label><Select value={f.condition} onValueChange={(v) => { set("condition", v); markDirty("basic"); }}><SelectTrigger className={inputCls}><SelectValue /></SelectTrigger><SelectContent>{conditions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
              {f.condition !== "NEW" && <div className="sm:col-span-2"><Label className={labelCls}>Condition Notes</Label><Textarea value={f.condition_notes} onChange={(e) => { set("condition_notes", e.target.value); markDirty("basic"); }} className="mt-1 resize-none" rows={2} placeholder="Describe the condition..." /></div>}
            </div>
            <div>
              <Label className={labelCls}>Compatible Kitchen Layouts</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {kitchenLayoutOptions.map((layout) => (
                  <button key={layout} type="button" onClick={() => toggleLayout(layout)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${kitchenLayouts.includes(layout) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"}`}>
                    {layout}
                  </button>
                ))}
              </div>
            </div>
            </fieldset>
            {!isReadOnly && <SaveSectionButton onClick={() => saveSectionToDb("basic")} saving={savingSection === "basic"} saved={sectionSaved.basic} dirty={sectionDirty.basic} />}
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECTION 2 — DIMENSIONS ═══ */}
        <AccordionItem value="dimensions" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">2 · Dimensions <SectionIndicator section="dimensions" /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <fieldset disabled={isReadOnly}>
            <div className="flex items-center gap-2"><Label className="text-xs">mm</Label><Switch checked={useInches} onCheckedChange={setUseInches} /><Label className="text-xs">inches</Label></div>
            {!f.category_id && <p className="text-sm text-muted-foreground">Select a category to see dimension fields.</p>}
            {f.category_id && (<>
              <LayoutVisual type={layoutType} dims={{ width_mm: dimVal("width_mm"), wall_a: dimVal("wall_a_length_mm"), wall_b: dimVal("wall_b_length_mm"), wall_c: dimVal("wall_c_length_mm") }} />
              <div className="grid sm:grid-cols-3 gap-4">
                {(layoutType === "straight" || layoutType === "standard" || !layoutType) && <div><Label className={labelCls}>{layoutType === "straight" ? "Wall Length" : "Width"} ({useInches ? "in" : "mm"})</Label><Input type="number" value={dimVal("width_mm")} onChange={(e) => setDim("width_mm", e.target.value)} className={inputCls} /></div>}
                {(layoutType === "l_shape" || layoutType === "u_shape") && (<><div><Label className={labelCls}>Wall A ({useInches ? "in" : "mm"})</Label><Input type="number" value={dimVal("wall_a_length_mm")} onChange={(e) => setDim("wall_a_length_mm", e.target.value)} className={inputCls} /></div><div><Label className={labelCls}>Wall B ({useInches ? "in" : "mm"})</Label><Input type="number" value={dimVal("wall_b_length_mm")} onChange={(e) => setDim("wall_b_length_mm", e.target.value)} className={inputCls} /></div></>)}
                {layoutType === "u_shape" && <div><Label className={labelCls}>Wall C ({useInches ? "in" : "mm"})</Label><Input type="number" value={dimVal("wall_c_length_mm")} onChange={(e) => setDim("wall_c_length_mm", e.target.value)} className={inputCls} /></div>}
                <div><Label className={labelCls}>Height ({useInches ? "in" : "mm"})</Label><Input type="number" value={dimVal("height_mm")} onChange={(e) => setDim("height_mm", e.target.value)} className={inputCls} /></div>
                <div><Label className={labelCls}>Depth ({useInches ? "in" : "mm"})</Label><Input type="number" value={dimVal("depth_mm")} onChange={(e) => setDim("depth_mm", e.target.value)} className={inputCls} /></div>
              </div>
            </>)}
            </fieldset>
            {!isReadOnly && <SaveSectionButton onClick={() => saveSectionToDb("dimensions")} saving={savingSection === "dimensions"} saved={sectionSaved.dimensions} dirty={sectionDirty.dimensions} />}
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECTION 3 — HARDWARE DETAILS ═══ */}
        <AccordionItem value="hardware" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">3 · Hardware Details <SectionIndicator section="hardware" /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <fieldset disabled={isReadOnly}>
            <HardwareSection hardware={hardware} onChange={(h) => { setHardware(h); markDirty("hardware"); }} sellerId={user?.id} productId={liveProductId} />
            </fieldset>
            {!isReadOnly && <SaveSectionButton onClick={() => saveSectionToDb("hardware")} saving={savingSection === "hardware"} saved={sectionSaved.hardware} dirty={sectionDirty.hardware} />}
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECTION 4 — ADDITIONAL FEATURES ═══ */}
        <AccordionItem value="features" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">4 · Additional Features <SectionIndicator section="features" /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <fieldset disabled={isReadOnly}>
            <AdditionalFeaturesSection features={additionalFeatures} onChange={(af) => { setAdditionalFeatures(af); markDirty("features"); }} />
            </fieldset>
            {!isReadOnly && <SaveSectionButton onClick={() => saveSectionToDb("features")} saving={savingSection === "features"} saved={sectionSaved.features} dirty={sectionDirty.features} />}
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECTION 5 — PRICING ═══ */}
        <AccordionItem value="pricing" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">5 · Pricing <SectionIndicator section="pricing" /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <fieldset disabled={isReadOnly}>
            <div className="grid sm:grid-cols-3 gap-4">
              <div><Label className={labelCls}>Retail Price (CAD) *</Label><div className="relative mt-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input type="number" step="0.01" value={f.price_retail} onChange={(e) => handleRetailChange(e.target.value)} className="pl-7" /></div></div>
              <div><Label className={labelCls}>Sale Price (CAD)</Label><div className="relative mt-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input type="number" step="0.01" value={f.price_sale} onChange={(e) => handleSaleChange(e.target.value)} className="pl-7" /></div></div>
              <div><Label className={labelCls}>Discount %</Label><div className="relative mt-1"><Input type="number" min="0" max="99" value={f.discount_pct} onChange={(e) => handleDiscountChange(e.target.value)} className="pr-7" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span></div></div>
            </div>
            <div className="flex items-center gap-3"><Checkbox id="custom-order" checked={f.is_custom_order} onCheckedChange={(v) => { set("is_custom_order", !!v); markDirty("pricing"); }} /><Label htmlFor="custom-order" className="text-sm">This is a custom/made-to-order product</Label></div>
            {f.is_custom_order && <div className="max-w-xs"><Label className={labelCls}>Lead Time (days)</Label><Input type="number" value={f.lead_time_days} onChange={(e) => setWithDirty("pricing", "lead_time_days", e.target.value)} className={inputCls} /></div>}
            </fieldset>
            {!isReadOnly && <SaveSectionButton onClick={() => saveSectionToDb("pricing")} saving={savingSection === "pricing"} saved={sectionSaved.pricing} dirty={sectionDirty.pricing} />}
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECTION 6 — ADD-ONS ═══ */}
        <AccordionItem value="addons" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">6 · Add-Ons & Inclusions <SectionIndicator section="addons" /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <fieldset disabled={isReadOnly}>
            {options.length === 0 && <p className="text-sm text-muted-foreground">No add-ons yet. Click "Add Option" to include countertops, sinks, or other add-ons.</p>}
            {options.map((opt, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3 relative">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeOption(i)}><Trash2 className="w-4 h-4" /></Button>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label className={labelCls}>Option Type *</Label>
                    <Select value={opt.option_type} onValueChange={(v) => updateOption(i, "option_type", v)}>
                      <SelectTrigger className={inputCls}><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>{optionTypes.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className={labelCls}>Option Name *</Label><Input value={opt.option_name} onChange={(e) => updateOption(i, "option_name", e.target.value)} className={inputCls} placeholder="e.g. Granite Countertop" /></div>
                </div>
                <div><Label className={labelCls}>Inclusion Status</Label>
                  <RadioGroup value={opt.inclusion_status} onValueChange={(v) => updateOption(i, "inclusion_status", v)} className="flex gap-4 mt-1">
                    <div className="flex items-center gap-1.5"><RadioGroupItem value="included" id={`inc-${i}`} /><Label htmlFor={`inc-${i}`} className="text-xs">Included</Label></div>
                    <div className="flex items-center gap-1.5"><RadioGroupItem value="optional" id={`opt-${i}`} /><Label htmlFor={`opt-${i}`} className="text-xs">Optional</Label></div>
                    <div className="flex items-center gap-1.5"><RadioGroupItem value="not_included" id={`ni-${i}`} /><Label htmlFor={`ni-${i}`} className="text-xs">Not Included</Label></div>
                  </RadioGroup>
                </div>
                {opt.inclusion_status === "optional" && (
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div><Label className={labelCls}>Retail Price (CAD) *</Label><div className="relative mt-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input type="number" step="0.01" value={opt.price_retail} onChange={(e) => handleOptionRetailChange(i, e.target.value)} className="pl-7" /></div></div>
                    <div><Label className={labelCls}>Discount %</Label><div className="relative mt-1"><Input type="number" min="0" max="99" value={opt.discount_pct} onChange={(e) => handleOptionDiscountChange(i, e.target.value)} className="pr-7" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span></div></div>
                    <div><Label className={labelCls}>Sale Price (CAD)</Label><div className="relative mt-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input type="number" step="0.01" value={opt.price_discounted} onChange={(e) => handleOptionSaleChange(i, e.target.value)} className="pl-7" /></div></div>
                  </div>
                )}
                <div><Label className={labelCls}>Description</Label><Input value={opt.description} onChange={(e) => updateOption(i, "description", e.target.value)} className={inputCls} /></div>
                <div className="space-y-2">
                  <Label className={labelCls}>Specifications</Label>
                  {opt.specs.map((s, si) => (
                    <div key={si} className="flex gap-2 items-center">
                      <Input value={s.key} onChange={(e) => updateSpec(i, si, "key", e.target.value)} placeholder="Key" className="flex-1" />
                      <Input value={s.value} onChange={(e) => updateSpec(i, si, "value", e.target.value)} placeholder="Value" className="flex-1" />
                      <Button variant="ghost" size="icon" onClick={() => removeSpec(i, si)}><X className="w-3 h-3" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addSpec(i)}><Plus className="w-3 h-3 mr-1" />Add Spec</Button>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addOption}><Plus className="w-4 h-4 mr-2" />Add Option</Button>
            </fieldset>
            {!isReadOnly && <SaveSectionButton onClick={() => saveSectionToDb("addons")} saving={savingSection === "addons"} saved={sectionSaved.addons} dirty={sectionDirty.addons} />}
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECTION 7 — COMPATIBLE APPLIANCES ═══ */}
        <AccordionItem value="appliances" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">7 · Compatible Appliances <SectionIndicator section="appliances" /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <fieldset disabled={isReadOnly}>
            <div className="flex items-start gap-2 p-3 rounded-md bg-muted">
              <Info className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">List appliance models that fit this cabinet's cutout dimensions.</p>
            </div>
            {appliances.map((app, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3 relative">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeAppliance(i)}><Trash2 className="w-4 h-4" /></Button>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label className={labelCls}>Appliance Type *</Label>
                    <Select value={app.appliance_type} onValueChange={(v) => updateAppliance(i, "appliance_type", v)}>
                      <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{applianceTypes.map((o) => <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className={labelCls}>Brand</Label><Input value={app.brand} onChange={(e) => updateAppliance(i, "brand", e.target.value)} className={inputCls} placeholder="e.g. Sub-Zero, Bosch" /></div>
                  <div><Label className={labelCls}>Model Number</Label><Input value={app.model_number} onChange={(e) => updateAppliance(i, "model_number", e.target.value)} className={inputCls} /></div>
                  <div><Label className={labelCls}>Model Name</Label><Input value={app.model_name} onChange={(e) => updateAppliance(i, "model_name", e.target.value)} className={inputCls} /></div>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div><Label className={labelCls}>Width (mm)</Label><Input type="number" value={app.width_mm} onChange={(e) => updateAppliance(i, "width_mm", e.target.value)} className={inputCls} /></div>
                  <div><Label className={labelCls}>Height (mm)</Label><Input type="number" value={app.height_mm} onChange={(e) => updateAppliance(i, "height_mm", e.target.value)} className={inputCls} /></div>
                  <div><Label className={labelCls}>Depth (mm)</Label><Input type="number" value={app.depth_mm} onChange={(e) => updateAppliance(i, "depth_mm", e.target.value)} className={inputCls} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label className={labelCls}>Notes</Label><Input value={app.notes} onChange={(e) => updateAppliance(i, "notes", e.target.value)} className={inputCls} placeholder="e.g. Panel-ready" /></div>
                  <div><Label className={labelCls}>Reference URL</Label><Input value={app.reference_url} onChange={(e) => updateAppliance(i, "reference_url", e.target.value)} className={inputCls} placeholder="https://" /></div>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addAppliance}><Plus className="w-4 h-4 mr-2" />Add Compatible Appliance</Button>
            </fieldset>
            {!isReadOnly && <SaveSectionButton onClick={() => saveSectionToDb("appliances")} saving={savingSection === "appliances"} saved={sectionSaved.appliances} dirty={sectionDirty.appliances} />}
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECTION 8 — IMAGES & DOCUMENTS ═══ */}
        <AccordionItem value="images" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">8 · Images & Documents <SectionIndicator section="images" /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <fieldset disabled={isReadOnly}>
            <ImageUpload value={mainImageUrl} onChange={(v) => { setMainImageUrl(v); markDirty("images"); }} label="Main Image (auto-optimized to WebP)" />
            <MultiImageUpload value={galleryUrls.length ? galleryUrls : null} onChange={(v) => { setGalleryUrls(v); markDirty("images"); }} label="Gallery Images (auto-optimized to WebP, max 25)" />
            <FileUpload value={techDrawingUrl} onChange={(v) => { setTechDrawingUrl(v); markDirty("images"); }} label="Technical Drawings (PDF)" accept=".pdf" bucket="product-documents" />
            </fieldset>
            {!isReadOnly && <SaveSectionButton onClick={() => saveSectionToDb("images")} saving={savingSection === "images"} saved={sectionSaved.images} dirty={sectionDirty.images} />}
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECTION 9 — DESCRIPTION & VISIBILITY ═══ */}
        <AccordionItem value="details" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">9 · Description & Visibility <SectionIndicator section="details" /></AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <fieldset disabled={isReadOnly}>
            <div>
              <Label className={labelCls}>Short Description</Label>
              <Textarea value={s8.short_description} onChange={(e) => setS8ValDirty("short_description", e.target.value.slice(0, 200))} className="mt-1 resize-none" rows={2} maxLength={200} />
              <p className="text-xs text-muted-foreground mt-1">{s8.short_description.length}/200</p>
            </div>
            <div>
              <Label className={labelCls}>Long Description</Label>
              <Textarea value={s8.long_description} onChange={(e) => setS8ValDirty("long_description", e.target.value)} className="mt-1 resize-none" rows={5} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label className={labelCls}>Stock Level</Label><Input type="number" value={s8.stock_level} onChange={(e) => setS8ValDirty("stock_level", e.target.value)} className={inputCls} /></div>
              <div><Label className={labelCls}>Availability Status</Label>
                <Select value={s8.availability_status} onValueChange={(v) => setS8ValDirty("availability_status", v)}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent>{availabilityStatuses.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="featured-toggle" checked={isFeatured} onCheckedChange={(v) => { setIsFeatured(v); markDirty("details"); }} />
              <Label htmlFor="featured-toggle" className="text-sm">Featured Product</Label>
            </div>
            </fieldset>
            {!isReadOnly && <SaveSectionButton onClick={() => saveSectionToDb("details")} saving={savingSection === "details"} saved={sectionSaved.details} dirty={sectionDirty.details} />}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* ── Sticky bottom action bar ── */}
      {!isReadOnly && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex gap-2">
              {(listingStatus === "draft" || !liveProductId) && (
                <Button variant="outline" onClick={() => handleFullSave("draft")} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save as Draft
                </Button>
              )}
              {listingStatus === "approved" && (
                <Button variant="outline" onClick={handleSaveApproved} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => navigate("/seller/products")} disabled={saving}>Cancel</Button>
              {(listingStatus === "draft" || !liveProductId) && (
                autoApprove ? (
                  <Button onClick={() => handleFullSave("approved")} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    Publish to Store
                  </Button>
                ) : (
                  <Button onClick={() => setSubmitDialogOpen(true)} disabled={saving}>
                    <SendHorizontal className="w-4 h-4 mr-2" />
                    Submit for Review
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit confirmation dialog */}
      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit for Review?</AlertDialogTitle>
            <AlertDialogDescription>
              Your product will be submitted for admin review. Once submitted, you cannot edit until review is complete. You can withdraw from review if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setSubmitDialogOpen(false); handleFullSave("pending_review"); }}>
              Submit for Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {uploadProgress && <p className="text-sm text-muted-foreground animate-pulse">{uploadProgress}</p>}
    </div>
  );
};

export default SellerProductForm;
