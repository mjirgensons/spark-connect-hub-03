import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Save, Upload } from "lucide-react";

const MM_TO_INCH = 0.0393701;
const fmt = (v: string) => v ? `${(Number(v) * MM_TO_INCH).toFixed(1)}″` : "";

const kitchenLayouts = ["L-Shaped", "U-Shaped", "Galley", "Island", "Peninsula", "One-Wall"];
const countertopOptions = ["no", "yes", "optional"];

const SellerNewProduct = () => {
  const [form, setForm] = useState({
    product_name: "",
    product_code: "",
    category_id: "",
    style: "",
    color: "",
    material: "",
    width_mm: "",
    height_mm: "",
    depth_mm: "",
    price_retail: "",
    price_sale: "",
    discount_pct: "",
    short_description: "",
    long_description: "",
    countertop_option: "no",
    countertop_material: "",
    countertop_thickness: "",
    countertop_finish: "",
    countertop_price_retail: "",
    countertop_price_sale: "",
    countertop_discount_pct: "",
  });
  const [layouts, setLayouts] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<FileList | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["seller-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*");
      return data || [];
    },
  });

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  // Auto-calc discount
  const updatePricing = (key: string, val: string) => {
    const next = { ...form, [key]: val };
    const retail = parseFloat(next.price_retail);
    const sale = parseFloat(next.price_sale);
    if (key === "price_retail" || key === "price_sale") {
      if (retail > 0 && sale > 0 && sale <= retail) {
        next.discount_pct = (((retail - sale) / retail) * 100).toFixed(1);
      }
    } else if (key === "discount_pct") {
      const pct = parseFloat(val);
      if (retail > 0 && pct >= 0 && pct <= 100) {
        next.price_sale = (retail * (1 - pct / 100)).toFixed(2);
      }
    }
    setForm(next);
  };

  const updateCtPricing = (key: string, val: string) => {
    const next = { ...form, [key]: val };
    const retail = parseFloat(next.countertop_price_retail);
    const sale = parseFloat(next.countertop_price_sale);
    if (key === "countertop_price_retail" || key === "countertop_price_sale") {
      if (retail > 0 && sale > 0 && sale <= retail) {
        next.countertop_discount_pct = (((retail - sale) / retail) * 100).toFixed(1);
      }
    } else if (key === "countertop_discount_pct") {
      const pct = parseFloat(val);
      if (retail > 0 && pct >= 0 && pct <= 100) {
        next.countertop_price_sale = (retail * (1 - pct / 100)).toFixed(2);
      }
    }
    setForm(next);
  };

  const toggleLayout = (l: string) => {
    setLayouts((prev) => prev.includes(l) ? prev.filter((v) => v !== l) : [...prev, l]);
  };

  const handleSave = (publish: boolean) => {
    console.log("Product data:", { ...form, layouts, publish, mainImage: mainImage?.name, additionalImages: additionalImages?.length, pdfFile: pdfFile?.name });
    toast({
      title: publish ? "Product published (placeholder)" : "Draft saved (placeholder)",
      description: "Database insert will be wired after seller_id is added to products table.",
    });
  };

  const inputClass = "mt-1 border-2 border-foreground";
  const cardStyle = { boxShadow: "4px 4px 0 0 hsl(var(--foreground))" };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-serif text-2xl md:text-3xl font-bold">Add New Product</h1>

      {/* Basic Info */}
      <Card className="border-2 border-foreground p-6 space-y-4" style={cardStyle}>
        <h2 className="font-sans font-bold text-base">Basic Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold">Product Name *</Label>
            <Input value={form.product_name} onChange={(e) => set("product_name", e.target.value)} className={inputClass} />
          </div>
          <div>
            <Label className="text-xs font-semibold">Product Code / SKU *</Label>
            <Input value={form.product_code} onChange={(e) => set("product_code", e.target.value)} className={inputClass} />
          </div>
          <div>
            <Label className="text-xs font-semibold">Category *</Label>
            <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
              <SelectTrigger className={inputClass}><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-semibold">Style</Label>
            <Input value={form.style} onChange={(e) => set("style", e.target.value)} className={inputClass} placeholder="e.g. Shaker" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Color</Label>
            <Input value={form.color} onChange={(e) => set("color", e.target.value)} className={inputClass} placeholder="e.g. White" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Material</Label>
            <Input value={form.material} onChange={(e) => set("material", e.target.value)} className={inputClass} placeholder="e.g. Solid Wood" />
          </div>
        </div>
      </Card>

      {/* Dimensions */}
      <Card className="border-2 border-foreground p-6" style={cardStyle}>
        <h2 className="font-sans font-bold text-base mb-4">Dimensions</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Width", key: "width_mm" },
            { label: "Height", key: "height_mm" },
            { label: "Depth", key: "depth_mm" },
          ].map((d) => (
            <div key={d.key}>
              <Label className="text-xs font-semibold">{d.label} (mm) *</Label>
              <Input type="number" value={(form as any)[d.key]} onChange={(e) => set(d.key, e.target.value)} className={inputClass} />
              {(form as any)[d.key] && <p className="text-xs text-muted-foreground mt-1">{fmt((form as any)[d.key])}</p>}
            </div>
          ))}
        </div>
      </Card>

      {/* Pricing */}
      <Card className="border-2 border-foreground p-6" style={cardStyle}>
        <h2 className="font-sans font-bold text-base mb-4">Pricing</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-semibold">Retail Price ($) *</Label>
            <Input type="number" step="0.01" value={form.price_retail} onChange={(e) => updatePricing("price_retail", e.target.value)} className={inputClass} />
          </div>
          <div>
            <Label className="text-xs font-semibold">Selling Price ($) *</Label>
            <Input type="number" step="0.01" value={form.price_sale} onChange={(e) => updatePricing("price_sale", e.target.value)} className={inputClass} />
          </div>
          <div>
            <Label className="text-xs font-semibold">Discount %</Label>
            <Input type="number" step="0.1" value={form.discount_pct} onChange={(e) => updatePricing("discount_pct", e.target.value)} className={inputClass} />
          </div>
        </div>
      </Card>

      {/* Description */}
      <Card className="border-2 border-foreground p-6 space-y-4" style={cardStyle}>
        <h2 className="font-sans font-bold text-base">Description</h2>
        <div>
          <Label className="text-xs font-semibold">Short Description</Label>
          <Input value={form.short_description} onChange={(e) => set("short_description", e.target.value)} className={inputClass} maxLength={200} />
        </div>
        <div>
          <Label className="text-xs font-semibold">Full Description</Label>
          <Textarea value={form.long_description} onChange={(e) => set("long_description", e.target.value)} className="mt-1 border-2 border-foreground resize-none" rows={5} />
        </div>
      </Card>

      {/* Images */}
      <Card className="border-2 border-foreground p-6 space-y-4" style={cardStyle}>
        <h2 className="font-sans font-bold text-base">Images</h2>
        <div>
          <Label className="text-xs font-semibold">Main Image</Label>
          <div className="mt-1 border-2 border-dashed border-foreground p-4 text-center cursor-pointer hover:bg-muted transition-colors">
            <input type="file" accept="image/*" onChange={(e) => setMainImage(e.target.files?.[0] || null)} className="hidden" id="main-img" />
            <label htmlFor="main-img" className="cursor-pointer">
              <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{mainImage ? mainImage.name : "Click to upload main product image"}</p>
            </label>
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold">Additional Images</Label>
          <div className="mt-1 border-2 border-dashed border-foreground p-4 text-center cursor-pointer hover:bg-muted transition-colors">
            <input type="file" accept="image/*" multiple onChange={(e) => setAdditionalImages(e.target.files)} className="hidden" id="add-imgs" />
            <label htmlFor="add-imgs" className="cursor-pointer">
              <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{additionalImages?.length ? `${additionalImages.length} file(s) selected` : "Click to upload additional images"}</p>
            </label>
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold">Installation Instructions (PDF)</Label>
          <div className="mt-1 border-2 border-dashed border-foreground p-4 text-center cursor-pointer hover:bg-muted transition-colors">
            <input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="hidden" id="pdf-file" />
            <label htmlFor="pdf-file" className="cursor-pointer">
              <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{pdfFile ? pdfFile.name : "Click to upload PDF"}</p>
            </label>
          </div>
        </div>
      </Card>

      {/* Kitchen Layouts */}
      <Card className="border-2 border-foreground p-6" style={cardStyle}>
        <h2 className="font-sans font-bold text-base mb-3">Compatible Kitchen Layouts</h2>
        <div className="flex flex-wrap gap-3">
          {kitchenLayouts.map((l) => (
            <label key={l} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={layouts.includes(l)} onCheckedChange={() => toggleLayout(l)} />
              <span className="text-sm">{l}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Countertop */}
      <Card className="border-2 border-foreground p-6 space-y-4" style={cardStyle}>
        <h2 className="font-sans font-bold text-base">Countertop Options</h2>
        <div>
          <Label className="text-xs font-semibold">Countertop Status</Label>
          <Select value={form.countertop_option} onValueChange={(v) => set("countertop_option", v)}>
            <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
            <SelectContent>
              {countertopOptions.map((o) => (
                <SelectItem key={o} value={o}>{o === "no" ? "Unavailable" : o === "yes" ? "Included" : "Optional"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {form.countertop_option !== "no" && (
          <>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-semibold">Material</Label>
                <Input value={form.countertop_material} onChange={(e) => set("countertop_material", e.target.value)} className={inputClass} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Thickness</Label>
                <Input value={form.countertop_thickness} onChange={(e) => set("countertop_thickness", e.target.value)} className={inputClass} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Finish</Label>
                <Input value={form.countertop_finish} onChange={(e) => set("countertop_finish", e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-semibold">CT Retail Price ($)</Label>
                <Input type="number" step="0.01" value={form.countertop_price_retail} onChange={(e) => updateCtPricing("countertop_price_retail", e.target.value)} className={inputClass} />
              </div>
              <div>
                <Label className="text-xs font-semibold">CT Sale Price ($)</Label>
                <Input type="number" step="0.01" value={form.countertop_price_sale} onChange={(e) => updateCtPricing("countertop_price_sale", e.target.value)} className={inputClass} />
              </div>
              <div>
                <Label className="text-xs font-semibold">CT Discount %</Label>
                <Input type="number" step="0.1" value={form.countertop_discount_pct} onChange={(e) => updateCtPricing("countertop_discount_pct", e.target.value)} className={inputClass} />
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="border-2 border-foreground" onClick={() => handleSave(false)}>
          Save as Draft
        </Button>
        <Button onClick={() => handleSave(true)}>
          Publish Product
        </Button>
      </div>
    </div>
  );
};

export default SellerNewProduct;
