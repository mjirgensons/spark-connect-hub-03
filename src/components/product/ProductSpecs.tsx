import { Badge } from "@/components/ui/badge";
import { Ruler, Palette, Layers, Info, Package } from "lucide-react";
import { fmtDim } from "@/lib/productHelpers";

interface ProductSpecsProps {
  product: any;
}

export function buildSpecItems(product: any) {
  const hasSimpleWidth = product.width_mm && product.width_mm > 0;
  const hasWallA = product.wall_a_length_mm && product.wall_a_length_mm > 0;
  const hasWallB = product.wall_b_length_mm && product.wall_b_length_mm > 0;
  const hasWallC = product.wall_c_length_mm && product.wall_c_length_mm > 0;
  const hasMultiWall = hasWallA;
  const hasAnyWidth = hasSimpleWidth || hasMultiWall;
  const hasHeight = product.height_mm && product.height_mm > 0;
  const hasDepth = product.depth_mm && product.depth_mm > 0;
  const hasDimensions = hasAnyWidth || hasHeight || hasDepth;

  const specItems: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (hasDimensions) {
    if (hasMultiWall && !hasSimpleWidth) {
      const wallParts = [
        hasWallA && `Wall A: ${fmtDim(product.wall_a_length_mm!)}`,
        hasWallB && `Wall B: ${fmtDim(product.wall_b_length_mm!)}`,
        hasWallC && `Wall C: ${fmtDim(product.wall_c_length_mm!)}`,
      ].filter(Boolean);
      const otherParts = [
        hasHeight && `H: ${fmtDim(product.height_mm)}`,
        hasDepth && `D: ${fmtDim(product.depth_mm)}`,
      ].filter(Boolean);
      specItems.push({ icon: <Ruler className="w-4 h-4 text-muted-foreground" />, label: "Dimensions", value: [...wallParts, ...otherParts].join("  ·  ") });
    } else {
      const w = fmtDim(product.width_mm);
      const h = fmtDim(product.height_mm);
      const d = fmtDim(product.depth_mm);
      const parts = [w && `W: ${w}`, h && `H: ${h}`, d && `D: ${d}`].filter(Boolean);
      specItems.push({ icon: <Ruler className="w-4 h-4 text-muted-foreground" />, label: "Dimensions", value: parts.join("  ·  ") });
    }
  }
  if (product.color) specItems.push({ icon: <Palette className="w-4 h-4 text-muted-foreground" />, label: "Color", value: product.color });
  if (product.material) specItems.push({ icon: <Layers className="w-4 h-4 text-muted-foreground" />, label: "Material", value: product.material });
  if (product.style) specItems.push({ icon: <Info className="w-4 h-4 text-muted-foreground" />, label: "Style", value: product.style });
  if (product.door_style) specItems.push({ icon: <Info className="w-4 h-4 text-muted-foreground" />, label: "Door Style", value: (product.door_style || "").replace(/_/g, " ") });
  if (product.door_material) specItems.push({ icon: <Layers className="w-4 h-4 text-muted-foreground" />, label: "Door Material", value: (product.door_material || "").replace(/_/g, " ") });
  if (product.finish_type) specItems.push({ icon: <Info className="w-4 h-4 text-muted-foreground" />, label: "Finish Type", value: product.finish_type });
  if (product.construction_type) specItems.push({ icon: <Info className="w-4 h-4 text-muted-foreground" />, label: "Construction", value: product.construction_type });
  if (product.condition) {
    let condVal = product.condition;
    if (product.condition_notes) condVal += ` — ${product.condition_notes}`;
    specItems.push({ icon: <Info className="w-4 h-4 text-muted-foreground" />, label: "Condition", value: condVal });
  }
  if (product.manufacturer) specItems.push({ icon: <Info className="w-4 h-4 text-muted-foreground" />, label: "Manufacturer", value: product.manufacturer });
  if (product.stock_level > 0) specItems.push({ icon: <Package className="w-4 h-4 text-muted-foreground" />, label: "Units in Stock", value: String(product.stock_level) });

  return specItems;
}

const ProductSpecs = ({ product }: ProductSpecsProps) => {
  const specItems = buildSpecItems(product);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {specItems.map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3 border rounded-md">
            <div className="mt-0.5">{item.icon}</div>
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-medium text-foreground">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
      {product.compatible_kitchen_layouts && product.compatible_kitchen_layouts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Compatible Kitchen Layouts</h3>
          <p className="text-xs text-muted-foreground">This cabinet set fits the following kitchen configurations</p>
          <div className="flex flex-wrap gap-1.5">
            {product.compatible_kitchen_layouts.map((layout: string) => (
              <Badge key={layout} variant="secondary" className="text-xs">{layout}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSpecs;
