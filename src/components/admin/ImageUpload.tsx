import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

export const ImageUpload = ({ value, onChange, label }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, { upsert: true });

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    onChange(urlData.publicUrl);
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="flex items-center gap-2">
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="Image URL or upload"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange(null)}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {value && (
        <img src={value} alt="Preview" className="h-20 w-20 rounded-md object-cover border border-border" />
      )}
    </div>
  );
};

interface MultiImageUploadProps {
  value: string[] | null;
  onChange: (urls: string[]) => void;
  label?: string;
}

export const MultiImageUpload = ({ value, onChange, label }: MultiImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    const urls = [...(value || [])];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { upsert: true });

      if (error) {
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      urls.push(urlData.publicUrl);
    }

    onChange(urls);
    setUploading(false);
  };

  const removeImage = (index: number) => {
    const urls = [...(value || [])];
    urls.splice(index, 1);
    onChange(urls);
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
          {uploading ? "Uploading..." : "Upload Images"}
        </Button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
      {(value || []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(value || []).map((url, i) => (
            <div key={i} className="relative group">
              <img src={url} alt={`Image ${i + 1}`} className="h-16 w-16 rounded-md object-cover border border-border" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
