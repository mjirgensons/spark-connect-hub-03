import { useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { FileText, Upload } from "lucide-react";

const SellerDocuments = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = () => {
    if (!file) return;
    toast({ title: "Upload placeholder", description: `"${file.name}" will be uploaded once seller storage is wired.` });
    setFile(null);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/seller/dashboard" }, { label: "Documents" }]} />
      <h1 className="font-serif text-2xl md:text-3xl font-bold">Documents</h1>

      <Card className="border-2 border-foreground p-6" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
        <h2 className="font-sans font-bold text-base mb-3">Upload Document</h2>
        <div className="border-2 border-dashed border-foreground p-6 text-center hover:bg-muted transition-colors cursor-pointer mb-4">
          <input type="file" accept=".pdf,.dwg,.png,.jpg" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="doc-upload" />
          <label htmlFor="doc-upload" className="cursor-pointer">
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{file ? file.name : "Click to upload installation drawings, rough-in diagrams, or specs"}</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DWG, PNG, JPG — max 20MB</p>
          </label>
        </div>
        {file && (
          <Button onClick={handleUpload}>
            <Upload size={14} className="mr-2" /> Upload
          </Button>
        )}
      </Card>

      <Card className="border-2 border-foreground p-8 text-center" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="font-sans font-bold text-lg mb-2">No documents yet</p>
        <p className="text-sm text-muted-foreground">
          Upload installation drawings and specs for your products. These help contractors install correctly.
        </p>
      </Card>
    </div>
  );
};

export default SellerDocuments;
