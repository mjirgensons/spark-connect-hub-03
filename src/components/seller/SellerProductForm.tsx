import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
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
import { Loader2, Save } from "lucide-react";

// ---------- helpers ----------
const generateCode = (name: string) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join("")
    .slice(0, 4);
  return initials ? `${initials}-001` : "";
};

const inToMm = (v: number) => Math.round(v * 25.4);
const mmToIn = (v: number) => +(v / 25.4).toFixed(2);

// ---------- option lists ----------
const doorStyles = ["shaker", "slab", "raised_panel", "recessed_panel", "beadboard", "louvered", "glass_front", "other"];
const doorMaterials = ["solid_wood", "mdf", "thermofoil", "plywood", "particleboard", "other"];
const finishTypes = ["paint", "stain", "lacquer", "laminate", "veneer", "melamine", "acrylic", "other"];
const conditions = ["NEW", "NEW-OB", "OVERSTK", "DISC", "EX-DISP", "FLOOR", "RETURN", "REFURB", "USED-A", "USED-B", "USED-C", "AS-IS", "PART"];
const hingeBrands = ["Blum", "Grass", "Hettich", "Salice", "Other"];
const slideBrands = ["Blum", "Grass", "Hettich", "Accuride", "King Slide", "Other"];
const handleTypes = ["knob", "bar_pull", "bin_pull", "edge_pull", "finger_pull", "push_to_open", "integrated_channel", "other"];

// ---------- layout visuals ----------
const LayoutVisual = ({ type, dims }: { type: string; dims: Record<string, string> }) => {
  const base = "border-2 border-primary/60 rounded text-[10px] flex items-center justify-center text-muted-foreground";
  if (type === "straight") {
    return (
      <div className="flex items-end gap-1 py-4">
        <div className={`${base} w-40 h-10`}>{dims.width_mm || "W"}</div>
      </div>
    );
  }
  if (type === "l_shape") {
    return (
      <div className="py-4 relative w-40 h-28">
        <div className={`${base} absolute bottom-0 left-0 w-40 h-10`}>{dims.wall_a || "A"}</div>
        <div className={`${base} absolute bottom-0 left-0 w-10 h-28`}>{dims.wall_b || "B"}</div>
      </div>
    );
  }
  if (type === "u_shape") {
    return (
      <div className="py-4 relative w-44 h-28">
        <div className={`${base} absolute bottom-0 left-0 w-44 h-10`}>{dims.wall_a || "A"}</div>
        <div className={`${base} absolute bottom-0 left-0 w-10 h-28`}>{dims.wall_c || "C"}</div>
        <div className={`${base} absolute bottom-0 right-0 w-10 h-28`}>{dims.wall_b || "B"}</div>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-1 py-4">
      <div className={`${base} w-20 h-16`}>{dims.width_mm || "W"}</div>
    </div>
  );
};

// ---------- component ----------
const SellerProductForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [useInches, setUseInches] = useState(false);
  const [codeEdited, setCodeEdited] = useState(false);

  // form state
  const [f, setF] = useState({
    product_name: "", product_code: "", category_id: "", style: "", color: "", material: "",
    door_style: "", door_material: "", finish_type: "", construction_type: "", condition: "NEW",
    condition_notes: "", manufacturer: "",
    // dimensions (always stored as mm strings)
    width_mm: "", height_mm: "", depth_mm: "",
    wall_a_length_mm: "", wall_b_length_mm: "", wall_c_length_mm: "",
    // hardware
    hinge_brand: "", hinge_model: "", slide_brand: "", slide_model: "",
    handle_type: "", handle_finish: "",
    // pricing
    price_retail: "", price_sale: "",
    lead_time_days: "", is_custom_order: false,
  });

  const set = (key: string, val: string | boolean) => setF((p) => ({ ...p, [key]: val }));

  // auto-generate code
  const handleNameChange = (name: string) => {
    setF((p) => ({
      ...p,
      product_name: name,
      ...(codeEdited ? {} : { product_code: generateCode(name) }),
    }));
  };

  // categories
  const { data: categories = [] } = useQuery({
    queryKey: ["seller-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*");
      return data || [];
    },
  });

  const selectedCategory = useMemo(
    () => categories.find((c: any) => c.id === f.category_id),
    [categories, f.category_id],
  );
  const layoutType: string = selectedCategory?.layout_type || "standard";

  // discount calc
  const retail = parseFloat(f.price_retail);
  const sale = parseFloat(f.price_sale);
  const discountPct =
    retail > 0 && sale > 0 && sale <= retail
      ? Math.round((1 - sale / retail) * 100)
      : null;

  // dimension display helpers
  const dimVal = (key: string) => {
    const raw = (f as any)[key] as string;
    if (!raw) return "";
    if (useInches) return String(mmToIn(Number(raw)));
    return raw;
  };
  const setDim = (key: string, val: string) => {
    if (useInches) {
      const mm = val ? String(inToMm(Number(val))) : "";
      set(key, mm);
    } else {
      set(key, val);
    }
  };

  // submit
  const handleSubmit = async () => {
    if (!f.product_name || !f.product_code || !f.category_id || !f.price_retail) {
      toast({ title: "Missing required fields", description: "Product name, code, category, and retail price are required.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Not authenticated", variant: "destructive" });
      return;
    }

    setSaving(true);
    const row: Record<string, unknown> = {
      product_name: f.product_name,
      product_code: f.product_code,
      category_id: f.category_id,
      style: f.style || "N/A",
      color: f.color || "N/A",
      material: f.material || "N/A",
      door_style: f.door_style || null,
      door_material: f.door_material || null,
      finish_type: f.finish_type || null,
      construction_type: f.construction_type || null,
      condition: f.condition,
      condition_notes: f.condition !== "NEW" ? f.condition_notes || null : null,
      manufacturer: f.manufacturer || null,
      width_mm: f.width_mm ? Number(f.width_mm) : 0,
      height_mm: f.height_mm ? Number(f.height_mm) : 0,
      depth_mm: f.depth_mm ? Number(f.depth_mm) : 0,
      wall_a_length_mm: f.wall_a_length_mm ? Number(f.wall_a_length_mm) : null,
      wall_b_length_mm: f.wall_b_length_mm ? Number(f.wall_b_length_mm) : null,
      wall_c_length_mm: f.wall_c_length_mm ? Number(f.wall_c_length_mm) : null,
      hinge_brand: f.hinge_brand || null,
      hinge_model: f.hinge_model || null,
      slide_brand: f.slide_brand || null,
      slide_model: f.slide_model || null,
      price_retail_usd: parseFloat(f.price_retail),
      price_discounted_usd: f.price_sale ? parseFloat(f.price_sale) : parseFloat(f.price_retail),
      discount_percentage: discountPct ?? 0,
      lead_time_days: f.is_custom_order && f.lead_time_days ? Number(f.lead_time_days) : null,
      is_custom_order: f.is_custom_order,
      seller_id: user.id,
      availability_status: "In Stock",
      stock_level: 0,
    };

    const { error } = await supabase.from("products").insert(row as any);
    setSaving(false);

    if (error) {
      toast({ title: "Error creating product", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Product created successfully!" });
      navigate("/seller/products");
    }
  };

  const inputCls = "mt-1";
  const labelCls = "text-xs font-semibold";

  return (
    <div className="space-y-4 max-w-3xl">
      <Accordion type="multiple" defaultValue={["basic", "dimensions", "hardware", "pricing"]} className="space-y-3">
        {/* ===== SECTION 1 — BASIC INFO ===== */}
        <AccordionItem value="basic" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">Basic Information</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className={labelCls}>Product Name *</Label>
                <Input value={f.product_name} onChange={(e) => handleNameChange(e.target.value)} className={inputCls} />
              </div>
              <div>
                <Label className={labelCls}>Product Code *</Label>
                <Input
                  value={f.product_code}
                  onChange={(e) => { setCodeEdited(true); set("product_code", e.target.value); }}
                  className={inputCls}
                  placeholder="Auto-generated"
                />
              </div>
              <div>
                <Label className={labelCls}>Category *</Label>
                <Select value={f.category_id} onValueChange={(v) => set("category_id", v)}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelCls}>Manufacturer</Label>
                <Input value={f.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label className={labelCls}>Style</Label>
                <Input value={f.style} onChange={(e) => set("style", e.target.value)} className={inputCls} placeholder="e.g. Shaker" />
              </div>
              <div>
                <Label className={labelCls}>Color</Label>
                <Input value={f.color} onChange={(e) => set("color", e.target.value)} className={inputCls} placeholder="e.g. White" />
              </div>
              <div>
                <Label className={labelCls}>Material</Label>
                <Input value={f.material} onChange={(e) => set("material", e.target.value)} className={inputCls} placeholder="e.g. Solid Wood" />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label className={labelCls}>Door Style</Label>
                <Select value={f.door_style} onValueChange={(v) => set("door_style", v)}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{doorStyles.map((o) => <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelCls}>Door Material</Label>
                <Select value={f.door_material} onValueChange={(v) => set("door_material", v)}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{doorMaterials.map((o) => <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelCls}>Finish Type</Label>
                <Select value={f.finish_type} onValueChange={(v) => set("finish_type", v)}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{finishTypes.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className={labelCls}>Construction Type</Label>
              <RadioGroup value={f.construction_type} onValueChange={(v) => set("construction_type", v)} className="flex gap-6 mt-1">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="framed" id="ct-framed" />
                  <Label htmlFor="ct-framed">Framed</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="frameless" id="ct-frameless" />
                  <Label htmlFor="ct-frameless">Frameless</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className={labelCls}>Condition</Label>
                <Select value={f.condition} onValueChange={(v) => set("condition", v)}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent>{conditions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {f.condition !== "NEW" && (
                <div className="sm:col-span-2">
                  <Label className={labelCls}>Condition Notes</Label>
                  <Textarea value={f.condition_notes} onChange={(e) => set("condition_notes", e.target.value)} className="mt-1 resize-none" rows={2} placeholder="Describe the condition..." />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ===== SECTION 2 — DIMENSIONS ===== */}
        <AccordionItem value="dimensions" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">Dimensions</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs">mm</Label>
              <Switch checked={useInches} onCheckedChange={setUseInches} />
              <Label className="text-xs">inches</Label>
            </div>

            {!f.category_id && <p className="text-sm text-muted-foreground">Select a category to see dimension fields.</p>}

            {f.category_id && (
              <>
                <LayoutVisual
                  type={layoutType}
                  dims={{
                    width_mm: dimVal("width_mm"),
                    wall_a: dimVal("wall_a_length_mm"),
                    wall_b: dimVal("wall_b_length_mm"),
                    wall_c: dimVal("wall_c_length_mm"),
                  }}
                />

                <div className="grid sm:grid-cols-3 gap-4">
                  {(layoutType === "straight" || layoutType === "standard" || !layoutType) && (
                    <div>
                      <Label className={labelCls}>{layoutType === "straight" ? "Wall Length" : "Width"} ({useInches ? "in" : "mm"})</Label>
                      <Input type="number" value={dimVal("width_mm")} onChange={(e) => setDim("width_mm", e.target.value)} className={inputCls} />
                    </div>
                  )}
                  {(layoutType === "l_shape" || layoutType === "u_shape") && (
                    <>
                      <div>
                        <Label className={labelCls}>Wall A ({useInches ? "in" : "mm"})</Label>
                        <Input type="number" value={dimVal("wall_a_length_mm")} onChange={(e) => setDim("wall_a_length_mm", e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <Label className={labelCls}>Wall B ({useInches ? "in" : "mm"})</Label>
                        <Input type="number" value={dimVal("wall_b_length_mm")} onChange={(e) => setDim("wall_b_length_mm", e.target.value)} className={inputCls} />
                      </div>
                    </>
                  )}
                  {layoutType === "u_shape" && (
                    <div>
                      <Label className={labelCls}>Wall C ({useInches ? "in" : "mm"})</Label>
                      <Input type="number" value={dimVal("wall_c_length_mm")} onChange={(e) => setDim("wall_c_length_mm", e.target.value)} className={inputCls} />
                    </div>
                  )}
                  <div>
                    <Label className={labelCls}>Height ({useInches ? "in" : "mm"})</Label>
                    <Input type="number" value={dimVal("height_mm")} onChange={(e) => setDim("height_mm", e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <Label className={labelCls}>Depth ({useInches ? "in" : "mm"})</Label>
                    <Input type="number" value={dimVal("depth_mm")} onChange={(e) => setDim("depth_mm", e.target.value)} className={inputCls} />
                  </div>
                </div>
              </>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* ===== SECTION 3 — HARDWARE ===== */}
        <AccordionItem value="hardware" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">Hardware Details</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className={labelCls}>Hinge Brand</Label>
                <Select value={f.hinge_brand} onValueChange={(v) => set("hinge_brand", v)}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{hingeBrands.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {f.hinge_brand && (
                <div>
                  <Label className={labelCls}>Hinge Model</Label>
                  <Input value={f.hinge_model} onChange={(e) => set("hinge_model", e.target.value)} className={inputCls} />
                </div>
              )}
              <div>
                <Label className={labelCls}>Drawer Slide Brand</Label>
                <Select value={f.slide_brand} onValueChange={(v) => set("slide_brand", v)}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{slideBrands.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {f.slide_brand && (
                <div>
                  <Label className={labelCls}>Drawer Slide Model</Label>
                  <Input value={f.slide_model} onChange={(e) => set("slide_model", e.target.value)} className={inputCls} />
                </div>
              )}
              <div>
                <Label className={labelCls}>Handle Type</Label>
                <Select value={f.handle_type} onValueChange={(v) => set("handle_type", v)}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{handleTypes.map((o) => <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelCls}>Handle Finish</Label>
                <Input value={f.handle_finish} onChange={(e) => set("handle_finish", e.target.value)} className={inputCls} placeholder="e.g. Brushed Nickel, Matte Black" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ===== SECTION 4 — PRICING ===== */}
        <AccordionItem value="pricing" className="border rounded-lg">
          <AccordionTrigger className="px-4 font-bold text-base">Pricing</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label className={labelCls}>Retail Price (CAD) *</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input type="number" step="0.01" value={f.price_retail} onChange={(e) => set("price_retail", e.target.value)} className="pl-7" />
                </div>
              </div>
              <div>
                <Label className={labelCls}>Sale Price (CAD)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input type="number" step="0.01" value={f.price_sale} onChange={(e) => set("price_sale", e.target.value)} className="pl-7" />
                </div>
              </div>
              <div>
                <Label className={labelCls}>Discount</Label>
                <Input value={discountPct !== null ? `${discountPct}%` : "—"} readOnly className="mt-1 bg-muted" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="custom-order"
                checked={f.is_custom_order}
                onCheckedChange={(v) => set("is_custom_order", !!v)}
              />
              <Label htmlFor="custom-order" className="text-sm">This is a custom/made-to-order product</Label>
            </div>

            {f.is_custom_order && (
              <div className="max-w-xs">
                <Label className={labelCls}>Lead Time (days)</Label>
                <Input type="number" value={f.lead_time_days} onChange={(e) => set("lead_time_days", e.target.value)} className={inputCls} />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Create Product
        </Button>
        <Button variant="outline" onClick={() => navigate("/seller/products")} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default SellerProductForm;
