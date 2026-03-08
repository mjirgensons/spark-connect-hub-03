import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/contexts/CompareContext";
import { cn } from "@/lib/utils";

interface CompareButtonProps {
  productId: string;
  variant?: "icon" | "text";
}

const CompareButton = ({ productId, variant = "icon" }: CompareButtonProps) => {
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const active = isInCompare(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    active ? removeFromCompare(productId) : addToCompare(productId);
  };

  if (variant === "text") {
    return (
      <Button
        variant={active ? "default" : "outline"}
        size="sm"
        onClick={handleClick}
        className={cn("border-2 border-foreground", active && "")}
      >
        <ArrowLeftRight className="w-4 h-4 mr-2" />
        {active ? "Remove from Compare" : "Compare"}
      </Button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sm border-2 transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background/80 text-muted-foreground border-foreground/30 hover:border-foreground"
      )}
      aria-label={active ? "Remove from compare" : "Add to compare"}
    >
      <ArrowLeftRight className="w-4 h-4" />
    </button>
  );
};

export default CompareButton;
