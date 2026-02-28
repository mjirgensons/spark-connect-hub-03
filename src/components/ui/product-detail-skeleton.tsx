import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const ProductDetailSkeleton = () => (
  <div className="container mx-auto px-4 py-10 pt-24 md:pt-10">
    {/* Back link */}
    <Skeleton className="h-4 w-40 mb-8" />

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* Image */}
      <Skeleton className="aspect-square w-full rounded-none" />

      {/* Details */}
      <div className="space-y-6">
        <div>
          <Skeleton className="h-5 w-20 mb-2" />
          <Skeleton className="h-8 w-2/3 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Pricing box */}
        <div className="border p-5 space-y-2">
          <div className="flex items-end gap-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-16" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        <Separator />

        {/* Specs */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 shrink-0" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Button */}
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  </div>
);

export { ProductDetailSkeleton };
