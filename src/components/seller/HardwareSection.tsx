import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Camera, Loader2, Plus, X } from "lucide-react";
import { optimizeImage } from "@/lib/optimizeImage";

export interface HardwareSpec { key: string; value: string }

export interface HardwareItem {
  brand?: string;
  model?: string;
  type?: string;
  finish?: string;
  image_url?: string;
  specs: HardwareSpec[];
}

export interface HardwareDetails {
  hinges: HardwareItem;
  drawer_slides: HardwareItem;
  handles: HardwareItem;
}

export const emptyHardwareDetails: HardwareDetails = {
  hinges: { brand: "", model: "", image_url: "", specs: [] },
  drawer_slides: { brand: "", model: "", image_url: "", specs: [] },
  handles: { type: "", finish: "", image_url: "", specs: [] },
};

const hingeBrands = ["Blum", "Grass", "Hettich", "Salice", "Other"];
const slideBrands = ["Blum", "Grass", "Hettich", "Accuride", "King Slide", "Other"];
const handleTypes = ["knob", "bar_pull", "bin_pull", "edge_pull", "finger_pull", "push_to_open", "integrated_channel", "other"];

interface HardwareSubSectionProps {
  title: string;
  item: HardwareItem;
  onChange: (item: HardwareItem) => void;
  fields: { label: string; key: "brand" | "model" | "type" | "finish"; options?: string[] }[];
  uploadPath: string;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const HardwareSubSection = ({ title, item, onChange, fields, uploadPath }: HardwareSubSectionProps) => {
  const [uploading, setUploading] = useState(false);
  const [optSummary, setOptSummary] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: string, val: string) => onChange({ ...item, [key]: val });
  const addSpec = () => onChange({ ...item, specs: [...item.specs, { key: "", value: "" }] });
  const removeSpec = (i: number) => onChange({ ...item, specs: item.specs.filter((_, idx) => idx !== i) });
  const updateSpec = (i: number, field: "key" | "value", val: string) =>
    onChange({ ...item, specs: item.specs.map((s, idx) => idx === i ? { ...s, [field]: val } : s) });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setOptSummary(null);
    try {
      const originalSize = file.size;
      const optimized = await optimizeImage(file, { maxWidth: 256, maxHeight: 256, quality: 0.8 });
      const optimizedSize = optimized.size;
      const savedPct = originalSize > 0 ? Math.round((1 - optimizedSize / originalSize) * 100) : 0;
      setOptSummary(`${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (${savedPct}% saved)`);
      const ext = optimized.name.split(".").pop();
      const fileName = `${uploadPath}.${ext}`;
      await supabase.storage.from("product-images").upload(fileName, optimized, { upsert: true });
      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
      onChange({ ...item, image_url: data.publicUrl });
    } catch {
      setOptSummary("Upload failed");
    }
    setUploading(false);
  };

  const labelCls = "text-xs font-semibold";

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-bold">{title}</h4>
      <div className="flex gap-4">
        {/* Image uploader */}
        <div className="shrink-0 space-y-1">
          <div
            className="w-16 h-16 rounded border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary/50 transition-colors relative"
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : item.image_url ? (
              <img src={item.image_url} alt={title} className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-5 h-5 text-muted-foreground" />
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
          {optSummary && (
            <p className="text-[10px] text-muted-foreground leading-tight max-w-[80px]">{optSummary}</p>
          )}
        </div>

        {/* Fields */}
        <div className="flex-1 grid sm:grid-cols-2 gap-3">
          {fields.map((fld) => (
            <div key={fld.key}>
              <Label className={labelCls}>{fld.label}</Label>
              {fld.options ? (
                <Select value={(item as any)[fld.key] || ""} onValueChange={(v) => set(fld.key, v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{fld.options.map((o) => <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Input value={(item as any)[fld.key] || ""} onChange={(e) => set(fld.key, e.target.value)} className="mt-1" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Additional specs */}
      <div className="space-y-2">
        <Label className={labelCls}>Additional Specs</Label>
        {item.specs.map((s, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input value={s.key} onChange={(e) => updateSpec(i, "key", e.target.value)} placeholder="e.g. Weight" className="flex-1" />
            <span className="text-muted-foreground">:</span>
            <Input value={s.value} onChange={(e) => updateSpec(i, "value", e.target.value)} placeholder="e.g. 150g" className="flex-1" />
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeSpec(i)}><X className="w-3 h-3" /></Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addSpec}><Plus className="w-3 h-3 mr-1" />Add Spec</Button>
      </div>
    </div>
  );
};

interface HardwareSectionProps {
  hardware: HardwareDetails;
  onChange: (hw: HardwareDetails) => void;
  sellerId?: string;
  productId?: string;
}

const HardwareSection = ({ hardware, onChange, sellerId, productId }: HardwareSectionProps) => {
  const basePath = sellerId ? `${sellerId}/hardware/${productId || "new"}` : `hardware/${productId || "new"}`;

  return (
    <div className="space-y-4">
      <HardwareSubSection
        title="Hinges"
        item={hardware.hinges}
        onChange={(h) => onChange({ ...hardware, hinges: h })}
        fields={[
          { label: "Brand", key: "brand", options: hingeBrands },
          { label: "Model", key: "model" },
        ]}
        uploadPath={`${basePath}_hinges`}
      />
      <HardwareSubSection
        title="Drawer Slides"
        item={hardware.drawer_slides}
        onChange={(h) => onChange({ ...hardware, drawer_slides: h })}
        fields={[
          { label: "Brand", key: "brand", options: slideBrands },
          { label: "Model", key: "model" },
        ]}
        uploadPath={`${basePath}_slides`}
      />
      <HardwareSubSection
        title="Handles"
        item={hardware.handles}
        onChange={(h) => onChange({ ...hardware, handles: h })}
        fields={[
          { label: "Type", key: "type", options: handleTypes },
          { label: "Finish", key: "finish" },
        ]}
        uploadPath={`${basePath}_handles`}
      />
    </div>
  );
};

export default HardwareSection;
