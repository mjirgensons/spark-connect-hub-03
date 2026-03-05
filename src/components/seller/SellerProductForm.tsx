import { useState, useMemo } from "react";
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
import { Loader2, Save, Plus, Trash2, Info, X, Eye } from "lucide-react";
import { ImageUpload, MultiImageUpload } from "@/components/admin/ImageUpload";
import { FileUpload } from "@/components/admin/FileUpload";

// ── helpers ──
const generateCode = (name: string) => {
  const initials = name.split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase()).join("").slice(0, 4);
  return initials ? `${initials}-001` : "";
};
const inToMm = (v: number) => Math.round(v * 25.4);
const mmToIn = (v: number) => +(v / 25.4).toFixed(2);

// ── option lists ──
const doorStyles = ["shaker", "slab", "raised_panel", "recessed_panel", "beadboard", "louvered", "glass_front", "other"];
const doorMaterials = ["solid_wood", "mdf", "thermofoil", "plywood", "particleboard", "other"];
const finishTypes = ["paint", "stain", "lacquer", "laminate", "veneer", "melamine", "acrylic", "other"];
const conditions = ["NEW", "NEW-OB", "OVERSTK", "DISC", "EX-DISP", "FLOOR", "RETURN", "REFURB", "USED-A", "USED-B", "USED-C", "AS-IS", "PART"];
const hingeBrands = ["Blum", "Grass", "Hettich", "Salice", "Other"];
const slideBrands = ["Blum", "Grass", "Hettich", "Accuride", "King Slide", "Other"];
const handleTypes = ["knob", "bar_pull", "bin_pull", "edge_pull", "finger_pull", "push_to_open", "integrated_channel", "other"];
const optionTypes = ["countertop", "sink", "faucet", "appliance", "installation", "delivery", "backsplash", "hardware", "lighting"];
const applianceTypes = ["refrigerator", "range", "wall_oven", "cooktop", "dishwasher", "microwave", "range_hood", "wine_cooler", "trash_compactor", "warming_drawer", "ice_maker"];
const availabilityStatuses = ["In Stock", "Low Stock", "Deactivated"];

// ── types ──
interface ProductOption {
  option_type: string; option_name: string; inclusion_status: string;
  price_retail: string; price_discounted: string; description: string;
  specs: { key: string; value: string }[];
}
interface CompatAppliance {
  appliance_type: string; brand: string; model_number: string; model_name: string;
  width_mm: string; height_mm: string; depth_mm: string; notes: string; reference_url: string;
}

// ── layout visual ──
const LayoutVisual = ({ type, dims }: { type: string; dims: Record<string, string> }) => {
  const base = "border-2 border-primary/60 rounded text-[10px] flex items-center justify-center text-muted-foreground";
  if (type === "straight") return <div className="flex items-end gap-1 py-4"><div className={`${base} w-40 h-10`}>{dims.width_mm || "W"}</div></div>;
  if (type === "l_shape") return <div className="py-4 relative w-40 h-28"><div className={`${base} absolute bottom-0 left-0 w-40 h-10`}>{dims.wall_a || "A"}</div><div className={`${base} absolute bottom-0 left-0 w-10 h-28`}>{dims.wall_b || "B"}</div></div>;
  if (type === "u_shape") return <div className="py-4 relative w-44 h-28"><div className={`${base} absolute bottom-0 left-0 w-44 h-10`}>{dims.wall_a || "A"}</div><div className={`${base} absolute bottom-0 left-0 w-10 h-28`}>{dims.wall_c || "C"}</div><div className={`${base} absolute bottom-0 right-0 w-10 h-28`}>{dims.wall_b || "B"}</div></div>;
  return <div className="flex items-end gap-1 py-4"><div className={`${base} w-20 h-16`}>{dims.width_mm || "W"}</div></div>;
};

// ── main component ──
const SellerProductForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [useInches, setUseInches] = useState(false);
  const [codeEdited, setCodeEdited] = useState(false);

  // S1-S4 form state
  const [f, setF] = useState({
    product_name: "", product_code: "", category_id: "", style: "", color: "", material: "",
    door_style: "", door_material: "", finish_type: "", construction_type: "", condition: "NEW",
    condition_notes: "", manufacturer: "",
    width_mm: "", height_mm: "", depth_mm: "",
    wall_a_length_mm: "", wall_b_length_mm: "", wall_c_length_mm: "",
    hinge_brand: "", hinge_model: "", slide_brand: "", slide_model: "",
    handle_type: "", handle_finish: "",
    price_retail: "", price_sale: "", lead_time_days: "", is_custom_order: false,
  });

  // S5 add-ons
  const [options, setOptions] = useState<ProductOption[]>([]);
  // S6 compatible appliances
  const [appliances, setAppliances] = useState<CompatAppliance[]>([]);
  // S7 images (managed by shared upload components — URLs stored directly)
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [techDrawingUrl, setTechDrawingUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  // S8 description & visibility
  const [s8, setS8] = useState({
    short_description: "", long_description: "", stock_level: "0",
    availability_status: "In Stock", visibility: "draft",
  });

  const set = (key: string, val: string | boolean) => setF((p) => ({ ...p, [key]: val }));
  const setS8Val = (key: string, val: string) => setS8((p) => ({ ...p, [key]: val }));

  const handleNameChange = (name: string) => {
    setF((p) => ({ ...p, product_name: name, ...(codeEdited ? {} : { product_code: generateCode(name) }) }));
  };

  const { data: categories = [] } = useQuery({
    queryKey: ["seller-categories"],
    queryFn: async () => { const { data } = await supabase.from("categories").select("*"); return data || []; },
  });

  const selectedCategory = useMemo(() => categories.find((c: any) => c.id === f.category_id), [categories, f.category_id]);
  const layoutType: string = selectedCategory?.layout_type || "standard";

  const retail = parseFloat(f.price_retail);
  const sale = parseFloat(f.price_sale);
  const discountPct = retail > 0 && sale > 0 && sale <= retail ? Math.round((1 - sale / retail) * 100) : null;

  const dimVal = (key: string) => { const raw = (f as any)[key] as string; if (!raw) return ""; return useInches ? String(mmToIn(Number(raw))) : raw; };
  const setDim = (key: string, val: string) => { if (useInches) { set(key, val ? String(inToMm(Number(val))) : ""); } else { set(key, val); } };

  // S5 helpers
  const addOption = () => setOptions((p) => [...p, { option_type: "", option_name: "", inclusion_status: "not_included", price_retail: "", price_discounted: "", description: "", specs: [] }]);
  const removeOption = (i: number) => setOptions((p) => p.filter((_, idx) => idx !== i));
  const updateOption = (i: number, key: string, val: string) => setOptions((p) => p.map((o, idx) => idx === i ? { ...o, [key]: val } : o));
  const addSpec = (i: number) => setOptions((p) => p.map((o, idx) => idx === i ? { ...o, specs: [...o.specs, { key: "", value: "" }] } : o));
  const removeSpec = (oi: number, si: number) => setOptions((p) => p.map((o, idx) => idx === oi ? { ...o, specs: o.specs.filter((_, j) => j !== si) } : o));
  const updateSpec = (oi: number, si: number, field: "key" | "value", val: string) => setOptions((p) => p.map((o, idx) => idx === oi ? { ...o, specs: o.specs.map((s, j) => j === si ? { ...s, [field]: val } : s) } : o));

  // S6 helpers
  const showAppliances = options.some((o) => o.option_type === "appliance" && o.inclusion_status === "not_included");
  const addAppliance = () => setAppliances((p) => [...p, { appliance_type: "", brand: "", model_number: "", model_name: "", width_mm: "", height_mm: "", depth_mm: "", notes: "", reference_url: "" }]);
  const removeAppliance = (i: number) => setAppliances((p) => p.filter((_, idx) => idx !== i));
  const updateAppliance = (i: number, key: string, val: string) => setAppliances((p) => p.map((a, idx) => idx === i ? { ...a, [key]: val } : a));

  // S7 — no manual helpers needed; ImageUpload/MultiImageUpload/FileUpload manage state

  // ── SUBMIT ──
  const handleSubmit = async (visibility: "draft" | "published") => {
    if (!f.product_name || !f.product_code || !f.category_id || !f.price_retail) {
      toast({ title: "Missing required fields", description: "Product name, code, category, and retail price are required.", variant: "destructive" });
      return;
    }
    if (!user) { toast({ title: "Not authenticated", variant: "destructive" }); return; }

    setSaving(true);
    try {
      // 1. INSERT product
      const row: Record<string, unknown> = {
        product_name: f.product_name, product_code: f.product_code, category_id: f.category_id,
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
        hinge_brand: f.hinge_brand || null, hinge_model: f.hinge_model || null,
        slide_brand: f.slide_brand || null, slide_model: f.slide_model || null,
        price_retail_usd: parseFloat(f.price_retail),
        price_discounted_usd: f.price_sale ? parseFloat(f.price_sale) : parseFloat(f.price_retail),
        discount_percentage: discountPct ?? 0,
        lead_time_days: f.is_custom_order && f.lead_time_days ? Number(f.lead_time_days) : null,
        is_custom_order: f.is_custom_order,
        seller_id: user.id, availability_status: s8.availability_status,
        stock_level: Number(s8.stock_level) || 0,
        short_description: s8.short_description || null, long_description: s8.long_description || null,
        tag: visibility,
      };

      const { data: product, error: prodErr } = await supabase.from("products").insert(row as any).select("id").single();
      if (prodErr || !product) throw new Error(prodErr?.message || "Failed to create product");
      const productId = product.id;

      // 2. Update product with image/document URLs (already uploaded by components)
      setUploadProgress("Saving media references...");
      const mediaUpdates: Record<string, unknown> = {};
      if (mainImageUrl) mediaUpdates.main_image_url = mainImageUrl;
      if (galleryUrls.length) mediaUpdates.additional_image_urls = galleryUrls;
      if (techDrawingUrl) mediaUpdates.technical_drawings_url = techDrawingUrl;
      if (Object.keys(mediaUpdates).length) {
        await supabase.from("products").update(mediaUpdates as any).eq("id", productId);
      }

      // 3. INSERT product_options
      setUploadProgress("Saving options...");
      if (options.length) {
        const optRows = options.filter((o) => o.option_type && o.option_name).map((o, i) => ({
          product_id: productId,
          option_type: o.option_type,
          option_name: o.option_name,
          inclusion_status: o.inclusion_status,
          price_retail: o.inclusion_status === "optional" && o.price_retail ? parseFloat(o.price_retail) : 0,
          price_discounted: o.inclusion_status === "optional" && o.price_discounted ? parseFloat(o.price_discounted) : 0,
          description: o.description || null,
          specifications: o.specs.reduce((acc, s) => (s.key ? { ...acc, [s.key]: s.value } : acc), {} as Record<string, string>),
          sort_order: i,
        }));
        if (optRows.length) {
          const { error: optErr } = await supabase.from("product_options").insert(optRows as any);
          if (optErr) console.error("Options insert error:", optErr.message);
        }
      }

      // 4. INSERT compatible appliances
      if (appliances.length) {
        const appRows = appliances.filter((a) => a.appliance_type).map((a, i) => ({
          product_id: productId,
          appliance_type: a.appliance_type,
          brand: a.brand || null,
          model_number: a.model_number || null,
          model_name: a.model_name || null,
          dimensions: { width_mm: Number(a.width_mm) || 0, height_mm: Number(a.height_mm) || 0, depth_mm: Number(a.depth_mm) || 0 },
          notes: a.notes || null,
          reference_url: a.reference_url || null,
          sort_order: i,
        }));
        if (appRows.length) {
          const { error: appErr } = await supabase.from("product_compatible_appliances").insert(appRows as any);
          if (appErr) console.error("Appliances insert error:", appErr.message);
        }
      }

      setUploadProgress(null);
      toast({ title: "Product created successfully!" });
      navigate("/seller/products");
    } catch (err: any) {
      toast({ title: "Error creating product", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const labelCls = "text-xs font-semibold";
  const inputCls = "mt-1";

  return (
    <div className="space-y-4 max-w-3xl">
      <Accordion type="multiple" defaultValue={["basic", "dimensions", "hardware", "pricing", "addons", "appliances", "images", "details"]} className="space-y-3">

        {/* ═══ SECTION 1 — BASIC INFO ═══ */}
        <AccordionItem value="basic" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">1 · Basic Information</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label className={labelCls}>Product Name *</Label><Input value={f.product_name} onChange={(e) => handleNameChange(e.target.value)} className={inputCls} /></div>
              <div><Label className={labelCls}>Product Code *</Label><Input value={f.product_code} onChange={(e) => { setCodeEdited(true); set("product_code", e.target.value); }} className={inputCls} placeholder="Auto-generated" /></div>
              <div><Label className={labelCls}>Category *</Label>
                <Select value={f.category_id} onValueChange={(v) => set("category_id", v)}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className={labelCls}>Manufacturer</Label><Input value={f.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} className={inputCls} /></div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div><Label className={labelCls}>Style</Label><Input value={f.style} onChange={(e) => set("style", e.target.value)} className={inputCls} placeholder="e.g. Shaker" /></div>
              <div><Label className={labelCls}>Color</Label><Input value={f.color} onChange={(e) => set("color", e.target.value)} className={inputCls} placeholder="e.g. White" /></div>
              <div><Label className={labelCls}>Material</Label><Input value={f.material} onChange={(e) => set("material", e.target.value)} className={inputCls} placeholder="e.g. Solid Wood" /></div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div><Label className={labelCls}>Door Style</Label><Select value={f.door_style} onValueChange={(v) => set("door_style", v)}><SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{doorStyles.map((o) => <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className={labelCls}>Door Material</Label><Select value={f.door_material} onValueChange={(v) => set("door_material", v)}><SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{doorMaterials.map((o) => <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className={labelCls}>Finish Type</Label><Select value={f.finish_type} onValueChange={(v) => set("finish_type", v)}><SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{finishTypes.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label className={labelCls}>Construction Type</Label>
              <RadioGroup value={f.construction_type} onValueChange={(v) => set("construction_type", v)} className="flex gap-6 mt-1">
                <div className="flex items-center gap-2"><RadioGroupItem value="framed" id="ct-framed" /><Label htmlFor="ct-framed">Framed</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="frameless" id="ct-frameless" /><Label htmlFor="ct-frameless">Frameless</Label></div>
              </RadioGroup>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label className={labelCls}>Condition</Label><Select value={f.condition} onValueChange={(v) => set("condition", v)}><SelectTrigger className={inputCls}><SelectValue /></SelectTrigger><SelectContent>{conditions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
              {f.condition !== "NEW" && <div className="sm:col-span-2"><Label className={labelCls}>Condition Notes</Label><Textarea value={f.condition_notes} onChange={(e) => set("condition_notes", e.target.value)} className="mt-1 resize-none" rows={2} placeholder="Describe the condition..." /></div>}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECTION 2 — DIMENSIONS ═══ */}
        <AccordionItem value="dimensions" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">2 · Dimensions</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECTION 3 — HARDWARE ═══ */}
        <AccordionItem value="hardware" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">3 · Hardware Details</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label className={labelCls}>Hinge Brand</Label><Select value={f.hinge_brand} onValueChange={(v) => set("hinge_brand", v)}><SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{hingeBrands.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
              {f.hinge_brand && <div><Label className={labelCls}>Hinge Model</Label><Input value={f.hinge_model} onChange={(e) => set("hinge_model", e.target.value)} className={inputCls} /></div>}
              <div><Label className={labelCls}>Drawer Slide Brand</Label><Select value={f.slide_brand} onValueChange={(v) => set("slide_brand", v)}><SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{slideBrands.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
              {f.slide_brand && <div><Label className={labelCls}>Drawer Slide Model</Label><Input value={f.slide_model} onChange={(e) => set("slide_model", e.target.value)} className={inputCls} /></div>}
              <div><Label className={labelCls}>Handle Type</Label><Select value={f.handle_type} onValueChange={(v) => set("handle_type", v)}><SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{handleTypes.map((o) => <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className={labelCls}>Handle Finish</Label><Input value={f.handle_finish} onChange={(e) => set("handle_finish", e.target.value)} className={inputCls} placeholder="e.g. Brushed Nickel, Matte Black" /></div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECTION 4 — PRICING ═══ */}
        <AccordionItem value="pricing" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">4 · Pricing</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div><Label className={labelCls}>Retail Price (CAD) *</Label><div className="relative mt-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input type="number" step="0.01" value={f.price_retail} onChange={(e) => set("price_retail", e.target.value)} className="pl-7" /></div></div>
              <div><Label className={labelCls}>Sale Price (CAD)</Label><div className="relative mt-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input type="number" step="0.01" value={f.price_sale} onChange={(e) => set("price_sale", e.target.value)} className="pl-7" /></div></div>
              <div><Label className={labelCls}>Discount</Label><Input value={discountPct !== null ? `${discountPct}%` : "—"} readOnly className="mt-1 bg-muted" /></div>
            </div>
            <div className="flex items-center gap-3"><Checkbox id="custom-order" checked={f.is_custom_order} onCheckedChange={(v) => set("is_custom_order", !!v)} /><Label htmlFor="custom-order" className="text-sm">This is a custom/made-to-order product</Label></div>
            {f.is_custom_order && <div className="max-w-xs"><Label className={labelCls}>Lead Time (days)</Label><Input type="number" value={f.lead_time_days} onChange={(e) => set("lead_time_days", e.target.value)} className={inputCls} /></div>}
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECTION 5 — ADD-ONS ═══ */}
        <AccordionItem value="addons" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">5 · Add-Ons & Inclusions</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            {options.length === 0 && (
              <p className="text-sm text-muted-foreground">No add-ons yet. Click "Add Option" to include countertops, sinks, or other add-ons.</p>
            )}
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
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><Label className={labelCls}>Price Retail (CAD)</Label><div className="relative mt-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input type="number" step="0.01" value={opt.price_retail} onChange={(e) => updateOption(i, "price_retail", e.target.value)} className="pl-7" /></div></div>
                    <div><Label className={labelCls}>Price Discounted (CAD)</Label><div className="relative mt-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input type="number" step="0.01" value={opt.price_discounted} onChange={(e) => updateOption(i, "price_discounted", e.target.value)} className="pl-7" /></div></div>
                  </div>
                )}
                <div><Label className={labelCls}>Description</Label><Input value={opt.description} onChange={(e) => updateOption(i, "description", e.target.value)} className={inputCls} /></div>
                {/* Specs */}
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
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECTION 6 — COMPATIBLE APPLIANCES ═══ */}
        {showAppliances && (
          <AccordionItem value="appliances" className="border rounded-lg">
            <AccordionTrigger className="px-4 font-bold text-base">6 · Compatible Appliances</AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
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
            </AccordionContent>
          </AccordionItem>
        )}

        {/* ═══ SECTION 7 — IMAGES & DOCUMENTS ═══ */}
        <AccordionItem value="images" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">7 · Images & Documents</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <ImageUpload
              value={mainImageUrl}
              onChange={setMainImageUrl}
              label="Main Image (auto-optimized to WebP)"
            />
            <MultiImageUpload
              value={galleryUrls.length ? galleryUrls : null}
              onChange={setGalleryUrls}
              label="Gallery Images (auto-optimized to WebP, max 25)"
            />
            <FileUpload
              value={techDrawingUrl}
              onChange={setTechDrawingUrl}
              label="Technical Drawings (PDF)"
              accept=".pdf"
              bucket="product-documents"
            />
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECTION 8 — DESCRIPTION & VISIBILITY ═══ */}
        <AccordionItem value="details" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">8 · Description & Visibility</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <div>
              <Label className={labelCls}>Short Description</Label>
              <Textarea value={s8.short_description} onChange={(e) => setS8Val("short_description", e.target.value.slice(0, 200))} className="mt-1 resize-none" rows={2} maxLength={200} />
              <p className="text-xs text-muted-foreground mt-1">{s8.short_description.length}/200</p>
            </div>
            <div>
              <Label className={labelCls}>Long Description</Label>
              <Textarea value={s8.long_description} onChange={(e) => setS8Val("long_description", e.target.value)} className="mt-1 resize-none" rows={5} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label className={labelCls}>Stock Level</Label><Input type="number" value={s8.stock_level} onChange={(e) => setS8Val("stock_level", e.target.value)} className={inputCls} /></div>
              <div><Label className={labelCls}>Availability Status</Label>
                <Select value={s8.availability_status} onValueChange={(v) => setS8Val("availability_status", v)}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent>{availabilityStatuses.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className={labelCls}>Visibility</Label>
              <RadioGroup value={s8.visibility} onValueChange={(v) => setS8Val("visibility", v)} className="flex gap-6 mt-1">
                <div className="flex items-center gap-2"><RadioGroupItem value="draft" id="vis-draft" /><Label htmlFor="vis-draft">Draft</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="published" id="vis-pub" /><Label htmlFor="vis-pub">Published</Label></div>
              </RadioGroup>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* ── Submit buttons ── */}
      {uploadProgress && <p className="text-sm text-muted-foreground animate-pulse">{uploadProgress}</p>}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save as Draft
        </Button>
        <Button onClick={() => handleSubmit("published")} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          Publish
        </Button>
        <Button variant="ghost" onClick={() => navigate("/seller/products")} disabled={saving}>Cancel</Button>
      </div>
    </div>
  );
};

export default SellerProductForm;
