import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

export interface FeatureItem { key: string; value: string }

interface AdditionalFeaturesSectionProps {
  features: FeatureItem[];
  onChange: (features: FeatureItem[]) => void;
}

const AdditionalFeaturesSection = ({ features, onChange }: AdditionalFeaturesSectionProps) => {
  const add = () => onChange([...features, { key: "", value: "" }]);
  const remove = (i: number) => onChange(features.filter((_, idx) => idx !== i));
  const update = (i: number, field: "key" | "value", val: string) =>
    onChange(features.map((f, idx) => idx === i ? { ...f, [field]: val } : f));

  return (
    <div className="space-y-3">
      {features.length === 0 && (
        <p className="text-sm text-muted-foreground">No additional features yet. Click below to add custom product features.</p>
      )}
      {features.map((feat, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input value={feat.key} onChange={(e) => update(i, "key", e.target.value)} placeholder="e.g. Soft-close drawers" className="flex-1" />
          <span className="text-muted-foreground">:</span>
          <Input value={feat.value} onChange={(e) => update(i, "value", e.target.value)} placeholder="e.g. Yes, all drawers" className="flex-1" />
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(i)}><X className="w-3 h-3" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="w-3 h-3 mr-1" />Add Feature</Button>
    </div>
  );
};

export default AdditionalFeaturesSection;
