import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const OrderCardSkeleton = () => (
  <Card className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--foreground))]">
    <CardContent className="p-4 flex flex-wrap items-center justify-between gap-2">
      <div className="space-y-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-36" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </CardContent>
  </Card>
);

export { OrderCardSkeleton };
