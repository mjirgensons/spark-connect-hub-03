import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, MessageSquare } from "lucide-react";
import { getOptPrice } from "@/lib/productHelpers";

interface ProductAddOnsProps {
  opt: any;
  compact: boolean;
  checkedAddOns: Set<string>;
  toggleAddOn: (id: string) => void;
  onAskAbout?: (opt: any) => void;
}

const ProductAddOns = ({ opt, compact, checkedAddOns, toggleAddOn, onAskAbout }: ProductAddOnsProps) => {
  const isIncluded = opt.inclusion_status === "included";
  const price = getOptPrice(opt);
  const hasDiscount = Number(opt.discount_percentage) > 0 && Number(opt.price_retail) > Number(opt.price_discounted);
  const hasExtraDetails = !!opt.description;

  return (
    <div className={`${compact ? "py-2" : "border rounded-lg p-4"}`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={checkedAddOns.has(opt.id)}
          disabled={isIncluded}
          onCheckedChange={() => toggleAddOn(opt.id)}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium text-foreground ${compact ? "" : "text-base"}`}>{opt.option_name}</span>
            {!compact && (
              <>
                <Badge variant="outline" className="text-[10px]">{(opt.option_type || "").replace(/_/g, " ")}</Badge>
                <Badge variant={isIncluded ? "default" : "secondary"} className="text-[10px]">
                  {isIncluded ? "Included" : opt.inclusion_status === "optional" ? "Optional" : "Not Included"}
                </Badge>
              </>
            )}
          </div>
          {!compact && opt.description && (
            <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
          )}
          {!compact && (
            <div className="flex items-center gap-4 mt-2">
              {hasExtraDetails && (
                <Collapsible>
                  <CollapsibleTrigger className="text-xs text-primary hover:underline flex items-center gap-1">
                    <ChevronDown className="w-3 h-3" /> More Details
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 text-xs text-muted-foreground bg-muted/30 rounded p-3">
                    {opt.description}
                  </CollapsibleContent>
                </Collapsible>
              )}
              {onAskAbout && (
                <button
                  onClick={() => onAskAbout(opt)}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" /> Ask about this
                </button>
              )}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          {isIncluded ? (
            <span className="text-xs text-muted-foreground">Included</span>
          ) : price > 0 ? (
            <div className="flex items-center gap-1.5">
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">${Number(opt.price_retail).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              )}
              <span className="text-sm font-semibold text-foreground">${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProductAddOns;
