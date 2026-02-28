import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const ProductCardSkeleton = () => (
  <Card
    className="border-2 border-foreground overflow-hidden"
    style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
  >
    <Skeleton className="aspect-[4/3] w-full rounded-none" />
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-16 shrink-0" />
      </div>
      <Skeleton className="h-3 w-1/2" />
      <div className="flex items-baseline gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-3 w-12" />
      <Skeleton className="h-9 w-full" />
    </div>
  </Card>
);

export { ProductCardSkeleton };
