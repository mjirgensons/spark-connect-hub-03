import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, Sparkles, AlertTriangle, RefreshCw, Info, Trash2 } from "lucide-react";
import { optimizeImage } from "@/lib/optimizeImage";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface ImageOptStatus {
  url: string;
  status: "optimized" | "failed" | "original" | "unknown";
  reason?: string;
  originalSizeKB?: number;
  finalSizeKB?: number;
  originalFile?: File;
}

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  onOptStatusChange?: (status: ImageOptStatus | null) => void;
}

export const ImageUpload = ({ value, onChange, label, onOptStatusChange }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [optStatus, setOptStatus] = useState<ImageOptStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const updateStatus = useCallback((s: ImageOptStatus | null) => {
    setOptStatus(s);
    onOptStatusChange?.(s);
  }, [onOptStatusChange]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    const originalSizeKB = Math.round(file.size / 1024);
    try {
      const optimized = await optimizeImage(file);
      const ext = optimized.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(fileName, optimized, { upsert: true });

      if (error) {
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        updateStatus({ url: "", status: "failed", reason: `Upload error: ${error.message}`, originalSizeKB, originalFile: file });
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      const finalSizeKB = Math.round(optimized.size / 1024);
      onChange(urlData.publicUrl);
      updateStatus({ url: urlData.publicUrl, status: "optimized", originalSizeKB, finalSizeKB });
      toast({ title: "Image optimized & uploaded", description: `${originalSizeKB}KB → ${finalSizeKB}KB WebP` });
    } catch (e: any) {
      toast({ title: "Optimization failed", description: "Uploading original instead", variant: "destructive" });
      // Fallback: upload original
      const ext = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(fileName, file, { upsert: true });
      if (error) {
        updateStatus({ url: "", status: "failed", reason: `Both optimization and upload failed: ${error.message}`, originalSizeKB, originalFile: file });
      } else {
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
        onChange(urlData.publicUrl);
        updateStatus({ url: urlData.publicUrl, status: "failed", reason: e?.message || "Canvas optimization failed — original uploaded", originalSizeKB, finalSizeKB: originalSizeKB, originalFile: file });
      }
    }
    setUploading(false);
  };

  const handleResubmit = async () => {
    if (optStatus?.originalFile) {
      // Delete old file from storage before re-uploading
      if (value) {
        const bucketPath = "product-images/";
        const idx = value.indexOf(bucketPath);
        if (idx !== -1) {
          const filePath = value.substring(idx + bucketPath.length);
          await supabase.storage.from("product-images").remove([filePath]);
        }
      }
      uploadFile(optStatus.originalFile);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDeleteFromStorage = async () => {
    if (!value) return;
    try {
      const bucketPath = "product-images/";
      const idx = value.indexOf(bucketPath);
      if (idx === -1) return;
      const filePath = value.substring(idx + bucketPath.length);
      await supabase.storage.from("product-images").remove([filePath]);
      onChange(null);
      updateStatus(null);
      toast({ title: "Image deleted from storage" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const getStatusFromUrl = (url: string): ImageOptStatus["status"] => {
    if (url.includes(".webp")) return "optimized";
    if (url.startsWith("http")) return "original";
    return "unknown";
  };

  const displayStatus = optStatus || (value ? { url: value, status: getStatusFromUrl(value) } as ImageOptStatus : null);

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="flex items-center gap-2">
        <Input
          value={value || ""}
          onChange={(e) => { onChange(e.target.value || null); updateStatus(null); }}
          placeholder="Image URL or upload"
          className="flex-1"
        />
        <Button type="button" variant="outline" size="icon" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="icon" onClick={() => { onChange(null); updateStatus(null); }}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {value && displayStatus && (
        <ImageStatusPanel
          status={displayStatus}
          onResubmit={handleResubmit}
          onDeleteFromStorage={handleDeleteFromStorage}
          uploading={uploading}
        />
      )}
    </div>
  );
};

// ─── Status Info Panel ───────────────────────────────────────
interface ImageStatusPanelProps {
  status: ImageOptStatus;
  onResubmit: () => void;
  onDeleteFromStorage: () => void;
  uploading: boolean;
}

const ImageStatusPanel = ({ status, onResubmit, onDeleteFromStorage, uploading }: ImageStatusPanelProps) => {
  const isOptimized = status.status === "optimized";
  const isFailed = status.status === "failed";
  const isOriginal = status.status === "original";

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${
      isOptimized ? "border-primary/30 bg-primary/5" : 
      isFailed ? "border-destructive/30 bg-destructive/5" : 
      "border-border bg-muted/30"
    }`}>
      <div className="flex items-start gap-3">
        {status.url && (
          <img src={status.url} alt="Preview" className="h-16 w-16 rounded-md object-cover border border-border shrink-0" />
        )}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1.5">
            {isOptimized && (
              <Badge variant="default" className="text-[10px] gap-1">
                <Sparkles className="w-3 h-3" /> Optimized (WebP)
              </Badge>
            )}
            {isFailed && (
              <Badge variant="destructive" className="text-[10px] gap-1">
                <AlertTriangle className="w-3 h-3" /> Optimization Failed
              </Badge>
            )}
            {isOriginal && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Info className="w-3 h-3" /> Original (not optimized)
              </Badge>
            )}
            {status.status === "unknown" && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Info className="w-3 h-3" /> External URL
              </Badge>
            )}
          </div>

          {status.originalSizeKB != null && (
            <p className="text-xs text-muted-foreground">
              Original: {status.originalSizeKB}KB
              {status.finalSizeKB != null && status.status === "optimized" && (
                <> → {status.finalSizeKB}KB ({Math.round((1 - status.finalSizeKB / status.originalSizeKB) * 100)}% saved)</>
              )}
            </p>
          )}

          {isFailed && status.reason && (
            <p className="text-xs text-destructive">{status.reason}</p>
          )}

          <div className="flex items-center gap-1.5 pt-1">
            {(isFailed || isOriginal) && (
              <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={onResubmit} disabled={uploading}>
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Resubmit
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] px-2 gap-1 text-destructive hover:text-destructive" onClick={onDeleteFromStorage}>
              <Trash2 className="w-3 h-3" /> Delete from storage
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Multi Image Upload ──────────────────────────────────────
interface MultiImageUploadProps {
  value: string[] | null;
  onChange: (urls: string[]) => void;
  label?: string;
  onOptStatusesChange?: (statuses: ImageOptStatus[]) => void;
}

export const MultiImageUpload = ({ value, onChange, label, onOptStatusesChange }: MultiImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [optStatuses, setOptStatuses] = useState<ImageOptStatus[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const updateStatuses = useCallback((s: ImageOptStatus[]) => {
    setOptStatuses(s);
    onOptStatusesChange?.(s);
  }, [onOptStatusesChange]);

  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    const urls = [...(value || [])];
    const newStatuses = [...optStatuses];

    for (const file of Array.from(files)) {
      const originalSizeKB = Math.round(file.size / 1024);
      try {
        const optimized = await optimizeImage(file);
        const ext = optimized.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage
          .from("product-images")
          .upload(fileName, optimized, { upsert: true });

        if (error) {
          toast({ title: "Upload failed", description: error.message, variant: "destructive" });
          newStatuses.push({ url: "", status: "failed", reason: error.message, originalSizeKB, originalFile: file });
          continue;
        }

        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
        const finalSizeKB = Math.round(optimized.size / 1024);
        urls.push(urlData.publicUrl);
        newStatuses.push({ url: urlData.publicUrl, status: "optimized", originalSizeKB, finalSizeKB });
      } catch (e: any) {
        // Fallback upload original
        const ext = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(fileName, file, { upsert: true });
        if (!error) {
          const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
          urls.push(urlData.publicUrl);
          newStatuses.push({ url: urlData.publicUrl, status: "failed", reason: e?.message || "Optimization failed — original uploaded", originalSizeKB, finalSizeKB: originalSizeKB, originalFile: file });
        } else {
          newStatuses.push({ url: "", status: "failed", reason: `Full failure: ${error.message}`, originalSizeKB, originalFile: file });
        }
      }
    }

    onChange(urls);
    updateStatuses(newStatuses);
    setUploading(false);
    toast({ title: "Upload complete" });
  };

  const resubmitImage = async (index: number) => {
    const st = optStatuses[index];
    if (!st?.originalFile) return;
    setUploading(true);
    const originalSizeKB = Math.round(st.originalFile.size / 1024);
    try {
      const optimized = await optimizeImage(st.originalFile);
      const ext = optimized.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(fileName, optimized, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
      const finalSizeKB = Math.round(optimized.size / 1024);

      // Delete old file if exists
      if (st.url) {
        const bucketPath = "product-images/";
        const idx = st.url.indexOf(bucketPath);
        if (idx !== -1) {
          const filePath = st.url.substring(idx + bucketPath.length);
          await supabase.storage.from("product-images").remove([filePath]);
        }
      }

      const newUrls = [...(value || [])];
      newUrls[index] = urlData.publicUrl;
      onChange(newUrls);

      const newStatuses = [...optStatuses];
      newStatuses[index] = { url: urlData.publicUrl, status: "optimized", originalSizeKB, finalSizeKB };
      updateStatuses(newStatuses);
      toast({ title: "Image re-optimized successfully" });
    } catch (e: any) {
      toast({ title: "Resubmit failed", description: e?.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const removeImage = async (index: number) => {
    const url = (value || [])[index];
    if (url) {
      const bucketPath = "product-images/";
      const idx = url.indexOf(bucketPath);
      if (idx !== -1) {
        const filePath = url.substring(idx + bucketPath.length);
        await supabase.storage.from("product-images").remove([filePath]);
      }
    }
    const urls = [...(value || [])];
    urls.splice(index, 1);
    onChange(urls);
    const newStatuses = [...optStatuses];
    newStatuses.splice(index, 1);
    updateStatuses(newStatuses);
  };

  const getStatusFromUrl = (url: string): ImageOptStatus => {
    if (url.includes(".webp")) return { url, status: "optimized" };
    if (url.startsWith("http")) return { url, status: "original" };
    return { url, status: "unknown" };
  };

  const allImages = (value || []).map((url, i) => optStatuses[i] || getStatusFromUrl(url));

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="w-full">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
          {uploading ? "Optimizing & Uploading..." : "Upload Images (auto-optimized)"}
        </Button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
      {allImages.length > 0 && (
        <div className="space-y-2">
          {allImages.map((imgStatus, i) => (
            <div key={i} className={`flex items-center gap-3 rounded-md border p-2 ${
              imgStatus.status === "optimized" ? "border-primary/20 bg-primary/5" :
              imgStatus.status === "failed" ? "border-destructive/20 bg-destructive/5" :
              "border-border bg-muted/20"
            }`}>
              <img src={imgStatus.url || ""} alt={`Image ${i + 1}`} className="h-12 w-12 rounded object-cover border border-border shrink-0" />
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-1">
                  {imgStatus.status === "optimized" && (
                    <span className="text-[10px] font-medium text-primary flex items-center gap-0.5"><Sparkles className="w-3 h-3" /> WebP</span>
                  )}
                  {imgStatus.status === "failed" && (
                    <span className="text-[10px] font-medium text-destructive flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Failed</span>
                  )}
                  {imgStatus.status === "original" && (
                    <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-0.5"><Info className="w-3 h-3" /> Original</span>
                  )}
                </div>
                {imgStatus.originalSizeKB != null && (
                  <p className="text-[10px] text-muted-foreground">
                    {imgStatus.originalSizeKB}KB{imgStatus.finalSizeKB != null && imgStatus.status === "optimized" ? ` → ${imgStatus.finalSizeKB}KB` : ""}
                  </p>
                )}
                {imgStatus.status === "failed" && imgStatus.reason && (
                  <p className="text-[10px] text-destructive truncate">{imgStatus.reason}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {(imgStatus.status === "failed" || imgStatus.status === "original") && (
                  <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => resubmitImage(i)} disabled={uploading}>
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                )}
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeImage(i)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Helper to get optimization summary for product list ─────
export function getImageOptSummary(product: { main_image_url: string | null; additional_image_urls: string[] | null }): {
  label: "all-optimized" | "partial" | "none" | "no-images";
  optimizedCount: number;
  totalCount: number;
} {
  const urls: string[] = [];
  if (product.main_image_url) urls.push(product.main_image_url);
  if (product.additional_image_urls?.length) urls.push(...product.additional_image_urls);
  if (urls.length === 0) return { label: "no-images", optimizedCount: 0, totalCount: 0 };

  const optimizedCount = urls.filter(u => u.includes(".webp")).length;
  if (optimizedCount === urls.length) return { label: "all-optimized", optimizedCount, totalCount: urls.length };
  if (optimizedCount > 0) return { label: "partial", optimizedCount, totalCount: urls.length };
  return { label: "none", optimizedCount: 0, totalCount: urls.length };
}
