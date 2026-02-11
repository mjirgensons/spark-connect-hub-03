import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, FileText } from "lucide-react";

interface FileUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  accept?: string;
  bucket?: string;
}

export const FileUpload = ({ value, onChange, label, accept = ".pdf", bucket = "product-documents" }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    onChange(urlData.publicUrl);
    setUploading(false);
    toast({ title: "File uploaded successfully" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const fileName = value ? decodeURIComponent(value.split("/").pop() || "") : null;

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="flex items-center gap-2">
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="File URL or upload"
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
      <input ref={fileInputRef} type="file" accept={accept} className="hidden" onChange={handleFileChange} />
      {value && (
        <a href={value} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
          <FileText className="w-4 h-4" /> {fileName}
        </a>
      )}
    </div>
  );
};
