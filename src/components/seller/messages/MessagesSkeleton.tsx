import { Skeleton } from "@/components/ui/skeleton";

const MessagesSkeleton = () => (
  <div className="p-4 space-y-4">
    {/* Buyer message */}
    <div className="flex justify-start">
      <div className="space-y-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-16 w-56 rounded-lg" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
    {/* Seller message */}
    <div className="flex justify-end">
      <div className="space-y-1 flex flex-col items-end">
        <Skeleton className="h-12 w-48 rounded-lg" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
    {/* Buyer message */}
    <div className="flex justify-start">
      <div className="space-y-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
    {/* Seller message */}
    <div className="flex justify-end">
      <div className="space-y-1 flex flex-col items-end">
        <Skeleton className="h-20 w-52 rounded-lg" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  </div>
);

export default MessagesSkeleton;
